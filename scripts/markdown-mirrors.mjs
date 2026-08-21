// Post-build. For every dist/**/index.html, write a Markdown twin next to it (/path.md) built from the <main>
// element, and concatenate the core pages into dist/llms-full.txt. One source (the rendered HTML), zero drift.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const DIST = 'dist';
const SITE = 'https://rlpmg.com';
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.remove(['script', 'style', 'noscript', 'svg', 'button', 'form']);
// Tables: keep as GitHub-flavored Markdown tables.
td.addRule('table', {
  filter: 'table',
  replacement(_content, node) {
    const trs = Array.from(node.getElementsByTagName('tr'));
    const rows = trs.map((tr) =>
      Array.from(tr.childNodes)
        .filter((c) => c.nodeName === 'TH' || c.nodeName === 'TD')
        .map((c) => c.textContent.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|')),
    );
    if (!rows.length) return '';
    const w = Math.max(...rows.map((r) => r.length));
    const line = (r) => `| ${Array.from({ length: w }, (_, i) => r[i] ?? '').join(' | ')} |`;
    return `\n\n${line(rows[0])}\n| ${Array(w).fill('---').join(' | ')} |\n${rows.slice(1).map(line).join('\n')}\n\n`;
  },
});
// Definition lists (FAQ): "**Question**\n\nAnswer"
td.addRule('dl', {
  filter: ['dt'],
  replacement: (content) => `\n\n**${content.trim()}**\n\n`,
});
td.addRule('dd', { filter: ['dd'], replacement: (content) => `${content.trim()}\n\n` });

function walk(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : f === 'index.html' ? [p] : [];
  });
}

// Core pages that go into llms-full.txt, in reading order. Anything matching is included; blog posts are not.
const CORE_ORDER = [
  '/', '/pricing/', '/how-it-works/', '/what-we-manage/', '/columbus-property-management/', '/services/',
  '/compare/', '/key-performance-indicators/', '/areas-we-serve/', '/property-management-', '/faq/', '/about/',
  '/team/', '/reviews/', '/residents/', '/homes-for-rent/', '/tools/', '/ai-and-human-oversight/',
];
const isCore = (path) => CORE_ORDER.some((c) => (c.endsWith('-') ? path.startsWith(c) : path === c || (c !== '/' && path.startsWith(c))));
const coreRank = (path) => CORE_ORDER.findIndex((c) => (c.endsWith('-') ? path.startsWith(c) : path === c || (c !== '/' && path.startsWith(c))));

let count = 0;
const core = [];
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  const $ = load(html);
  if ($('meta[http-equiv="refresh"]').length) continue; // redirect stubs
  if ($('meta[name="robots"][content*="noindex"]').length && !process.env.PREVIEW_NOINDEX) continue;
  const main = $('main');
  if (!main.length) continue;
  const path = '/' + relative(DIST, dirname(file)).replace(/\\/g, '/').replace(/^\.$/, '');
  const urlPath = path === '/' ? '/' : path.replace(/\/?$/, '/');
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content') ?? '';
  main.find('nav[aria-label="Breadcrumb"], [data-md-skip]').remove();
  // Absolute-ify links so a fetched .md file still points home.
  main.find('a[href^="/"]').each((_, a) => $(a).attr('href', SITE + $(a).attr('href')));
  const body = td.turndown(main.html() ?? '').replace(/\n{3,}/g, '\n\n').trim();
  const md = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\nurl: ${SITE}${urlPath}\nhtml: ${SITE}${urlPath}\n---\n\n${body}\n`;
  const out = urlPath === '/' ? join(DIST, 'index.md') : join(DIST, urlPath.replace(/\/$/, '') + '.md');
  writeFileSync(out, md);
  count++;
  if (isCore(urlPath)) core.push({ rank: coreRank(urlPath), urlPath, title, body });
}

core.sort((a, b) => a.rank - b.rank || a.urlPath.localeCompare(b.urlPath));

// City pages repeat the same pricing and operations sections by design, so that each page stands alone
// when an assistant extracts it. In the concatenated file that repetition is pure bulk, so those sections
// are dropped here and replaced with a pointer. The per-page .md twins keep the full text.
const SHARED_CITY_HEADINGS = [
  'What does property management cost in',
  'How does RL Property Management handle a',
];
for (const c of core) {
  if (!c.urlPath.startsWith('/property-management-')) continue;
  const before = c.body.length;
  for (const h of SHARED_CITY_HEADINGS) {
    // Drop from the heading up to (not including) the next H2.
    c.body = c.body.replace(new RegExp(`\\n## ${h}[^\\n]*\\n[\\s\\S]*?(?=\\n## |$)`, 'g'), '\n');
  }
  if (c.body.length < before) {
    c.body += '\n\nPricing and the standard leasing, maintenance, and reporting process are identical in each area served. See https://rlpmg.com/pricing/ and https://rlpmg.com/columbus-property-management/.';
  }
}
const header = `# RL Property Management: full text of core pages\n\nSource: ${SITE}. Index: ${SITE}/llms.txt. Facts: ${SITE}/api/facts.json. Generated at build on ${new Date().toISOString().slice(0, 10)} from the same HTML served to visitors.\n\n`;
writeFileSync(
  join(DIST, 'llms-full.txt'),
  header + core.map((c) => `\n\n---\n\n<!-- ${SITE}${c.urlPath} -->\n\n# ${c.title}\n\nURL: ${SITE}${c.urlPath}\n\n${c.body}`).join('\n'),
);
if (!existsSync(join(DIST, 'index.md'))) console.warn('No index.md generated: check that pages render a <main>.');
console.log(`Markdown mirrors: ${count} pages. llms-full.txt: ${core.length} core pages.`);
