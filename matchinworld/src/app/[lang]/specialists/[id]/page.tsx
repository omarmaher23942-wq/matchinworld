'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconStar, IconClock, IconCalendar, IconShieldCheck,
  IconArrowRight, IconArrowLeft, IconMessageCircle,
  IconBrain, IconTarget, IconBarbell, IconSalad,
  IconStethoscope, IconYoga, IconTrendingUp, IconSparkles,
  IconChevronLeft, IconChevronRight
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

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

const DAYS: Record<number, { ar: string; en: string }> = {
  0: { ar: 'الأحد',    en: 'Sunday' },
  1: { ar: 'الاثنين',  en: 'Monday' },
  2: { ar: 'الثلاثاء', en: 'Tuesday' },
  3: { ar: 'الأربعاء', en: 'Wednesday' },
  4: { ar: 'الخميس',   en: 'Thursday' },
  5: { ar: 'الجمعة',   en: 'Friday' },
  6: { ar: 'السبت',    en: 'Saturday' },
}

export default function SpecialistProfilePage({
  params
}: {
  params: Promise<{ lang: Locale; id: string }>
}) {
  const { lang, id } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [specialist, setSpecialist] = useState<any>(null)
  const [availability, setAvailability] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: specData } = await supabase
        .from('specialists')
        .select('*, users(name, avatar_url)')
        .eq('id', id)
        .single()

      if (!specData) { router.push(`/${safeLang}/specialists`); return }
      setSpecialist(specData)
      setSelectedDuration(specData.session_durations?.[0] ?? 60)

      const { data: availData } = await supabase
        .from('availability')
        .select('*')
        .eq('specialist_id', id)
        .order('day_of_week')

      setAvailability(availData ?? [])

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, clients(users(name))')
        .eq('specialist_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5)

      setReviews(reviewsData ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBook() {
    if (!selectedSlot) return
    setBookingLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'client') {
      alert(isAr ? 'فقط العملاء يمكنهم الحجز' : 'Only clients can book sessions')
      setBookingLoading(false)
      return
    }

    // حساب التاريخ القادم للـ slot
    const today = new Date()
    const dayOfWeek = selectedSlot.day
    const daysUntil = (dayOfWeek - today.getDay() + 7) % 7 || 7
    const sessionDate = new Date(today)
    sessionDate.setDate(today.getDate() + daysUntil)
    const [hours, minutes] = selectedSlot.time.split(':')
    sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const amountClient     = Math.round(specialist.price_per_hour * 1.15)
    const amountSpecialist = Math.round(specialist.price_per_hour * 0.85)
    const platformFee      = specialist.price_per_hour - amountSpecialist + (amountClient - specialist.price_per_hour)

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        client_id:       user.id,
        specialist_id:   id,
        scheduled_at:    sessionDate.toISOString(),
        duration_minutes: selectedDuration,
        status:          'pending_payment',
        amount_client:    amountClient,
        amount_specialist: amountSpecialist,
        platform_fee:     platformFee,
      })
      .select()
      .single()

    if (error || !booking) {
      alert(isAr ? 'حدث خطأ في الحجز' : 'Booking failed')
      setBookingLoading(false)
      return
    }

    window.location.href = `/${safeLang}/pay/${booking.id}`
  }

  // توليد الـ time slots
  function generateSlots(startTime: string, endTime: string, duration: number) {
    const slots: string[] = []
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM
    while (current + duration <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0')
      const m = (current % 60).toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
      current += duration
    }
    return slots
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  if (!specialist) return null

  const clientPrice = Math.round(specialist.price_per_hour * 1.15)

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
          >
            <Arrow size={18} className="text-gray-600" />
          </button>
          <Link href={`/${safeLang}`} className="text-lg font-black text-blue-600">MatchInWorld</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Profile */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 p-6"
          >
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center text-3xl font-black text-blue-600 shrink-0">
                {specialist.users?.name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-gray-900">{specialist.users?.name}</h1>
                  {specialist.kyc_status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                      <IconShieldCheck size={12} />
                      {isAr ? 'موثّق' : 'Verified'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <IconStar size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-gray-700">{specialist.rating?.toFixed(1) ?? '0.0'}</span>
                    <span className="text-xs text-gray-400">({specialist.total_sessions ?? 0} {isAr ? 'جلسة' : 'sessions'})</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm font-bold text-blue-600">
                    {clientPrice} {isAr ? 'ج/جلسة' : 'EGP/session'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {specialist.specializations?.map((spec: string) => (
                    <span key={spec} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                      {isAr ? SPECIALIZATIONS[spec]?.ar ?? spec : SPECIALIZATIONS[spec]?.en ?? spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">{isAr ? 'نبذة عني' : 'About Me'}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{specialist.bio}</p>
            </div>
          </motion.div>

          {/* Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 p-6"
          >
            <h3 className="font-black text-gray-900 mb-4">{isAr ? 'المواعيد المتاحة' : 'Available Times'}</h3>

            {/* Duration selector */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">{isAr ? 'مدة الجلسة' : 'Session Duration'}</p>
              <div className="flex gap-2 flex-wrap">
                {specialist.session_durations?.map((d: number) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDuration(d); setSelectedSlot(null) }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedDuration === d
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-100 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <IconClock size={14} />
                    {d} {isAr ? 'دقيقة' : 'min'}
                  </button>
                ))}
              </div>
            </div>

            {availability.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <IconCalendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isAr ? 'لا توجد مواعيد متاحة حالياً' : 'No available slots'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availability.map(avail => {
                  const slots = generateSlots(avail.start_time, avail.end_time, selectedDuration)
                  return (
                    <div key={avail.id}>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {isAr ? DAYS[avail.day_of_week]?.ar : DAYS[avail.day_of_week]?.en}
                        <span className="text-xs text-gray-400 ms-2 font-normal">
                          {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot({ day: avail.day_of_week, time: slot })}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all ${
                              selectedSlot?.day === avail.day_of_week && selectedSlot?.time === slot
                                ? 'border-blue-500 bg-blue-600 text-white'
                                : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-blue-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl border border-gray-100 p-6"
            >
              <h3 className="font-black text-gray-900 mb-4">{isAr ? 'التقييمات' : 'Reviews'}</h3>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {r.clients?.users?.name ?? (isAr ? 'عميل' : 'Client')}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <IconStar
                            key={star}
                            size={13}
                            className={star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Booking card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 sticky top-24"
          >
            <h3 className="font-black text-gray-900 mb-4">{isAr ? 'احجز جلسة' : 'Book a Session'}</h3>

            <div className="bg-blue-50 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{isAr ? 'سعر الجلسة' : 'Session Price'}</span>
                <span className="font-black text-blue-600 text-lg">{clientPrice} {isAr ? 'ج' : 'EGP'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{isAr ? 'المدة' : 'Duration'}</span>
                <span>{selectedDuration} {isAr ? 'دقيقة' : 'min'}</span>
              </div>
            </div>

            {selectedSlot ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
                <p className="text-sm font-semibold text-green-700">
                  {isAr ? 'الموعد المختار:' : 'Selected Slot:'}
                </p>
                <p className="text-sm text-green-600 mt-0.5">
                  {isAr ? DAYS[selectedSlot.day]?.ar : DAYS[selectedSlot.day]?.en} — {selectedSlot.time}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-4">
                <p className="text-xs text-amber-700">
                  {isAr ? 'اختر موعداً من الجدول أعلاه' : 'Select a slot from the schedule above'}
                </p>
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!selectedSlot || bookingLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-200"
            >
              {bookingLoading
                ? (isAr ? 'جاري الحجز...' : 'Booking...')
                : (isAr ? 'احجز الآن' : 'Book Now')
              }
              {!bookingLoading && <Arrow size={18} />}
            </button>

            <Link
              href={`/${safeLang}/chat/new?specialist=${id}`}
              className="w-full flex items-center justify-center gap-2 mt-3 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 font-medium py-3 rounded-2xl transition-all text-sm"
            >
              <IconMessageCircle size={18} />
              {isAr ? 'راسل المتخصص' : 'Message Specialist'}
            </Link>
          </motion.div>
        </div>

      </div>
    </main>
  )
}