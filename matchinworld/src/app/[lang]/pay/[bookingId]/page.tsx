'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconCopy, IconCheck, IconUpload, IconArrowLeft,
  IconArrowRight, IconClock, IconCalendar, IconShieldCheck
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

export default function PaymentPage({
  params
}: {
  params: Promise<{ lang: Locale; bookingId: string }>
}) {
  const { lang, bookingId } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [method, setMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const PAYMENT_NUMBERS = {
    vodafone_cash: { number: '+201094321957', label: isAr ? 'Vodafone Cash' : 'Vodafone Cash' },
    instapay:      { number: '+201092993469', label: 'InstaPay' },
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data } = await supabase
        .from('bookings')
        .select('*, specialists(users(name), specializations), clients(users(name))')
        .eq('id', bookingId)
        .eq('client_id', user.id)
        .single()

      if (!data) { router.push(`/${safeLang}/dashboard`); return }
      if (data.status !== 'pending_payment') {
        window.location.href = `/${safeLang}/dashboard`
        return
      }

      setBooking(data)
      setLoading(false)
    }
    load()
  }, [bookingId])

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num)
    setCopied(num)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSubmit() {
    if (!receipt) return
    setSubmitting(true)

    try {
      const receiptUrl = await uploadToCloudinary(receipt, 'receipts')

      await supabase.from('payments').insert({
        booking_id:  bookingId,
        method,
        receipt_url: receiptUrl,
        status:      'pending',
      })

      setDone(true)
    } catch {
      alert(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  if (done) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <IconCheck size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">
          {isAr ? 'تم إرسال الإيصال' : 'Receipt Submitted'}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {isAr
            ? 'سيتم مراجعة الدفع وتأكيد حجزك خلال دقائق. يمكنك متابعة حالة الحجز من لوحة التحكم.'
            : 'Your payment will be reviewed and booking confirmed within minutes. Track your booking from the dashboard.'
          }
        </p>
        <Link
          href={`/${safeLang}/dashboard`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all"
        >
          {isAr ? 'لوحة التحكم' : 'Go to Dashboard'}
          <Arrow size={18} />
        </Link>
      </motion.div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
          >
            <Arrow size={18} className="text-gray-600" />
          </button>
          <span className="text-lg font-black text-blue-600">MatchInWorld</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            {isAr ? 'إتمام الدفع' : 'Complete Payment'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAr ? 'حول المبلغ وارفع صورة الإيصال لتأكيد حجزك' : 'Transfer the amount and upload receipt to confirm your booking'}
          </p>
        </motion.div>

        {/* Booking summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 p-6"
        >
          <h3 className="font-black text-gray-900 mb-4">{isAr ? 'تفاصيل الحجز' : 'Booking Details'}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{isAr ? 'المتخصص' : 'Specialist'}</span>
              <span className="text-sm font-semibold text-gray-900">{booking?.specialists?.users?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{isAr ? 'التاريخ والوقت' : 'Date & Time'}</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(booking?.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                {' '}
                {new Date(booking?.scheduled_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{isAr ? 'المدة' : 'Duration'}</span>
              <span className="text-sm font-semibold text-gray-900">{booking?.duration_minutes} {isAr ? 'دقيقة' : 'min'}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-900">{isAr ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
              <span className="text-xl font-black text-blue-600">{booking?.amount_client} {isAr ? 'ج' : 'EGP'}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-gray-100 p-6"
        >
          <h3 className="font-black text-gray-900 mb-4">{isAr ? 'طريقة الدفع' : 'Payment Method'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(['vodafone_cash', 'instapay'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  method === m
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-100 text-gray-600 hover:border-blue-200'
                }`}
              >
                {m === 'vodafone_cash' ? '📱 Vodafone Cash' : '💳 InstaPay'}
              </button>
            ))}
          </div>

          {/* Payment number */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-2">
              {isAr ? 'حول المبلغ على الرقم التالي:' : 'Transfer to the following number:'}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{PAYMENT_NUMBERS[method].label}</p>
                <p className="text-lg font-black text-gray-900 tracking-wider">
                  {PAYMENT_NUMBERS[method].number}
                </p>
              </div>
              <button
                onClick={() => copyNumber(PAYMENT_NUMBERS[method].number)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  copied === PAYMENT_NUMBERS[method].number
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {copied === PAYMENT_NUMBERS[method].number
                  ? <><IconCheck size={15} /> {isAr ? 'تم النسخ' : 'Copied'}</>
                  : <><IconCopy size={15} /> {isAr ? 'نسخ' : 'Copy'}</>
                }
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {isAr ? 'المبلغ المطلوب تحويله:' : 'Amount to transfer:'}
                <span className="font-black text-blue-600 ms-2 text-sm">{booking?.amount_client} {isAr ? 'ج' : 'EGP'}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload receipt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 p-6"
        >
          <h3 className="font-black text-gray-900 mb-2">{isAr ? 'ارفع صورة الإيصال' : 'Upload Receipt'}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {isAr ? 'بعد إتمام التحويل، ارفع صورة لإيصال التحويل' : 'After transferring, upload a screenshot of the receipt'}
          </p>

          <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            receipt ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}>
            {receipt ? (
              <>
                <IconCheck size={28} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">{receipt.name}</span>
                <span className="text-xs text-gray-400">{isAr ? 'اضغط لتغيير الصورة' : 'Click to change'}</span>
              </>
            ) : (
              <>
                <IconUpload size={28} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-600">{isAr ? 'اضغط لرفع صورة الإيصال' : 'Click to upload receipt'}</span>
                <span className="text-xs text-gray-400">PNG, JPG</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setReceipt(e.target.files?.[0] ?? null)}
            />
          </label>
        </motion.div>

        {/* Security note */}
        <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
          <IconShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            {isAr
              ? 'لن يتم تأكيد حجزك إلا بعد مراجعة الإيصال من فريقنا. يستغرق ذلك عادةً أقل من 30 دقيقة.'
              : 'Your booking will only be confirmed after our team reviews the receipt. This usually takes less than 30 minutes.'
            }
          </p>
        </div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={handleSubmit}
          disabled={!receipt || submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 text-base"
        >
          {submitting
            ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
            : (isAr ? 'إرسال الإيصال وتأكيد الحجز' : 'Submit Receipt & Confirm Booking')
          }
          {!submitting && <Arrow size={18} />}
        </motion.button>

      </div>
    </main>
  )
}