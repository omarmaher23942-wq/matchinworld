'use client'

import { use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  IconBrain, IconTarget, IconBarbell, IconSalad,
  IconStethoscope, IconYoga, IconTrendingUp, IconSparkles,
  IconSearch, IconRobot, IconCalendar,
  IconArrowRight, IconArrowLeft,
  IconStar, IconShieldCheck, IconUsers, IconClock,
} from '@tabler/icons-react'
import { translations, type Locale } from '@/i18n/translations'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export default function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const t = translations[safeLang]
  const isAr = safeLang === 'ar'
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const categories = [
    { icon: IconBrain,       ar: 'الصحة النفسية',   en: 'Mental Health',   color: 'bg-violet-50 text-violet-600 border-violet-100' },
    { icon: IconTarget,      ar: 'الكوتشينج',        en: 'Life Coaching',   color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { icon: IconBarbell,     ar: 'اللياقة البدنية',  en: 'Fitness',         color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { icon: IconSalad,       ar: 'التغذية',          en: 'Nutrition',       color: 'bg-green-50 text-green-600 border-green-100' },
    { icon: IconStethoscope, ar: 'استشارات طبية',   en: 'Medical',         color: 'bg-red-50 text-red-600 border-red-100' },
    { icon: IconYoga,        ar: 'العلاج الطبيعي',  en: 'Physiotherapy',   color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { icon: IconTrendingUp,  ar: 'التنمية الشخصية', en: 'Personal Dev',    color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    { icon: IconSparkles,    ar: 'وأكثر...',         en: 'And more...',     color: 'bg-pink-50 text-pink-600 border-pink-100' },
  ]

  const steps = [
    { icon: IconSearch,   step: '01', ar: 'صف احتياجك',     en: 'Describe Your Need', descAr: 'اكتب ما تحتاجه والـ AI يفهمك تماماً',      descEn: 'Tell us what you need, AI understands you' },
    { icon: IconRobot,    step: '02', ar: 'الـ AI يرشح لك', en: 'AI Matches You',      descAr: 'نظام ذكي يختار أفضل المتخصصين لحالتك',     descEn: 'Smart system picks the best specialists for you' },
    { icon: IconCalendar, step: '03', ar: 'احجز جلستك',     en: 'Book Your Session',  descAr: 'اختار الوقت المناسب وادفع بأمان تام',       descEn: 'Pick a time and pay securely' },
  ]

  const stats = [
    { icon: IconUsers,       value: '500+', ar: 'متخصص موثّق',   en: 'Verified Specialists' },
    { icon: IconStar,        value: '4.9',  ar: 'متوسط التقييم', en: 'Average Rating' },
    { icon: IconShieldCheck, value: '100%', ar: 'جلسات آمنة',    en: 'Secure Sessions' },
    { icon: IconClock,       value: '24/7', ar: 'دعم مستمر',     en: 'Always Available' },
  ]

  return (
    <main className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-blue-600 tracking-tight">MatchInWorld</span>
          <div className="flex items-center gap-2">
            <Link href={`/${safeLang}/specialists`} className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all">
              {t.nav.specialists}
            </Link>
            <Link href={`/${safeLang}/auth/login`} className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all">
              {t.nav.login}
            </Link>
            <Link href={`/${safeLang}/auth/signup`} className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition-all shadow-sm shadow-blue-200">
              {t.nav.signup}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <motion.div className="max-w-4xl mx-auto text-center relative z-10" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <IconRobot size={16} />
              {isAr ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI Matching'}
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            {isAr
              ? (<>ابحث عن <span className="text-blue-600">متخصصك</span> المناسب</>)
              : (<>Find Your <span className="text-blue-600">Perfect</span> Specialist</>)
            }
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href={`/${safeLang}/auth/signup`} className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5">
              {t.hero.cta}
              <Arrow size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={`/${safeLang}/specialists`} className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:-translate-y-0.5">
              {isAr ? 'تصفح المتخصصين' : 'Browse Specialists'}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <motion.div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {stats.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <s.icon size={20} />
              </div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{isAr ? s.ar : s.en}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-gray-900 mb-3">
              {isAr ? 'التخصصات المتاحة' : 'Available Specializations'}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500">
              {isAr ? 'اختر التخصص الذي تحتاجه' : 'Choose the specialization you need'}
            </motion.p>
          </motion.div>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {categories.map((cat, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.03, y: -4 }} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${cat.color}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm">
                  <cat.icon size={24} />
                </div>
                <span className="text-sm font-semibold text-center">{isAr ? cat.ar : cat.en}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-gray-900 mb-3">
              {isAr ? 'كيف تشتغل المنصة؟' : 'How It Works'}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500">
              {isAr ? 'ثلاث خطوات بسيطة للوصول لمتخصصك' : 'Three simple steps to find your specialist'}
            </motion.p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {steps.map((item, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }} className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all">
                <div className="text-xs font-black text-blue-300 mb-4 tracking-widest">{item.step}</div>
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
                  <item.icon size={26} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{isAr ? item.ar : item.en}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 bg-white border border-gray-100 rounded-full items-center justify-center shadow-sm">
                    <Arrow size={14} className="text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-12 text-center relative overflow-hidden" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-700 rounded-full blur-3xl opacity-40" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-4">
              {isAr ? 'جاهز تبدأ رحلتك؟' : 'Ready to Get Started?'}
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              {isAr ? 'انضم لآلاف المستخدمين الذين وجدوا متخصصهم المناسب' : 'Join thousands who found their perfect specialist'}
            </p>
            <Link href={`/${safeLang}/auth/signup`} className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl">
              {t.hero.cta}
              <Arrow size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span className="font-bold text-gray-900">MatchInWorld</span>
          <span>© 2025 {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</span>
        </div>
      </footer>

    </main>
  )
}