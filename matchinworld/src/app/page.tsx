import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const ARABIC_COUNTRIES = [
  'EG','SA','AE','KW','QA','BH','OM',
  'JO','LB','SY','IQ','YE','LY','TN',
  'DZ','MA','SD','MR','PS','SO','DJ'
]

export default async function RootPage() {
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''
  const locale = ARABIC_COUNTRIES.includes(country) ? 'ar' : 'en'
  redirect(`/${locale}`)
}