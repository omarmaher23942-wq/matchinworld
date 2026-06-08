import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { type Locale } from '@/i18n/translations'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MatchInWorld',
  description: 'Find your perfect specialist',
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const isArabic = lang === 'ar'

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={lang}
      className={`${inter.className} min-h-screen`}
    >
      {children}
    </div>
  )
}