'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // استفاده از همان فرمول ایمیل جعلی برای لاگین
    const fakeEmail = `${username}@example.com`

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    })

    if (error) {
      setMessage('خطا در ورود: یوزرنیم یا رمز عبور اشتباه است.')
    } else {
      setMessage('ورود موفقیت آمیز بود! در حال انتقال...')
      // بعداً اینجا کد ریدایرکت رو می‌ذاریم
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth: '300px', margin: '50px auto'}}>
      <h2>ورود</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="text" 
          placeholder="نام کاربری" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{width: '100%', padding: '8px', margin: '8px 0'}}
        />
        <input 
          type="password" 
          placeholder="رمز عبور" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{width: '100%', padding: '8px', margin: '8px 0'}}
        />
        <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
      {message && <p style={{marginTop: '10px', color: message.includes('خطا') ? 'red' : 'green'}}>{message}</p>}
      <p style={{marginTop: '15px'}}>حساب نداری؟ <Link href="/auth/signup">ثبت نام</Link></p>
    </div>
  )
}