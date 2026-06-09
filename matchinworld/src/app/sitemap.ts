import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://matchinworld.com'
  const langs = ['ar', 'en']

  const staticPages = ['', '/specialists', '/auth/login', '/auth/signup']

  const urls: MetadataRoute.Sitemap = []

  for (const lang of langs) {
    for (const page of staticPages) {
      urls.push({
        url: `${baseUrl}/${lang}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }
  }

  return urls
}