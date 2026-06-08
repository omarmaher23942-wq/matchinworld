'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconArrowLeft, IconArrowRight, IconWallet,
  IconClock, IconCheck, IconX, IconLoader2,
  IconCurrencyDollar
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

export default function EarningsPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [wallet, setWallet] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ method: 'vodafone_cash', account: '', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }
      setUserId(user.id)

      const { data: walletData } = await supabase
        .from('wallets').select('*').eq('user_id', user.id).single()
      setWallet(walletData)

      const { data: wData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('specialist_id', user.id)
        .order('created_at', { ascending: false })
      setWithdrawals(wData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function submitWithdrawal() {
    if (!form.account || !form.amount) return
    const amount = parseInt(form.amount)
    if (amount <= 0 || amount > (wallet?.balance ?? 0)) return

    setSubmitting(true)
    await supabase.from('withdrawal_requests').insert({
      specialist_id:  userId,
      amount,
      method:         form.method,
      account_number: form.account,
      status:         'pending',
    })

    const { data: wData } = await supabase
      .from('withdrawal_requests').select('*')
      .eq('specialist_id', userId).order('created_at', { ascending: false })
    setWithdrawals(wData ?? [])
    setShowForm(false)
    setForm({ method: 'vodafone_cash', account: '', amount: '' })
    setSubmitting(false)
  }

  const STATUS_STYLES: Record<string, { ar: string; en: string; class: string }> = {
    pending:   { ar: 'قيد المراجعة', en: 'Pending',   class: 'bg-amber-50 text-amber-600' },
    completed: { ar: 'تم التحويل',   en: 'Completed', class: 'bg-green-50 text-green-600' },
    rejected:  { ar: 'مرفوض',        en: 'Rejected',  class: 'bg-red-50 text-red-500' },
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all">
            <Arrow size={18} className="text-gray-600" />
          </button>
          <span className="text-lg font-black text-blue-600">MatchInWorld</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-900">{isAr ? 'أرباحي' : 'My Earnings'}</h1>
        </motion.div>

        {/* Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">{isAr ? 'الرصيد المتاح للسحب' : 'Available for Withdrawal'}</p>
              <p className="text-4xl font-black mt-1">{wallet?.balance ?? 0} <span className="text-lg font-normal">{isAr ? 'ج' : 'EGP'}</span></p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <IconWallet size={28} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20 mb-4">
            <div>
              <p className="text-blue-100 text-xs">{isAr ? 'إجمالي الأرباح' : 'Total Earned'}</p>
              <p className="font-bold mt-0.5">{wallet?.total_earned ?? 0} {isAr ? 'ج' : 'EGP'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={(wallet?.balance ?? 0) <= 0}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all text-sm"
          >
            {isAr ? 'طلب سحب الأرباح' : 'Request Withdrawal'}
          </button>
        </motion.div>

        {/* Withdrawal form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4"
          >
            <h3 className="font-black text-gray-900">{isAr ? 'طلب سحب' : 'Withdrawal Request'}</h3>

            <div className="grid grid-cols-2 gap-3">
              {(['vodafone_cash', 'instapay'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, method: m })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.method === m ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-600'
                  }`}
                >
                  {m === 'vodafone_cash' ? '📱 Vodafone' : '💳 InstaPay'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">{isAr ? 'رقم الحساب' : 'Account Number'}</label>
              <input
                type="text"
                value={form.account}
                onChange={e => setForm({ ...form, account: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder={isAr ? 'رقم المحفظة أو الحساب' : 'Wallet or account number'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? `المبلغ (الحد الأقصى: ${wallet?.balance ?? 0} ج)` : `Amount (Max: ${wallet?.balance ?? 0} EGP)`}
              </label>
              <div className="relative">
                <IconCurrencyDollar size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={wallet?.balance ?? 0}
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder={isAr ? 'المبلغ المطلوب سحبه' : 'Amount to withdraw'}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={submitWithdrawal}
                disabled={submitting || !form.account || !form.amount}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {submitting
                  ? <><IconLoader2 size={16} className="animate-spin" /> {isAr ? 'جاري...' : 'Sending...'}</>
                  : (isAr ? 'إرسال الطلب' : 'Submit')
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* Withdrawal history */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-black text-gray-900 mb-4">{isAr ? 'طلبات السحب السابقة' : 'Withdrawal History'}</h2>
          {withdrawals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-500 text-sm">{isAr ? 'لا توجد طلبات سابقة' : 'No withdrawal requests yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w, i) => {
                const status = STATUS_STYLES[w.status] ?? STATUS_STYLES.pending
                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      w.status === 'completed' ? 'bg-green-50 text-green-600' :
                      w.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {w.status === 'completed' ? <IconCheck size={18} /> :
                       w.status === 'rejected' ? <IconX size={18} /> : <IconClock size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {w.method === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}: {w.account_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(w.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="font-black text-gray-900">{w.amount} <span className="text-xs font-normal">{isAr ? 'ج' : 'EGP'}</span></p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.class}`}>
                        {isAr ? status.ar : status.en}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}