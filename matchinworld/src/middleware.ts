import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ARABIC_COUNTRIES = [
  'EG','SA','AE','KW','QA','BH','OM',
  'JO','LB','SY','IQ','YE','LY','TN',
  'DZ','MA','SD','MR','PS','SO','DJ'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/ar') ||
    pathname.startsWith('/en')
  ) {
    return NextResponse.next()
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim()

  let locale = 'ar'

  if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'unknown') {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/country/`, {
        signal: AbortSignal.timeout(1500)
      })
      const country = (await res.text()).trim()
      locale = ARABIC_COUNTRIES.includes(country) ? 'ar' : 'en'
    } catch {
      locale = 'ar'
    }
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}