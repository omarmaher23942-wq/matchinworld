'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  IconCheck, IconStar, IconArrowRight, IconArrowLeft,
  IconCalendar, IconLoader2, IconX
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

export default function SessionEndPage({
  params
}: {
  params: Promise<{ lang: Locale; bookingId: string }>
}) {
  const { lang, bookingId } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [booking, setBooking] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [hasReview, setHasReview] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      setCurrentUser(userData)

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, specialists(users(name)), clients(users(name))')
        .eq('id', bookingId)
        .single()
      setBooking(bookingData)

      // تحقق لو عمل review قبل كده
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single()
      if (reviewData) setHasReview(true)
    }
    load()
  }, [bookingId])

  async function submitReview() {
    if (!currentUser || !booking) return
    setSubmitting(true)

    await supabase.from('reviews').insert({
      booking_id:    bookingId,
      client_id:     currentUser.id,
      specialist_id: booking.specialist_id,
      rating,
      comment,
      is_published:  true,
      ai_validated:  false,
    })

    // تحديث تقييم المتخصص
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('specialist_id', booking.specialist_id)
      .eq('is_published', true)

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await supabase.from('specialists').update({
        rating: Math.round(avg * 10) / 10,
        total_sessions: allReviews.length,
      }).eq('id', booking.specialist_id)
    }

    setDone(true)
    setSubmitting(false)
  }

  const otherPerson = booking
    ? (currentUser?.role === 'client' ? booking.specialists?.users : booking.clients?.users)
    : null

  const isClient = currentUser?.role === 'client'

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30"
          >
            <IconCheck size={36} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-black text-white mb-2">
            {isAr ? 'انتهت الجلسة' : 'Session Ended'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isAr ? `جلسة مع ${otherPerson?.name}` : `Session with ${otherPerson?.name}`}
          </p>
        </div>

        <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 space-y-5">

          {/* Review section — للعميل فقط */}
          {isClient && !hasReview && !done && (
            <>
              <div>
                <p className="text-white font-bold mb-4 text-center">
                  {isAr ? 'كيف كانت الجلسة؟' : 'How was the session?'}
                </p>
                <div className="flex items-center justify-center gap-2 mb-5">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)}>
                      <IconStar
                        size={36}
                        className={`transition-all ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600 fill-gray-600'}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-sm text-white placeholder:text-gray-400 resize-none"
                  placeholder={isAr ? 'شاركنا تجربتك (اختياري)...' : 'Share your experience (optional)...'}
                />
              </div>

              <button
                onClick={submitReview}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all"
              >
                {submitting
                  ? <><IconLoader2 size={18} className="animate-spin" /> {isAr ? 'جاري الإرسال...' : 'Submitting...'}</>
                  : (isAr ? 'إرسال التقييم' : 'Submit Review')
                }
              </button>

              <button
                onClick={() => setDone(true)}
                className="w-full text-gray-400 hover:text-gray-200 text-sm py-2 transition-all"
              >
                {isAr ? 'تخطي' : 'Skip'}
              </button>
            </>
          )}

          {/* Done state */}
          {(done || hasReview || !isClient) && (
            <>
              {done && !hasReview && (
                <div className="text-center py-4">
                  <IconCheck size={32} className="text-green-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{isAr ? 'شكراً على تقييمك!' : 'Thanks for your review!'}</p>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href={`/${safeLang}/specialists/${booking?.specialist_id}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all"
                >
                  <IconCalendar size={18} />
                  {isAr ? 'احجز جلسة أخرى' : 'Book Another Session'}
                </Link>

                <Link
                  href={`/${safeLang}/dashboard`}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-2xl transition-all text-sm"
                >
                  {isAr ? 'الرئيسية' : 'Go to Dashboard'}
                  <Arrow size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  )
}