import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Shared frontmatter every page-like entry carries for the extraction contract (BRIEF.md section 4). */
const aeoPage = {
  title: z.string().max(120),
  /** <title> tag, 60 chars max. Falls back to title. */
  seoTitle: z.string().max(60).optional(),
  description: z.string().min(120).max(160),
  /** The 40 to 70 word direct answer rendered under the H1. */
  directAnswer: z.string().min(150).max(520),
  keyFacts: z.array(z.string()).min(3).max(6),
  faq: z
    .array(z.object({ q: z.string(), a: z.string().max(400) }))
    .min(3)
    .max(8)
    .optional(),
  related: z.array(z.object({ href: z.string(), label: z.string() })).optional(),
  lastVerified: z.coerce.date(),
  reviewedBy: z.string().default('Peter Lohmann, Principal Broker and CEO'),
  noindex: z.boolean().default(false),
};

/** Migrated and new blog posts. Path: src/content/blog/<slug>.md  ->  /blog/<slug>/ */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seoTitle: z.string().optional(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Peter Lohmann'),
      categories: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      primaryCategory: z.string().optional(),
      /** Drives the curated index pages and feeds without moving URLs. */
      type: z.enum(['article', 'market-guide', 'policy-update', 'podcast']).default('article'),
      /** For market guides: the city slug this guide belongs to (links from the city page). */
      city: z.string().optional(),
      heroImage: z.string().optional(),
      heroAlt: z.string().optional(),
      wpId: z.number().optional(),
      draft: z.boolean().default(false),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    }),
});

/** One per city. Path: src/content/cities/<slug>.md -> /property-management-<slug>-ohio/ (or custom path). */
const cities = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cities' }),
  schema: z.object({
    ...aeoPage,
    name: z.string(),
    /** Override the URL path when it must match an existing slug (e.g. /property-management-canal-winchester/). */
    path: z.string().optional(),
    county: z.string(),
    kind: z.enum(['city', 'village', 'neighborhood', 'township']).default('city'),
    /** "within Columbus" for neighborhoods like Clintonville; distance for suburbs. */
    relationToColumbus: z.string(),
    distanceMilesFromDowntown: z.number().optional(),
    schoolDistricts: z.array(z.string()),
    neighborhoods: z.array(z.string()).default([]),
    zipCodes: z.array(z.string()).default([]),
    /** Every number here must carry a source and an asOf date. No source, no number. */
    rentContext: z
      .array(z.object({ label: z.string(), value: z.string(), source: z.string(), asOf: z.string() }))
      .default([]),
    sourceOfIncomeProtection: z.object({ applies: z.boolean(), note: z.string().optional() }),
    localRegulation: z.array(z.string()).default([]),
    marketGuideSlug: z.string().optional(),
    geo: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

/** Static AEO pages authored as Markdown (services, compare, residents, tools prose, trust). */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    ...aeoPage,
    /** URL path including leading and trailing slash, e.g. /services/tenant-screening/ */
    path: z.string().regex(/^\/([a-z0-9-]+\/)*$/),
    section: z.enum(['owners', 'services', 'compare', 'residents', 'tools', 'trust', 'company', 'legal']),
    schemaType: z.enum(['WebPage', 'Service', 'HowTo', 'AboutPage', 'ContactPage', 'CollectionPage']).default('WebPage'),
    /** For Service pages: the Offer price in USD/month if applicable. */
    offer: z.object({ price: z.number(), unit: z.string() }).optional(),
    howToSteps: z.array(z.object({ name: z.string(), text: z.string() })).optional(),
    order: z.number().default(100),
  }),
});

/** Master FAQ entries, grouped by topic. Rendered on /faq/ and reusable on other pages by id. */
const faqs = defineCollection({
  loader: file('./src/content/faq.json'),
  schema: z.object({
    id: z.string(),
    topic: z.string(),
    question: z.string(),
    answer: z.string().max(1200),
    pages: z.array(z.string()).default([]),
  }),
});

const team = defineCollection({
  loader: file('./src/content/team.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    leadership: z.boolean().default(false),
    licenseNumber: z.string().optional(),
    linkedin: z.string().url().optional(),
    order: z.number().default(100),
  }),
});

export const collections = { blog, cities, pages, faqs, team };
