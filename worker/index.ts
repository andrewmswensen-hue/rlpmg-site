/**
 * Cloudflare Worker in front of the static Astro build.
 *
 * Three jobs:
 *  1. True HTTP 301s for retired rlpmg.com URLs (Astro's own redirects are meta-refresh only).
 *  2. Form relay: POST /api/forms/<id> -> formatted email to the matching LeadSimple intake address.
 *  3. AI crawler logging to KV, surfaced at /internal/crawlers (basic auth, noindex).
 *
 * Secrets (wrangler secret put): LEADSIMPLE_INTAKE_MAIN, LEADSIMPLE_INTAKE_RENT_EVAL,
 * MAILCHANNELS_API_KEY (or whichever sender is chosen), INTERNAL_USER, INTERNAL_PASS, TURNSTILE_SECRET.
 */
import { redirects, workerOnlyRedirects } from '../src/data/redirects.mjs';
import { crawlerTokens } from '../src/data/crawlers';

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  CRAWLER_LOG?: KVNamespace;
  SITE_ORIGIN: string;
  LEADSIMPLE_INTAKE_MAIN?: string;
  LEADSIMPLE_INTAKE_RENT_EVAL?: string;
  INTERNAL_USER?: string;
  INTERNAL_PASS?: string;
  TURNSTILE_SECRET?: string;
}

type RedirectTarget = { status: number; destination: string };
const table = { ...redirects, ...workerOnlyRedirects } as Record<string, RedirectTarget>;

/** Forms whose leads should go to the rent-evaluation intake rather than the general one. */
const RENT_EVAL_FORMS = new Set(['rent-evaluation', 'consultation']);

const FORM_LABELS: Record<string, string> = {
  contact: 'Website contact form',
  'rent-evaluation': 'Free rent evaluation request',
  consultation: 'Consultation request',
  'agent-referral': 'Agent referral',
  'rental-verification': 'Rental verification request',
  'vendor-application': 'Vendor application',
  acquisition: 'Property management company acquisition inquiry',
  'leasing-inquiry': 'Leasing inquiry',
  'application-appeal': 'Application appeal',
};

function matchRedirect(pathname: string): string | null {
  const exact = table[pathname];
  if (exact) return exact.destination;
  for (const [from, to] of Object.entries(table)) {
    const i = from.indexOf('[...');
    if (i === -1) continue;
    const prefix = from.slice(0, i);
    if (pathname.startsWith(prefix)) {
      return to.destination.replace(/\[\.\.\.[a-z]+\]/, pathname.slice(prefix.length));
    }
  }
  return null;
}

function detectCrawler(ua: string): string | null {
  const lower = ua.toLowerCase();
  for (const token of crawlerTokens) if (lower.includes(token.toLowerCase())) return token;
  return null;
}

async function logCrawler(env: Env, request: Request, url: URL, ctx: ExecutionContext) {
  if (!env.CRAWLER_LOG) return;
  const ua = request.headers.get('user-agent') ?? '';
  const token = detectCrawler(ua);
  if (!token) return;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  // One key per crawler per day per path, with a hit counter. Cheap to write, easy to roll up.
  const key = `hit:${day}:${token}:${url.pathname}`;
  ctx.waitUntil(
    (async () => {
      const prev = await env.CRAWLER_LOG!.get(key);
      const count = prev ? parseInt(prev, 10) + 1 : 1;
      await env.CRAWLER_LOG!.put(key, String(count), { expirationTtl: 60 * 60 * 24 * 120 });
    })(),
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

async function handleForm(request: Request, env: Env, url: URL): Promise<Response> {
  const formId = url.pathname.replace('/api/forms/', '').replace(/\/$/, '');
  if (!FORM_LABELS[formId]) return new Response('Unknown form', { status: 404 });

  const data = await request.formData();
  // Honeypot: a bot fills the hidden "website" field.
  if (String(data.get('website') ?? '')) return Response.redirect(new URL('/thank-you/', url.origin).href, 303);

  const fields: [string, string][] = [];
  for (const [k, v] of data.entries()) {
    if (k === 'website' || typeof v !== 'string' || !v.trim()) continue;
    fields.push([k, v.trim()]);
  }

  const meta = Object.fromEntries(fields.filter(([k]) => ['page', 'referrer', 'ai_source', 'utm_source', 'utm_medium', 'utm_campaign', 'form'].includes(k)));
  const answers = fields.filter(([k]) => !(k in meta));

  const subjectSource = meta.ai_source ? ` [AI: ${meta.ai_source}]` : '';
  const subject = `${FORM_LABELS[formId]}${subjectSource}`;
  const lines = [
    ...answers.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`),
    '',
    '--- attribution ---',
    `form: ${formId}`,
    `page: ${meta.page ?? ''}`,
    `referrer: ${meta.referrer ?? ''}`,
    `ai_source: ${meta.ai_source ?? '(none)'}`,
    `utm_source: ${meta.utm_source ?? ''}`,
    `utm_medium: ${meta.utm_medium ?? ''}`,
    `utm_campaign: ${meta.utm_campaign ?? ''}`,
    `submitted: ${new Date().toISOString()}`,
  ];

  const to = RENT_EVAL_FORMS.has(formId) ? env.LEADSIMPLE_INTAKE_RENT_EVAL : env.LEADSIMPLE_INTAKE_MAIN;
  if (!to) {
    console.log('Form received but no intake address configured', subject, lines.join('\n'));
    return Response.redirect(new URL('/thank-you/', url.origin).href, 303);
  }

  // MailChannels-style send. Swap for the chosen provider at cutover; the payload shape is the only thing to change.
  const send = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'website@rlpmg.com', name: 'rlpmg.com website' },
      reply_to: answers.find(([k]) => k.includes('email')) ? { email: answers.find(([k]) => k.includes('email'))![1] } : undefined,
      subject,
      content: [{ type: 'text/plain', value: lines.join('\n') }],
    }),
  }).catch((e) => {
    console.error('Form relay failed', e);
    return null;
  });

  if (!send || !send.ok) console.error('Form relay non-OK', send?.status, subject);
  return Response.redirect(new URL('/thank-you/', url.origin).href, 303);
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="RLPM internal"', 'x-robots-tag': 'noindex, nofollow' },
  });
}

async function crawlerDashboard(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  const expected = 'Basic ' + btoa(`${env.INTERNAL_USER ?? 'rlpm'}:${env.INTERNAL_PASS ?? ''}`);
  if (!env.INTERNAL_PASS || auth !== expected) return unauthorized();
  if (!env.CRAWLER_LOG) return new Response('Crawler log KV namespace is not bound yet.', { status: 503 });

  const list = await env.CRAWLER_LOG.list({ prefix: 'hit:', limit: 1000 });
  const rows = await Promise.all(
    list.keys.map(async (k) => {
      const [, day, bot, ...rest] = k.name.split(':');
      return { day, bot, path: rest.join(':'), count: parseInt((await env.CRAWLER_LOG!.get(k.name)) ?? '0', 10) };
    }),
  );
  const byBot = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const r of rows) {
    byBot.set(r.bot, (byBot.get(r.bot) ?? 0) + r.count);
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.count);
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
  }
  const top = (m: Map<string, number>, n = 25) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const tbl = (title: string, m: Map<string, number>, col: string) => `
    <h2>${title}</h2>
    <table><thead><tr><th>${col}</th><th>Requests</th></tr></thead><tbody>
    ${top(m).map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow">
    <title>AI crawler activity</title><style>
    body{font-family:Jost,system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#1a1a1a}
    h1{color:#59070e}h2{color:#123143;margin-top:2rem}
    table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
    th,td{text-align:left;padding:.4rem .6rem;border-bottom:1px solid #ddd}
    th{color:#123143;border-bottom:2px solid #123143}
    td:last-child,th:last-child{text-align:right}
    </style></head><body>
    <h1>AI crawler activity on rlpmg.com</h1>
    <p>${rows.reduce((s, r) => s + r.count, 0).toLocaleString()} logged requests from known AI crawlers across ${byDay.size} days. Entries expire after 120 days.</p>
    ${tbl('By crawler', byBot, 'Crawler')}
    ${tbl('Most crawled pages', byPath, 'Path')}
    ${tbl('By day', byDay, 'Day')}
    </body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow' } });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname.startsWith('/api/forms/')) {
      return handleForm(request, env, url);
    }

    const dest = matchRedirect(url.pathname);
    if (dest) return Response.redirect(new URL(dest, url.origin).href, 301);

    if (url.pathname.startsWith('/internal/crawlers')) return crawlerDashboard(request, env);
    if (url.pathname.startsWith('/internal/')) {
      return new Response('Not found', { status: 404, headers: { 'x-robots-tag': 'noindex, nofollow' } });
    }

    await logCrawler(env, request, url, ctx);
    return env.ASSETS.fetch(request);
  },
};
