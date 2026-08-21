// Verifies the cutover promise: every URL on the current rlpmg.com resolves on the new site,
// either as a page that exists or as a redirect whose destination exists.
// Reads the old sitemaps in ../source/ and the redirect table in src/data/redirects.mjs.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { redirects, workerOnlyRedirects } from '../src/data/redirects.mjs';

const DIST = 'dist';
const table = { ...redirects, ...workerOnlyRedirects };

function builtPaths() {
  const out = new Set();
  (function walk(d, base = '') {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p, `${base}/${f}`);
      else if (f === 'index.html') out.add(`${base}/`);
      else if (f.endsWith('.xml') || f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.md')) out.add(`${base}/${f}`);
    }
  })(DIST);
  out.add('/');
  return out;
}

function sitemapUrls(file) {
  if (!existsSync(file)) return [];
  const xml = readFileSync(file, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/(www\.)?rlpmg\.com/, ''))
    .map((p) => (p === '' ? '/' : p));
}

function resolve(path, built, depth = 0) {
  if (depth > 3) return { ok: false, why: 'redirect loop' };
  if (built.has(path)) return { ok: true, via: depth ? 'redirect' : 'direct' };
  const exact = table[path];
  if (exact) return resolve(exact.destination, built, depth + 1);
  for (const [from, to] of Object.entries(table)) {
    const i = from.indexOf('[...');
    if (i === -1) continue;
    const prefix = from.slice(0, i);
    if (path.startsWith(prefix)) {
      const dest = to.destination.replace(/\[\.\.\.[a-z]+\]/, path.slice(prefix.length));
      return resolve(dest, built, depth + 1);
    }
  }
  return { ok: false, why: 'no page and no redirect' };
}

const built = builtPaths();
const old = [...new Set([
  ...sitemapUrls('../source/sitemap-pages.xml'),
  ...sitemapUrls('../source/sitemap-posts.xml'),
])];

const fails = [];
let direct = 0, viaRedirect = 0;
for (const path of old) {
  const r = resolve(path, built);
  if (!r.ok) fails.push({ path, why: r.why });
  else if (r.via === 'direct') direct++;
  else viaRedirect++;
}

// Every redirect destination must itself exist.
const badDest = [];
for (const [from, to] of Object.entries(table)) {
  if (from.includes('[...')) continue;
  if (!resolve(to.destination, built).ok) badDest.push(`${from} -> ${to.destination}`);
}

console.log(`Old URLs checked: ${old.length}`);
console.log(`  resolve directly: ${direct}`);
console.log(`  resolve via 301:  ${viaRedirect}`);
console.log(`  unresolved:       ${fails.length}`);
if (fails.length) {
  console.log('\nUNRESOLVED:');
  for (const f of fails.slice(0, 40)) console.log(`  ${f.path}  (${f.why})`);
  if (fails.length > 40) console.log(`  ... and ${fails.length - 40} more`);
}
if (badDest.length) {
  console.log('\nREDIRECTS POINTING AT MISSING PAGES:');
  for (const b of badDest) console.log(`  ${b}`);
}
process.exit(fails.length || badDest.length ? 1 : 0);
