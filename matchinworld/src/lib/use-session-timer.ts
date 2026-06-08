import { useState, useEffect } from 'react'

export type JoinStatus = 'early' | 'ready' | 'late'

export function useSessionTimer(scheduledAt: string): {
  status: JoinStatus
  minutesUntil: number
} {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const sessionTime = new Date(scheduledAt).getTime()
  const diffMinutes = (sessionTime - now) / 1000 / 60

  let status: JoinStatus
  if (diffMinutes > 10) status = 'early'
  else if (diffMinutes > -90) status = 'ready'
  else status = 'late'

  return {
    status,
    minutesUntil: Math.ceil(diffMinutes),
  }
}