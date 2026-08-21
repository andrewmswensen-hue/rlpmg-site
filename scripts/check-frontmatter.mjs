// Quick frontmatter length check for content/pages and content/cities before a full build.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
function walk(d) { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) ? [p] : []; }); }
let bad = 0;
for (const f of [...walk('src/content/pages'), ...(statSync('src/content/cities', { throwIfNoEntry: false }) ? walk('src/content/cities') : [])]) {
  const fm = readFileSync(f, 'utf8').split('---')[1] ?? '';
  const get = (k) => (fm.match(new RegExp(`^${k}: "(.*)"$`, 'm')) ?? [])[1];
  const d = get('description'), a = get('directAnswer'), st = get('seoTitle');
  const issues = [];
  if (d && (d.length < 120 || d.length > 160)) issues.push(`description ${d.length}`);
  if (a && (a.length < 150 || a.length > 520)) issues.push(`directAnswer ${a.length}`);
  if (st && st.length > 60) issues.push(`seoTitle ${st.length}`);
  const faqA = [...fm.matchAll(/^\s+a: "(.*)"$/gm)].map((m) => m[1]).filter((x) => x.length > 400);
  if (faqA.length) issues.push(`faq answers >400: ${faqA.length}`);
  if (issues.length) { bad++; console.log(`${f}: ${issues.join(', ')}`); }
}
console.log(bad ? `${bad} file(s) need fixes.` : 'Frontmatter lengths OK.');
