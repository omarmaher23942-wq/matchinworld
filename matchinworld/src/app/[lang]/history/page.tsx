'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconCalendar, IconClock, IconArrowLeft, IconArrowRight,
  IconVideo, IconStar, IconCheck,
  IconX, IconLoader2
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const STATUS_STYLES: Record<string, { ar: string; en: string; class: string }> = {
  pending_payment: { ar: 'انتظار الدفع',  en: 'Awaiting Payment', class: 'bg-amber-50 text-amber-600' },
  confirmed:       { ar: 'مؤكد',          en: 'Confirmed',        class: 'bg-blue-50 text-blue-600' },
  completed:       { ar: 'مكتمل',         en: 'Completed',        class: 'bg-green-50 text-green-600' },
  cancelled:       { ar: 'ملغي',          en: 'Cancelled',        class: 'bg-red-50 text-red-500' },
}

export default function HistoryPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users').select('role').eq('id', user.id).single()

      setUserRole(userData?.role ?? 'client')

      let query = supabase
        .from('bookings')
        .select('*, specialists(users(name, avatar_url)), clients(users(name, avatar_url)), reviews(id)')
        .order('scheduled_at', { ascending: false })

      if (userData?.role === 'client') {
        query = query.eq('client_id', user.id)
      } else {
        query = query.eq('specialist_id', user.id)
      }

      const { data } = await query
      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function submitReview() {
    if (!reviewBookingId) return
    setSubmittingReview(true)

    const { data: { user } } = await supabase.auth.getUser()
    const booking = bookings.find(b => b.id === reviewBookingId)

    await supabase.from('reviews').insert({
      booking_id:    reviewBookingId,
      client_id:     user?.id,
      specialist_id: booking?.specialist_id,
      rating,
      comment,
      is_published:  true,
      ai_validated:  false,
    })

    setReviewBookingId(null)
    setRating(5)
    setComment('')
    setSubmittingReview(false)

    // تحديث قائمة الحجوزات
    setBookings(prev => prev.map(b =>
      b.id === reviewBookingId ? { ...b, reviews: [{ id: 'done' }] } : b
    ))
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all">
            <Arrow size={18} className="text-gray-600" />
          </button>
          <span className="text-lg font-black text-blue-600">MatchInWorld</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-900">{isAr ? 'سجل الجلسات' : 'Session History'}</h1>
          <p className="text-gray-500 text-sm mt-1">{bookings.length} {isAr ? 'جلسة' : 'sessions'}</p>
        </motion.div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <IconCalendar size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-900">{isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b, i) => {
              const other = userRole === 'client' ? b.specialists?.users : b.clients?.users
              const status = STATUS_STYLES[b.status] ?? STATUS_STYLES.cancelled
              const hasReview = b.reviews?.length > 0
              const isCompleted = b.status === 'completed'
              const isPending = b.status === 'pending_payment'
              const isConfirmed = b.status === 'confirmed'

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center text-blue-600 font-black shrink-0">
                      {other?.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{other?.name}</p>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.class}`}>
                          {isAr ? status.ar : status.en}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <IconCalendar size={12} />
                          {new Date(b.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <IconClock size={12} />
                          {new Date(b.scheduled_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs font-bold text-blue-600">{b.amount_client} {isAr ? 'ج' : 'EGP'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {isPending && userRole === 'client' && (
                      <Link href={`/${safeLang}/pay/${b.id}`}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                        {isAr ? 'ادفع الآن' : 'Pay Now'}
                      </Link>
                    )}
                    {isConfirmed && (
                      <>
                        <Link href={`/${safeLang}/session/${b.id}`}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                          <IconVideo size={14} />
                          {isAr ? 'انضم' : 'Join'}
                        </Link>
                        
                      </>
                    )}
                    {isCompleted && userRole === 'client' && !hasReview && (
                      <button
                        onClick={() => setReviewBookingId(b.id)}
                        className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-amber-200"
                      >
                        <IconStar size={14} />
                        {isAr ? 'قيّم الجلسة' : 'Rate Session'}
                      </button>
                    )}
                    {isCompleted && hasReview && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <IconCheck size={14} />
                        {isAr ? 'تم التقييم' : 'Reviewed'}
                      </span>
                    )}
                    {isCompleted && (
                      <Link href={`/${safeLang}/specialists/${b.specialist_id}`}
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                        {isAr ? 'احجز مجدداً' : 'Book Again'}
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">{isAr ? 'قيّم الجلسة' : 'Rate Session'}</h3>
              <button onClick={() => setReviewBookingId(null)} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200">
                <IconX size={16} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mb-5">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRating(star)}>
                  <IconStar
                    size={32}
                    className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-none mb-4"
              placeholder={isAr ? 'تعليقك (اختياري)...' : 'Your comment (optional)...'}
            />

            <button
              onClick={submitReview}
              disabled={submittingReview}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl transition-all"
            >
              {submittingReview
                ? <><IconLoader2 size={16} className="animate-spin" /> {isAr ? 'جاري الإرسال...' : 'Submitting...'}</>
                : (isAr ? 'إرسال التقييم' : 'Submit Review')
              }
            </button>
          </motion.div>
        </div>
      )}
    </main>
  )
}