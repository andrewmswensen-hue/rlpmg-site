#!/usr/bin/env python3
"""
WordPress WXR -> src/content/blog/<slug>.md

Keeps post HTML (Astro renders raw HTML inside Markdown) but normalizes the hand-styled component boxes into
semantic, class-based markup that src/styles/blog.css styles in the brand palette:
  TL;DR box            -> <aside class="post-box post-tldr">
  Key Takeaways        -> <aside class="post-box post-takeaways">
  In This Article TOC  -> <nav class="post-toc">
  Pull quote           -> <blockquote class="post-pullquote">
  CTA block            -> <aside class="post-cta">
  Beehiiv embed        -> <div class="post-newsletter">
Strips pasted junk (Gmail/Squarespace/Claude classes), em dashes, and rewrites absolute rlpmg.com links to relative.
Images keep their rlpmg.com URLs until the uploads folder is mirrored locally (see STATUS.md).

Usage: python3 scripts/import-wxr.py ../source/wordpress-export-2026-08-21.xml
"""
import sys, re, json, html, os
import xml.etree.ElementTree as ET
from datetime import datetime

NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc': 'http://purl.org/dc/elements/1.1/',
}
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'blog')
AUTHORS = {'peter@rlpmg.com': 'Peter Lohmann', 'andrew': 'Andrew Swensen', 'RLPMGroup.social@gmail.com': 'RL Property Management'}


def text(el, path):
    return el.findtext(path, '', NS) or ''


def classify(title, cats):
    t = title.lower()
    if 'policy update' in t:
        return 'policy-update'
    if 'Rental Market Guide' in cats or re.search(r'rental market( guide)?', t) and re.search(r'20\d\d|guide', t):
        return 'market-guide'
    if 'Owner Occupied Podcast' in cats or 'podcast' in t:
        return 'podcast'
    return 'article'


CITY_WORDS = ['german village', 'short north', 'grandview heights', 'clintonville', 'arena district', 'upper arlington', 'southern orchards',
              'worthington', 'westerville', 'dublin', 'reynoldsburg', 'hilliard', 'gahanna', 'powell', 'pickerington', 'new albany', 'bexley',
              'canal winchester', 'grove city', 'delaware', 'marysville', 'lancaster', 'newark', 'london', 'ashville', 'blacklick', 'columbus']


def city_of(title):
    t = title.lower()
    for c in CITY_WORDS:
        if c in t:
            return re.sub(r'[^a-z0-9]+', '-', c).strip('-')
    return None


def clean_html(b):
    b = b.replace('<!-- [et_pb_line_break_holder] -->', '\n')
    b = re.sub(r'\[/?et_pb[^\]]*\]', '', b)
    b = re.sub(r'\[gravityform[^\]]*\]', '', b)
    b = re.sub(r'\[remote_content[^\]]*\]', '', b)
    # junk classes from pasted sources
    b = re.sub(r'\s(?:class|style|dir|data-[a-z-]+)="[^"]*(?:font-claude|gmail-|sqs-|whitespace-normal|xl6\d|\bp[1-6]\b|\bs[1-4]\b)[^"]*"', '', b)
    b = re.sub(r'<(/?)(span|font)(\s[^>]*)?>', '', b)  # drop inline spans/fonts entirely
    b = b.replace('—', ', ').replace(' – ', ', ')  # em dash, spaced en dash
    b = re.sub(r'\s+,', ',', b)
    b = b.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    # absolute internal links -> relative
    b = re.sub(r'href="https?://(?:www\.)?rlpmg\.com(/[^"]*)"', r'href="\1"', b)
    b = re.sub(r'href="https?://(?:www\.)?rlpmg\.com/?"', 'href="/"', b)

    # Component boxes. Match on the label text inside the first <p> of an inline-styled div.
    def box(label_regex, cls, tag='aside'):
        nonlocal b
        pat = re.compile(r'<div style="[^"]*">\s*<p style="[^"]*">\s*(' + label_regex + r')\s*</p>(.*?)</div>', re.S | re.I)
        b = pat.sub(lambda m: f'<{tag} class="post-box {cls}"><p class="post-box-label">{m.group(1).strip()}</p>{m.group(2)}</{tag}>', b)

    box(r'TL;DR', 'post-tldr')
    box(r'Key Takeaways', 'post-takeaways')
    box(r'In This Article', 'post-toc', tag='nav')
    box(r'Related Reading', 'post-related')
    # generic remaining inline-styled divs with a label -> plain box
    b = re.sub(r'<div style="[^"]*">\s*<p style="[^"]*">\s*([A-Z][A-Za-z ;&]{2,40})\s*</p>', r'<aside class="post-box"><p class="post-box-label">\1</p>', b)
    # pull quotes
    b = re.sub(r'<blockquote style="[^"]*">', '<blockquote class="post-pullquote">', b)
    # Beehiiv
    b = re.sub(r'<script[^>]*subscribe-forms\.beehiiv\.com[^>]*></script>', '', b)
    b = re.sub(r'<iframe([^>]*subscribe-forms\.beehiiv\.com[^>]*)></iframe>', r'<div class="post-newsletter"><iframe\1 loading="lazy" title="RL Property Management newsletter signup"></iframe></div>', b)
    # strip remaining inline styles on common tags but keep the tag
    b = re.sub(r'<(p|h[1-6]|ul|ol|li|div|table|tr|td|th|a|strong|em|img|blockquote)([^>]*?)\sstyle="[^"]*"', r'<\1\2', b)
    # h1 inside body -> h2 (page has one H1)
    b = re.sub(r'<(/?)h1\b', r'<\1h2', b)
    # lazy-load images, ensure alt attr exists
    b = re.sub(r'<img(?![^>]*loading=)', '<img loading="lazy" decoding="async"', b)
    b = re.sub(r'<img(?![^>]*\balt=)([^>]*)>', r'<img alt=""\1>', b)
    b = re.sub(r'\n{3,}', '\n\n', b)
    return b.strip()


def excerpt_from(b):
    t = re.sub(r'<aside.*?</aside>', '', b, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(re.sub(r'\s+', ' ', t)).strip()
    return t[:157].rsplit(' ', 1)[0] + '...' if len(t) > 160 else t


def yaml_str(s):
    return json.dumps(s, ensure_ascii=False)


def main(path):
    root = ET.parse(path).getroot()
    items = root.findall('./channel/item')
    attachments = {text(i, 'wp:post_id'): text(i, 'wp:attachment_url') for i in items if text(i, 'wp:post_type') == 'attachment'}
    os.makedirs(OUT, exist_ok=True)
    n = 0
    stats = {'article': 0, 'market-guide': 0, 'policy-update': 0, 'podcast': 0}
    for it in items:
        if text(it, 'wp:post_type') != 'post' or text(it, 'wp:status') not in ('publish', 'future'):
            continue
        slug = text(it, 'wp:post_name')
        title = html.unescape(it.findtext('title', '') or '').replace('—', ', ').replace('’', "'")
        body = clean_html(text(it, 'content:encoded'))
        cats = [c.text for c in it.findall('category') if c.get('domain') == 'category' and c.text != 'Uncategorized']
        tags = [c.text for c in it.findall('category') if c.get('domain') == 'post_tag']
        meta = {m.findtext('wp:meta_key', '', NS): m.findtext('wp:meta_value', '', NS) for m in it.findall('wp:postmeta', NS)}
        pub = text(it, 'wp:post_date_gmt') or text(it, 'wp:post_date')
        mod = text(it, 'wp:post_modified_gmt') or text(it, 'wp:post_modified')
        pub_iso = datetime.strptime(pub, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%dT%H:%M:%SZ')
        mod_iso = datetime.strptime(mod, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%dT%H:%M:%SZ') if mod and mod != '0000-00-00 00:00:00' else pub_iso
        desc = html.unescape(meta.get('_yoast_wpseo_metadesc', '') or '') or excerpt_from(body)
        desc = desc.replace('—', ', ').replace('’', "'")
        seo_title = html.unescape(meta.get('_yoast_wpseo_title', '') or '').replace('%%title%%', title).replace('%%sep%%', '|').replace('%%sitename%%', 'RL Property Management').replace('%%page%%', '').strip(' |')
        thumb = attachments.get(meta.get('_thumbnail_id', ''), '')
        ptype = classify(title, cats)
        stats[ptype] += 1
        primary = meta.get('_yoast_wpseo_primary_category', '')
        fm = {
            'title': title,
            'description': desc,
            'pubDate': pub_iso,
            'updatedDate': mod_iso,
            'author': AUTHORS.get(text(it, 'dc:creator'), 'Peter Lohmann'),
            'categories': cats,
            'tags': tags,
            'type': ptype,
            'wpId': int(text(it, 'wp:post_id')),
            'draft': text(it, 'wp:status') == 'future' and False,
        }
        if seo_title and seo_title != title:
            fm['seoTitle'] = seo_title
        if thumb:
            fm['heroImage'] = thumb
        if ptype == 'market-guide':
            c = city_of(title)
            if c:
                fm['city'] = c
        lines = ['---']
        for k, v in fm.items():
            if isinstance(v, list):
                lines.append(f'{k}: [' + ', '.join(yaml_str(x) for x in v) + ']')
            elif isinstance(v, bool):
                lines.append(f'{k}: {"true" if v else "false"}')
            elif isinstance(v, int):
                lines.append(f'{k}: {v}')
            else:
                lines.append(f'{k}: {yaml_str(v)}')
        lines.append('---')
        lines.append('')
        lines.append(body)
        with open(os.path.join(OUT, f'{slug}.md'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
        n += 1
    print(f'wrote {n} posts to {OUT}: {stats}')


if __name__ == '__main__':
    main(sys.argv[1])
