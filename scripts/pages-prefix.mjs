// Preview-only. Rewrites root-relative URLs in the built HTML/CSS/XML/TXT so the site works under a sub-path
// (GitHub Pages serves project sites at /<repo>/). Production on Cloudflare serves from / and never runs this.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const prefix = (process.argv[2] || '').replace(/\/$/, '');
if (!prefix) {
  console.error('usage: node scripts/pages-prefix.mjs /repo-name');
  process.exit(1);
}
const exts = new Set(['.html', '.css', '.xml', '.txt', '.md', '.json']);
function walk(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : exts.has(extname(p)) ? [p] : [];
  });
}
let n = 0;
for (const f of walk('dist')) {
  let s = readFileSync(f, 'utf8');
  const before = s;
  // href="/x", src="/x", content="/x", url(/x), and the meta-refresh redirect stubs.
  s = s.replace(/(href|src|content|action)="\/(?!\/)/g, `$1="${prefix}/`);
  s = s.replace(/url\(\/(?!\/)/g, `url(${prefix}/`);
  s = s.replace(/url=\/(?!\/)/g, `url=${prefix}/`);
  if (s !== before) {
    writeFileSync(f, s);
    n++;
  }
}
// Pages needs this so _astro/ is not ignored by Jekyll.
writeFileSync('dist/.nojekyll', '');
console.log(`Prefixed ${n} files with ${prefix}`);
