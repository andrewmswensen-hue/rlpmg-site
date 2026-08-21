#!/usr/bin/env python3
"""
Migrate the two long-form scoped-HTML pages (2026 market report, client handbook) out of the
WordPress export and into src/pages/<slug>/index.astro, preserving their own scoped CSS.

These pages use Andrew's scoped design-system kit rather than the site's Tailwind components, so the
<style> block travels with the markup. The wrapper supplies the head, schema, header, and footer.

Usage: python3 scripts/import-longform.py
"""
import xml.etree.ElementTree as ET
import re, html, os, json

NS = {'content': 'http://purl.org/rss/1.0/modules/content/', 'wp': 'http://wordpress.org/export/1.2/'}
HERE = os.path.dirname(__file__)
EXPORT = os.path.join(HERE, '..', '..', 'source', 'wordpress-export-2026-08-21.xml')
PAGES = os.path.join(HERE, '..', 'src', 'pages')

TARGETS = [
    {
        'link': 'https://rlpmg.com/2026-columbus-market-report/',
        'slug': '2026-columbus-market-report',
        'title': '2026 Columbus Single-Family Rental Market Report',
        'seoTitle': '2026 Columbus Rental Market Report | RLPM',
        'description': 'RL Property Management\'s 2026 Columbus single-family rental market report: median prices, rent growth, cap rates by neighborhood, regulatory changes, and the investor outlook.',
        'directAnswer': 'RL Property Management publishes an annual report on the Columbus, Ohio single-family rental market covering median home prices, rent levels and growth, cap rates by neighborhood, employment drivers, regulatory changes affecting landlords, and the outlook for the year ahead. The 2026 edition draws on Columbus REALTORS, RentCafe, Arbor, Redfin, the Franklin County Auditor, and RL Property Management\'s own portfolio of approximately 750 units.',
        'keyFacts': [
            'The report covers the Columbus, Ohio single-family rental market across 30+ neighborhoods.',
            'Sources include Columbus REALTORS, RentCafe, Arbor, Redfin, the Franklin County Auditor, and RL Property Management\'s own operating data.',
            'Sections cover housing market overview, rental performance, best neighborhoods for investment, employment drivers, regulatory updates, and the 2026 outlook.',
            'RL Property Management has served Columbus investors since 2013 and manages approximately 750 units.',
        ],
        'section': 'owners',
    },
    {
        'link': 'https://rlpmg.com/client-handbook/',
        'slug': 'client-handbook',
        'title': 'RL Property Management client handbook',
        'seoTitle': 'Client Handbook | RL Property Management',
        'description': 'The client handbook for RL Property Management owners in Columbus, Ohio: rent disbursement, maintenance reserves, leasing, evictions, fair housing standards, fees, and contacts.',
        'directAnswer': 'The RL Property Management client handbook is the operating reference for property owners under management in Columbus, Ohio. It covers when rent is disbursed, how the maintenance reserve works, what happens during vacancy and leasing, how repairs are authorized and billed, lease renewals and rent increases, fair housing and screening standards, the full fee schedule, and who to contact for each type of question.',
        'keyFacts': [
            'The handbook is the operating reference for current RL Property Management clients in Columbus, Ohio.',
            'It covers rent disbursement timing, maintenance reserves, leasing, evictions, renewals, and the full fee schedule.',
            'Fair housing standards cover federal, Ohio (military status), and Columbus (sexual orientation, gender identity, source of income) protected classes.',
            'Terms in the signed Property Management Agreement control where the handbook and the agreement differ.',
        ],
        'section': 'owners',
    },
]



# CONTENT_STYLE.md guardrails applied to migrated copy. Word-level substitutions only: these do not
# change meaning, and they keep the two long-form pages consistent with the rest of the new site.
COPY_SUBS = [
    (r"\bit's always up to date\b", "it stays current"),
    (r"\bIt's always up to date\b", "It stays current"),
    (r"\balways\b", "consistently"),
    (r"\bAlways\b", "Consistently"),
    (r"\bnever\s+([a-z]+)\b", r"do not \1"),
    (r"\bNever\s+([a-z]+)\b", r"Do not \1"),
    (r"\bevery\b", "each"),
    (r"\bEvery\b", "Each"),
    (r"\bperfect\b", "ideal"),
    (r"\bguaranteed\b", "assured"),
    (r"\bLearn more\b", "See details"),
    (r"\blearn more\b", "see details"),
]


def scrub_copy(b):
    """Apply the copy guardrails to text nodes only, leaving tags, attributes, and class names alone."""
    parts = re.split(r'(<[^>]+>)', b)
    for i, part in enumerate(parts):
        if part.startswith('<'):
            continue
        for pat, rep in COPY_SUBS:
            part = re.sub(pat, rep, part)
        parts[i] = part
    return ''.join(parts)


def clean(b):
    b = b.replace('<!-- [et_pb_line_break_holder] -->', '\n')
    # Keep the page's own <style>; drop Divi shortcodes and the site-wide furniture the wrapper supplies.
    b = re.sub(r'\[et_pb_[^\]]*\]', '', b)
    b = re.sub(r'\[/et_pb_[^\]]*\]', '', b)
    b = re.sub(r'\[gravityform[^\]]*\]', '', b)
    b = re.sub(r'\[remote_content[^\]]*\]', '', b)
    b = b.replace('—', ', ').replace(' – ', ', ')
    b = b.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    b = re.sub(r'href="https?://(?:www\.)?rlpmg\.com(/[^"]*)"', r'href="\1"', b)
    # First h1 becomes the page H1 via the wrapper; demote any in-body h1 to h2.
    b = re.sub(r'<(/?)h1\b', r'<\1h2', b)
    b = re.sub(r'<img(?![^>]*loading=)', '<img loading="lazy" decoding="async"', b)
    b = re.sub(r'<img(?![^>]*\balt=)([^>]*)>', r'<img alt=""\1>', b)
    b = scrub_copy(b)
    return b.strip()


def main():
    root = ET.parse(EXPORT).getroot()
    for t in TARGETS:
        item = [i for i in root.findall('./channel/item') if i.findtext('link', '') == t['link']]
        if not item:
            print('MISSING in export:', t['link'])
            continue
        body = clean(item[0].findtext('content:encoded', '', NS) or '')
        # Split the scoped <style> blocks out so they can go in a <style is:global> slot.
        styles = re.findall(r'<style[^>]*>(.*?)</style>', body, re.S)
        body_no_style = re.sub(r'<style[^>]*>.*?</style>', '', body, flags=re.S).strip()
        css = '\n'.join(styles)

        out_dir = os.path.join(PAGES, t['slug'])
        os.makedirs(out_dir, exist_ok=True)
        path = f"/{t['slug']}/"
        css_json = json.dumps(css)
        astro = f'''---
/**
 * Migrated from WordPress. This page carries its own scoped CSS (Andrew's long-form kit), so the styles
 * travel with the markup rather than using the site's Tailwind components.
 * Regenerate with: python3 scripts/import-longform.py
 */
import Base from '../../layouts/Base.astro';
import AeoPage from '../../components/AeoPage.astro';
import {{ LAST_VERIFIED }} from '../../data/facts';
import {{ webPageNode, breadcrumbNode }} from '../../lib/schema';

const path = {json.dumps(path)};
const title = {json.dumps(t['seoTitle'])};
const description = {json.dumps(t['description'])};
const directAnswer = {json.dumps(t['directAnswer'])};
const keyFacts = {json.dumps(t['keyFacts'], indent=2)};
const crumbs = [{{ name: 'Home', path: '/' }}, {{ name: {json.dumps(t['title'])}, path }}];
const schema = [webPageNode({{ path, title, description }}), breadcrumbNode(crumbs)];
// The page's own scoped CSS, migrated with the markup. is:inline keeps Tailwind's parser out of it
// (the original stylesheet contains text Tailwind reads as a malformed at-rule).
const migratedCss = {css_json};
---

<Base {{title}} {{description}} {{path}} {{schema}}>
  <AeoPage
    title={json.dumps(t['title'])}
    {{directAnswer}}
    {{keyFacts}}
    lastVerified={{LAST_VERIFIED}}
    breadcrumbs={{crumbs}}
    related={{[
      {{ href: '/pricing/', label: 'Pricing' }},
      {{ href: '/faq/', label: 'Owner FAQ' }},
      {{ href: '/key-performance-indicators/', label: 'KPI scorecard' }},
      {{ href: '/contact-us/', label: 'Contact' }},
    ]}}
  >
    <div class="longform" set:html={{`{body_no_style.replace('\\\\', '\\\\\\\\').replace('`', '\\\\`').replace('${', '\\\\${')}`}} />
  </AeoPage>
</Base>

<style is:inline set:html={{migratedCss}} />
'''
        with open(os.path.join(out_dir, 'index.astro'), 'w', encoding='utf-8') as f:
            f.write(astro)
        print(f"wrote {out_dir}/index.astro  ({len(body_no_style):,} chars markup, {len(css):,} chars css)")


if __name__ == '__main__':
    main()
