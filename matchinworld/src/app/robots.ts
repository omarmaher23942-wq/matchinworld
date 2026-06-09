import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/ar/', '/en/'],
      disallow: ['/ar/dashboard', '/ar/admin', '/en/dashboard', '/en/admin'],
    },
    sitemap: 'https://matchinworld.com/sitemap.xml',
  }
}