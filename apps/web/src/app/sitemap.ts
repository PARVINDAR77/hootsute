import type { MetadataRoute } from 'next';
import { BLOG_ARTICLES } from '@/components/marketing/public-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const now = new Date();

  const staticRoutes = [
    '',
    '/features',
    '/platforms',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/help',
    '/privacy',
    '/terms',
    '/security',
    '/login',
    '/signup',
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  for (const post of BLOG_ARTICLES) {
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedDate),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
