import '@fontsource/vazirmatn/300.css';
import '@fontsource/vazirmatn/400.css';
import type { ReactNode } from 'react'
import '@fontsource/vazirmatn/700.css';
import './globals.css'
import { UserProvider } from '@/components/UserContext'

export const metadata = {
  title: 'پروژه شیشه‌ای من',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-[Vazirmatn]">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}