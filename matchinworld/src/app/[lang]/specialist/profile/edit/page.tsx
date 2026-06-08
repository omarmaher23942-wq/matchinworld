'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconArrowLeft, IconArrowRight, IconCamera,
  IconCheck, IconLoader2, IconCurrencyDollar,
  IconBrain, IconTarget, IconBarbell, IconSalad,
  IconStethoscope, IconYoga, IconTrendingUp, IconSparkles, IconClock
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

const SPECIALIZATIONS = [
  { id: 'mental_health',  icon: IconBrain,       ar: 'الصحة النفسية',   en: 'Mental Health' },
  { id: 'coaching',       icon: IconTarget,      ar: 'الكوتشينج',        en: 'Life Coaching' },
  { id: 'fitness',        icon: IconBarbell,     ar: 'اللياقة البدنية',  en: 'Fitness' },
  { id: 'nutrition',      icon: IconSalad,       ar: 'التغذية',          en: 'Nutrition' },
  { id: 'medical',        icon: IconStethoscope, ar: 'استشارات طبية',   en: 'Medical' },
  { id: 'physiotherapy',  icon: IconYoga,        ar: 'العلاج الطبيعي',  en: 'Physiotherapy' },
  { id: 'personal_dev',   icon: IconTrendingUp,  ar: 'التنمية الشخصية', en: 'Personal Dev' },
  { id: 'other',          icon: IconSparkles,    ar: 'أخرى',             en: 'Other' },
]

const DURATIONS = [30, 45, 60, 90]

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white transition-all"
const textareaClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-none leading-relaxed transition-all"

export default function SpecialistProfileEditPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bio, setBio] = useState('')
  const [price, setPrice] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [durations, setDurations] = useState<number[]>([60])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }
      setUserId(user.id)

      const { data: userData } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      if (!userData || userData.role !== 'specialist') {
        window.location.href = `/${safeLang}/dashboard`
        return
      }
      setName(userData.name ?? '')
      setAvatarUrl(userData.avatar_url ?? '')
      setAvatarPreview(userData.avatar_url ?? '')

      const { data: specData } = await supabase
        .from('specialists').select('*').eq('id', user.id).single()
      if (specData) {
        setBio(specData.bio ?? '')
        setPrice(specData.price_per_hour?.toString() ?? '')
        setSpecializations(specData.specializations ?? [])
        setDurations(specData.session_durations ?? [60])
      }

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

  function toggleSpec(id: string) {
    setSpecializations(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function toggleDuration(d: number) {
    setDurations(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function handleSave() {
    if (!name.trim() || !bio.trim() || !price || specializations.length === 0) return
    setSaving(true)

    let finalAvatarUrl = avatarUrl
    if (avatarFile) {
      finalAvatarUrl = await uploadToCloudinary(avatarFile, 'avatars')
    }

    await supabase.from('users').update({
      name: name.trim(),
      avatar_url: finalAvatarUrl,
    }).eq('id', userId)

    await supabase.from('specialists').update({
      bio: bio.trim(),
      price_per_hour: parseInt(price) || 0,
      specializations,
      session_durations: durations,
    }).eq('id', userId)

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
          <p className="text-gray-500 text-sm mt-1">{isAr ? 'معلوماتك ستظهر للعملاء في بروفايلك' : 'Your info will appear on your profile'}</p>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">{isAr ? 'الصورة الشخصية' : 'Profile Photo'}</h3>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-blue-600">{name?.charAt(0) ?? '?'}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -end-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md">
                <IconCamera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{isAr ? 'صورة احترافية تزيد الثقة' : 'A professional photo builds trust'}</p>
              <p className="text-xs text-gray-400 mt-1">{isAr ? 'JPG أو PNG — حد أقصى 5MB' : 'JPG or PNG — max 5MB'}</p>
            </div>
          </div>
        </motion.div>

        {/* Basic info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">{isAr ? 'المعلومات الأساسية' : 'Basic Info'}</h3>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass}
              placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{isAr ? 'نبذة عنك' : 'Bio'}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className={textareaClass}
              placeholder={isAr
                ? 'مثال: معالج نفسي معتمد بخبرة 8 سنوات، متخصص في علاج القلق والاكتئاب...'
                : 'Example: Certified therapist with 8 years experience, specializing in anxiety...'
              }
            />
            <p className="text-xs text-gray-400 text-end mt-1">{bio.length} {isAr ? 'حرف' : 'chars'}</p>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">{isAr ? 'السعر ومدة الجلسة' : 'Pricing & Duration'}</h3>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {isAr ? 'سعر الجلسة (بالجنيه المصري)' : 'Session Price (EGP)'}
            </label>
            <div className="relative">
              <IconCurrencyDollar size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
              <input type="number" min={50} value={price} onChange={e => setPrice(e.target.value)}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder={isAr ? 'مثال: 300' : 'e.g. 300'} />
            </div>
            {price && !isNaN(parseInt(price)) && (
              <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-1">
                <p className="text-xs text-gray-500">
                  {isAr ? 'العميل سيدفع:' : 'Client pays:'}
                  <span className="text-green-600 font-semibold ms-1">{Math.round(parseInt(price) * 1.15)} {isAr ? 'ج' : 'EGP'}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {isAr ? 'ستستلم:' : 'You receive:'}
                  <span className="text-blue-600 font-semibold ms-1">{Math.round(parseInt(price) * 0.85)} {isAr ? 'ج' : 'EGP'}</span>
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{isAr ? 'مدد الجلسات المتاحة' : 'Available Durations'}</label>
            <div className="flex gap-3 flex-wrap">
              {DURATIONS.map(d => (
                <button key={d} type="button" onClick={() => toggleDuration(d)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    durations.includes(d) ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-600 hover:border-blue-200'
                  }`}>
                  <IconClock size={15} />
                  {d} {isAr ? 'دقيقة' : 'min'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Specializations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">{isAr ? 'التخصصات' : 'Specializations'}</h3>
          <div className="grid grid-cols-2 gap-3">
            {SPECIALIZATIONS.map(s => (
              <button key={s.id} type="button" onClick={() => toggleSpec(s.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start w-full ${
                  specializations.includes(s.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 bg-white'
                }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  specializations.includes(s.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <s.icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1">{isAr ? s.ar : s.en}</span>
                {specializations.includes(s.id) && <IconCheck size={16} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Save button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={handleSave}
          disabled={saving || !name.trim() || !bio.trim() || !price || specializations.length === 0 || durations.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
        >
          {saving ? (
            <><IconLoader2 size={18} className="animate-spin" /> {isAr ? 'جاري الحفظ...' : 'Saving...'}</>
          ) : saved ? (
            <><IconCheck size={18} /> {isAr ? 'تم الحفظ!' : 'Saved!'}</>
          ) : (
            isAr ? 'حفظ التغييرات' : 'Save Changes'
          )}
        </motion.button>
      </div>
    </main>
  )
}