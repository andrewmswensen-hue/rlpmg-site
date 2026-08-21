import type { CollectionEntry } from 'astro:content';
import { slugify } from './format';

/** City page URL. Existing slugs are preserved via frontmatter `path`; new cities follow the established pattern. */
export function cityPath(c: CollectionEntry<'cities'>): string {
  return c.data.path ?? `/property-management-${slugify(c.data.name)}-ohio/`;
}

export function blogPath(id: string): string {
  return `/blog/${id}/`;
}
