'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconUser, IconArrowLeft, IconArrowRight,
  IconCheck, IconCamera, IconLoader2
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

export default function ProfileEditPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', avatar_url: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users').select('*').eq('id', authUser.id).single()

      if (!userData) { window.location.href = `/${safeLang}/onboarding`; return }

      setUser(userData)
      setForm({ name: userData.name ?? '', avatar_url: userData.avatar_url ?? '' })
      setAvatarPreview(userData.avatar_url ?? '')
      setLoading(false)
    }
    load()
  }, [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    let avatarUrl = form.avatar_url

    if (avatarFile) {
      avatarUrl = await uploadToCloudinary(avatarFile, 'avatars')
    }

    await supabase.from('users').update({
      name: form.name,
      avatar_url: avatarUrl,
    }).eq('id', user.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
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
          <h1 className="text-2xl font-black text-gray-900">{isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-blue-600">{form.name?.charAt(0) ?? '?'}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -end-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md">
                <IconCamera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <p className="text-xs text-gray-400">{isAr ? 'اضغط على الأيقونة لتغيير الصورة' : 'Click icon to change photo'}</p>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
            <div className="relative">
              <IconUser size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-200"
          >
            {saving ? (
              <><IconLoader2 size={18} className="animate-spin" /> {isAr ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : saved ? (
              <><IconCheck size={18} /> {isAr ? 'تم الحفظ' : 'Saved!'}</>
            ) : (
              isAr ? 'حفظ التغييرات' : 'Save Changes'
            )}
          </button>
        </motion.div>
      </div>
    </main>
  )
}