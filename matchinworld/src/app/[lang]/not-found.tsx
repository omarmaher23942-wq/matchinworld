'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconArrowLeft } from '@tabler/icons-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl font-black text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-8">الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p>
        <Link
          href="/ar"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all"
        >
          <IconArrowLeft size={18} />
          العودة للرئيسية
        </Link>
      </motion.div>
    </main>
  )
}