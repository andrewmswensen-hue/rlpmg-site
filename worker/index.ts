/**
 * Cloudflare Worker in front of the static Astro build.
 * Phase 1: serves assets, issues true HTTP 301s for retired URLs, and stubs the API routes.
 * Phase 8 adds: form relay to LeadSimple, AI-crawler logging to KV, /internal/crawlers dashboard.
 */
import { redirects, workerOnlyRedirects } from '../src/data/redirects.mjs';

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  SITE_ORIGIN: string;
}

type RedirectTarget = { status: number; destination: string };
const table = { ...redirects, ...workerOnlyRedirects } as Record<string, RedirectTarget>;

function matchRedirect(pathname: string): string | null {
  const exact = table[pathname];
  if (exact) return exact.destination;
  for (const [from, to] of Object.entries(table)) {
    const i = from.indexOf('[...');
    if (i === -1) continue;
    const prefix = from.slice(0, i);
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      return to.destination.replace(/\[\.\.\.[a-z]+\]/, rest);
    }
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const dest = matchRedirect(url.pathname);
    if (dest) return Response.redirect(new URL(dest, url.origin).href, 301);

    if (url.pathname.startsWith('/api/forms/')) {
      return new Response(JSON.stringify({ ok: false, error: 'Form relay lands in Phase 8.' }), {
        status: 501,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.pathname.startsWith('/internal/')) {
      return new Response('Not yet.', { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
