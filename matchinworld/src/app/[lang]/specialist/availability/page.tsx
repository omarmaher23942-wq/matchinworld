'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconArrowLeft, IconArrowRight, IconPlus,
  IconTrash, IconCheck, IconLoader2
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const DAYS = [
  { value: 0, ar: 'الأحد',    en: 'Sunday' },
  { value: 1, ar: 'الاثنين',  en: 'Monday' },
  { value: 2, ar: 'الثلاثاء', en: 'Tuesday' },
  { value: 3, ar: 'الأربعاء', en: 'Wednesday' },
  { value: 4, ar: 'الخميس',   en: 'Thursday' },
  { value: 5, ar: 'الجمعة',   en: 'Friday' },
  { value: 6, ar: 'السبت',    en: 'Saturday' },
]

export default function AvailabilityPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [userId, setUserId] = useState<string>('')
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }
      setUserId(user.id)

      const { data } = await supabase
        .from('availability')
        .select('*')
        .eq('specialist_id', user.id)
        .order('day_of_week')

      setSlots(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function addSlot() {
    setSlots(prev => [...prev, {
      id: `new-${Date.now()}`,
      specialist_id: userId,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      isNew: true,
    }])
  }

  function updateSlot(id: string, field: string, value: any) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  async function deleteSlot(id: string, isNew: boolean) {
    if (!isNew) {
      await supabase.from('availability').delete().eq('id', id)
    }
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  async function saveAll() {
    setSaving(true)
    for (const slot of slots) {
      if (slot.isNew) {
        await supabase.from('availability').insert({
          specialist_id: userId,
          day_of_week:   slot.day_of_week,
          start_time:    slot.start_time,
          end_time:      slot.end_time,
        })
      } else {
        await supabase.from('availability').update({
          day_of_week: slot.day_of_week,
          start_time:  slot.start_time,
          end_time:    slot.end_time,
        }).eq('id', slot.id)
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // reload
    const { data } = await supabase
      .from('availability').select('*').eq('specialist_id', userId).order('day_of_week')
    setSlots(data ?? [])
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{isAr ? 'مواعيد الإتاحة' : 'Availability'}</h1>
            <p className="text-gray-500 text-sm mt-1">{isAr ? 'حدد الأيام والأوقات المتاحة للحجز' : 'Set your available days and times'}</p>
          </div>
          <button
            onClick={addSlot}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <IconPlus size={16} />
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </motion.div>

        {slots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-4">{isAr ? 'لا توجد مواعيد بعد' : 'No slots yet'}</p>
            <button onClick={addSlot} className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all">
              <IconPlus size={16} />
              {isAr ? 'إضافة موعد' : 'Add Slot'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-4"
              >
                <div className="grid grid-cols-3 gap-3 items-center">
                  <select
                    value={slot.day_of_week}
                    onChange={e => updateSlot(slot.id, 'day_of_week', parseInt(e.target.value))}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-blue-400"
                  >
                    {DAYS.map(d => (
                      <option key={d.value} value={d.value}>{isAr ? d.ar : d.en}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start_time?.slice(0, 5)}
                      onChange={e => updateSlot(slot.id, 'start_time', e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-blue-400"
                    />
                    <span className="text-gray-400 text-xs">→</span>
                    <input
                      type="time"
                      value={slot.end_time?.slice(0, 5)}
                      onChange={e => updateSlot(slot.id, 'end_time', e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => deleteSlot(slot.id, slot.isNew)}
                      className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-all"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {slots.length > 0 && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-200"
          >
            {saving ? (
              <><IconLoader2 size={18} className="animate-spin" /> {isAr ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : saved ? (
              <><IconCheck size={18} /> {isAr ? 'تم الحفظ' : 'Saved!'}</>
            ) : (
              isAr ? 'حفظ المواعيد' : 'Save Availability'
            )}
          </button>
        )}
      </div>
    </main>
  )
}