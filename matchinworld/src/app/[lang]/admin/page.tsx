'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconShieldCheck, IconX, IconCheck, IconUsers, IconCalendar,
  IconWallet, IconAlertCircle, IconLogout, IconEye,
  IconClock, IconChevronRight, IconChevronLeft
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

type Tab = 'overview' | 'kyc' | 'payments' | 'withdrawals' | 'reports'

export default function AdminPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [kycRequests, setKycRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users').select('role').eq('id', user.id).single()

      if (userData?.role !== 'admin') { window.location.href = `/${safeLang}/dashboard`; return }

      await loadAll()
      setLoading(false)
    }
    load()
  }, [])

  async function loadAll() {
    const [
      { count: usersCount },
      { count: bookingsCount },
      { data: kycData },
      { data: paymentsData },
      { data: withdrawalsData },
      { data: reportsData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('specialists')
        .select('*, users(name, email)')
        .eq('kyc_status', 'pending'),
      supabase.from('payments')
        .select('*, bookings(*, clients(users(name)), specialists(users(name)))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('withdrawal_requests')
        .select('*, specialists(users(name))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('reports')
        .select('*, reporter:users!reporter_id(name), reported:users!reported_id(name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false }),
    ])

    setStats({ usersCount, bookingsCount })
    setKycRequests(kycData ?? [])
    setPayments(paymentsData ?? [])
    setWithdrawals(withdrawalsData ?? [])
    setReports(reportsData ?? [])
  }

  async function approveKYC(id: string) {
    setActionLoading(id)
    await supabase.from('specialists')
      .update({ kyc_status: 'approved', is_active: true })
      .eq('id', id)
    await loadAll()
    setActionLoading(null)
  }

  async function rejectKYC(id: string) {
    setActionLoading(id)
    await supabase.from('specialists')
      .update({ kyc_status: 'rejected', is_active: false })
      .eq('id', id)
    await loadAll()
    setActionLoading(null)
  }

  async function confirmPayment(payment: any) {
    setActionLoading(payment.id)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('payments').update({
      status: 'confirmed',
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString(),
    }).eq('id', payment.id)

    await supabase.from('bookings').update({ status: 'confirmed' })
      .eq('id', payment.booking_id)

    // تحديث المحفظة
    const booking = payment.bookings
    if (booking) {
      const { data: clientWallet } = await supabase.from('wallets')
        .select('*').eq('user_id', booking.client_id).single()
      if (clientWallet) {
        await supabase.from('wallets').update({
          total_spent: (clientWallet.total_spent ?? 0) + booking.amount_client
        }).eq('user_id', booking.client_id)
      }

      const { data: specWallet } = await supabase.from('wallets')
        .select('*').eq('user_id', booking.specialist_id).single()
      if (specWallet) {
        await supabase.from('wallets').update({
          balance: (specWallet.balance ?? 0) + booking.amount_specialist,
          total_earned: (specWallet.total_earned ?? 0) + booking.amount_specialist,
        }).eq('user_id', booking.specialist_id)
      }
    }

    await loadAll()
    setActionLoading(null)
  }

  async function confirmWithdrawal(id: string, specialistId: string, amount: number) {
    setActionLoading(id)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('withdrawal_requests').update({
      status: 'completed',
      processed_by: user?.id,
    }).eq('id', id)

    const { data: wallet } = await supabase.from('wallets')
      .select('*').eq('user_id', specialistId).single()
    if (wallet) {
      await supabase.from('wallets').update({
        balance: Math.max(0, (wallet.balance ?? 0) - amount)
      }).eq('user_id', specialistId)
    }

    await loadAll()
    setActionLoading(null)
  }

  async function resolveReport(id: string) {
    setActionLoading(id)
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
    await loadAll()
    setActionLoading(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = `/${safeLang}`
  }

  const tabs: { key: Tab; ar: string; en: string; count?: number }[] = [
    { key: 'overview',    ar: 'نظرة عامة',      en: 'Overview' },
    { key: 'kyc',         ar: 'توثيق الهوية',   en: 'KYC',         count: kycRequests.length },
    { key: 'payments',    ar: 'المدفوعات',       en: 'Payments',    count: payments.length },
    { key: 'withdrawals', ar: 'طلبات السحب',     en: 'Withdrawals', count: withdrawals.length },
    { key: 'reports',     ar: 'البلاغات',        en: 'Reports',     count: reports.length },
  ]

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} className="max-w-lg max-h-screen rounded-2xl" alt="KYC" />
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-blue-600">MatchInWorld</span>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">
              {isAr ? 'أدمن' : 'Admin'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <IconLogout size={16} />
            {isAr ? 'خروج' : 'Logout'}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {isAr ? t.ar : t.en}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={fadeUp} custom={0} initial="hidden" animate="show">
            {[
              { icon: IconUsers,        value: stats.usersCount ?? 0,       label: isAr ? 'إجمالي المستخدمين' : 'Total Users',        color: 'text-blue-600 bg-blue-50' },
              { icon: IconCalendar,     value: stats.bookingsCount ?? 0,    label: isAr ? 'إجمالي الحجوزات' : 'Total Bookings',       color: 'text-green-600 bg-green-50' },
              { icon: IconShieldCheck,  value: kycRequests.length,          label: isAr ? 'طلبات KYC' : 'KYC Requests',               color: 'text-amber-600 bg-amber-50' },
              { icon: IconAlertCircle,  value: reports.length,              label: isAr ? 'بلاغات مفتوحة' : 'Open Reports',           color: 'text-red-600 bg-red-50' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* KYC */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            {kycRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <IconShieldCheck size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
              </div>
            ) : kycRequests.map(req => (
              <motion.div key={req.id} variants={fadeUp} custom={0} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{req.users?.name}</p>
                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        {isAr ? 'قيد المراجعة' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{req.users?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{req.specializations?.join(' · ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveKYC(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      <IconCheck size={16} />
                      {isAr ? 'موافقة' : 'Approve'}
                    </button>
                    <button
                      onClick={() => rejectKYC(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      <IconX size={16} />
                      {isAr ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
                {/* KYC Images */}
                <div className="flex gap-3 mt-4">
                  {req.kyc_front_url && (
                    <button
                      onClick={() => setSelectedImage(req.kyc_front_url)}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-sm font-medium text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl transition-all"
                    >
                      <IconEye size={16} />
                      {isAr ? 'وجه البطاقة' : 'ID Front'}
                    </button>
                  )}
                  {req.kyc_back_url && (
                    <button
                      onClick={() => setSelectedImage(req.kyc_back_url)}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-sm font-medium text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl transition-all"
                    >
                      <IconEye size={16} />
                      {isAr ? 'ظهر البطاقة' : 'ID Back'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <IconWallet size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">{isAr ? 'لا توجد مدفوعات معلقة' : 'No pending payments'}</p>
              </div>
            ) : payments.map(payment => (
              <motion.div key={payment.id} variants={fadeUp} custom={0} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        {isAr ? 'انتظار التأكيد' : 'Awaiting Confirmation'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {payment.method === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{isAr ? 'العميل:' : 'Client:'}</span>{' '}
                      {payment.bookings?.clients?.users?.name}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      <span className="font-semibold">{isAr ? 'المتخصص:' : 'Specialist:'}</span>{' '}
                      {payment.bookings?.specialists?.users?.name}
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {payment.bookings?.amount_client} {isAr ? 'ج' : 'EGP'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {payment.receipt_url && (
                      <button
                        onClick={() => setSelectedImage(payment.receipt_url)}
                        className="flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-xl transition-all"
                      >
                        <IconEye size={15} />
                        {isAr ? 'الإيصال' : 'Receipt'}
                      </button>
                    )}
                    <button
                      onClick={() => confirmPayment(payment)}
                      disabled={actionLoading === payment.id}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      <IconCheck size={15} />
                      {isAr ? 'تأكيد' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <IconWallet size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">{isAr ? 'لا توجد طلبات سحب' : 'No withdrawal requests'}</p>
              </div>
            ) : withdrawals.map(w => (
              <motion.div key={w.id} variants={fadeUp} custom={0} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900">{w.specialists?.users?.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {w.method === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}: {w.account_number}
                    </p>
                    <p className="text-lg font-black text-blue-600 mt-1">
                      {w.amount} {isAr ? 'ج' : 'EGP'}
                    </p>
                  </div>
                  <button
                    onClick={() => confirmWithdrawal(w.id, w.specialist_id, w.amount)}
                    disabled={actionLoading === w.id}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    <IconCheck size={15} />
                    {isAr ? 'تم التحويل' : 'Mark as Done'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <IconAlertCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">{isAr ? 'لا توجد بلاغات مفتوحة' : 'No open reports'}</p>
              </div>
            ) : reports.map(r => (
              <motion.div key={r.id} variants={fadeUp} custom={0} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {isAr ? 'مفتوح' : 'Open'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{isAr ? 'المُبلِّغ:' : 'Reporter:'}</span>{' '}
                      {r.reporter?.name}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      <span className="font-semibold">{isAr ? 'المُبلَّغ عنه:' : 'Reported:'}</span>{' '}
                      {r.reported?.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-xl p-3">
                      {r.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveReport(r.id)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    <IconCheck size={15} />
                    {isAr ? 'تم الحل' : 'Resolve'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}