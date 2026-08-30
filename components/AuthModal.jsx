'use client'
import { useState } from 'react'
import { useUser } from './UserContext'
export default function AuthModal({ isOpen, onClose, type }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { loginUser } = useUser()

  if (!isOpen) return null

   const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const endpoint = type === 'login' ? '/api/login' : '/api/signup'
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'خطایی رخ داد')
          } else {
        setMessage(data.message)
        // اگر عملیات لاگین بود، کاربر رو در حافظه ذخیره کن و مودال رو ببند
        if (type === 'login' && data.user) {
          loginUser(data.user, data.walletToken)
          setTimeout(() => {
            onClose()
            setMessage('')
          }, 500)
        }
        // اگر ثبت نام بود
        if (type === 'signup') {
          setTimeout(() => {
            onClose()
            setMessage('')
            setUsername('')
            setPassword('')
          }, 2000)
        }
      }
    } catch (error) {
      setMessage('خطا در ارتباط با سرور. آیا سرور روشن است؟')
      console.error("Fetch Error:", error)
    } finally {
      // این بخش مطمئن میشه که دکمه تحت هر شرایطی از حالت لود در بیاد
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* پس زمینه تار شده */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* باکس مودال شیشه‌ای */}
      <div className="relative glass rounded-2xl w-full max-w-md p-8 modal-enter">
        <button onClick={onClose} className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors text-2xl leading-none font-light">&times;</button>

        <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent">
          {type === 'login' ? 'ورود به حساب کاربری' : 'ثبت نام حساب جدید'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">نام کاربری</label>
            <input
              type="text"
              className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              placeholder="مثلاً: ali123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">رمز عبور</label>
            <input
              type="password"
              className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              placeholder="حداقل ۶ کاراکتر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-400 hover:to-primary-400 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-primary-500/30 disabled:opacity-50"
          >
            {loading ? 'لطفاً صبر کنید...' : (type === 'login' ? 'ورود' : 'ثبت نام')}
          </button>
        </form>

        {message && (
          <p className={`mt-5 text-center text-sm p-3 rounded-lg ${message.includes('خطا') || message.includes('اشتباه') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}