/**
 * THE single source of truth for every company fact on rlpmg.com.
 *
 * Every page, every JSON-LD block, llms.txt, llms-full.txt, and /api/facts.json read from this file.
 * To change a price, a phone number, or a KPI: edit it here, rebuild, done.
 *
 * Rules:
 *  - Only verified facts. Anything not confirmed by RLPM does not go in this file.
 *  - Each numeric or legal fact that can go stale carries an "asOf" date next to it.
 *  - Keep values as numbers where they are numbers. Formatting happens in src/lib/format.ts.
 *
 * Last full review: 2026-08-21 (Andrew Swensen).
 */

export const LAST_VERIFIED = '2026-08-21'; // ISO date. Rendered as "August 2026" sitewide.

export const company = {
  name: 'RL Property Management',
  legalName: 'RL Property Management Group, Inc.',
  alternateNames: ['RLPM', 'RL Property Management Group', 'RLPMG'],
  shortName: 'RLPM',
  domain: 'rlpmg.com',
  url: 'https://rlpmg.com',
  foundingYear: 2013,
  description:
    'RL Property Management is a residential property management company in Gahanna, Ohio, managing approximately 750 single-family and small multi-family rental units across the Columbus metro for a flat monthly fee with no leasing fee.',
  license: {
    type: 'Ohio Real Estate Brokerage',
    label: 'Ohio Brokerage File No.',
    number: 'REC.2015003677',
    issuer: 'Ohio Division of Real Estate and Professional Licensing',
  },
  brokerOfRecord: {
    name: 'Peter Lohmann',
    title: 'Principal Broker and CEO',
  },
  address: {
    street: '750 Cross Pointe Rd, STE B',
    streetLine1: '750 Cross Pointe Rd',
    streetLine2: 'STE B',
    city: 'Gahanna',
    region: 'OH',
    regionName: 'Ohio',
    postalCode: '43230',
    country: 'US',
    county: 'Franklin County',
    // Geo for 750 Cross Pointe Rd, Gahanna, OH 43230. Verify against Google Business Profile before cutover.
    geo: { latitude: 40.0169, longitude: -82.8675 },
  },
  contact: {
    general: { phone: '614.725.3059', phoneE164: '+16147253059', email: 'info@rlpmg.com' },
    sales: {
      phone: '614.212.6903',
      phoneE164: '+16142126903',
      email: 'sfritz@rlpmg.com',
      name: 'Scott Fritz',
      title: 'Business Development Manager',
    },
  },
  hours: {
    summary: 'Office visits by appointment only.',
    emergencyMaintenance: '24/7 emergency maintenance line, including weekends and holidays.',
  },
  scale: {
    unitsUnderManagement: 750, // Published figure. Internal count ~725 as of Aug 2026.
    unitsLabel: 'approximately 750',
    employees: 33,
    maintenanceTechnicians: 8,
    executiveOwnedUnits: 12,
    asOf: '2026-08',
  },
  reviews: {
    platform: 'Google',
    ratingValue: 4.3,
    reviewCount: 544, // Verify on publish day against the live Google Business Profile.
    bestRating: 5,
    url: 'https://share.google/mvPPjhKCCucteVYHn',
    asOf: '2026-08-21',
  },
  mission:
    'Grow to approximately 2,500 units and be the premier property management company for class A and class B rental properties in the Columbus, Ohio metro.',
  affiliations: ['NARPM (National Association of Residential Property Managers)', 'Equal Housing Opportunity'],
  social: {
    youtube: 'https://www.youtube.com/channel/UCLzWGP73xNc-1Wj55M2bUfw',
    instagram: 'https://www.instagram.com/rlpropertymanagement',
    linkedin: 'https://www.linkedin.com/company/rl-property-management',
    facebook: 'https://www.facebook.com/rentrl',
    google: 'https://share.google/mvPPjhKCCucteVYHn',
  },
  portals: {
    owner: 'https://rlp.managebuilding.com/Manager',
    resident: 'https://rlp.managebuilding.com/Resident/apps/portal/login?returnUrl=%2Fhome',
    maintenanceRequest: 'https://app.propertymeld.com/',
    listings: 'https://rentengine.io/c/rlpmg',
    apply: 'https://app.rentengine.io/apply?accounts=685fca39-a52a-42b2-b29e-0a62dfe86dac',
    scheduleCall: 'https://calendly.com/newowners-rlpmg/30min',
  },
} as const;

/** Pricing. Per unit, per month, USD. As of 2026. */
export const pricing = {
  asOf: '2026-01-01',
  effectiveLabel: '2026',
  currency: 'USD',
  plans: [
    {
      id: 'passive',
      name: 'Passive',
      monthlyFee: 117,
      maintenanceApprovalLimit: 1500,
      maintenanceReserve: 1500,
      summary: 'Lowest monthly fee. RLPM approves repairs up to $1,500 per item without contacting the owner.',
      includes: [] as readonly string[],
      excludes: ['Pre-listing support', "Owner's preferred vendors", 'HOA/COA support'],
    },
    {
      id: 'standard',
      name: 'Standard',
      monthlyFee: 137,
      maintenanceApprovalLimit: 750,
      maintenanceReserve: 750,
      summary: 'Middle tier. Adds HOA/COA support and owner-handled repairs on vacant units.',
      includes: ['HOA/COA support', 'Owner-handled repairs on vacant units'],
      excludes: ['Pre-listing support', "Owner's preferred vendors"],
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyFee: 184,
      maintenanceApprovalLimit: 350,
      maintenanceReserve: 350,
      summary: 'Most owner involvement. Adds pre-listing support and use of the owner\'s preferred vendors.',
      includes: [
        'HOA/COA support',
        'Owner-handled repairs on vacant units',
        'Pre-listing support',
        "Owner's preferred vendors",
      ],
      excludes: [],
    },
  ],
  includedInEveryPlan: [
    'Tenant screening (credit and criminal)',
    'Rent collection',
    'Emergency and non-emergency maintenance management',
    'Advertising and marketing on 45+ rental platforms',
    'Online owner portal',
    'Financial recordkeeping',
    'Monthly statements by email',
    'Direct deposit of net income',
    'In-house maintenance service',
    'Move-in ready inspection',
    'Move-out inspection with turn scope preparation',
  ],
  fees: {
    leasingFee: 0,
    leaseRenewalFee: 250,
    onboardingFeeVacantUnit: 300,
    annualAccountingAndTechnologyFee: 125,
    preInspection: {
      amount: 300,
      note: 'Credited against the onboarding fee when a Property Management Agreement is signed.',
    },
    inHouseMaintenance: { hourlyRate: 84, tripCharge: 15, note: 'Plus materials.' },
    vendorProjectManagement: {
      percent: 15,
      appliesToVendorCostUpTo: 3000,
      maxPerProject: 450,
      note: 'Applies to third-party vendor work. Does not apply to turns.',
    },
    turnProjectManagement: [
      { upTo: 15000, percent: 15 },
      { from: 15001, upTo: 25000, percent: 10 },
      { from: 25001, percent: 7.5 },
    ],
    photography: {
      policy:
        'Professional listing photography is billed to the owner at vendor cost plus the standard project management markup, typically $250 to $450.',
      typicalMin: 250,
      typicalMax: 450,
      effectiveDate: '2026-10-01',
      grandfather: 'Existing professional photos on file are used at no charge.',
    },
  },
  volumeDiscount: {
    tiers: [
      { minUnits: 5, maxUnits: 9, percentOff: 10, note: '10 percent off monthly management fees per unit.' },
      { minUnits: 10, note: 'Custom pricing.' },
    ],
  },
  reserves: {
    requiredMaintenanceReservePerUnit: 'Equal to the plan\'s maintenance approval limit: $350, $750, or $1,500.',
    recommendedOwnerReserve: "6 months' rent",
  },
  vacancyGuarantee:
    'The monthly management fee on a vacant unit is reimbursed if the property stays vacant longer than 60 days.',
  /** The market-standard model used for comparison copy. Generic by design; no competitor is named. */
  marketStandard: {
    percentOfRentLow: 8,
    percentOfRentHigh: 10,
    leasingFee: 'one month\'s rent',
    description:
      'A typical Columbus property manager charges 8 to 10 percent of monthly rent plus a leasing fee equal to one month\'s rent each time a unit is leased.',
  },
} as const;

export const whatWeManage = {
  accepted: [
    'Single-family homes',
    'Condos and townhomes (where the association permits rentals)',
    'Duplexes, triplexes, and fourplexes',
    'Small and mid-size multi-family buildings that do not require on-site staff, typically under 100 units',
  ],
  notAccepted: [
    'OSU-area campus rentals',
    'Renting by the bedroom',
    'Student housing with shared spaces or individually leased rooms',
    'Owner-handled repairs on occupied units',
    'Home warranties',
    'HOA/COA management (RLPM does manage rentals located inside an HOA where rentals are permitted)',
    'Renovation projects on properties that are not yet rent-ready',
  ],
  propertyClasses: 'Class A and class B properties are the focus; class C is considered case by case.',
} as const;

export const leasing = {
  platforms: {
    count: 45,
    label: '45+ rental platforms',
    examples: ['Zillow', 'Trulia', 'Apartments.com', 'rlpmg.com'],
    excluded: ['Craigslist'],
  },
  averageLeaseUpWeeks: { min: 3, max: 4, note: 'Once the unit is rent-ready. No lease timeline is promised.' },
  placementPhilosophy: 'Quality of placement is prioritized over speed of placement.',
  qualification: {
    incomeMultiple: 3,
    noViolentCriminalConvictions: true,
    noEvictionsWithinYears: 5,
    credit: 'No serious or recurring credit issues',
  },
  screeningCovers: [
    'Credit history',
    'Criminal history',
    'Rental history, including landlord references',
    'Income verification by pay stub or bank statement',
  ],
  securityDeposit: "1 to 2 months' rent depending on credit",
  petDamageCoverage: {
    amount: 4000,
    since: 2026,
    fundedBy: 'A monthly pet administration fee paid by the resident',
  },
  escalationRate: { percent: 3.5, note: 'Share of rentals that escalate to eviction, litigation, or significant dispute.' },
  /** Resident-facing figures published on the current rlpmg.com resident FAQ. Confirm before reuse. */
  residentFees: {
    applicationFeePerPerson: 100,
    applicationFeeRefundIfApproved: 50,
    petRentPerPetMonthly: 50,
    petAcceptanceFee: 300,
    leaseSigningAdminFeePercentOfRent: 10,
    asOf: '2026-08-21',
  },
} as const;

export const evictions = {
  county: 'Franklin County',
  court: 'Franklin County Municipal Court',
  handledBy: 'Local eviction attorneys',
  steps: 3,
  typicalDurationWeeks: 6,
  costs: {
    asOf: '2026-08-01',
    source: 'Franklin County Municipal Court Clerk civil cost schedule effective 8/1/2026',
    filingFeePossessionOnly: 149,
    filingFeePossessionAndDamages: 186,
    attorneyApprox: 100,
    rlpmProcessFee: 199,
    totalPossessionOnlyApprox: { min: 448, max: 450 },
  },
  alternatives: 'Pay-and-stay arrangements and other alternatives are pursued where possible.',
} as const;

export const maintenance = {
  emergencyLine: '24/7 emergency call center, including weekends and holidays',
  routineCompletionWeeks: { min: 1, max: 3 },
  inspections: {
    frequency: 'Quarterly',
    covers: ['Smoke detectors', 'Appliances', 'Resident responsibilities', 'Liabilities', 'Overall condition'],
  },
  detectors: 'Smoke and CO detectors are checked quarterly and replaced at 10 years or older.',
  vacancyUtilities: 'Utilities stay active during vacancy for turnover work, repairs, and winter protection.',
} as const;

/** The 25 cities and neighborhoods RLPM serves. Slug drives /property-management-<slug>-ohio/ (see cities collection). */
export const serviceArea = {
  region: 'Columbus, Ohio metro',
  counties: ['Franklin County', 'Delaware County', 'Licking County', 'Fairfield County', 'Union County', 'Madison County', 'Pickaway County'],
  places: [
    'Ashville',
    'Bexley',
    'Blacklick',
    'Canal Winchester',
    'Clintonville',
    'Columbus',
    'Delaware',
    'Dublin',
    'Gahanna',
    'German Village',
    'Grandview Heights',
    'Grove City',
    'Hilliard',
    'Lancaster',
    'London',
    'Marysville',
    'New Albany',
    'Newark',
    'Pickerington',
    'Powell',
    'Reynoldsburg',
    'Short North',
    'Upper Arlington',
    'Westerville',
    'Worthington',
  ],
  propertyLimit: 'Properties that do not require on-site staff, typically under 100 units.',
} as const;

/** Hand-updated KPI scorecard. Update the numbers and asOf together. */
export const kpis = {
  asOf: '2026-07',
  asOfLabel: 'July 2026',
  sourceUrl: 'https://rlpmg.com/key-performance-indicators/',
  metrics: [
    { id: 'days-on-market', label: 'Median days on market', value: 11, unit: 'days' },
    { id: 'time-to-turn', label: 'Median time to turn', value: 12, unit: 'days' },
    { id: 'renewal-rate', label: 'Lease renewal rate', value: 72, unit: '%' },
    { id: 'occupancy', label: 'Occupancy rate', value: 91, unit: '%' },
    { id: 'average-rent', label: 'Average rent', value: 1653, unit: 'USD/month' },
    { id: 'repair-days', label: 'Median repair days', value: 6, unit: 'days' },
    { id: 'collected-by-5th', label: 'Rent collected by the 5th', value: 96, unit: '%' },
    { id: 'resident-satisfaction', label: 'Resident satisfaction', value: 4.3, unit: 'out of 5' },
  ],
} as const;

export const agentReferrals = {
  payoutPerClosedClient: 1000,
  annualBudget2026: 50000,
  legalBasis: 'Paid broker-to-broker under Ohio Revised Code 4735.18(A)(11).',
  asOf: '2026-08-21',
} as const;

export type Plan = (typeof pricing.plans)[number];
