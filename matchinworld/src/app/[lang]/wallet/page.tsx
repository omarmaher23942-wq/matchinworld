'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconWallet, IconArrowLeft, IconArrowRight,
  IconArrowUp, IconArrowDown, IconClock
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

export default function WalletPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [wallet, setWallet] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: walletData } = await supabase
        .from('wallets').select('*').eq('user_id', user.id).single()
      setWallet(walletData)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, specialists(users(name)), clients(users(name))')
        .or(`client_id.eq.${user.id},specialist_id.eq.${user.id}`)
        .in('status', ['confirmed', 'completed'])
        .order('scheduled_at', { ascending: false })
        .limit(20)

      setBookings(bookingsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

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
          <h1 className="text-2xl font-black text-gray-900">{isAr ? 'محفظتي' : 'My Wallet'}</h1>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</p>
              <p className="text-4xl font-black mt-1">{wallet?.balance ?? 0} <span className="text-xl font-normal">{isAr ? 'ج' : 'EGP'}</span></p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <IconWallet size={28} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-blue-100 text-xs">{isAr ? 'إجمالي المدفوع' : 'Total Spent'}</p>
              <p className="font-bold mt-0.5">{wallet?.total_spent ?? 0} {isAr ? 'ج' : 'EGP'}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs">{isAr ? 'إجمالي المكتسب' : 'Total Earned'}</p>
              <p className="font-bold mt-0.5">{wallet?.total_earned ?? 0} {isAr ? 'ج' : 'EGP'}</p>
            </div>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-black text-gray-900 mb-4">{isAr ? 'سجل المعاملات' : 'Transaction History'}</h2>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <IconWallet size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{isAr ? 'لا توجد معاملات بعد' : 'No transactions yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    b.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {b.status === 'completed' ? <IconArrowDown size={20} /> : <IconClock size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {b.specialists?.users?.name ?? b.clients?.users?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-black text-gray-900">{b.amount_client} <span className="text-xs font-normal">{isAr ? 'ج' : 'EGP'}</span></p>
                    <p className={`text-xs font-medium mt-0.5 ${b.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                      {b.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'قادم' : 'Upcoming')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}