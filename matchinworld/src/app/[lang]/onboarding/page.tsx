'use client'

import { use, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconUser, IconBriefcase, IconBrain, IconTarget, IconBarbell,
  IconSalad, IconStethoscope, IconYoga, IconTrendingUp, IconSparkles,
  IconClock, IconCurrencyDollar, IconFileText, IconCamera,
  IconCheck, IconChevronRight, IconChevronLeft
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.3 } },
}

const SPECIALIZATIONS = [
  { id: 'mental_health',  icon: IconBrain,       ar: 'الصحة النفسية',   en: 'Mental Health' },
  { id: 'coaching',       icon: IconTarget,      ar: 'الكوتشينج',        en: 'Life Coaching' },
  { id: 'fitness',        icon: IconBarbell,     ar: 'اللياقة البدنية',  en: 'Fitness' },
  { id: 'nutrition',      icon: IconSalad,       ar: 'التغذية',          en: 'Nutrition' },
  { id: 'medical',        icon: IconStethoscope, ar: 'استشارات طبية',   en: 'Medical' },
  { id: 'physiotherapy',  icon: IconYoga,        ar: 'العلاج الطبيعي',  en: 'Physiotherapy' },
  { id: 'personal_dev',   icon: IconTrendingUp,  ar: 'التنمية الشخصية', en: 'Personal Dev' },
  { id: 'other',          icon: IconSparkles,    ar: 'أخرى',             en: 'Other' },
]

const DURATIONS = [30, 45, 60, 90]

const CLIENT_STEPS = ['profile', 'needs']
const SPEC_STEPS   = ['bio', 'specializations', 'pricing', 'kyc']

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white"
const textareaClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white resize-none leading-relaxed"

export default function OnboardingPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Next = isAr ? IconChevronLeft : IconChevronRight
  const Prev = isAr ? IconChevronRight : IconChevronLeft

  // المرحلة الأولى: اختيار الـ role
  // المرحلة الثانية: باقي الخطوات حسب الـ role
  const [role, setRole] = useState<'client' | 'specialist' | ''>('')
  const [roleSelected, setRoleSelected] = useState(false)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [clientData, setClientData] = useState({ age: '', gender: '', needs: '' })
  const [specData, setSpecData] = useState({
    bio: '',
    price: '',
    specializations: [] as string[],
    durations: [60] as number[],
    kycFront: null as File | null,
    kycBack: null as File | null,
  })

  const steps = role === 'specialist' ? SPEC_STEPS : CLIENT_STEPS
  const totalSteps = steps.length
  const progress = ((step + 1) / totalSteps) * 100

  function toggleSpec(id: string) {
    setSpecData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(id)
        ? prev.specializations.filter(s => s !== id)
        : [...prev.specializations, id]
    }))
  }

  function toggleDuration(d: number) {
    setSpecData(prev => ({
      ...prev,
      durations: prev.durations.includes(d)
        ? prev.durations.filter(x => x !== d)
        : [...prev.durations, d]
    }))
  }

  function canNext() {
    const current = steps[step]
    if (current === 'profile')         return clientData.age !== '' && clientData.gender !== ''
    if (current === 'needs')           return clientData.needs.trim().length > 10
    if (current === 'bio')             return specData.bio.trim().length > 20
    if (current === 'specializations') return specData.specializations.length > 0
    if (current === 'pricing')         return specData.price !== '' && specData.durations.length > 0
    if (current === 'kyc')             return specData.kycFront !== null && specData.kycBack !== null
    return true
  }

  async function handleFinish() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

    try {
      if (role === 'client') {
        await supabase.from('clients').upsert({
          id: user.id,
          age: parseInt(clientData.age) || null,
          gender: clientData.gender,
          needs_description: clientData.needs,
        })
        window.location.href = `/${safeLang}/dashboard`
      } else {
        let frontUrl = ''
        let backUrl = ''
        if (specData.kycFront) frontUrl = await uploadToCloudinary(specData.kycFront, 'kyc')
        if (specData.kycBack)  backUrl  = await uploadToCloudinary(specData.kycBack,  'kyc')

        await supabase.from('specialists').upsert({
          id: user.id,
          bio: specData.bio,
          price_per_hour: parseInt(specData.price) || 0,
          specializations: specData.specializations,
          session_durations: specData.durations,
          kyc_front_url: frontUrl,
          kyc_back_url: backUrl,
          kyc_status: 'pending',
          is_active: false,
        })
        window.location.href = `/${safeLang}/waiting`
      }
    } catch {
      setError(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again')
    }
    setLoading(false)
  }

  // ── شاشة اختيار الـ role (منفصلة تماماً عن باقي الخطوات) ──
  if (!roleSelected) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-blue-600">MatchInWorld</span>
        </div>
        <motion.div
          className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isAr ? 'أنت من؟' : 'Who are you?'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {isAr ? 'اختر نوع حسابك لنخصص تجربتك' : 'Choose your account type to personalize your experience'}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                value: 'client',
                icon: IconUser,
                ar: 'أبحث عن متخصص',
                en: 'Looking for a Specialist',
                descAr: 'احجز جلسات مع أفضل المتخصصين',
                descEn: 'Book sessions with top specialists',
              },
              {
                value: 'specialist',
                icon: IconBriefcase,
                ar: 'أنا متخصص / مقدم خدمة',
                en: 'I am a Specialist',
                descAr: 'قدم خدماتك واحصل على عملاء جدد',
                descEn: 'Offer your services and get new clients',
              },
            ].map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value as 'client' | 'specialist')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-start w-full ${
                  role === r.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-200 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  role === r.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <r.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm">{isAr ? r.ar : r.en}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{isAr ? r.descAr : r.descEn}</div>
                </div>
                {role === r.value && <IconCheck size={20} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={role === ''}
            onClick={() => {
              if (role !== '') {
                setStep(0)
                setRoleSelected(true)
              }
            }}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            {isAr ? 'التالي' : 'Next'}
            <Next size={18} />
          </button>
        </motion.div>
      </div>
    </main>
  )

  // ── باقي الخطوات ──
  function renderStep() {
    const current = steps[step]

    if (current === 'profile') return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'أخبرنا عنك' : 'Tell us about yourself'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isAr ? 'سنستخدم هذه المعلومات لترشيح أفضل المتخصصين لك' : 'We use this to recommend the best specialists for you'}
        </p>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{isAr ? 'العمر' : 'Age'}</label>
          <input
            type="number"
            min={10} max={100}
            value={clientData.age}
            onChange={e => setClientData({ ...clientData, age: e.target.value })}
            className={inputClass}
            placeholder={isAr ? 'عمرك بالسنوات' : 'Your age'}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">{isAr ? 'الجنس' : 'Gender'}</label>
          <div className="flex gap-3">
            {[
              { value: 'male',   ar: 'ذكر',  en: 'Male' },
              { value: 'female', ar: 'أنثى', en: 'Female' },
              { value: 'other',  ar: 'أخرى', en: 'Other' },
            ].map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setClientData({ ...clientData, gender: g.value })}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  clientData.gender === g.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-100 text-gray-600 hover:border-blue-200'
                }`}
              >
                {isAr ? g.ar : g.en}
              </button>
            ))}
          </div>
        </div>
      </div>
    )

    if (current === 'needs') return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'ما الذي تحتاجه؟' : 'What do you need?'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isAr ? 'اكتب بحرية — سيفهم نظامنا احتياجك ويرشح لك الأنسب' : 'Write freely — our system understands you and finds the best match'}
        </p>
        <textarea
          value={clientData.needs}
          onChange={e => setClientData({ ...clientData, needs: e.target.value })}
          rows={5}
          className={textareaClass}
          placeholder={isAr
            ? 'مثال: أعاني من ضغط نفسي وقلق بسبب العمل، وأحتاج شخص يساعدني في إدارة مشاعري...'
            : "Example: I've been struggling with work stress and anxiety, I need help managing my emotions..."
          }
        />
        <div className="text-xs text-gray-400 text-end">{clientData.needs.length} {isAr ? 'حرف' : 'chars'}</div>
      </div>
    )

    if (current === 'bio') return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'عرّف بنفسك' : 'Introduce yourself'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isAr ? 'اكتب نبذة احترافية ستظهر في بروفايلك للعملاء' : 'Write a professional bio that will appear on your profile'}
        </p>
        <textarea
          value={specData.bio}
          onChange={e => setSpecData({ ...specData, bio: e.target.value })}
          rows={5}
          className={textareaClass}
          placeholder={isAr
            ? 'مثال: معالج نفسي معتمد بخبرة 8 سنوات، متخصص في علاج القلق والاكتئاب...'
            : 'Example: Certified psychotherapist with 8 years of experience, specializing in anxiety...'
          }
        />
        <div className="text-xs text-gray-400 text-end">{specData.bio.length} {isAr ? 'حرف' : 'chars'}</div>
      </div>
    )

    if (current === 'specializations') return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'ما هي تخصصاتك؟' : 'Your Specializations'}
        </h2>
        <p className="text-gray-500 text-sm">{isAr ? 'اختر كل التخصصات المناسبة لك' : 'Select all that apply'}</p>
        <div className="grid grid-cols-2 gap-3">
          {SPECIALIZATIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSpec(s.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start w-full ${
                specData.specializations.includes(s.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:border-blue-200 bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                specData.specializations.includes(s.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <s.icon size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 flex-1">{isAr ? s.ar : s.en}</span>
              {specData.specializations.includes(s.id) && <IconCheck size={16} className="text-blue-600 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    )

    if (current === 'pricing') return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'السعر ومدة الجلسة' : 'Pricing & Duration'}
        </h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            {isAr ? 'سعر الجلسة (بالجنيه المصري)' : 'Session Price (EGP)'}
          </label>
          <div className="relative">
            <IconCurrencyDollar size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="number"
              min={50}
              value={specData.price}
              onChange={e => setSpecData({ ...specData, price: e.target.value })}
              className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder={isAr ? 'مثال: 1000' : 'e.g. 1000'}
            />
          </div>
          {specData.price && !isNaN(parseInt(specData.price)) && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="text-xs text-gray-500">
                {isAr ? 'العميل سيدفع:' : 'Client pays:'}
                <span className="text-green-600 font-semibold ms-1">{Math.round(parseInt(specData.price) * 1.15)} {isAr ? 'ج' : 'EGP'}</span>
              </div>
              <div className="text-xs text-gray-500">
                {isAr ? 'ستستلم:' : 'You receive:'}
                <span className="text-blue-600 font-semibold ms-1">{Math.round(parseInt(specData.price) * 0.85)} {isAr ? 'ج' : 'EGP'}</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            {isAr ? 'مدد الجلسات المتاحة' : 'Available Durations'}
          </label>
          <div className="flex gap-3 flex-wrap">
            {DURATIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDuration(d)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  specData.durations.includes(d)
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-100 text-gray-600 hover:border-blue-200'
                }`}
              >
                <IconClock size={15} />
                {d} {isAr ? 'دقيقة' : 'min'}
              </button>
            ))}
          </div>
        </div>
      </div>
    )

    if (current === 'kyc') return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">
          {isAr ? 'توثيق الهوية' : 'Identity Verification'}
        </h2>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
          {isAr
            ? 'مطلوب لحماية العملاء وضمان جودة الخدمة. سيراجع فريقنا طلبك خلال 24 ساعة.'
            : 'Required to protect clients. Our team will review your request within 24 hours.'
          }
        </div>
        {[
          { key: 'kycFront', icon: IconCamera,   ar: 'وجه البطاقة الوطنية', en: 'National ID — Front' },
          { key: 'kycBack',  icon: IconFileText, ar: 'ظهر البطاقة الوطنية', en: 'National ID — Back' },
        ].map(item => (
          <div key={item.key}>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              {isAr ? item.ar : item.en}
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              specData[item.key as 'kycFront' | 'kycBack']
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}>
              <item.icon size={24} className={specData[item.key as 'kycFront' | 'kycBack'] ? 'text-blue-600' : 'text-gray-400'} />
              <span className="text-sm text-gray-600 font-medium text-center">
                {specData[item.key as 'kycFront' | 'kycBack']
                  ? (specData[item.key as 'kycFront' | 'kycBack'] as File).name
                  : (isAr ? 'اضغط لرفع الصورة' : 'Click to upload')
                }
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null
                  setSpecData(prev => ({ ...prev, [item.key]: file }))
                }}
              />
            </label>
          </div>
        ))}
      </div>
    )

    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-6">
          <span className="text-2xl font-black text-blue-600">MatchInWorld</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{isAr ? `خطوة ${step + 1} من ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 min-h-96 flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={fadeUp} initial="hidden" animate="show" exit="exit">
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                if (step === 0) {
                  setRoleSelected(false)
                } else {
                  setStep(s => s - 1)
                }
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-all"
            >
              <Prev size={18} />
              {isAr ? 'السابق' : 'Back'}
            </button>

            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
              >
                {isAr ? 'التالي' : 'Next'}
                <Next size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canNext() || loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-green-200"
              >
                {loading
                  ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                  : (isAr ? 'إنهاء الإعداد' : 'Complete Setup')
                }
                {!loading && <IconCheck size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}