import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { company } from '../data/facts';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, 50);
  return rss({
    title: `${company.name} blog`,
    description: 'Owner education, Central Ohio landlord policy updates, and Columbus neighborhood rental market guides from RL Property Management.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.pubDate,
      description: p.data.description,
      link: `/blog/${p.id}/`,
      categories: p.data.categories,
      author: p.data.author,
    })),
    customData: '<language>en-us</language>',
  });
}
