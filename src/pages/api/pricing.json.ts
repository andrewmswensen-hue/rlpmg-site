import type { APIRoute } from 'astro';
import { company, pricing, LAST_VERIFIED } from '../../data/facts';

/** Pricing only, flattened for assistants that want one small document. */
export const GET: APIRoute = () => {
  const body = {
    version: 1,
    company: company.name,
    lastReviewed: LAST_VERIFIED,
    effective: pricing.effectiveLabel,
    currency: pricing.currency,
    unit: 'per unit per month',
    note: 'Flat monthly fee per unit. No leasing fee on any plan. Final pricing is governed by the signed Property Management Agreement.',
    plans: pricing.plans.map((p) => ({
      id: p.id,
      name: p.name,
      monthlyFee: p.monthlyFee,
      leasingFee: pricing.fees.leasingFee,
      leaseRenewalFee: pricing.fees.leaseRenewalFee,
      maintenanceApprovalLimitPerItem: p.maintenanceApprovalLimit,
      requiredMaintenanceReserve: p.maintenanceReserve,
      includes: p.includes,
      excludes: p.excludes,
      summary: p.summary,
    })),
    includedInEveryPlan: pricing.includedInEveryPlan,
    otherFees: {
      onboardingFeeVacantUnit: pricing.fees.onboardingFeeVacantUnit,
      annualAccountingAndTechnologyFee: pricing.fees.annualAccountingAndTechnologyFee,
      preInspection: pricing.fees.preInspection,
      inHouseMaintenance: pricing.fees.inHouseMaintenance,
      vendorProjectManagement: pricing.fees.vendorProjectManagement,
      turnProjectManagement: pricing.fees.turnProjectManagement,
      photography: pricing.fees.photography,
    },
    volumeDiscount: pricing.volumeDiscount,
    reserves: pricing.reserves,
    vacancyGuarantee: pricing.vacancyGuarantee,
    marketStandardForComparison: pricing.marketStandard,
    moreDetail: `${company.url}/pricing/`,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
