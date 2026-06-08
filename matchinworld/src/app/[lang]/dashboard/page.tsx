'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconCalendar, IconSearch, IconMessageCircle,
  IconClock, IconUser, IconLogout, IconChevronRight,
  IconChevronLeft, IconWallet, IconSparkles
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function ClientDashboard({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconChevronLeft : IconChevronRight

  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push(`/${safeLang}/auth/login`); return }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

        if (!userData) { window.location.href = `/${safeLang}/onboarding`; return }
        if (userData.role === 'admin') { window.location.href = `/${safeLang}/admin`; return }
        if (userData.role === 'specialist') { window.location.href = `/${safeLang}/specialist/dashboard`; return }

      setUser(userData)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`*, specialists(id, users(name, avatar_url), specializations, price_per_hour)`)
        .eq('client_id', authUser.id)
        .order('scheduled_at', { ascending: true })
        .limit(5)

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
    router.push(`/${safeLang}`)
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const pendingBookings  = bookings.filter(b => b.status === 'pending_payment')

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

        {/* Welcome */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show">
          <h1 className="text-2xl font-black text-gray-900">
            {isAr ? `أهلاً، ${user?.name} 👋` : `Welcome, ${user?.name} 👋`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr ? 'ما الذي تحتاجه اليوم؟' : 'What do you need today?'}
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={fadeUp} custom={1} initial="hidden" animate="show"
        >
          {[
            { icon: IconSparkles, ar: 'ابحث بالـ AI',    en: 'AI Match',       href: `/${safeLang}/match`,       color: 'bg-blue-600 text-white' },
            { icon: IconSearch,   ar: 'تصفح المتخصصين', en: 'Browse',         href: `/${safeLang}/specialists`, color: 'bg-white text-gray-700 border border-gray-200' },
            { icon: IconWallet,   ar: 'محفظتي',          en: 'My Wallet',      href: `/${safeLang}/wallet`,      color: 'bg-white text-gray-700 border border-gray-200' },
            { icon: IconUser,     ar: 'بروفايلي',        en: 'My Profile',     href: `/${safeLang}/profile/edit`,color: 'bg-white text-gray-700 border border-gray-200' },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-medium text-sm transition-all hover:-translate-y-1 hover:shadow-md ${action.color}`}
            >
              <action.icon size={22} />
              {isAr ? action.ar : action.en}
            </Link>
          ))}
        </motion.div>

        {/* Wallet card */}
        {wallet && (
          <motion.div
            variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{isAr ? 'رصيد محفظتك' : 'Wallet Balance'}</p>
                <p className="text-3xl font-black mt-1">{wallet.balance ?? 0} <span className="text-lg font-normal">{isAr ? 'ج' : 'EGP'}</span></p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <IconWallet size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
              <div>
                <p className="text-blue-100 text-xs">{isAr ? 'إجمالي المدفوع' : 'Total Spent'}</p>
                <p className="font-bold text-sm mt-0.5">{wallet.total_spent ?? 0} {isAr ? 'ج' : 'EGP'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending payments */}
        {pendingBookings.length > 0 && (
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="font-semibold text-amber-800 text-sm mb-3">
                {isAr ? '⏳ حجوزات تنتظر الدفع' : '⏳ Bookings Awaiting Payment'}
              </p>
              {pendingBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-white rounded-xl p-3 mt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {b.specialists?.users?.name ?? (isAr ? 'متخصص' : 'Specialist')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(b.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <Link
                    href={`/${safeLang}/pay/${b.id}`}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    {isAr ? 'ادفع الآن' : 'Pay Now'}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming sessions */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">{isAr ? 'جلساتي القادمة' : 'Upcoming Sessions'}</h2>
            <Link href={`/${safeLang}/history`} className="text-sm text-blue-600 font-medium flex items-center gap-1">
              {isAr ? 'كل الجلسات' : 'All Sessions'}
              <Arrow size={16} />
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconCalendar size={26} className="text-blue-400" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">{isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}</p>
              <p className="text-sm text-gray-500 mb-4">{isAr ? 'احجز جلستك الأولى الآن' : 'Book your first session now'}</p>
              <Link
                href={`/${safeLang}/match`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
              >
                <IconSparkles size={16} />
                {isAr ? 'ابحث بالـ AI' : 'AI Match'}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-100 transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <IconUser size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {b.specialists?.users?.name ?? (isAr ? 'متخصص' : 'Specialist')}
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

      </div>
    </main>
  )
}