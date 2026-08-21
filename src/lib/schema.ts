/**
 * JSON-LD graph builders. One canonical Organization node (#organization) is defined on the home page
 * and referenced by @id everywhere else, so every page links into a single connected entity graph.
 */
import { company, pricing, serviceArea, LAST_VERIFIED } from '../data/facts';

export const SITE = company.url;
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
export const BROKER_ID = `${SITE}/about/#peter-lohmann`;

const orgRef = { '@id': ORG_ID };

export function organizationNode(full = true) {
  const base = {
    '@type': ['RealEstateAgent', 'Organization'],
    '@id': ORG_ID,
    name: company.name,
    legalName: company.legalName,
    alternateName: [...company.alternateNames],
    url: SITE,
    telephone: company.contact.general.phoneE164,
    email: company.contact.general.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address.street,
      addressLocality: company.address.city,
      addressRegion: company.address.region,
      postalCode: company.address.postalCode,
      addressCountry: company.address.country,
    },
  };
  if (!full) return base;
  return {
    ...base,
    description: company.description,
    logo: { '@type': 'ImageObject', url: `${SITE}/images/rlpm-logo.png` },
    image: `${SITE}/images/og-default.png`,
    foundingDate: String(company.foundingYear),
    numberOfEmployees: { '@type': 'QuantitativeValue', value: company.scale.employees },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: company.address.geo.latitude,
      longitude: company.address.geo.longitude,
    },
    areaServed: [
      ...serviceArea.places.map((name) => ({ '@type': 'City', name: `${name}, OH` })),
      { '@type': 'AdministrativeArea', name: 'Franklin County, Ohio' },
      { '@type': 'AdministrativeArea', name: 'Columbus, Ohio metropolitan area' },
    ],
    identifier: {
      '@type': 'PropertyValue',
      name: company.license.label,
      value: company.license.number,
    },
    founder: { '@id': BROKER_ID },
    employee: { '@id': BROKER_ID },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: company.reviews.ratingValue,
      reviewCount: company.reviews.reviewCount,
      bestRating: company.reviews.bestRating,
    },
    priceRange: `$${pricing.plans[0].monthlyFee}-$${pricing.plans[2].monthlyFee} per unit per month`,
    knowsAbout: [
      'Residential property management',
      'Tenant screening and placement',
      'Rent collection',
      'Ohio landlord-tenant law',
      'Franklin County evictions',
      'Rental property maintenance',
      'Columbus, Ohio rental market',
    ],
    memberOf: { '@type': 'Organization', name: 'National Association of Residential Property Managers (NARPM)' },
    sameAs: Object.values(company.social),
  };
}

export function brokerNode() {
  return {
    '@type': 'Person',
    '@id': BROKER_ID,
    name: company.brokerOfRecord.name,
    jobTitle: company.brokerOfRecord.title,
    worksFor: orgRef,
    url: `${SITE}/about/`,
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE,
    name: company.name,
    publisher: orgRef,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/blog/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface WebPageInput {
  path: string;
  title: string;
  description: string;
  type?: string;
  dateModified?: string;
  datePublished?: string;
  reviewedBy?: boolean;
}

export function webPageNode(p: WebPageInput) {
  const url = `${SITE}${p.path}`;
  return {
    '@type': p.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: p.title,
    description: p.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: orgRef,
    publisher: orgRef,
    inLanguage: 'en-US',
    dateModified: p.dateModified ?? LAST_VERIFIED,
    ...(p.datePublished ? { datePublished: p.datePublished } : {}),
    ...(p.reviewedBy === false ? {} : { reviewedBy: { '@id': BROKER_ID } }),
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.direct-answer'] },
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.path}`,
    })),
  };
}

export function faqNode(path: string, faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE}${path}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function howToNode(path: string, name: string, steps: { name: string; text: string }[]) {
  return {
    '@type': 'HowTo',
    '@id': `${SITE}${path}#howto`,
    name,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${SITE}${path}#step-${i + 1}`,
    })),
  };
}

/** Service + OfferCatalog with one Offer per plan, each with an explicit monthly price. */
export function pricingNodes(path: string) {
  const url = `${SITE}${path}`;
  return [
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      serviceType: 'Residential property management',
      name: 'Flat-fee residential property management in Columbus, Ohio',
      provider: orgRef,
      areaServed: serviceArea.places.map((name) => ({ '@type': 'City', name: `${name}, OH` })),
      hasOfferCatalog: { '@id': `${url}#offers` },
    },
    {
      '@type': 'OfferCatalog',
      '@id': `${url}#offers`,
      name: 'RL Property Management plans',
      itemListElement: pricing.plans.map((plan) => ({
        '@type': 'Offer',
        '@id': `${url}#${plan.id}`,
        name: `${plan.name} plan`,
        description: plan.summary,
        price: plan.monthlyFee,
        priceCurrency: pricing.currency,
        availabilityStarts: pricing.asOf,
        offeredBy: orgRef,
        priceSpecification: [
          {
            '@type': 'UnitPriceSpecification',
            name: 'Monthly management fee',
            price: plan.monthlyFee,
            priceCurrency: pricing.currency,
            unitText: 'per unit per month',
          },
          {
            '@type': 'UnitPriceSpecification',
            name: 'Leasing fee',
            price: pricing.fees.leasingFee,
            priceCurrency: pricing.currency,
            unitText: 'per lease',
          },
          {
            '@type': 'UnitPriceSpecification',
            name: 'Lease renewal fee',
            price: pricing.fees.leaseRenewalFee,
            priceCurrency: pricing.currency,
            unitText: 'per renewal',
          },
        ],
      })),
    },
  ];
}

export function articleNode(p: {
  path: string;
  title: string;
  description?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
}) {
  const url = `${SITE}${p.path}`;
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: p.title,
    description: p.description,
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    datePublished: p.datePublished,
    dateModified: p.dateModified ?? p.datePublished,
    author:
      p.author === company.brokerOfRecord.name
        ? { '@id': BROKER_ID }
        : { '@type': 'Person', name: p.author, worksFor: orgRef },
    publisher: orgRef,
    ...(p.image ? { image: p.image.startsWith('http') ? p.image : `${SITE}${p.image}` } : {}),
  };
}

export function localBusinessNode(p: { path: string; name: string; geo?: { latitude: number; longitude: number } }) {
  const url = `${SITE}${p.path}`;
  return {
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    '@id': `${url}#localbusiness`,
    name: `${company.name}: ${p.name}`,
    parentOrganization: orgRef,
    url,
    telephone: company.contact.general.phoneE164,
    address: organizationNode(false).address,
    areaServed: { '@type': 'City', name: `${p.name}, OH`, ...(p.geo ? { geo: { '@type': 'GeoCoordinates', ...p.geo } } : {}) },
    identifier: { '@type': 'PropertyValue', name: company.license.label, value: company.license.number },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: company.reviews.ratingValue,
      reviewCount: company.reviews.reviewCount,
      bestRating: company.reviews.bestRating,
    },
  };
}

/** Wrap nodes into one @graph document. */
export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
