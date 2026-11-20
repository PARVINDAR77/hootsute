import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
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
        ],
        disallow: ['/dashboard', '/settings', '/content', '/calendar', '/bulk-publish', '/analytics', '/inbox', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
