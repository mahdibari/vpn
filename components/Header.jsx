'use client'
import { useState, useEffect } from 'react'
import { useUser } from './UserContext'
import { supabase } from '@/lib/supabase'
import AuthModal from './AuthModal'
import ProfileModal from './ProfileModal'
import WalletModal from './WalletModal'

const fa = n => Number(n || 0).toLocaleString("fa-IR")

export default function Header() {
  const { user, walletToken, logoutUser } = useUser()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [modalType, setModalType] = useState('login')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)

  const openModal = (type) => {
    setModalType(type)
    setIsAuthOpen(true)
  }

  // دریافت موجودی کیف پول با همان نشست کاربر سایت
  useEffect(() => {
    if (!user || !walletToken) {
      setWalletBalance(null)
      return
    }

    loadBalance(walletToken)
  }, [user, walletToken])

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

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-40 glass rounded-full px-8 py-3 flex items-center gap-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(129,140,248,0.2)]">
        <div className="text-xl font-bold bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent">
          MyApp
        </div>
        
        <div className="w-px h-6 bg-white/20"></div>

        <div className="flex gap-3 items-center">
          {/* اگر کاربر لاگین نبود */}
          {!user ? (
            <>
              <button onClick={() => openModal('login')} className="text-sm text-white/70 hover:text-white transition-colors px-4 py-1.5 rounded-full hover:bg-white/10">ورود</button>
              <button onClick={() => openModal('signup')} className="text-sm bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-400 hover:to-primary-400 text-white px-5 py-1.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary-500/30">ثبت نام</button>
            </>
          ) : (
            /* اگر کاربر لاگین بود */
            <>
              <button onClick={() => setIsWalletOpen(true)} className="text-sm text-white/90 hover:text-white transition-colors px-4 py-1.5 rounded-full hover:bg-white/10 flex items-center gap-2">
                👛 کیف پول
                {walletBalance !== null && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{fa(walletBalance)} تومان</span>
                )}
              </button>

              <button onClick={() => setIsProfileOpen(true)} className="text-sm text-white/90 hover:text-white transition-colors px-4 py-1.5 rounded-full hover:bg-white/10">
                پروفایل من
              </button>
              <button onClick={logoutUser} className="text-sm border border-red-500/50 text-red-300 hover:bg-red-500/20 px-4 py-1.5 rounded-full transition-all duration-300">
                خروج
              </button>
            </>
          )}
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} type={modalType} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} token={walletToken} />
    </>
  )
}