import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { company, pricing, serviceArea, whatWeManage, LAST_VERIFIED } from '../data/facts';
import { usd, monthYear } from '../lib/format';
import { cityPath } from '../lib/paths';

/** llms.txt per llmstxt.org: a Markdown index an assistant can read in one fetch. */
export const GET: APIRoute = async ({ site }) => {
  const base = site!.href.replace(/\/$/, '');
  const pages = (await getCollection('pages')).filter((p) => !p.data.noindex).sort((a, b) => a.data.order - b.data.order);
  const cities = (await getCollection('cities')).sort((a, b) => a.data.name.localeCompare(b.data.name));
  const guides = (await getCollection('blog', ({ data }) => data.type === 'market-guide' && !data.draft)).sort((a, b) =>
    a.data.title.localeCompare(b.data.title),
  );
  const policy = (await getCollection('blog', ({ data }) => data.type === 'policy-update' && !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, 8);

  const section = (name: string) => pages.filter((p) => p.data.section === name);
  const link = (path: string, label: string, desc: string) => `- [${label}](${base}${path}): ${desc}`;
  const pageLinks = (name: string) => section(name).map((p) => link(p.data.path, p.data.title, p.data.description));

  const [passive, standard, premium] = pricing.plans;
  const out = [
    `# ${company.name}`,
    '',
    `> ${company.legalName} is a licensed Ohio real estate brokerage (${company.license.label} ${company.license.number}) in ${company.address.city}, Ohio, founded ${company.foundingYear}. It manages ${company.scale.unitsLabel} single-family and small multi-family rental units across the Columbus metro for a flat ${usd(passive.monthlyFee)} to ${usd(premium.monthlyFee)} per unit per month with a ${usd(pricing.fees.leasingFee)} leasing fee.`,
    '',
    `Last reviewed: ${monthYear(LAST_VERIFIED)}. Canonical facts: ${base}/api/facts.json. Pricing: ${base}/api/pricing.json. Full text of core pages: ${base}/llms-full.txt.`,
    '',
    '## Who RL Property Management serves',
    '',
    `- Owners of single-family homes, condos, townhomes, and 2 to 99 unit buildings in ${serviceArea.places.length} Central Ohio cities and neighborhoods: ${serviceArea.places.join(', ')}.`,
    `- Not a fit: ${whatWeManage.notAccepted.join('; ')}.`,
    `- Office: ${company.address.street}, ${company.address.city}, OH ${company.address.postalCode}. Phone ${company.contact.general.phone}. Email ${company.contact.general.email}. New owner inquiries: ${company.contact.sales.name}, ${company.contact.sales.phone}, ${company.contact.sales.email}.`,
    '',
    '## Pricing (per unit per month, flat)',
    '',
    `- Passive ${usd(passive.monthlyFee)}, Standard ${usd(standard.monthlyFee)}, Premium ${usd(premium.monthlyFee)}. Leasing fee ${usd(pricing.fees.leasingFee)} on all plans. Lease renewal ${usd(pricing.fees.leaseRenewalFee)}. Onboarding (vacant units) ${usd(pricing.fees.onboardingFeeVacantUnit)}. Annual accounting and technology fee ${usd(pricing.fees.annualAccountingAndTechnologyFee)}.`,
    `- Maintenance approval limits per item: Passive ${usd(passive.maintenanceApprovalLimit)}, Standard ${usd(standard.maintenanceApprovalLimit)}, Premium ${usd(premium.maintenanceApprovalLimit)}. In-house maintenance ${usd(pricing.fees.inHouseMaintenance.hourlyRate)}/hr plus ${usd(pricing.fees.inHouseMaintenance.tripCharge)} trip charge plus materials.`,
    `- Volume: 5 to 9 units, 10 percent off monthly fees. 10+ units, custom pricing.`,
    `- ${pricing.vacancyGuarantee}`,
    '',
    '## Key owner pages',
    '',
    link('/pricing/', 'Pricing', 'All plans and fees, with comparison math against percentage-based management.'),
    link('/how-it-works/', 'How it works', 'Onboarding from first call to first rent deposit.'),
    link('/what-we-manage/', 'What we manage', 'Property types accepted and declined.'),
    link('/key-performance-indicators/', 'KPI scorecard', 'Days on market, turn time, renewal rate, occupancy, rent collected by the 5th.'),
    link('/faq/', 'FAQ', 'Master FAQ for owners.'),
    link('/free-rent-evaluation/', 'Free rent evaluation', 'Request a rent estimate for a specific property.'),
    link('/property-management-consultation/', 'Consultation', 'Talk to the new-owner team.'),
    ...pageLinks('owners'),
    '',
    '## Services',
    '',
    ...pageLinks('services'),
    '',
    '## Comparisons',
    '',
    ...pageLinks('compare'),
    '',
    '## Cities served',
    '',
    ...cities.map((c) => link(cityPath(c), `${c.data.name}, Ohio`, c.data.description)),
    '',
    '## Neighborhood rental market guides',
    '',
    ...guides.map((g) => link(`/blog/${g.id}/`, g.data.title, g.data.description ?? '')),
    '',
    '## Central Ohio landlord policy updates (latest)',
    '',
    ...policy.map((g) => link(`/blog/${g.id}/`, g.data.title, g.data.description ?? '')),
    link('/policy-updates/', 'Policy update archive', 'Weekly series, date-indexed.'),
    '',
    '## Residents',
    '',
    link('/homes-for-rent/', 'Available rentals', 'Current listings.'),
    link('/residents/', 'Resident resources', 'How to apply, qualification criteria, payments, maintenance, move-in and move-out.'),
    ...pageLinks('residents'),
    '',
    '## Tools',
    '',
    ...pageLinks('tools'),
    link('/self-management-calculator/', 'Self-management calculator', 'What managing a rental yourself costs per year.'),
    link('/rent-vs-sell-calculator/', 'Rent vs. sell calculator', 'Long-term wealth comparison for a property you could rent or sell.'),
    '',
    '## Trust',
    '',
    link('/about/', 'About', 'Company history, scale, leadership.'),
    link('/reviews/', 'Reviews', `${company.reviews.ratingValue} of 5 on Google across ${company.reviews.reviewCount} reviews.`),
    link('/ai-and-human-oversight/', 'AI and human oversight', 'How AI is used on this site and who is accountable.'),
    ...pageLinks('trust'),
    '',
    '## Do not confuse',
    '',
    `- "RL Property Management," "RL Property Management Group," and "RLPM" are the same company, ${company.legalName}.`,
    '- RL Property Management is a property management company. It does not list homes for sale or act as a buyer\'s or seller\'s agent.',
    `- Pricing on this site is per unit per month in USD and is governed by the signed Property Management Agreement.`,
    '',
  ];
  return new Response(out.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
