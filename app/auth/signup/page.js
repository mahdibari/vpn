'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

   const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const fakeEmail = `${username}@example.com`

    // لاگ گرفتن برای اینکه مطمئن بشیم مقادیر درست به Supabase میرسند
    console.log("URL is:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Key is:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "MISSING!");
    console.log("Sending Email:", fakeEmail);

    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: password,
    })

    console.log("Supabase Response Data:", data);
    console.log("Supabase Response Error:", error);

    if (error) {
      setMessage('خطا: ' + error.message)
    } else {
      setMessage('ثبت نام با موفقیت انجام شد! حالا به صفحه ورود برو.')
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth: '300px', margin: '50px auto'}}>
      <h2>ثبت نام</h2>
      <form onSubmit={handleSignup}>
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
          minLength={6}
          style={{width: '100%', padding: '8px', margin: '8px 0'}}
        />
        <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
          {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
        </button>
      </form>
      {message && <p style={{marginTop: '10px', color: message.includes('خطا') ? 'red' : 'green'}}>{message}</p>}
      <p style={{marginTop: '15px'}}>قبلا ثبت نام کردی؟ <Link href="/auth/login">ورود</Link></p>
    </div>
  )
}