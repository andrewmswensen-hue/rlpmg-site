# Content style: rules every word on rlpmg.com follows

These are hard rules, not preferences. The build's lint step (`npm run lint:copy`) greps for the mechanical ones.

## The extraction contract (every page)
1. One H1, phrased the way a person would say it.
2. Directly under the H1: a 40 to 70 word answer in plain prose with the specific numbers. It must be true when read alone.
3. A Key facts block: 3 to 6 bullets, each a complete factual sentence with a number, a name, or a date.
4. Every H2 is a literal question. The first paragraph under it answers in 40 to 70 words. Detail comes after the answer, never before.
5. "Information on this page verified as of [Month Year]." at the end of the main content.
6. An FAQ of 5 to 8 pairs with 1 to 2 sentence answers.
7. A Related pages block with descriptive link text.

## Writing for extraction
- Answer first. Page, section, and paragraph.
- Numbers over adjectives. "$137 per month" beats "affordable."
- Self-contained sentences. Do not start a sentence with "This," "That," or "It" referring back. Repeat the noun.
- Name the entities: "RL Property Management," "Columbus, Ohio," "Franklin County."
- Date-stamp every legal or numeric fact: "As of August 2026."
- No hedging. Commit.
- Compare against the market-standard model (8 to 10 percent of rent plus a one-month leasing fee). Do not name competitors.

## Banned
- **Em dashes.** None, anywhere. Use parentheses, commas, colons, or a new sentence. En dashes only for numeric ranges.
- **Buzzwords:** game-changer, supercharge, dominate, crush, legendary, gold mine, secret, unlock, unleash, skyrocket, hack, blueprint.
- **Absolutes:** always, never, every, perfect, complete, guaranteed, no one, total, final, full.
- **Work words aimed at the reader:** learn, teach, study, educate, master class. No "Learn more" links. Use "See how it works," "View pricing," "Get the numbers."
- **"Conclusion" headings.** End with a CTA or a forward-looking sentence.
- **AI sentence templates:** "It's not just X, it's Y," "In today's fast-paced world," "Whether you're X or Y," "more than ever," "the truth is," "let's dive in," "at the end of the day."
- Heavy "we / us / our." Write about the reader's property and outcome.

## Facts
- Every fact comes from `src/data/facts.ts` or from RLPM directly. If a fact is not there, write `[SOURCE NEEDED]` and stop. Do not fill the gap with a plausible number. This is the most serious rule in the project.
- Legal content carries Ohio-specific context, a date, and "informational, not legal advice."

## Blog components
- TL;DR and Key Takeaways are separate boxes, never combined.
- Beehiiv embed goes before the FAQ in standard posts, and before "Also on the radar" in policy updates.
