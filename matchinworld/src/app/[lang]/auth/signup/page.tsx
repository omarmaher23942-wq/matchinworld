'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconUser, IconLock, IconEye, IconEyeOff, IconArrowRight, IconArrowLeft, IconBriefcase } from '@tabler/icons-react'
import { translations, type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const t = translations[safeLang]
  const isAr = safeLang === 'ar'
  const Arrow = isAr ? IconArrowLeft : IconArrowRight
  const router = useRouter()

  const [form, setForm] = useState({ name: '', username: '', password: '', role: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { value: 'client',     ar: 'أبحث عن متخصص',        en: 'Looking for a Specialist', icon: IconUser },
    { value: 'specialist', ar: 'أنا متخصص / مقدم خدمة', en: 'I am a Specialist',         icon: IconBriefcase },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.role) {
      setError(isAr ? 'اختر نوع حسابك' : 'Please select account type')
      return
    }
    if (form.username.trim().length < 3) {
      setError(isAr ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' : 'Username must be at least 3 characters')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const fakeEmail = `${form.username.toLowerCase().trim()}@matchinworld.local`

    const { data, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: form.password,
      options: { data: { name: form.name, username: form.username, role: form.role } }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError(isAr ? 'اسم المستخدم مأخوذ، جرب اسم آخر' : 'Username already taken, try another')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: fakeEmail,
        name: form.name,
        role: form.role,
      })
      router.push(`/${safeLang}/onboarding`)
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
          <p className="text-gray-500 mt-2 text-sm">{isAr ? 'إنشاء حساب جديد' : 'Create your account'}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">{isAr ? 'أنت...' : 'I am...'}</p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-medium cursor-pointer ${
                    form.role === r.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-100 hover:border-blue-200 text-gray-600'
                  }`}
                >
                  <r.icon size={22} />
                  {isAr ? r.ar : r.en}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <IconUser size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                />
              </div>
            </div>

            {/* Username */}
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
                  placeholder={isAr ? 'مثال: ahmed123' : 'e.g. john123'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <IconLock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
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

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2"
            >
              {loading
                ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                : (isAr ? 'إنشاء الحساب' : 'Create Account')
              }
              {!loading && <Arrow size={18} />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.already}{' '}
            <Link href={`/${safeLang}/auth/login`} className="text-blue-600 font-semibold hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  )
}