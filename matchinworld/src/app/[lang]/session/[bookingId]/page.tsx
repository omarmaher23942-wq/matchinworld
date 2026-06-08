'use client'

declare global {
  interface Window { localStream: MediaStream }
}

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconMicrophone, IconMicrophoneOff, IconVideo, IconVideoOff,
  IconPhone, IconScreenShare, IconScreenShareOff,
  IconArrowLeft, IconArrowRight, IconMaximize, IconMinimize
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

const API_WS = process.env.NEXT_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') ?? 'ws://localhost:8000'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

export default function SessionPage({ params }: { params: Promise<{ lang: Locale; bookingId: string }> }) {
  const { lang, bookingId } = use(params)
  const safeLang = lang === 'ar' || lang === 'en' ? lang : 'ar'
  const isAr = safeLang === 'ar'
  const router = useRouter()
  const supabase = createClient()
  const Arrow = isAr ? IconArrowLeft : IconArrowRight

  const [booking, setBooking] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inSession, setInSession] = useState(false)
  const [joining, setJoining] = useState(false)
  const [mode, setMode] = useState<'video' | 'audio'>('video')
  const [videoOn, setVideoOn] = useState(true)
  const [audioOn, setAudioOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [remoteConnected, setRemoteConnected] = useState(false)

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const wsRef          = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const timerRef       = useRef<NodeJS.Timeout | null>(null)
  const containerRef   = useRef<HTMLDivElement>(null)

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

    return () => {
      cleanup()
    }
  }, [bookingId])

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (pcRef.current) pcRef.current.close()
    if (wsRef.current) wsRef.current.close()
  }

  async function joinSession() {
    setJoining(true)
    try {
      // جيب الـ media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === 'video',
        audio: true,
      })
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // إنشئ WebSocket connection
      const userId = currentUser?.id ?? 'user'
      const ws = new WebSocket(`${API_WS}/signal/ws/${bookingId}/${userId}`)
      wsRef.current = ws

      // إنشئ RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      // إضافة الـ tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // لما تيجي remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setRemoteConnected(true)
        }
      }

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate
          }))
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setRemoteConnected(true)
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setRemoteConnected(false)
        }
      }

      // WebSocket messages
      ws.onopen = async () => {
        // الأول يدخل يبعت offer
        setTimeout(async () => {
          if (pc.signalingState === 'stable') {
            try {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }))
            } catch {}
          }
        }, 1000)
      }

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          ws.send(JSON.stringify({ type: 'answer', sdp: answer }))

        } else if (msg.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          }

        } else if (msg.type === 'ice-candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          } catch {}

        } else if (msg.type === 'user-joined') {
          // الشخص التاني دخل — ابعت offer
          if (pc.signalingState === 'stable') {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            ws.send(JSON.stringify({ type: 'offer', sdp: offer }))
          }

        } else if (msg.type === 'user-left') {
          setRemoteConnected(false)
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
        }
      }

      setInSession(true)
      setJoining(false)

      // Start timer
      timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000)

    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل الانضمام — تأكد من السماح للكاميرا والميكروفون' : 'Failed to join — check camera/mic permissions')
      setJoining(false)
    }
  }

  function toggleVideo() {
    if (!localStreamRef.current) return
    const track = localStreamRef.current.getVideoTracks()[0]
    if (track) {
      track.enabled = !videoOn
      setVideoOn(!videoOn)
    }
  }

  function toggleAudio() {
    if (!localStreamRef.current) return
    const track = localStreamRef.current.getAudioTracks()[0]
    if (track) {
      track.enabled = !audioOn
      setAudioOn(!audioOn)
    }
  }

  async function toggleScreenShare() {
    if (!pcRef.current || !localStreamRef.current) return
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(screenTrack)
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
        screenTrack.onended = () => stopScreenShare()
        setScreenSharing(true)
      } catch {}
    } else {
      stopScreenShare()
    }
  }

  async function stopScreenShare() {
    if (!pcRef.current || !localStreamRef.current) return
    const camTrack = localStreamRef.current.getVideoTracks()[0]
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
    if (sender && camTrack) await sender.replaceTrack(camTrack)
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
    setScreenSharing(false)
  }

  function toggleFullscreen() {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setFullscreen(!fullscreen)
  }

  async function leaveSession() {
    cleanup()
    // تحديث حالة الجلسة
    await supabase.from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)
      .eq('status', 'confirmed')
    window.location.href = `/${safeLang}/session/${bookingId}/end`
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const otherPerson = booking
    ? (currentUser?.role === 'client' ? booking.specialists?.users : booking.clients?.users)
    : null

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  // Pre-join
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
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${mode === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            <IconVideo size={18} />
            {isAr ? 'فيديو' : 'Video'}
          </button>
          <button
            onClick={() => setMode('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${mode === 'audio' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            <IconMicrophone size={18} />
            {isAr ? 'صوت فقط' : 'Audio Only'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-center">
            <button
              onClick={() => setVideoOn(!videoOn)}
              disabled={mode === 'audio'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 ${videoOn && mode === 'video' ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-400'}`}
            >
              {videoOn && mode === 'video' ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
            </button>
            <p className="text-xs text-gray-400 mt-1">{isAr ? 'كاميرا' : 'Camera'}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => setAudioOn(!audioOn)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${audioOn ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-400'}`}
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
          {joining ? (isAr ? 'جاري الانضمام...' : 'Joining...') : (isAr ? 'انضم للجلسة' : 'Join Session')}
        </button>

        <button onClick={() => router.back()} className="w-full mt-3 text-gray-400 hover:text-gray-200 text-sm py-2">
          {isAr ? 'رجوع' : 'Go back'}
        </button>
      </motion.div>
    </main>
  )

  // In-session
  return (
    <main ref={containerRef} className="h-screen bg-gray-900 flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-xs font-black">
            {otherPerson?.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{otherPerson?.name}</p>
            <p className={`text-xs font-medium ${remoteConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              {remoteConnected
                ? formatDuration(callDuration)
                : (isAr ? 'في انتظار الانضمام...' : 'Waiting to join...')
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-800/60 px-2 py-1 rounded-lg">
            {mode === 'video' ? (isAr ? 'فيديو' : 'Video') : (isAr ? 'صوت' : 'Audio')}
          </span>
          <button onClick={toggleFullscreen} className="w-8 h-8 bg-gray-700/60 text-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-600 transition-all">
            {fullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">

        {/* Remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ background: '#111827' }}
        />

        {/* Remote audio-only overlay */}
        {!remoteConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-4"
              >
                {otherPerson?.name?.charAt(0) ?? '?'}
              </motion.div>
              <p className="text-white font-semibold">{otherPerson?.name}</p>
              <p className="text-yellow-400 text-sm mt-1">
                {isAr ? 'في انتظار الانضمام...' : 'Waiting for other person...'}
              </p>
            </div>
          </div>
        )}

        {/* Local video (PIP) */}
        <div className="absolute bottom-4 end-4 w-36 h-24 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-xl bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {(!videoOn || mode === 'audio') && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-black">
                {currentUser?.name?.charAt(0) ?? '?'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/60 backdrop-blur-sm px-6 py-4 shrink-0">
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">

          {/* Mic */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${audioOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {audioOn ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            disabled={mode === 'audio'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 ${videoOn && mode === 'video' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {videoOn && mode === 'video' ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
          </button>

          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${screenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          >
            {screenSharing ? <IconScreenShareOff size={20} /> : <IconScreenShare size={20} />}
          </button>

          {/* Switch mode */}
          <button
            onClick={async () => {
              const newMode = mode === 'video' ? 'audio' : 'video'
              setMode(newMode)
              if (localStreamRef.current) {
                const track = localStreamRef.current.getVideoTracks()[0]
                if (track) track.enabled = newMode === 'video'
              }
              setVideoOn(newMode === 'video')
            }}
            className="w-12 h-12 rounded-2xl bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {mode === 'video' ? <IconMicrophone size={20} /> : <IconVideo size={20} />}
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
          {isAr ? 'اتصال مباشر آمن' : 'Secure peer-to-peer connection'}
        </p>
      </div>
    </main>
  )
}