// Structural JSON-LD check over the built site. Not a replacement for validator.schema.org (run that manually
// on representative pages), but it catches the failures that matter at build time:
// unparseable JSON, missing @context, nodes without @type, dangling @id references, empty required fields.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

function walk(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : f === 'index.html' ? [p] : [];
  });
}
const REQUIRED = {
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  BreadcrumbList: ['itemListElement'],
  WebPage: ['url', 'name'],
  Article: ['headline', 'datePublished', 'author'],
  Offer: ['price', 'priceCurrency'],
  HowTo: ['name', 'step'],
  Person: ['name'],
  PostalAddress: ['streetAddress', 'addressLocality', 'postalCode'],
};
let pages = 0, nodes = 0, errors = 0;
const definedIds = new Set(), referencedIds = new Map();
function visit(node, file) {
  if (Array.isArray(node)) return node.forEach((n) => visit(n, file));
  if (!node || typeof node !== 'object') return;
  const keys = Object.keys(node);
  if (keys.length === 1 && node['@id']) {
    referencedIds.set(node['@id'], file);
    return;
  }
  if (node['@id']) definedIds.add(node['@id']);
  const types = [].concat(node['@type'] ?? []);
  if (!types.length && !node['@id']) { console.log(`${file}: node without @type: ${JSON.stringify(node).slice(0, 80)}`); errors++; }
  nodes++;
  for (const t of types) for (const r of REQUIRED[t] ?? []) {
    const v = node[r];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) { console.log(`${file}: ${t} missing ${r}`); errors++; }
  }
  for (const k of keys) if (!k.startsWith('@')) visit(node[k], file);
}
for (const file of walk('dist')) {
  const $ = load(readFileSync(file, 'utf8'));
  if ($('meta[http-equiv="refresh"]').length) continue;
  const blocks = $('script[type="application/ld+json"]');
  if (!blocks.length) { console.log(`${file}: no JSON-LD`); errors++; continue; }
  pages++;
  blocks.each((_, s) => {
    let json;
    try { json = JSON.parse($(s).html()); } catch (e) { console.log(`${file}: invalid JSON-LD (${e.message})`); errors++; return; }
    if (json['@context'] !== 'https://schema.org') { console.log(`${file}: @context missing`); errors++; }
    visit(json['@graph'] ?? json, file);
  });
}
// Site-wide ids (#organization, #website, broker) are defined on the home page only, by design.
for (const [id, file] of referencedIds) if (!definedIds.has(id)) { console.log(`dangling @id ${id} (referenced in ${file}, defined nowhere)`); errors++; }
console.log(`Schema check: ${pages} pages, ${nodes} nodes, ${errors} error(s).`);
process.exit(errors ? 1 : 0);
