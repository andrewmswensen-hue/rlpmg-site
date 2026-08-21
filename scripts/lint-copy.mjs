// Greps rendered HTML and content sources for the banned list in CONTENT_STYLE.md.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
const roots = ['dist', 'src/content', 'src/pages', 'src/components', 'src/data'];
const exts = new Set(['.html', '.md', '.mdx', '.astro', '.ts', '.json', '.txt']);
// Em dashes are banned everywhere, including migrated posts (the importer strips them at import).
const emDash = /—/g;
// The rest of the guardrails apply to copy written for this build. The 379 migrated blog posts are
// Peter Lohmann's published articles (2018 to 2026) with existing search equity; they are exempt by decision
// 2026-08-21 (see ../STATUS.md). New posts added to src/content/blog are expected to follow CONTENT_STYLE.md.
const banned = [
  /\b(game-changer|supercharge|dominate|crush|legendary|gold mine|unlock|unleash|skyrocket|blueprint)\b/gi,
  /\b(always|never|every|perfect|guaranteed)\b/gi,
  /\blearn more\b/gi,
  /\bconclusion\b/gi,
  /it'?s not just .{1,40}, it'?s/gi,
  /in today'?s fast-paced world|more than ever|the truth is|let'?s dive in|at the end of the day/gi,
];
let hits = 0;
function walk(d) {
  let out = [];
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    const s = statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    else if (exts.has(extname(p))) out.push(p);
  }
  return out;
}
for (const r of roots) {
  let files = [];
  try { files = walk(r); } catch { continue; }
  for (const f of files) {
    if (f.includes('wp-content') || f.endsWith('lint-copy.mjs') || f.endsWith('CONTENT_STYLE.md')) continue;
    const txt = readFileSync(f, 'utf8');
    // Skip <script type="application/ld+json"> and code blocks? No: schema text is copy too.
    const lines = txt.split('\n');
    const isMigratedPost = f.startsWith('src/content/blog') || f.startsWith('dist/blog');
    lines.forEach((line, i) => {
      const t = line.trim();
      if (isMigratedPost) {
        emDash.lastIndex = 0;
        const m = emDash.exec(line);
        if (m) { hits++; console.log(`${f}:${i + 1}: em dash  ${t.slice(0, 110)}`); }
        return;
      }
      // Code comments are not copy.
      if (/\.(ts|mjs|astro)$/.test(f) && (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'))) return;
      for (const re of [emDash, ...banned]) {
        re.lastIndex = 0;
        const m = re.exec(line);
        if (m) { hits++; console.log(`${f}:${i + 1}: "${m[0]}"  ${line.trim().slice(0, 110)}`); }
      }
    });
  }
}
console.log(hits ? `\n${hits} banned-copy hit(s).` : 'Copy lint clean.');
process.exit(hits ? 1 : 0);
