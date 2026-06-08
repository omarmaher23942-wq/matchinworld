'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IconClock, IconShieldCheck, IconMail } from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WaitingPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  async function checkStatus() {
    setChecking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/${safeLang}/auth/login`); return }

    const { data } = await supabase
      .from('specialists')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    if (data?.kyc_status === 'approved') {
      router.push(`/${safeLang}/specialist/dashboard`)
    } else if (data?.kyc_status === 'rejected') {
      router.push(`/${safeLang}/onboarding`)
    }
    setChecking(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-10">

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <IconClock size={36} className="text-amber-600" />
          </motion.div>

          <h1 className="text-2xl font-black text-gray-900 mb-3">
            {isAr ? 'طلبك قيد المراجعة' : 'Your Request is Under Review'}
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {isAr
              ? 'فريقنا يراجع بيانات توثيق هويتك. ارجع لهذه الصفحة خلال 24 ساعة للتحقق من حالة طلبك.'
              : 'Our team is reviewing your identity documents. Check back within 24 hours to see your approval status.'
            }
          </p>

          <div className="space-y-3 mb-8">
            {[
              { icon: IconShieldCheck, ar: 'تم استلام طلبك بنجاح',        en: 'Your request was received' },
              { icon: IconClock,       ar: 'جاري مراجعة المستندات',        en: 'Documents are being reviewed' },
              { icon: IconMail, ar: 'راجع الصفحة للتحقق من الحالة', en: 'Check this page for status updates' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 text-start">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon size={16} />
                </div>
                <span className="text-sm text-gray-600 font-medium">{isAr ? item.ar : item.en}</span>
              </div>
            ))}
          </div>

          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {checking
              ? (isAr ? 'جاري التحقق...' : 'Checking...')
              : (isAr ? 'تحقق من الحالة' : 'Check Status')
            }
          </button>
        </div>
      </motion.div>
    </main>
  )
}