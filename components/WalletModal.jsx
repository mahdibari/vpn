'use client'

import { useEffect, useState } from 'react'
import { useUser } from './UserContext'
import { supabase } from '@/lib/supabase'


const CARD_NUMBER = "6219-8619-7066-8181"

const fa = n => Number(n || 0).toLocaleString("fa-IR")

export default function WalletModal({ isOpen, onClose, token: tokenProp = null }) {
  const { user, walletToken } = useUser()
  const [token, setToken] = useState(null)
  const [authMsg, setAuthMsg] = useState("")
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [deposit, setDeposit] = useState(null)
  const [history, setHistory] = useState([])
  const [seconds, setSeconds] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.id) return

    let cancelled = false

    async function initWallet() {
      // نشست کیف پول از همان لاگین اصلی سایت می‌آید.
      let currentToken = tokenProp || walletToken || localStorage.getItem("wp_token")

      // برای کاربرانی که قبل از این نسخه لاگین کرده‌اند، نشست را خودکار می‌سازیم.
      if (!currentToken) {
        const res = await fetch('/api/wallet/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        })
        const data = await res.json()
        currentToken = data?.token || null
        if (currentToken) localStorage.setItem('wp_token', currentToken)
      }

      if (cancelled) return
      setToken(currentToken)
      if (currentToken) {
        const valid = await boot(currentToken)

        // اگر نشست قبلی منقضی شده باشد، بدون دخالت کاربر نشست جدید می‌گیریم.
        if (!valid && user?.id) {
          const res = await fetch('/api/wallet/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id }),
          })
          const data = await res.json()

          if (data?.token) {
            localStorage.setItem('wp_token', data.token)
            setToken(data.token)
            await boot(data.token)
          } else {
            setToken(null)
            setAuthMsg('خطا در آماده‌سازی کیف پول')
          }
        }
      }
    }

    initWallet().catch(error => {
      console.error('Wallet init error:', error)
      if (!cancelled) setAuthMsg('خطا در آماده‌سازی کیف پول')
    })

    return () => { cancelled = true }
  }, [isOpen, user?.id, tokenProp, walletToken])

  useEffect(() => {
    if (!deposit?.expires_at) return

    const update = () => {
      const s = Math.max(
        0,
        Math.floor((new Date(deposit.expires_at).getTime() - Date.now()) / 1000)
      )
      setSeconds(s)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [deposit])

  useEffect(() => {
    if (!deposit?.id || !token) return

    const id = setInterval(async () => {
      const { data } = await supabase.rpc("deposit_status", {
        p_token: token,
        p_id: deposit.id
      })

      if (data === "paid") {
        clearInterval(id)
        setDeposit(null)
        await boot(token)
        setAuthMsg("✅ پرداخت تأیید شد! کیف پول شارژ شد.")
      }

      if (data === "expired" || data === "canceled") {
        clearInterval(id)
        setDeposit(null)
        await loadHistory(token)
      }
    }, 5000)

    return () => clearInterval(id)
  }, [deposit?.id, token])

  async function boot(currentToken) {
    const { data } = await supabase.rpc("me", {
      p_token: currentToken
    })

    if (data?.ok) {
      setToken(currentToken)
      setBalance(Number(data.balance || 0))
      await loadHistory(currentToken)
      return true
    }

    return false
  }

  async function loadHistory(currentToken) {
    const { data } = await supabase.rpc("history", {
      p_token: currentToken
    })
    setHistory(data || [])
  }

  async function createDeposit() {
    const amt = parseInt(amount, 10) || 0

    if (amt < 10000) {
      setAuthMsg("حداقل مبلغ ۱۰,۰۰۰ تومان است")
      return
    }

    setBusy(true)
    setAuthMsg("")

    const { data, error } = await supabase.rpc("create_deposit", {
      p_token: token,
      p_base_toman: amt
    })

    setBusy(false)

    if (error || !data?.ok) {
      setAuthMsg("خطا: " + (error?.message || data?.error || "نامشخص"))
      return
    }

    setDeposit(data)
  }

  async function cancelDeposit() {
    if (deposit) {
      await supabase.rpc("cancel_deposit", {
        p_token: token,
        p_id: deposit.id
      })
    }

    setDeposit(null)
    await loadHistory(token)
  }

  function copyText(text) {
    const clean = String(text).replace(/\D/g, "")
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clean)
      setAuthMsg("کپی شد")
    }
  }



  if (!isOpen) return null

  const card = CARD_NUMBER.replace(/\D/g, "")
  const timer =
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir="rtl"
      onClick={onClose}
    >
      {/* انیمیشن چشمک‌زن هشدار واریز */}
      <style>{`
        @keyframes red-blink {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 14px rgba(239, 68, 68, 0.75);
          }
          50% {
            opacity: 0.25;
            text-shadow: none;
          }
        }
        .alert-blink {
          animation: red-blink 1.1s ease-in-out infinite;
        }
      `}</style>

      <div
        className="w-full max-w-[430px] max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#12101c] text-white p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">👛 کیف پول</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {!token ? (
          <div className="rounded-2xl bg-[#1d1830] p-5 text-center">
            <div className="text-3xl mb-3">⏳</div>
            <h3 className="text-lg font-bold mb-2">در حال آماده‌سازی کیف پول</h3>
            <p className="text-sm text-white/50">
              کیف پول به‌صورت خودکار به حساب کاربری شما متصل می‌شود.
            </p>
            {authMsg && (
              <p className="text-center text-sm text-amber-400 mt-3">{authMsg}</p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-[#1d1830] p-5 mb-4 text-center">
              <div className="text-3xl font-black">{fa(balance)} تومان</div>
              <div className="text-sm text-white/50 mt-1">
                موجودی کیف پول
              </div>
            </div>

            {!deposit ? (
              <div className="rounded-2xl bg-[#1d1830] p-5">
                <h3 className="font-bold mb-3">افزایش موجودی</h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[50000, 100000, 200000, 500000].map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className={`rounded-xl py-3 ${
                        Number(amount) === v
                          ? "bg-violet-600"
                          : "bg-[#2c2547]"
                      }`}
                    >
                      {fa(v)}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="یا مبلغ دلخواه..."
                  className="w-full mb-3 rounded-xl border border-white/10 bg-[#241e3d] px-4 py-3 outline-none"
                />

                <button
                  disabled={busy}
                  onClick={createDeposit}
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 font-bold"
                >
                  {busy ? "در حال ایجاد..." : "دریافت اطلاعات واریز"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#1d1830] p-5">
                <div className="text-center text-sm text-white/50 mb-2">
                  مبلغ قابل واریز
                </div>

                <div className="text-center text-xl font-bold mb-4">
                  {fa(deposit.amount_toman)} تومان
                </div>

                {/* ⚠️ هشدار چشمک‌زن قرمز — دقیقاً زیر مبلغ واریزی */}
                <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 mb-4">
                  <p className="alert-blink text-center text-[13px] font-black text-red-500 leading-6">
                    ⚠️ دقیقاً همین مبلغ را با اپ بانکی (بلوبانک، ویپاد و…) کارت‌به‌کارت به شماره کارت زیر واریز کنید
                  </p>
                   <p className="text-center text-xs text-red-300/90 mt-1.5 leading-5">
                 بعد از واریز   سیس به سایت برگردید
                  </p>
                  <p className="text-center text-xs text-red-300/90 mt-1.5 leading-5">
                    در صورت واریز دقیق همین مبلغ، کیف پول شما به‌صورت خودکار و در کمتر از ۱ دقیقه شارژ می‌شود ✅
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl bg-[#241e3d] p-3 mb-2">
                  <span className="font-bold tracking-wider">
                    {card.replace(/(\d{4})(?=\d)/g, "$1-")}
                  </span>
                  <button
                    onClick={() => copyText(card)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                  >
                    کپی
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl bg-[#241e3d] p-3 mb-2">
                  <span className="font-bold">
                    {fa(deposit.amount_rial)} ریال
                  </span>
                  <button
                    onClick={() => copyText(deposit.amount_rial)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                  >
                    کپی
                  </button>
                </div>

                <div className="text-center text-amber-400 font-bold mb-3">
                  ⏳ {timer}
                </div>

                <div className="text-center text-sm text-amber-300 mb-4">
                  در انتظار واریز شما...
                </div>

                <button
                  onClick={cancelDeposit}
                  className="w-full rounded-xl bg-[#2c2547] py-3"
                >
                  انصراف
                </button>
              </div>
            )}

            {authMsg && (
              <p className="text-center text-sm text-white/70 mt-3">
                {authMsg}
              </p>
            )}

            <div className="rounded-2xl bg-[#1d1830] p-5 mt-4">
              <h3 className="font-bold mb-3">تاریخچه واریزی‌ها</h3>

              {history.length === 0 ? (
                <div className="text-center text-sm text-white/40">
                  هنوز واریزی ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(d => (
                    <div
                      key={d.id}
                      className="flex justify-between rounded-xl bg-[#241e3d] p-3 text-sm"
                    >
                      <span>{fa(d.amount_toman)} تومان</span>
                      <span>
                        {{
                          pending: "در انتظار",
                          paid: "پرداخت شد",
                          expired: "منقضی",
                          canceled: "لغو شد"
                        }[d.status] || d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </>
        )}
      </div>
    </div>
  )
}