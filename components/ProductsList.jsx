'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from './UserContext'
import WalletModal from './WalletModal'

const fa = n => Number(n || 0).toLocaleString("fa-IR")

export default function ProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, walletToken } = useUser()
  const [buyingProduct, setBuyingProduct] = useState(null)
  const [buyingLoading, setBuyingLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [balance, setBalance] = useState(null)
  const toastTimerRef = useRef(null)

  const showToast = (message, type = 'info', icon = '🔔', duration = 5000, extra = {}) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type, icon, duration, visible: true, ...extra })
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null)
      setTimeout(() => setToast(null), 500)
    }, duration)
  }

  const closeToast = () => {
    setToast(prev => prev ? { ...prev, visible: false } : null)
    setTimeout(() => setToast(null), 400)
  }

  const openWallet = () => {
    closeToast()
    setWalletOpen(true)
  }

  // گرفتن موجودی کیف پول کاربر
  const refreshBalance = async () => {
    if (!walletToken) return
    const { data } = await supabase.rpc("me", { p_token: walletToken })
    if (data?.ok) setBalance(Number(data.balance || 0))
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    refreshBalance()
  }, [walletToken])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('is_featured', { ascending: false })
    if (!error) setProducts(data)
    setLoading(false)
  }

  const handleBuyClick = (product) => {
    if (!user) {
      showToast('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error', '⚠️')
      return
    }
    setBuyingProduct(product)
  }

  // نوتیف مخصوص کمبود موجودی — با متن راهنما و دکمه شارژ کیف پول
  const showInsufficientBalanceToast = () => {
    showToast(
      'موجودی کیف پول شما برای این خرید کافی نیست!',
      'error',
      '💳',
      9000,
      {
        subText: 'برای ادامه خرید، لطفاً کیف پول خود را شارژ کنید.',
        action: {
          label: '👛 شارژ کیف پول',
          onClick: openWallet
        }
      }
    )
  }

  const confirmPurchase = async () => {
    if (!buyingProduct || !user) return

    setBuyingLoading(true)

    try {
      const finalPrice = buyingProduct.discount > 0
        ? buyingProduct.price - (buyingProduct.price * buyingProduct.discount / 100)
        : buyingProduct.price

      // چک موجودی سمت کلاینت (اگر موجودی از قبل مشخص باشد)
      if (balance !== null && balance < Math.round(finalPrice)) {
        setBuyingProduct(null)
        showInsufficientBalanceToast()
        return
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: buyingProduct.id,
          product_price: Math.round(finalPrice)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت خرید')
      }

      showToast('✅ خرید شما با موفقیت ثبت شد!\nپس از تایید ادمین، لینک کانفیگ در پروفایل شما قرار می‌گیرد.', 'success', '🎉', 6000)
      setBuyingProduct(null)
      refreshBalance()
    } catch (err) {
      const msg = err.message || 'خطا در ثبت خرید'

      // اگر خطای سمت سرور هم مربوط به موجودی بود، همین نوتیف ویژه نشان داده می‌شود
      if (msg.includes('موجودی') || /balance|insufficient/i.test(msg)) {
        setBuyingProduct(null)
        showInsufficientBalanceToast()
      } else {
        showToast(msg, 'error', '❌')
      }
    } finally {
      setBuyingLoading(false)
    }
  }

  if (loading) return <div className="text-center text-white/50 mt-20">در حال بارگذاری محصولات...</div>

  return (
    <>
      <div className="w-full max-w-xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/90">بسته های امام نت</h2>
        
        <div className="flex flex-col gap-6">
          {products.map((product) => {
            const hasDiscount = product.discount > 0
            const finalPrice = hasDiscount ? product.price - (product.price * product.discount / 100) : product.price
            const isFeatured = product.is_featured

            return (
              <div 
                key={product.id} 
                className={`
                  rounded-2xl p-6 relative overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col
                  ${isFeatured 
                    ? 'glass featured-glow shimmer-border md:scale-105 hover:scale-[1.08]' 
                    : 'glass hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(129,140,248,0.15)]'
                  }
                `}
              >
                {/* استیکرهای مینیمال سفید (فقط برای محصولات عادی) */}
                {!isFeatured && (
                  <>
                    <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-white/10 rounded-full group-hover:border-white/20 transition-all duration-500"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-white/5 rounded-2xl rotate-45 group-hover:border-white/15 transition-all duration-500"></div>
                    <div className="absolute top-6 left-6 w-2 h-2 bg-white/20 rounded-full"></div>
                  </>
                )}

                {/* محتوای کارت (ز-10 برای محصول ویژه تا زیر نور نره) */}
                <div className={`relative flex flex-col h-full ${isFeatured ? 'featured-content' : 'z-10'}`}>
                  
                  {/* هدر کارت */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-accent-400 font-medium mb-1">{product.location} | {product.server_name}</p>
                      <h3 className={`font-bold text-white ${isFeatured ? 'text-xl' : 'text-lg'}`}>{product.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isFeatured && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-orange-500/30 animate-pulse">
                          🔥 ویژه
                        </span>
                      )}
                      {hasDiscount && (
                        <span className={`text-xs px-2 py-1 rounded-lg border ${isFeatured ? 'bg-red-500/30 text-red-200 border-red-400/50' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                          {product.discount}% تخفیف
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className={`space-y-2 mb-6 flex-grow ${isFeatured ? 'text-white/80' : 'text-white/60'} text-sm`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isFeatured ? 'bg-yellow-400' : 'bg-primary-400'}`}></div>
                      <span>حجم: {product.volume}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isFeatured ? 'bg-yellow-400' : 'bg-accent-400'}`}></div>
                      <span>اعتبار: {product.validity_days} روز</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isFeatured ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                      <span>بهترین پینگ: {product.best_ping}</span>
                    </div>
                  </div>

                  {/* فوتر و قیمت */}
                  <div className={`pt-4 mt-auto flex items-end justify-between ${isFeatured ? 'border-t border-purple-400/30' : 'border-t border-white/10'}`}>
                    <div>
                      {hasDiscount && (
                        <p className="text-xs text-white/30 line-through mb-1">{product.price.toLocaleString('fa-IR')} تومان</p>
                      )}
                      <p className={`font-extrabold bg-gradient-to-r from-white to-accent-200 bg-clip-text text-transparent ${isFeatured ? 'text-2xl' : 'text-xl'}`}>
                        {Math.round(finalPrice).toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleBuyClick(product)}
                      className={`text-sm px-5 py-2.5 rounded-xl transition-all duration-300 text-white font-medium
                      ${isFeatured 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-orange-500/40' 
                        : 'bg-gradient-to-r from-accent-500 to-primary-500 hover:shadow-lg hover:shadow-primary-500/30'
                      }
                    `}>
                      خرید کانفیگ
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Toast Notification Component - طراحی شیک و مدرن */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] transition-all duration-700 ease-out transform ${toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
          <div className={`
            relative overflow-hidden rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-xl border flex items-start gap-4 min-w-[340px] max-w-md
            ${toast.type === 'success' ? 'bg-gradient-to-br from-green-500/25 to-emerald-600/20 border-green-400/40' : 
              toast.type === 'error' ? 'bg-gradient-to-br from-red-500/25 to-rose-600/20 border-red-400/40' : 
              'bg-gradient-to-br from-blue-500/25 to-indigo-600/20 border-blue-400/40'}
          `}>
            {/* افکت درخشش پس‌زمینه */}
            <div className={`absolute inset-0 opacity-30 ${
              toast.type === 'success' ? 'bg-gradient-to-r from-green-400/20 to-transparent' : 
              toast.type === 'error' ? 'bg-gradient-to-r from-red-400/20 to-transparent' : 
              'bg-gradient-to-r from-blue-400/20 to-transparent'
            }`}></div>
            
            {/* آیکون با انیمیشن */}
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
              toast.type === 'success' ? 'bg-green-500/30' : 
              toast.type === 'error' ? 'bg-red-500/30' : 
              'bg-blue-500/30'
            }`}>
              <span className="text-2xl animate-bounce">{toast.icon}</span>
            </div>
            
            {/* متن پیام + زیرمتن + دکمه اکشن */}
            <div className="relative flex-1 flex flex-col items-stretch gap-1.5">
              <p className="text-white font-semibold text-sm leading-relaxed whitespace-pre-line">{toast.message}</p>
              {toast.subText && (
                <p className="text-white/70 text-xs leading-relaxed">{toast.subText}</p>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold py-2.5 px-4 transition-all duration-300 shadow-lg shadow-violet-600/30 hover:shadow-violet-500/40"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            
            {/* دکمه بستن */}
            <button 
              onClick={closeToast}
              className="relative w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* نوار پیشرفت زمان — متناسب با مدت زمان هر نوتیف */}
            <div className={`absolute bottom-0 left-0 h-1 ${
              toast.type === 'success' ? 'bg-green-400' : 
              toast.type === 'error' ? 'bg-red-400' : 
              'bg-blue-400'
            }`} style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
              width: '100%'
            }}></div>
          </div>
        </div>
      )}

      {/* مودال تأیید خرید */}
      {buyingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBuyingProduct(null)}></div>
          
          <div className="relative w-full max-w-md rounded-2xl bg-[#1d1830] border border-white/10 p-6 text-white">
            <h3 className="text-xl font-bold mb-4">تأیید خرید</h3>
            
            <div className="mb-6 space-y-2">
              <p className="text-white/70">محصول: <span className="text-white font-medium">{buyingProduct.name}</span></p>
              <p className="text-white/70">حجم: <span className="text-white">{buyingProduct.volume}</span></p>
              <p className="text-white/70">قیمت نهایی: <span className="text-white font-bold">{Math.round(buyingProduct.discount > 0 ? buyingProduct.price - (buyingProduct.price * buyingProduct.discount / 100) : buyingProduct.price).toLocaleString('fa-IR')} تومان</span></p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmPurchase}
                disabled={buyingLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buyingLoading ? 'در حال پردازش...' : 'تأیید و پرداخت'}
              </button>
              <button 
                onClick={() => setBuyingProduct(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال کیف پول */}
      <WalletModal
        isOpen={walletOpen}
        onClose={() => {
          setWalletOpen(false)
          refreshBalance()
        }}
      />

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  )
}