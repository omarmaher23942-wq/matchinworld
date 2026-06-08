'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

declare global {
  interface Window { JitsiMeetExternalAPI: any }
}

export default function SessionPage({
  params
}: {
  params: Promise<{ lang: Locale; bookingId: string }>
}) {
  const { lang, bookingId } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()

  const [booking, setBooking] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      setCurrentUser(userData)

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, specialists(users(name)), clients(users(name))')
        .eq('id', bookingId)
        .single()

      if (!bookingData) { router.push(`/${safeLang}/dashboard`); return }
      setBooking(bookingData)
      setLoading(false)
    }
    load()
  }, [bookingId])

  useEffect(() => {
    if (!booking || !currentUser) return

    // Load Jitsi script
    const script = document.createElement('script')
    script.src = 'https://meet.matchinworld.com/external_api.js'
    script.async = true
    script.onload = () => initJitsi()
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [booking, currentUser])

  function initJitsi() {
    if (!window.JitsiMeetExternalAPI) return

    const roomName = `matchinworld-${bookingId}`
    const otherPerson = currentUser?.role === 'client'
      ? booking?.specialists?.users
      : booking?.clients?.users

    const api = new window.JitsiMeetExternalAPI('meet.matchinworld.com', {
      roomName,
      parentNode: document.getElementById('jitsi-container'),
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: currentUser?.name ?? 'User',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: true,
        defaultLanguage: isAr ? 'ar' : 'en',
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'settings',
          'videoquality', 'filmstrip', 'shortcuts', 'tileview',
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        DEFAULT_BACKGROUND: '#111827',
        TOOLBAR_ALWAYS_VISIBLE: false,
      },
    })

    api.addEventListener('readyToClose', async () => {
      await supabase.from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)
        .eq('status', 'confirmed')
      window.location.href = `/${safeLang}/session/${bookingId}/end`
    })
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="h-screen bg-gray-900 flex flex-col">
      <div id="jitsi-container" className="flex-1 w-full" />
    </main>
  )
}