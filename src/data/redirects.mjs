// 301 redirects from retired rlpmg.com URLs. Source of truth: ../../docs/redirect-map.csv (action = 301).
// Astro writes these as meta-refresh HTML at build; the Cloudflare Worker also serves them as true 301s
// (worker/redirects.ts reads this same list) so crawlers get a real HTTP 301.
const r = (destination) => ({ status: 301, destination });

export const redirects = {
  '/owner-faqs/': r('/faq/'),
  '/areas-served/': r('/areas-we-serve/'),
  '/max-investment/': r('/pricing/'),
  '/rent-mag/': r('/pricing/'),
  '/rental-analysis-form/': r('/free-rent-evaluation/'),
  '/we-pay-for-referrals-form/': r('/agent-referrals/'),
  '/calendly/': r('/property-management-consultation/'),
  '/local-advantage/': r('/about/'),
  '/leasing-form-page/': r('/residents/leasing-form/'),
  '/tenant-appeal-form-page/': r('/residents/application-appeal/'),
  '/we-buy-property-management-contracts-companies-form/': r('/sell-your-property-management-company/'),
};

// Wildcard and non-HTML redirects. Served by the Worker only (Astro cannot pre-render these).
export const workerOnlyRedirects = {
  '/category/[...slug]': r('/blog/category/[...slug]'),
  '/tag/[...slug]': r('/blog/'),
  '/author/[...slug]': r('/about/'),
  '/feed/': r('/rss.xml'),
  '/sitemap_index.xml': r('/sitemap-index.xml'),
  '/post-sitemap.xml': r('/sitemap-index.xml'),
  '/page-sitemap.xml': r('/sitemap-index.xml'),
};
