'use client'

import { use, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconSend, IconArrowLeft, IconArrowRight,
  IconVideo, IconPhone, IconUser
} from '@tabler/icons-react'
import { type Locale } from '@/i18n/translations'
import { createClient } from '@/lib/supabase'

export default function ChatPage({
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [booking, setBooking] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = `/${safeLang}/auth/login`; return }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setCurrentUser(userData)

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, specialists(users(name, avatar_url)), clients(users(name, avatar_url))')
        .eq('id', bookingId)
        .single()

      if (!bookingData) { router.push(`/${safeLang}/dashboard`); return }
      setBooking(bookingData)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, users(name)')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })

      setMessages(msgs ?? [])
      setLoading(false)
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload: any) => {
          const { data: msgWithUser } = await supabase
            .from('messages')
            .select('*, users(name)')
            .eq('id', payload.new.id)
            .single()

          if (msgWithUser) {
            setMessages(prev => [...prev, msgWithUser])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!newMessage.trim() || !currentUser) return
    setSending(true)

    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id:  currentUser.id,
      content:    newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const otherPerson = booking
    ? (currentUser?.role === 'client'
        ? booking.specialists?.users
        : booking.clients?.users)
    : null

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </main>
  )

  return (
    <main className="h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 h-16 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
        >
          <Arrow size={18} className="text-gray-600" />
        </button>

        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-violet-100 rounded-xl flex items-center justify-center text-blue-600 font-black shrink-0">
          {otherPerson?.name?.charAt(0) ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{otherPerson?.name}</p>
          <p className="text-xs text-green-500 font-medium">{isAr ? 'متصل' : 'Online'}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${safeLang}/session/${bookingId}`}
            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-all"
          >
            <IconVideo size={18} />
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconUser size={28} className="text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {isAr ? 'ابدأ المحادثة مع المتخصص' : 'Start the conversation'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser?.id
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < 10 ? i * 0.03 : 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <span className="text-xs text-gray-400 px-1">{msg.users?.name}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-ee-sm'
                    : 'bg-white border border-gray-100 text-gray-900 rounded-es-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">
                  {new Date(msg.created_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </motion.div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none text-gray-900 placeholder:text-gray-400 bg-white max-h-32"
            placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
            style={{ height: 'auto' }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all shadow-md shadow-blue-200 shrink-0"
          >
            <IconSend size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {isAr ? 'Enter للإرسال • Shift+Enter لسطر جديد' : 'Enter to send • Shift+Enter for new line'}
        </p>
      </div>

    </main>
  )
}