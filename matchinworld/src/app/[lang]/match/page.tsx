'use client'

import { use, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconSparkles, IconArrowLeft, IconArrowRight,
  IconStar, IconShieldCheck,
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'

const SPECIALIZATIONS: Record<string, { ar: string; en: string }> = {
  mental_health:  { ar: 'الصحة النفسية',   en: 'Mental Health' },
  coaching:       { ar: 'الكوتشينج',        en: 'Life Coaching' },
  fitness:        { ar: 'اللياقة البدنية',  en: 'Fitness' },
  nutrition:      { ar: 'التغذية',          en: 'Nutrition' },
  medical:        { ar: 'استشارات طبية',   en: 'Medical' },
  physiotherapy:  { ar: 'العلاج الطبيعي',  en: 'Physiotherapy' },
  personal_dev:   { ar: 'التنمية الشخصية', en: 'Personal Dev' },
  other:          { ar: 'أخرى',             en: 'Other' },
}

export default function MatchPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input')
  const [needs, setNeeds] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [aiReason, setAiReason] = useState('')

  async function handleMatch() {
    if (needs.trim().length < 10) return
    setStep('loading')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/match/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ needs, lang: safeLang }),
        }
      )

      const data = await response.json()
      setResults(data.matches ?? [])
      setAiReason(data.reason ?? '')
      setStep('results')
    } catch (err) {
      console.error(err)
      setStep('input')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
          >
            <Arrow size={18} className="text-gray-600" />
          </button>
          <span className="text-lg font-black text-blue-600">MatchInWorld</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <IconSparkles size={28} className="text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">
                  {isAr ? 'ابحث عن متخصصك' : 'Find Your Specialist'}
                </h1>
                <p className="text-gray-500">
                  {isAr ? 'صف احتياجك بحرية وسنجد لك الأنسب' : 'Describe your need freely and we will find the best match'}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6">
                <label className="text-sm font-semibold text-gray-700 block mb-3">
                  {isAr ? 'ما الذي تحتاجه؟' : 'What do you need?'}
                </label>
                <textarea
                  value={needs}
                  onChange={e => setNeeds(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-none leading-relaxed"
                  placeholder={isAr
                    ? 'مثال: أعاني من ضغط نفسي شديد بسبب العمل وأحتاج شخص يساعدني في إدارة مشاعري...'
                    : "Example: I've been struggling with work stress and need help managing anxiety..."
                  }
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{needs.length} {isAr ? 'حرف' : 'chars'}</span>
                  <span className="text-xs text-gray-400">{isAr ? 'الحد الأدنى 10 أحرف' : 'Min 10 chars'}</span>
                </div>
              </div>

              <button
                onClick={handleMatch}
                disabled={needs.trim().length < 10}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 text-base"
              >
                <IconSparkles size={20} />
                {isAr ? 'ابحث عن المتخصص المناسب' : 'Find My Match'}
              </button>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">
                  {isAr ? 'جاري تحليل احتياجك...' : 'Analyzing your needs...'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {isAr ? 'نبحث عن أفضل المتخصصين لك' : 'Finding the best specialists for you'}
                </p>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {isAr ? 'نتائج البحث' : 'Your Matches'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {isAr ? `وجدنا ${results.length} متخصص مناسب لك` : `Found ${results.length} specialists for you`}
                  </p>
                </div>
                <button
                  onClick={() => { setStep('input'); setResults([]) }}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  {isAr ? 'بحث جديد' : 'New Search'}
                </button>
              </div>

              {aiReason && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                  <IconSparkles size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">{aiReason}</p>
                </div>
              )}

              {results.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-500">{isAr ? 'لا توجد نتائج مطابقة حالياً' : 'No matches found currently'}</p>
                  <Link
                    href={`/${safeLang}/specialists`}
                    className="inline-flex items-center gap-2 mt-4 text-blue-600 font-semibold text-sm hover:underline"
                  >
                    {isAr ? 'تصفح كل المتخصصين' : 'Browse all specialists'}
                    <Arrow size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={`/${safeLang}/specialists/${s.id}`}
                        className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600 shrink-0">
                              {s.users?.name?.charAt(0) ?? '?'}
                            </div>
                            {i === 0 && (
                              <div className="absolute -top-2 -end-2 bg-amber-400 text-white text-xs font-black px-1.5 py-0.5 rounded-lg">
                                #1
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900">{s.users?.name}</h3>
                              {s.kyc_status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                  <IconShieldCheck size={11} />
                                  {isAr ? 'موثّق' : 'Verified'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <IconStar size={13} className="text-amber-400 fill-amber-400" />
                                <span className="text-xs font-bold text-gray-700">{s.rating?.toFixed(1) ?? '0.0'}</span>
                              </div>
                              <span className="text-xs font-bold text-blue-600">
                                {Math.round(s.price_per_hour * 1.15)} {isAr ? 'ج/جلسة' : 'EGP'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{s.bio}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {s.specializations?.slice(0, 3).map((spec: string) => (
                                <span key={spec} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                  {isAr ? SPECIALIZATIONS[spec]?.ar ?? spec : SPECIALIZATIONS[spec]?.en ?? spec}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span className="flex items-center gap-1 text-sm font-semibold text-blue-600 whitespace-nowrap">
                              {isAr ? 'احجز' : 'Book'}
                              <Arrow size={16} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}