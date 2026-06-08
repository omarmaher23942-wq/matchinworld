import { createClient } from '@/lib/supabase'

export type AuthState =
  | 'unauthenticated'
  | 'no_onboarding'
  | 'specialist_pending'
  | 'specialist_approved'
  | 'client_ready'
  | 'admin'

export async function getAuthState(): Promise<{ state: AuthState; role?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { state: 'unauthenticated' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) return { state: 'no_onboarding' }

  const role = userData.role

  if (role === 'admin') return { state: 'admin', role }

  if (role === 'client') {
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!clientData) return { state: 'no_onboarding', role }
    return { state: 'client_ready', role }
  }

  if (role === 'specialist') {
    const { data: specData } = await supabase
      .from('specialists')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    if (!specData) return { state: 'no_onboarding', role }
    if (specData.kyc_status === 'pending') return { state: 'specialist_pending', role }
    if (specData.kyc_status === 'approved') return { state: 'specialist_approved', role }
    return { state: 'no_onboarding', role }
  }

  return { state: 'unauthenticated' }
}