'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconLock, IconEye, IconEyeOff, IconArrowRight, IconArrowLeft } from '@tabler/icons-react'
import { translations, type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

export default function LoginPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const t = translations[safeLang]
  const isAr = safeLang === 'ar'
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const fakeEmail = `${form.username.toLowerCase().trim()}@matchinworld.local`

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: form.password,
    })

    if (authError) {
      setError(isAr ? 'اسم المستخدم أو كلمة المرور غلط' : 'Invalid username or password')
      setLoading(false)
      return
    }

    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 800))

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role === 'admin') {
        window.location.replace(`/${safeLang}/admin`)
      } else if (userData?.role === 'specialist') {
        window.location.replace(`/${safeLang}/specialist/dashboard`)
      } else if (userData?.role === 'client') {
        window.location.replace(`/${safeLang}/dashboard`)
      } else {
        // role = pending — محتاج يكمل الـ onboarding
        window.location.replace(`/${safeLang}/onboarding`)
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link href={`/${safeLang}`} className="text-2xl font-black text-blue-600">MatchInWorld</Link>
          <p className="text-gray-500 mt-2 text-sm">{isAr ? 'أهلاً بعودتك' : 'Welcome back'}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 text-sm font-medium">@</span>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.replace(/\s/g, '').toLowerCase() })}
                  className="w-full ps-8 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder={isAr ? 'اسم المستخدم' : 'your username'}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <IconLock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full ps-10 pe-10 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2"
            >
              {loading
                ? (isAr ? 'جاري الدخول...' : 'Signing in...')
                : t.auth.login
              }
              {!loading && <Arrow size={18} />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.noAccount}{' '}
            <Link href={`/${safeLang}/auth/signup`} className="text-blue-600 font-semibold hover:underline">
              {t.auth.signup}
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  )
}