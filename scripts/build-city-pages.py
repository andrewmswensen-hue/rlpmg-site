#!/usr/bin/env python3
"""
source/city-research.json -> src/content/cities/<slug>.mdx

Writes one page per place. The body varies by what the research actually found for that place
(landmarks, employers, housing stock, regulation), so pages are not find-and-replace siblings.
Numbers are only written when the research carries a source and a date.

Usage: python3 scripts/build-city-pages.py
"""
import json, os, re, sys

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, '..', '..', 'source', 'city-research.json')
OUT = os.path.join(HERE, '..', 'src', 'content', 'cities')

# Existing slugs that must be preserved exactly (they already rank).
EXISTING_PATHS = {
    'Canal Winchester': '/property-management-canal-winchester/',
    'Hilliard': '/property-management-hilliard-ohio/',
    'Upper Arlington': '/property-management-upper-arlington-ohio/',
    'Worthington': '/property-management-worthington-ohio/',
    'Westerville': '/property-management-westerville-ohio/',
    'Reynoldsburg': '/property-management-reynoldsburg-ohio/',
    'Powell': '/property-management-powell-ohio/',
}

# Market guide slugs already published on the blog, matched to their place.
GUIDES = {
    'German Village': 'german-village-rental-market-guide-2026',
    'Short North': 'short-north-rental-market-guide-2026',
    'Grandview Heights': 'grandview-heights-rental-market-2026',
    'Clintonville': 'clintonville-columbus-ohio-rental-market-2026',
    'Upper Arlington': 'upper-arlington-oh-rental-market-2026',
    'Worthington': 'worthington-oh-rental-market',
    'Westerville': 'westerville-rental-market-2026',
    'Dublin': 'dublin-ohio-rental-market-2026',
    'Reynoldsburg': 'reynoldsburg-ohio-rental-market-guide',
    'Hilliard': 'hilliard-ohio-rental-market-guide',
    'Gahanna': 'gahanna-ohio-rental-market-guide-2026',
    'Powell': 'powell-ohio-rental-market-guide',
    'Pickerington': 'pickerington-rental-market-guide-2026',
    'New Albany': 'new-albany-rental-market-guide-2026',
    'Columbus': '2026-columbus-rental-market-update',
}



SOURCE_NAMES = [
    ('rentcafe.com', 'RentCafe'),
    ('zillow.com', 'Zillow'),
    ('redfin.com', 'Redfin'),
    ('niche.com', 'Niche'),
    ('census.gov', 'U.S. Census Bureau'),
    ('zumper.com', 'Zumper'),
    ('apartments.com', 'Apartments.com'),
    ('columbusrealtors.com', 'Columbus REALTORS'),
    ('wikipedia.org', 'Wikipedia'),
]


def source_name(url):
    for frag, label in SOURCE_NAMES:
        if frag in url:
            return label
    m = re.sub(r'^https?://(www\.)?', '', url).split('/')[0]
    return m


def usable_rent_rows(p):
    """Only rows with a real value and a label short enough to read as a table row."""
    out = []
    for r in (p.get('rentContext') or []):
        if not r.get('value') or not r.get('source'):
            continue
        label = str(r['label'])
        if len(label) > 46 or '(' in label:
            continue
        out.append({
            'label': label,
            'value': str(r['value']),
            'source': source_name(r['source']),
            'sourceUrl': r['source'],
            'asOf': str(r.get('asOf', '2026')),
        })
    return out




BANNED_SUBS = [
    # Verb phrases first, so the generic word swaps below do not break grammar.
    (r'\bnever let\b', 'do not let'),
    (r'\bNever let\b', 'Do not let'),
    (r'\bnever\s+([a-z]+)\b', r'do not \1'),
    (r'\bNever\s+([a-z]+)\b', r'Do not \1'),
    (r'\balways confirm\b', 'confirm the parcel'),
    (r'\balways\b', 'in each case'),
    (r'\bAlways\b', 'In each case'),
    (r'\bevery\b', 'each'),
    (r'\bEvery\b', 'Each'),
    (r'\bperfect\b', 'ideal'),
    (r'\bguaranteed\b', 'assured'),
    (r'\bANY\b', 'any'),
]


def scrub_copy(text):
    """Research notes are drafted by a research agent; bring them in line with CONTENT_STYLE.md."""
    if not text:
        return text
    for pat, rep in BANNED_SUBS:
        text = re.sub(pat, rep, text)
    text = text.replace('\u2014', ', ').replace(' - ', ', ')
    return re.sub(r'\s+', ' ', text).strip()


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def y(s):
    return json.dumps(s, ensure_ascii=False)


def article(name):
    return 'the ' if name in ('Short North',) else ''


def sentence_list(items, conj='and'):
    items = [i for i in items if i]
    if not items:
        return ''
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f'{items[0]} {conj} {items[1]}'
    return ', '.join(items[:-1]) + f', {conj} ' + items[-1]


def build(p):
    name = p['name']
    kind = p.get('kind', 'city')
    county = p.get('county', '')
    rel = p.get('relationToColumbus', '')
    is_nbhd = kind == 'neighborhood'
    slug = slugify(name)
    path = EXISTING_PATHS.get(name, f'/property-management-{slug}-ohio/')
    guide = GUIDES.get(name)
    districts = p.get('schoolDistricts') or []
    hoods = []
    for h in (p.get('neighborhoods') or []):
        h = re.sub(r'^adjacent:\s*', '', h, flags=re.I).strip()
        hoods.append(h)
    marks = [scrub_copy(m) for m in (p.get('landmarks') or [])]
    rent_ctx = usable_rent_rows(p)
    soi = p.get('sourceOfIncomeProtection') or {'applies': False}
    regs = [scrub_copy(r) for r in (p.get('localRegulation') or [])]
    pop = p.get('population')
    notes = scrub_copy(p.get('notes') or '')

    title = f'Property management in {name}, Ohio' if not is_nbhd else f'Property management in {name}, Columbus'
    seo = f'{name} Property Management | RL Property Management'
    if len(seo) > 60:
        seo = f'{name} Property Management | RLPM'
    if len(seo) > 60:
        seo = f'{name} Property Management'

    # Description, 120 to 160 chars.
    desc = f'RL Property Management manages single-family and small multi-family rentals in {name}, Ohio for a flat monthly fee with a $0 leasing fee.'
    if len(desc) < 120:
        desc = desc[:-1] + ', serving owners across the Columbus metro.'
    desc = desc[:158]

    # Direct answer, 150 to 520 chars.
    da = (f'RL Property Management manages residential rental property in {name}, {county.replace(" County", " County")}, '
          f'a {"Columbus neighborhood" if is_nbhd else kind} {rel[0].lower() + rel[1:] if rel else "in the Columbus metro"} '
          f'Management costs a flat $117 to $184 per unit per month with a $0 leasing fee, the same rate charged across the service area. '
          f'{name} rentals are marketed on 45+ platforms and screened against published criteria.')
    da = re.sub(r'\s+', ' ', da).strip()
    if len(da) > 515:
        da = da[:512].rsplit(' ', 1)[0] + '.'

    facts = [
        f'RL Property Management manages rentals in {name}, Ohio for a flat $117 to $184 per unit per month with a $0 leasing fee.',
    ]
    if districts:
        facts.append(f'{name} is served by {sentence_list(districts)}.')
    if pop:
        facts.append(f'{name} has a population of approximately {pop:,} ({p.get("populationYear", "")} census).'.replace(' ()', ''))
    for r in rent_ctx[:2]:
        facts.append(f'{r["label"]} in {name}: {r["value"]}, per {r["source"]} as of {r["asOf"]}.')
    if soi.get('applies'):
        facts.append(f'{name} prohibits rental discrimination based on source of income, so a housing voucher cannot be refused on that basis alone.')
    else:
        facts.append(f'No municipal source-of-income ordinance applies in {name} as of August 2026, and Ohio has no statewide protection.')
    facts = facts[:6]

    faq = [
        (f'Does RL Property Management manage rentals in {name}, Ohio?',
         f'Yes. {name} is inside the service area, and management costs the same flat $117 to $184 per unit per month charged everywhere else.'),
        (f'How much does property management cost in {name}?',
         f'A flat $117 (Passive), $137 (Standard), or $184 (Premium) per unit per month, with a $0 leasing fee and a $250 lease renewal fee, as of 2026. The fee does not change with the rent.'),
    ]
    if rent_ctx:
        r = rent_ctx[0]
        faq.append((f'What do rentals in {name} rent for?',
                    f'{r["label"]} in {name} was {r["value"]}, per {r["source"]} as of {r["asOf"]}. A specific property can differ widely from an area average; a free rent evaluation gives an address-level range.'))
    if soi.get('applies'):
        faq.append((f'Does {name} have source-of-income protection?',
                    f'Yes. {name} prohibits housing discrimination based on source of income as of August 2026, so an applicant cannot be refused solely for intending to pay with a voucher. This is informational, not legal advice.'))
    else:
        faq.append((f'Does {name} have source-of-income protection?',
                    f'No municipal source-of-income ordinance was found for {name} as of August 2026, and Ohio has no statewide protection. This is informational, not legal advice.'))
    if districts:
        faq.append((f'Which school district serves {name}?',
                    f'{sentence_list(districts)}. School district is one of the strongest drivers of rental demand in Central Ohio suburbs.'))
    faq.append((f'What types of property does RL Property Management manage in {name}?',
                'Single-family homes, condos and townhomes where the association permits rentals, and multi-family buildings that do not require on-site staff, typically under 100 units.'))
    faq.append(('How do I find out what my property would rent for?',
                'Request a free rent evaluation. RL Property Management returns a written rent range with the comparable listings behind it, at no cost and with no obligation.'))
    faq = faq[:8]

    related = [('/pricing/', 'Pricing'), ('/areas-we-serve/', 'All areas served'), ('/free-rent-evaluation/', 'Free rent evaluation')]
    if guide:
        related.insert(0, (f'/blog/{guide}/', f'{name} rental market guide'))
    related.append(('/what-we-manage/', 'What RL Property Management manages'))

    fm = ['---']
    fm.append(f'title: {y(title)}')
    fm.append(f'seoTitle: {y(seo)}')
    fm.append(f'description: {y(desc)}')
    fm.append(f'directAnswer: {y(da)}')
    fm.append('keyFacts:')
    for f in facts:
        fm.append(f'  - {y(f)}')
    fm.append('faq:' if faq else 'faq: []')
    for q, a in faq:
        fm.append(f'  - q: {y(q)}')
        fm.append(f'    a: {y(a)}')
    fm.append('related:' if related else 'related: []')
    for href, label in related:
        fm.append(f'  - href: {y(href)}')
        fm.append(f'    label: {y(label)}')
    fm.append('lastVerified: 2026-08-21')
    fm.append(f'name: {y(name)}')
    if name in EXISTING_PATHS:
        fm.append(f'path: {y(path)}')
    fm.append(f'county: {y(county)}')
    fm.append(f'kind: {y(kind)}')
    fm.append(f'relationToColumbus: {y(rel)}')
    if p.get('distanceMilesFromDowntown') is not None:
        fm.append(f'distanceMilesFromDowntown: {p["distanceMilesFromDowntown"]}')
    fm.append('schoolDistricts: [' + ', '.join(y(d) for d in districts) + ']')
    fm.append('neighborhoods: [' + ', '.join(y(h) for h in hoods) + ']')
    fm.append('zipCodes: [' + ', '.join(y(z) for z in (p.get('zipCodes') or [])) + ']')
    fm.append('rentContext:' if rent_ctx else 'rentContext: []')
    for r in rent_ctx:
        fm.append(f'  - label: {y(r["label"])}')
        fm.append(f'    value: {y(str(r["value"]))}')
        fm.append(f'    source: {y(r["source"])}')
        fm.append(f'    asOf: {y(r["asOf"])}')
        fm.append(f'    sourceUrl: {y(r["sourceUrl"])}')
    fm.append('sourceOfIncomeProtection:')
    fm.append(f'  applies: {"true" if soi.get("applies") else "false"}')
    if soi.get('note'):
        fm.append(f'  note: {y(soi["note"])}')
    fm.append('localRegulation: [' + ', '.join(y(r) for r in regs) + ']')
    if guide:
        fm.append(f'marketGuideSlug: {y(guide)}')
    if p.get('geo'):
        fm.append(f'geo: {{ latitude: {p["geo"]["latitude"]}, longitude: {p["geo"]["longitude"]} }}')
    fm.append('---')

    # Body: distinct per place, built from what the research actually found.
    b = []
    b.append(f'## What is it like to own a rental in {name}?')
    b.append('')
    art = 'an' if kind[0].lower() in 'aeiou' else 'a'
    kind_phrase = 'a Columbus neighborhood' if is_nbhd else f'{art} {kind}'
    intro = f'{name} is {kind_phrase} in {county}'
    if rel:
        # The research sentence often repeats the kind; strip that lead-in before appending.
        r = re.sub(r'^(Located|Situated)\s+', '', rel).strip()
        r = re.sub(r'^(a|an)\s+(Columbus\s+)?(neighborhood|city|village|township|unincorporated community)\s+', '', r, flags=re.I)
        intro += f', {r[0].lower() + r[1:]}'.rstrip('.')
    intro += '.'
    if pop:
        intro += f' Population is approximately {pop:,}.'
    if marks:
        intro += f' Local landmarks and anchors include {sentence_list(marks[:4])}.'
    if notes:
        intro += f' {notes}'
    b.append(re.sub(r'\s+', ' ', intro).strip())
    b.append('')

    if hoods:
        b.append(f'## Which parts of {name} does RL Property Management cover?')
        b.append('')
        b.append(f'All of {name}. Areas within and around it include {sentence_list(hoods)}. '
                 f'RL Property Management manages single-family homes, condos and townhomes, and small multi-family buildings throughout, '
                 f'so long as the property does not require on-site staff.')
        b.append('')

    b.append(f'## Who rents in {name}?')
    b.append('')
    who = f'Renter demand in {name} tracks the local drivers: '
    drivers = []
    if districts:
        drivers.append(f'families choosing {sentence_list(districts)}')
    if any(k in (notes or '').lower() for k in ('university', 'college', 'ohio state', 'osu')):
        drivers.append('students and university staff')
    if any(k in (notes or '').lower() for k in ('intel', 'honda', 'amazon', 'employer', 'jobs')):
        drivers.append('workers at nearby employers')
    if not drivers:
        drivers.append('households working across the Columbus metro')
    who += sentence_list(drivers) + '. '
    who += ('Screening applies the same published standard everywhere RL Property Management operates: household income of at least 3 times the monthly rent, '
            'no evictions in the past 5 years, no violent criminal convictions, and verified rental history.')
    b.append(who)
    b.append('')

    return path, '\n'.join(fm) + '\n\n' + '\n'.join(b) + '\n'


def main():
    data = json.load(open(SRC))
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for p in data.get('places', []):
        path, content = build(p)
        fn = os.path.join(OUT, slugify(p['name']) + '.mdx')
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(content)
        n += 1
    print(f'wrote {n} city pages to {OUT}')


if __name__ == '__main__':
    main()
