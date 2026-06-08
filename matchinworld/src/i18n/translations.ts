export const translations = {
    ar: {
      nav: {
        home: 'الرئيسية',
        specialists: 'المتخصصون',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
      },
      hero: {
        title: 'ابحث عن متخصصك المناسب',
        subtitle: 'استشارات نفسية، كوتشينج، لياقة، وأكثر — بالـ AI',
        cta: 'ابدأ الآن',
      },
      auth: {
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        name: 'الاسم الكامل',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
        already: 'عندك حساب؟',
        noAccount: 'مش عندك حساب؟',
      },
      common: {
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        save: 'حفظ',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        book: 'احجز الآن',
        perHour: 'في الساعة',
      }
    },
    en: {
      nav: {
        home: 'Home',
        specialists: 'Specialists',
        login: 'Login',
        signup: 'Sign Up',
      },
      hero: {
        title: 'Find Your Perfect Specialist',
        subtitle: 'Mental health, coaching, fitness, and more — powered by AI',
        cta: 'Get Started',
      },
      auth: {
        email: 'Email',
        password: 'Password',
        name: 'Full Name',
        login: 'Login',
        signup: 'Sign Up',
        already: 'Already have an account?',
        noAccount: "Don't have an account?",
      },
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        book: 'Book Now',
        perHour: 'per hour',
      }
    }
  }
  
  export type Locale = 'ar' | 'en'
  export type Translations = typeof translations.ar