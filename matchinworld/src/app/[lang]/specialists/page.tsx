'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  IconSearch, IconStar, IconClock, IconFilter,
  IconBrain, IconTarget, IconBarbell, IconSalad,
  IconStethoscope, IconYoga, IconTrendingUp, IconSparkles,
  IconArrowRight, IconArrowLeft, IconX
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const SPECIALIZATIONS = [
  { id: 'all',           icon: IconSparkles,    ar: 'الكل',             en: 'All' },
  { id: 'mental_health', icon: IconBrain,       ar: 'الصحة النفسية',   en: 'Mental Health' },
  { id: 'coaching',      icon: IconTarget,      ar: 'الكوتشينج',        en: 'Life Coaching' },
  { id: 'fitness',       icon: IconBarbell,     ar: 'اللياقة البدنية',  en: 'Fitness' },
  { id: 'nutrition',     icon: IconSalad,       ar: 'التغذية',          en: 'Nutrition' },
  { id: 'medical',       icon: IconStethoscope, ar: 'استشارات طبية',   en: 'Medical' },
  { id: 'physiotherapy', icon: IconYoga,        ar: 'العلاج الطبيعي',  en: 'Physiotherapy' },
  { id: 'personal_dev',  icon: IconTrendingUp,  ar: 'التنمية الشخصية', en: 'Personal Dev' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
}

export default function SpecialistsPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [specialists, setSpecialists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { loadSpecialists() }, [selectedSpec, minRating])

  async function loadSpecialists() {
    setLoading(true)
    let query = supabase
      .from('specialists')
      .select('*, users(name, avatar_url)')
      .eq('kyc_status', 'approved')
      .eq('is_active', true)
      .order('rating', { ascending: false })

    if (selectedSpec !== 'all') {
      query = query.contains('specializations', [selectedSpec])
    }
    if (minRating) {
      query = query.gte('rating', parseFloat(minRating))
    }

    const { data } = await query
    setSpecialists(data ?? [])
    setLoading(false)
  }

  const filtered = specialists.filter(s => {
    const name = s.users?.name?.toLowerCase() ?? ''
    const bio = s.bio?.toLowerCase() ?? ''
    const q = search.toLowerCase()
    const matchSearch = !search || name.includes(q) || bio.includes(q)
    const matchPrice = !maxPrice || s.price_per_hour <= parseInt(maxPrice)
    return matchSearch && matchPrice
  })

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${safeLang}`} className="text-lg font-black text-blue-600">MatchInWorld</Link>
          <div className="flex items-center gap-3">
            <Link href={`/${safeLang}/match`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <IconSparkles size={16} />
              {isAr ? 'ابحث بالذكاء' : 'AI Match'}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isAr ? 'تصفح المتخصصين' : 'Browse Specialists'}
          </h1>
          <p className="text-gray-500">
            {isAr ? `${filtered.length} متخصص متاح` : `${filtered.length} specialists available`}
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <IconSearch size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white text-gray-900 placeholder:text-gray-400"
              placeholder={isAr ? 'ابحث باسم المتخصص أو التخصص...' : 'Search by name or specialization...'}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600">
                <IconX size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}
          >
            <IconFilter size={18} />
            {isAr ? 'فلترة' : 'Filter'}
          </button>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 grid grid-cols-2 gap-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'أقصى سعر (ج)' : 'Max Price (EGP)'}
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-sm bg-white text-gray-900 placeholder:text-gray-400"
                placeholder={isAr ? 'مثال: 500' : 'e.g. 500'}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'أدنى تقييم' : 'Min Rating'}
              </label>
              <select
                value={minRating}
                onChange={e => setMinRating(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-sm bg-white text-gray-900"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                <option value="4.5">4.5+</option>
                <option value="4">4.0+</option>
                <option value="3.5">3.5+</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Specialization tabs */}
        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {SPECIALIZATIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSpec(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedSpec === s.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              <s.icon size={16} />
              {isAr ? s.ar : s.en}
            </button>
          ))}
        </motion.div>

        {/* Specialists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <IconSearch size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-900 mb-1">{isAr ? 'لا توجد نتائج' : 'No results found'}</p>
            <p className="text-sm text-gray-500">{isAr ? 'جرب تغيير الفلاتر أو البحث' : 'Try changing filters or search'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="show"
                whileHover={{ y: -4 }}
              >
                <Link href={`/${safeLang}/specialists/${s.id}`} className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black text-blue-600">
                      {s.users?.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{s.users?.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <IconStar size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-gray-700">{s.rating?.toFixed(1) ?? '0.0'}</span>
                        <span className="text-xs text-gray-400">({s.total_sessions ?? 0} {isAr ? 'جلسة' : 'sessions'})</span>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="text-sm font-black text-blue-600">{Math.round(s.price_per_hour * 1.15)}</div>
                      <div className="text-xs text-gray-400">{isAr ? 'ج/جلسة' : 'EGP'}</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{s.bio}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {s.specializations?.slice(0, 2).map((spec: string) => (
                        <span key={spec} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                          {isAr
                            ? SPECIALIZATIONS.find(x => x.id === spec)?.ar ?? spec
                            : SPECIALIZATIONS.find(x => x.id === spec)?.en ?? spec
                          }
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <IconClock size={12} />
                      {s.session_durations?.[0] ?? 60} {isAr ? 'د' : 'min'}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                      {isAr ? 'متاح الآن' : 'Available'}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                      {isAr ? 'احجز' : 'Book'}
                      <Arrow size={16} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}