'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconCalendar, IconWallet, IconStar, IconUsers,
  IconClock, IconCheck, IconX, IconMessageCircle,
  IconSettings, IconLogout, IconChevronRight, IconChevronLeft,
  IconTrendingUp, IconShieldCheck, IconAlertCircle
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function SpecialistDashboard({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconChevronLeft : IconChevronRight

  const [user, setUser] = useState<any>(null)
  const [specialist, setSpecialist] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData) { window.location.href = `/${safeLang}/onboarding`; return }
      if (userData.role !== 'specialist') { window.location.href = `/${safeLang}/dashboard`; return }

      setUser(userData)

      const { data: specData } = await supabase
        .from('specialists')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!specData) { window.location.href = `/${safeLang}/onboarding`; return }
      if (specData.kyc_status === 'pending') { window.location.href = `/${safeLang}/waiting`; return }

      setSpecialist(specData)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`*, clients(id, users(name, avatar_url))`)
        .eq('specialist_id', authUser.id)
        .order('scheduled_at', { ascending: true })
        .limit(10)

      setBookings(bookingsData ?? [])

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      setWallet(walletData)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = `/${safeLang}`
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const pendingBookings  = bookings.filter(b => b.status === 'pending_payment')
  const completedCount   = bookings.filter(b => b.status === 'completed').length

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-black text-blue-600">MatchInWorld</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">{user?.name}</span>
            <Link
              href={`/${safeLang}/specialist/profile/edit`}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <IconSettings size={18} />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <IconLogout size={16} />
              {isAr ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* KYC rejected warning */}
        {specialist?.kyc_status === 'rejected' && (
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" animate="show"
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <IconAlertCircle size={20} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">
                {isAr ? 'تم رفض طلب التوثيق' : 'Verification Rejected'}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {isAr ? 'يرجى إعادة تقديم المستندات' : 'Please resubmit your documents'}
              </p>
            </div>
            <Link
              href={`/${safeLang}/onboarding`}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              {isAr ? 'إعادة التقديم' : 'Resubmit'}
            </Link>
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {isAr ? `أهلاً، ${user?.name}` : `Welcome, ${user?.name}`}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {specialist?.kyc_status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                    <IconShieldCheck size={12} />
                    {isAr ? 'موثّق' : 'Verified'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                    <IconClock size={12} />
                    {isAr ? 'قيد المراجعة' : 'Pending Review'}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {specialist?.specializations?.join(' · ')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={fadeUp} custom={1} initial="hidden" animate="show"
        >
          {[
            { icon: IconWallet,      value: `${wallet?.balance ?? 0}`,     label: isAr ? 'رصيدي (ج)' : 'Balance (EGP)',    color: 'bg-blue-600 text-white' },
            { icon: IconCalendar,    value: `${upcomingBookings.length}`,   label: isAr ? 'جلسات قادمة' : 'Upcoming',        color: 'bg-white border border-gray-100' },
            { icon: IconUsers,       value: `${completedCount}`,            label: isAr ? 'جلسات مكتملة' : 'Completed',      color: 'bg-white border border-gray-100' },
            { icon: IconStar,        value: `${specialist?.rating ?? 0}`,   label: isAr ? 'التقييم' : 'Rating',              color: 'bg-white border border-gray-100' },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl p-4 flex flex-col gap-2 ${stat.color}`}>
              <stat.icon size={20} className={i === 0 ? 'text-blue-100' : 'text-gray-400'} />
              <div className={`text-2xl font-black ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              <div className={`text-xs font-medium ${i === 0 ? 'text-blue-100' : 'text-gray-500'}`}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          variants={fadeUp} custom={2} initial="hidden" animate="show"
        >
          {[
            { icon: IconCalendar,   ar: 'مواعيدي',    en: 'Availability',  href: `/${safeLang}/specialist/availability` },
            { icon: IconWallet,     ar: 'أرباحي',     en: 'Earnings',      href: `/${safeLang}/specialist/earnings` },
            { icon: IconTrendingUp, ar: 'الإحصائيات', en: 'Stats',         href: `/${safeLang}/specialist/stats` },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:-translate-y-1 hover:shadow-md transition-all text-sm font-medium text-gray-700"
            >
              <action.icon size={22} className="text-blue-600" />
              {isAr ? action.ar : action.en}
            </Link>
          ))}
        </motion.div>

        {/* Pending confirmation */}
        {pendingBookings.length > 0 && (
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="font-semibold text-amber-800 text-sm mb-3">
                {isAr ? '⏳ حجوزات تنتظر تأكيد الدفع' : '⏳ Bookings Awaiting Payment Confirmation'}
              </p>
              {pendingBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-white rounded-xl p-3 mt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {b.clients?.users?.name ?? (isAr ? 'عميل' : 'Client')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(b.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-3 py-1 rounded-full">
                    {isAr ? 'انتظار الدفع' : 'Awaiting Payment'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming sessions */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">{isAr ? 'جلساتي القادمة' : 'Upcoming Sessions'}</h2>
            <Link href={`/${safeLang}/specialist/sessions`} className="text-sm text-blue-600 font-medium flex items-center gap-1">
              {isAr ? 'كل الجلسات' : 'All Sessions'}
              <Arrow size={16} />
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconCalendar size={26} className="text-blue-400" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">
                {isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
              </p>
              <p className="text-sm text-gray-500">
                {isAr ? 'أكمل إعداد مواعيد إتاحتك لتبدأ في استقبال الحجوزات' : 'Set your availability to start receiving bookings'}
              </p>
              <Link
                href={`/${safeLang}/specialist/availability`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all mt-4"
              >
                <IconCalendar size={16} />
                {isAr ? 'إعداد المواعيد' : 'Set Availability'}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-100 transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <IconUsers size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {b.clients?.users?.name ?? (isAr ? 'عميل' : 'Client')}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <IconCalendar size={12} />
                        {new Date(b.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <IconClock size={12} />
                        {new Date(b.scheduled_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {b.duration_minutes} {isAr ? 'دقيقة' : 'min'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${safeLang}/chat/${b.id}`}
                      className="w-9 h-9 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-xl flex items-center justify-center transition-all"
                    >
                      <IconMessageCircle size={18} />
                    </Link>
                    <Link
                      href={`/${safeLang}/session/${b.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      {isAr ? 'انضم' : 'Join'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Wallet */}
        {wallet && (
          <motion.div variants={fadeUp} custom={5} initial="hidden" animate="show">
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm">{isAr ? 'إجمالي أرباحك' : 'Total Earnings'}</p>
                  <p className="text-3xl font-black mt-1">
                    {wallet.total_earned ?? 0} <span className="text-lg font-normal">{isAr ? 'ج' : 'EGP'}</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <IconWallet size={24} />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-blue-100 text-xs">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</p>
                  <p className="font-bold text-sm mt-0.5">{wallet.balance ?? 0} {isAr ? 'ج' : 'EGP'}</p>
                </div>
                <Link
                  href={`/${safeLang}/specialist/earnings`}
                  className="ms-auto bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all self-end"
                >
                  {isAr ? 'طلب سحب' : 'Withdraw'}
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}