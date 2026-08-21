import type { APIRoute } from 'astro';
import { aiCrawlers } from '../data/crawlers';
import { LAST_VERIFIED } from '../data/facts';

export const GET: APIRoute = ({ site }) => {
  const base = site!.href.replace(/\/$/, '');
  const lines = [
    `# robots.txt for rlpmg.com (RL Property Management). Reviewed ${LAST_VERIFIED}.`,
    '#',
    '# Policy: this site is written to be read, quoted, and cited by AI assistants and search engines.',
    '# Each AI crawler below is allowed by name so that an operator who checks for an explicit rule finds one.',
    '# Nothing is blocked except the internal dashboard.',
    '',
    ...aiCrawlers.flatMap((c) => [`# ${c.operator} (${c.purpose})`, `User-agent: ${c.token}`, 'Allow: /', '']),
    'User-agent: *',
    'Allow: /',
    'Disallow: /internal/',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
    '# Machine-readable summaries',
    `# ${base}/llms.txt`,
    `# ${base}/llms-full.txt`,
    `# ${base}/api/facts.json`,
    `# ${base}/api/pricing.json`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
