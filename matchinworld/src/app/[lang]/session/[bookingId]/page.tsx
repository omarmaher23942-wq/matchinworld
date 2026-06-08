'use client'

import { use, useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  IconVideo, IconVideoOff, IconMicrophone, IconMicrophoneOff,
  IconPhone, IconMessageCircle, IconArrowLeft, IconArrowRight,
  IconScreenShare, IconScreenShareOff, IconMaximize, IconMinimize
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

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
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [booking, setBooking] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [inSession, setInSession] = useState(false)

  // Controls
  const [videoOn, setVideoOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [mode, setMode] = useState<'video' | 'audio'>('video')
  const [callDuration, setCallDuration] = useState(0)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')

  // Daily.co
  const callFrameRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
      if (bookingData.status !== 'confirmed') {
        alert(isAr ? 'الجلسة غير مؤكدة بعد' : 'Session not confirmed yet')
        router.back()
        return
      }

      // لو مفيش Daily room — إنشئه
      if (!bookingData.daily_room_url) {
        const res = await fetch('/api/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        })
        const { url } = await res.json()
        await supabase.from('bookings').update({ daily_room_url: url }).eq('id', bookingId)
        bookingData.daily_room_url = url
      }

      setBooking(bookingData)
      setLoading(false)
    }
    load()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (callFrameRef.current) callFrameRef.current.destroy()
    }
  }, [bookingId])

  async function joinSession() {
    if (!booking?.daily_room_url) return
    setJoining(true)

    try {
      // Load Daily.co script
      if (!window.DailyIframe) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/@daily-co/daily-js'
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const frame = window.DailyIframe.createFrame(containerRef.current!, {
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '16px',
        },
      })

      callFrameRef.current = frame

      frame.on('left-meeting', () => {
        setInSession(false)
        if (timerRef.current) clearInterval(timerRef.current)
        window.location.href = `/${safeLang}/dashboard`
      })

      await frame.join({
        url: booking.daily_room_url,
        userName: currentUser?.name ?? 'User',
        videoSource: mode === 'video',
        audioSource: true,
        startVideoOff: mode === 'audio',
        startAudioOff: false,
      })

      setInSession(true)
      setJoining(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل الانضمام، تأكد من السماح للكاميرا والميكروفون' : 'Failed to join, check camera/mic permissions')
      setJoining(false)
    }
  }

  async function toggleVideo() {
    if (!callFrameRef.current) return
    if (videoOn) {
      await callFrameRef.current.setLocalVideo(false)
    } else {
      await callFrameRef.current.setLocalVideo(true)
    }
    setVideoOn(!videoOn)
  }

  async function toggleAudio() {
    if (!callFrameRef.current) return
    if (audioOn) {
      await callFrameRef.current.setLocalAudio(false)
    } else {
      await callFrameRef.current.setLocalAudio(true)
    }
    setAudioOn(!audioOn)
  }

  async function toggleScreenShare() {
    if (!callFrameRef.current) return
    if (screenSharing) {
      await callFrameRef.current.stopScreenShare()
    } else {
      await callFrameRef.current.startScreenShare()
    }
    setScreenSharing(!screenSharing)
  }

  async function leaveSession() {
    if (callFrameRef.current) {
      await callFrameRef.current.leave()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    window.location.href = `/${safeLang}/dashboard`
  }

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  async function sendChatMsg() {
    if (!newMsg.trim() || !currentUser) return
    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUser.id,
      content: newMsg.trim(),
    })
    setMessages(prev => [...prev, {
      content: newMsg.trim(),
      sender_id: currentUser.id,
      users: { name: currentUser.name },
      created_at: new Date().toISOString(),
    }])
    setNewMsg('')
  }

  const otherPerson = booking
    ? (currentUser?.role === 'client'
        ? booking.specialists?.users
        : booking.clients?.users)
    : null

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  // Pre-join screen
  if (!inSession) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center border border-gray-700"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-500 rounded-3xl flex items-center justify-center text-3xl font-black text-white mx-auto mb-6">
          {otherPerson?.name?.charAt(0) ?? '?'}
        </div>

        <h2 className="text-xl font-black text-white mb-2">
          {isAr ? `جلسة مع ${otherPerson?.name}` : `Session with ${otherPerson?.name}`}
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          {new Date(booking?.scheduled_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
          {' — '}
          {booking?.duration_minutes} {isAr ? 'دقيقة' : 'min'}
        </p>

        {/* Mode selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
              mode === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <IconVideo size={18} />
            {isAr ? 'فيديو' : 'Video'}
          </button>
          <button
            onClick={() => setMode('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
              mode === 'audio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <IconMicrophone size={18} />
            {isAr ? 'صوت فقط' : 'Audio Only'}
          </button>
        </div>

        {/* Pre-join controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-center">
            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                videoOn && mode === 'video' ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {videoOn && mode === 'video' ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
            </button>
            <p className="text-xs text-gray-400 mt-1">{isAr ? 'كاميرا' : 'Camera'}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => setAudioOn(!audioOn)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                audioOn ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {audioOn ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
            </button>
            <p className="text-xs text-gray-400 mt-1">{isAr ? 'ميكروفون' : 'Mic'}</p>
          </div>
        </div>

        <button
          onClick={joinSession}
          disabled={joining}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all"
        >
          {joining
            ? (isAr ? 'جاري الانضمام...' : 'Joining...')
            : (isAr ? 'انضم للجلسة' : 'Join Session')
          }
        </button>

        <button
          onClick={() => router.back()}
          className="w-full mt-3 text-gray-400 hover:text-gray-200 text-sm py-2 transition-all"
        >
          {isAr ? 'رجوع' : 'Go back'}
        </button>
      </motion.div>
    </main>
  )

  // In-session screen
  return (
    <main className="h-screen bg-gray-900 flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-xs font-black">
            {otherPerson?.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{otherPerson?.name}</p>
            <p className="text-green-400 text-xs">{formatDuration(callDuration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-lg">
            {mode === 'video' ? (isAr ? 'فيديو' : 'Video') : (isAr ? 'صوت' : 'Audio')}
          </span>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ background: '#111827' }}
        />

        {/* Audio only overlay */}
        {mode === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-4"
              >
                {otherPerson?.name?.charAt(0) ?? '?'}
              </motion.div>
              <p className="text-white font-semibold">{otherPerson?.name}</p>
              <p className="text-green-400 text-sm mt-1">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}

        {/* Chat panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: isAr ? -320 : 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isAr ? -320 : 320, opacity: 0 }}
              className="absolute top-0 end-0 w-80 h-full bg-gray-800 border-s border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700">
                <p className="text-white font-semibold text-sm">
                  {isAr ? 'المحادثة' : 'Chat'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-48 px-3 py-2 rounded-xl text-sm ${
                      msg.sender_id === currentUser?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-700 flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMsg()}
                  className="flex-1 bg-gray-700 text-white placeholder:text-gray-400 text-sm px-3 py-2 rounded-xl outline-none border border-gray-600 focus:border-blue-500"
                  placeholder={isAr ? 'رسالة...' : 'Message...'}
                />
                <button
                  onClick={sendChatMsg}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <IconArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="bg-gray-900/90 backdrop-blur-sm px-6 py-4 shrink-0">
        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">

          {/* Mic */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              audioOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {audioOn ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            disabled={mode === 'audio'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 ${
              videoOn && mode === 'video' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {videoOn && mode === 'video' ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
          </button>

          {/* Switch mode */}
          <button
            onClick={() => {
              const newMode = mode === 'video' ? 'audio' : 'video'
              setMode(newMode)
              if (callFrameRef.current) {
                callFrameRef.current.setLocalVideo(newMode === 'video')
              }
            }}
            className="w-12 h-12 rounded-2xl bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {mode === 'video' ? <IconMicrophone size={20} /> : <IconVideo size={20} />}
          </button>

          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              screenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {screenSharing ? <IconScreenShareOff size={20} /> : <IconScreenShare size={20} />}
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              showChat ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <IconMessageCircle size={20} />
          </button>

          {/* End call */}
          <button
            onClick={leaveSession}
            className="w-14 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
          >
            <IconPhone size={20} className="rotate-[135deg]" />
          </button>

        </div>

        <p className="text-center text-xs text-gray-500 mt-2">
          {mode === 'video'
            ? (isAr ? 'وضع الفيديو' : 'Video Mode')
            : (isAr ? 'وضع الصوت فقط' : 'Audio Only Mode')
          }
          {' • '}
          {isAr ? 'اضغط على زر التبديل لتغيير الوضع' : 'Press switch button to change mode'}
        </p>
      </div>

    </main>
  )
}