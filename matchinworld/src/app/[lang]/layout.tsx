import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const isAr = lang === 'ar'

  return {
    title: isAr ? 'MatchInWorld — احجز جلستك مع متخصصك' : 'MatchInWorld — Book Your Expert Session',
    description: isAr
      ? 'منصة احترافية تربطك بأفضل المتخصصين في الصحة النفسية، الكوتشينج، اللياقة، والطب. احجز جلستك الآن.'
      : 'Professional platform connecting you with top specialists in mental health, coaching, fitness, and medical fields.',
    keywords: isAr
      ? 'استشارات أونلاين، متخصصين، صحة نفسية، كوتشينج، لياقة، طب'
      : 'online consultation, specialists, mental health, coaching, fitness, medical',
    openGraph: {
      title: isAr ? 'MatchInWorld — احجز جلستك' : 'MatchInWorld — Book Your Session',
      description: isAr
        ? 'تواصل مع أفضل المتخصصين وابدأ رحلتك'
        : 'Connect with top specialists and start your journey',
      url: 'https://matchinworld.com',
      siteName: 'MatchInWorld',
      locale: isAr ? 'ar_EG' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: isAr ? 'MatchInWorld — احجز جلستك' : 'MatchInWorld — Book Your Session',
      description: isAr
        ? 'تواصل مع أفضل المتخصصين وابدأ رحلتك'
        : 'Connect with top specialists and start your journey',
    },
    alternates: {
      canonical: `https://matchinworld.com/${lang}`,
      languages: {
        'ar': 'https://matchinworld.com/ar',
        'en': 'https://matchinworld.com/en',
      },
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const isArabic = lang === 'ar'

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} lang={lang} className={inter.className}>
      {children}
    </div>
  )
}