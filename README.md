# rlpmg.com

The AI-native website for RL Property Management, Columbus, Ohio. Built for answer engines first (ChatGPT, Perplexity, Claude, Google AI Overviews, Copilot) and people second.

**Preview:** https://andrewmswensen-hue.github.io/rlpmg-site/ (auto-deploys on every push to `main`, carries `noindex`)
**Production target:** Cloudflare Workers with static assets (not yet connected)

---

## The one rule

**Every company fact lives in [`src/data/facts.ts`](src/data/facts.ts).** Prices, phone numbers, the license number, unit count, review count, KPIs, eviction costs, service area. Pages, JSON-LD schema, `llms.txt`, `llms-full.txt`, and `/api/facts.json` all read from that file. Nothing is typed twice.

If a fact is not in `facts.ts` and RLPM has not supplied it, write the literal text `[SOURCE NEEDED]` and stop. Do not fill the gap with a plausible number.

---

## Everyday tasks

### Change a price

Edit the number in `src/data/facts.ts`, then:

```bash
npm run verify
```

That rebuilds, checks the schema, and runs the copy lint. The pricing page, the home page, every service page, the comparison tables, the calculators, `llms.txt`, and `/api/pricing.json` all update from the one edit. Commit and push; the preview redeploys in about a minute.

### Update the KPI scorecard

Edit the `kpis` block in `src/data/facts.ts`. Change the numbers **and** the `asOf` and `asOfLabel` fields together, so the date printed next to the numbers stays honest.

### Add a blog post

Create `src/content/blog/<slug>.md`. The URL becomes `/blog/<slug>/`. Minimum frontmatter:

```yaml
---
title: "The headline"
description: "One or two sentences, 120 to 160 characters."
pubDate: "2026-09-01T09:00:00Z"
author: "Peter Lohmann"
categories: ["Owner Education"]
type: "article"   # or market-guide, policy-update, podcast
---
```

`type` decides which index the post appears on: `market-guide` shows on `/guides/`, `policy-update` on `/policy-updates/`. The post stays at its `/blog/` URL either way.

Body is Markdown, and raw HTML works too. For the styled boxes, use these classes (see `src/styles/blog.css`):

```html
<aside class="post-box post-tldr"><p class="post-box-label">TL;DR</p><p>...</p></aside>
<aside class="post-box post-takeaways"><p class="post-box-label">Key Takeaways</p><ul>...</ul></aside>
<nav class="post-box post-toc"><p class="post-box-label">In This Article</p><ol>...</ol></nav>
<blockquote class="post-pullquote"><p>...</p></blockquote>
```

TL;DR and Key Takeaways are separate boxes. Never combine them.

### Add a standard page

Create `src/content/pages/<name>.mdx` with frontmatter matching the `pages` schema in `src/content.config.ts`. The `path` field is the URL. Required: `title`, `description` (120 to 160 chars), `directAnswer` (40 to 70 words), `keyFacts` (3 to 6), `lastVerified`, `path`, `section`.

Check lengths before building:

```bash
node scripts/check-frontmatter.mjs
```

### Add a city page

Create `src/content/cities/<slug>.mdx`. The URL becomes `/property-management-<slug>-ohio/` unless a `path` is set in frontmatter (used where an existing slug must be preserved, e.g. Canal Winchester). Numbers in `rentContext` each require a `source` and an `asOf`.

### Deploy

Pushing to `main` updates the GitHub Pages preview automatically. For production on Cloudflare (once `npx wrangler login` has been run once):

```bash
npm run deploy
```

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at http://localhost:4321 |
| `npm run build` | Static build into `dist/`, then generates the Markdown twins and `llms-full.txt` |
| `npm run verify` | Build + schema check + copy lint. Run before every commit. |
| `npm run lint:copy` | Checks the copy guardrails in [CONTENT_STYLE.md](CONTENT_STYLE.md) |
| `npm run check:schema` | Structural JSON-LD validation across the built site |
| `node scripts/check-frontmatter.mjs` | Frontmatter length limits for pages and cities |
| `npm run deploy` | Build and deploy to Cloudflare |

---

## How it is put together

```
src/
  data/facts.ts          THE source of truth for company facts
  data/crawlers.ts       AI crawler user-agent list (robots.txt + Worker logging)
  data/redirects.mjs     301s from retired rlpmg.com URLs
  lib/schema.ts          JSON-LD graph builders (one #organization entity, referenced by @id everywhere)
  lib/format.ts          usd(), monthYear(), slugify()
  lib/calc.ts            shared client runtime for the calculators
  content.config.ts      typed schemas for blog, cities, pages, faqs, team
  content/
    blog/                379 posts migrated from WordPress, plus new ones
    pages/               services, comparisons, residents, legal, trust (MDX)
    cities/              one file per city served
    faq.json             the master FAQ (66 entries)
    team.json            staff names and titles
  components/
    AeoPage.astro        the extraction contract: H1, byline, direct answer, key facts, FAQ, verified date
    Calc.astro           calculator shell (works without JS: shows defaults, static example stands)
    LeadForm.astro       plain HTML form + attribution capture
    PostLayout.astro     blog post chrome
  pages/                 routes
  styles/global.css      brand tokens (Tailwind 4 @theme)
  styles/blog.css        migrated post components in brand colors
scripts/
  import-wxr.py          WordPress export -> Markdown (re-runnable)
  markdown-mirrors.mjs   post-build: .md twin of every page + llms-full.txt
  check-schema.mjs       JSON-LD structural check
  lint-copy.mjs          copy guardrails
  check-frontmatter.mjs  frontmatter length limits
worker/index.ts          301s, form relay to LeadSimple, AI crawler logging, /internal/crawlers
```

## The machine layer

Generated on every build, all from `facts.ts` and the content collections:

- `/robots.txt` naming and allowing 25 AI crawlers explicitly
- `/sitemap-index.xml`
- `/llms.txt` (structured index) and `/llms-full.txt` (full text of the core pages)
- A `.md` twin of every page (`/pricing/` and `/pricing.md`), linked from each page's `<head>`
- `/api/facts.json` and `/api/pricing.json`
- `/rss.xml`
- JSON-LD on every page, linked into one entity graph

## Before cutover

See [../STATUS.md](../STATUS.md) for the open questions, the `[SOURCE NEEDED]` list, and the items marked for legal review.
