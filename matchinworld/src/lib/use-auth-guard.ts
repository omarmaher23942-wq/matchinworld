'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthState } from '@/lib/auth-guard'

export function useAuthGuard(lang: string, expectedState: 'client' | 'specialist' | 'admin') {
  const router = useRouter()

  useEffect(() => {
    getAuthState().then(({ state }) => {
      if (state === 'unauthenticated') {
        router.replace(`/${lang}/auth/login`)
      } else if (state === 'no_onboarding') {
        router.replace(`/${lang}/onboarding`)
      } else if (state === 'specialist_pending') {
        router.replace(`/${lang}/waiting`)
      } else if (expectedState === 'client' && state !== 'client_ready') {
        router.replace(`/${lang}/dashboard`)
      } else if (expectedState === 'specialist' && state !== 'specialist_approved') {
        router.replace(`/${lang}/specialist/dashboard`)
      }
    })
  }, [lang, expectedState, router])
}