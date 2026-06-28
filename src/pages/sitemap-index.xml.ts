import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import createSlug from '../lib/createSlug';

const staticRoutes = ['', 'services/', 'projects/', 'blog/', 'cv/'];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (value?: Date) => value?.toISOString().slice(0, 10);

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('http://localhost:4321');
  const blogEntries = await getCollection('blog');

  const tagRoutes = Array.from(
    new Set(blogEntries.flatMap((entry) => entry.data.tags ?? []))
  ).map((tag) => `blog/tag/${encodeURIComponent(tag)}/`);

  const urls = [
    ...staticRoutes.map((path) => ({ path })),
    ...blogEntries.map((entry) => ({
      path: `blog/${createSlug(entry.data.title, entry.slug)}/`,
      lastmod: formatDate(entry.data.pubDate),
    })),
    ...tagRoutes.map((path) => ({ path })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(({ path, lastmod }) => {
      const loc = escapeXml(new URL(path, base).href);
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
