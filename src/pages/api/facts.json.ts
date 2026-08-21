import type { APIRoute } from 'astro';
import {
  company,
  pricing,
  whatWeManage,
  leasing,
  evictions,
  maintenance,
  serviceArea,
  kpis,
  LAST_VERIFIED,
} from '../../data/facts';

/** Machine-readable fact set. Same source as every page. */
export const GET: APIRoute = () => {
  const body = {
    version: 1,
    lastVerified: LAST_VERIFIED,
    source: `${company.url}/api/facts.json`,
    humanReadable: `${company.url}/llms.txt`,
    company,
    pricing,
    whatWeManage,
    leasing,
    evictions,
    maintenance,
    serviceArea,
    kpis,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
