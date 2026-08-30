'use client'
import { useState, useEffect } from 'react'
import { useUser } from './UserContext'
import { supabase } from '@/lib/supabase'
import WalletModal from './WalletModal'

const fa = n => Number(n || 0).toLocaleString("fa-IR")

export default function ProfileModal({ isOpen, onClose }) {
  const { user, walletToken, logoutUser } = useUser()
  const [walletBalance, setWalletBalance] = useState(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [wpToken, setWpToken] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!isOpen || !user) return

    setWpToken(walletToken)

    if (walletToken) {
      loadBalance(walletToken)
    }

    loadPurchases()
  }, [isOpen, user, walletToken])

  async function loadBalance(token) {
    const { data } = await supabase.rpc("me", {
      p_token: token
    })

    if (data?.ok) {
      setWalletBalance(Number(data.balance || 0))
    } else {
      setWalletBalance(null)
    }
  }
  
  async function loadPurchases() {
    try {
      setLoadingPurchases(true)

      const { data, error } = await supabase
        .from('config_purchases')
        .select(`
          id,
          status,
          admin_config_link,
          purchased_at,
          delivered_at,
          products ( name, volume )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })

      if (error) throw error

      setPurchases(data || [])
    } catch (err) {
      console.error('Error loading purchases:', err)
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handleCopy = async (link, id) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  const handleLogout = () => {
    logoutUser()
    onClose()
  }

  const handleChangePassword = async () => {
    setPasswordMsg('')
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('❌ تمام فیلدها را پر کنید')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMsg('❌ رمز جدید و تکرار آن مطابقت ندارند')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordMsg('❌ رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }

    setPasswordMsg('⏳ در حال تغییر رمز...')
    
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          old_password: currentPassword, 
          new_password: newPassword 
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setPasswordMsg('❌ ' + (data.error || 'خطا در تغییر رمز'))
        return
      }
      
      setPasswordMsg('✅ رمز عبور با موفقیت تغییر کرد')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordMsg('')
      }, 2000)
    } catch (err) {
      setPasswordMsg('❌ خطا در تغییر رمز')
    }
  }

  if (!isOpen || !user) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#12101c] text-white p-6 shadow-2xl modal-enter">
          <button onClick={onClose} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl leading-none transition-colors">&times;</button>

          {/* هدر پروفایل با گرادینت زیبا */}
          <div className="relative mb-8">
            <div className="h-32 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
            </div>
            
            {/* آواتار */}
            <div className="absolute -bottom-12 right-1/2 translate-x-1/2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-violet-500/30 border-4 border-[#12101c]">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* نام کاربری */}
          <div className="text-center mb-8 mt-14">
            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-sm text-white/50">عضو عزیز MyApp</p>
          </div>

          {/* کارت موجودی کیف پول */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70">موجودی کیف پول</span>
              <span className="text-2xl">👛</span>
            </div>
            <div className="text-3xl font-black text-white mb-4">
              {walletBalance !== null ? fa(walletBalance) : '۰'} تومان
            </div>
            <button 
              onClick={() => setIsWalletOpen(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
            >
              💰 افزایش موجودی
            </button>
          </div>

          {/* بخش تغییر رمز عبور */}
          {!showChangePassword ? (
            <button 
              onClick={() => setShowChangePassword(true)}
              className="w-full py-4 rounded-xl bg-[#1d1830] hover:bg-[#241e3d] border border-white/10 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 mb-4"
            >
              <span>🔑</span>
              <span>تغییر رمز عبور</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-[#1d1830] p-5 mb-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🔐</span>
                <span>تغییر رمز عبور</span>
              </h3>
              
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی"
                className="w-full mb-3 rounded-xl border border-white/10 bg-[#241e3d] px-4 py-3 outline-none focus:border-violet-500/50 transition-colors"
              />
              
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز عبور جدید"
                className="w-full mb-3 rounded-xl border border-white/10 bg-[#241e3d] px-4 py-3 outline-none focus:border-violet-500/50 transition-colors"
              />
              
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور جدید"
                className="w-full mb-4 rounded-xl border border-white/10 bg-[#241e3d] px-4 py-3 outline-none focus:border-violet-500/50 transition-colors"
              />
              
              <div className="flex gap-2">
                <button 
                  onClick={handleChangePassword}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all duration-300"
                >
                  تأیید تغییر رمز
                </button>
                <button 
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswordMsg('')
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="px-4 py-3 rounded-xl bg-[#2c2547] hover:bg-[#342d52] text-white transition-colors"
                >
                  انصراف
                </button>
              </div>
              
              {passwordMsg && (
                <p className={`text-center text-sm mt-3 ${passwordMsg.includes('✅') ? 'text-green-400' : 'text-amber-400'}`}>
                  {passwordMsg}
                </p>
              )}
            </div>
          )}

          {/* بخش کانفیگ‌های خریداری شده */}
          <div className="rounded-2xl bg-[#1d1830] p-5 mb-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📦</span>
              <span>کانفیگ‌های خریداری شده</span>
            </h3>
            
            {loadingPurchases ? (
              <p className="text-center text-white/50 py-4">در حال بارگذاری...</p>
            ) : purchases.length === 0 ? (
              <p className="text-center text-white/50 py-4">هنوز خریدی انجام نداده‌اید</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="rounded-xl bg-[#241e3d] p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">
                          {purchase.products?.name || 'محصول'}
                          {purchase.products?.volume && (
                            <span className="text-white/40 text-xs mr-1">({purchase.products.volume})</span>
                          )}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {purchase.purchased_at
                            ? new Date(purchase.purchased_at).toLocaleDateString('fa-IR')
                            : '—'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap ${
                        purchase.status === 'approved'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : purchase.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {purchase.status === 'approved' ? '✅ تایید شده' : 
                         purchase.status === 'cancelled' ? '❌ لغو شده' : '⏳ در انتظار بررسی'}
                      </span>
                    </div>
                    
                    {/* نمایش لینک کانفیگ ثبت‌شده توسط ادمین */}
                    {purchase.admin_config_link ? (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/70 mb-2">لینک کانفیگ شما:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={purchase.admin_config_link} 
                            readOnly
                            dir="ltr"
                            className="flex-1 min-w-0 bg-[#12101c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80"
                          />
                          <button
                            onClick={() => handleCopy(purchase.admin_config_link, purchase.id)}
                            className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-xs transition-colors whitespace-nowrap"
                          >
                            {copiedId === purchase.id ? '✓ کپی شد' : 'کپی'}
                          </button>
                        </div>
                      </div>
                    ) : purchase.status === 'pending' ? (
                      <p className="text-xs text-white/50 mt-2">
                        ⏳ لینک کانفیگ پس از تایید ادمین در همین قسمت قرار می‌گیرد
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* دکمه خروج از حساب */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-300 font-medium flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} token={wpToken} />
    </>
  )
}
