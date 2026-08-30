'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/components/UserContext'
import Header from '@/components/Header'

const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

export default function PurchasesAdminPage() {
  const { user } = useUser()
  const router = useRouter()

  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  // مودال قرار دادن کانفیگ
  const [linkModal, setLinkModal] = useState(null)
  const [configLink, setConfigLink] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    if (user.username !== 'admin') {
      router.replace('/')
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('config_purchases')
        .select(`
          id,
          user_id,
          product_id,
          status,
          admin_config_link,
          purchased_at,
          delivered_at,
          profiles ( username ),
          products ( name, volume, price )
        `)
        .order('purchased_at', { ascending: false })

      if (fetchError) throw fetchError

      setPurchases(data || [])
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  // باز کردن مودال قرار دادن کانفیگ
  const openLinkModal = (purchase) => {
    setLinkModal(purchase)
    setConfigLink(purchase.admin_config_link || '')
    setError('')
  }

  // تایید: ذخیره لینک در فیلد admin_config_link کاربر
  const confirmConfig = async () => {
    if (!linkModal) return

    if (!configLink.trim()) {
      setError('لطفاً لینک کانفیگ را وارد کنید')
      return
    }

    try {
      setSaving(true)
      setError('')

      const { error: updateError } = await supabase
        .from('config_purchases')
        .update({
          admin_config_link: configLink.trim(),
          status: 'approved',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', linkModal.id)

      if (updateError) throw updateError

      // آپدیت لحظه‌ای جدول
      setPurchases((current) =>
        current.map((p) =>
          p.id === linkModal.id
            ? {
                ...p,
                admin_config_link: configLink.trim(),
                status: 'approved',
                delivered_at: new Date().toISOString(),
              }
            : p
        )
      )

      setLinkModal(null)
      setConfigLink('')
    } catch (err) {
      setError(err.message || 'خطا در ذخیره لینک کانفیگ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این خرید مطمئن هستید؟')) return

    try {
      const { error: deleteError } = await supabase
        .from('config_purchases')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setPurchases((current) => current.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message || 'خطا در حذف خرید')
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        در حال بارگذاری...
      </div>
    )
  }

  if (user.username !== 'admin') return null

  const filteredPurchases = purchases.filter((p) => {
    if (filter === 'pending') return p.status !== 'approved'
    if (filter === 'approved') return p.status === 'approved'
    return true
  })

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">خریداری‌های کاربران</h1>
            <p className="text-white/40 mt-2">قرار دادن لینک کانفیگ برای خریدهای کاربران</p>
          </div>

          <a
            href="/admin"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            بازگشت به پنل محصولات
          </a>
        </div>

        {/* فیلتر وضعیت */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm border transition-all ${
              filter === 'all'
                ? 'bg-accent-500/20 text-accent-300 border-accent-500/40'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            همه
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm border transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            در انتظار تایید
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-xl text-sm border transition-all ${
              filter === 'approved'
                ? 'bg-green-500/20 text-green-300 border-green-500/40'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            تایید شده
          </button>
        </div>

        {error && !linkModal && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4">
            {error}
          </div>
        )}

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-right text-white">
              <thead className="border-b border-white/10">
                <tr className="text-white/50 text-sm">
                  <th className="p-4">کاربر</th>
                  <th className="p-4">محصول</th>
                  <th className="p-4">قیمت</th>
                  <th className="p-4">تاریخ</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      {purchase.profiles?.username || 'کاربر'}
                    </td>
                    <td className="p-4 text-white/70">
                      {purchase.products
                        ? `${purchase.products.name} (${purchase.products.volume})`
                        : '—'}
                    </td>
                    <td className="p-4">
                      {purchase.products ? `${fa(purchase.products.price)} تومان` : '—'}
                    </td>
                    <td className="p-4 text-white/70 text-sm">
                      {purchase.purchased_at
                        ? new Date(purchase.purchased_at).toLocaleDateString('fa-IR')
                        : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        {purchase.status === 'approved' ? (
                          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-lg border border-green-500/30 w-fit">
                            تایید شده
                          </span>
                        ) : (
                          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-lg border border-yellow-500/30 w-fit">
                            در انتظار تایید
                          </span>
                        )}

                        {/* نشانگر: آیا کانفیگ برای این کاربر ثبت شده؟ */}
                        {purchase.admin_config_link && (
                          <span className="text-green-400 text-xs">
                            ✓ کانفیگ ثبت شده
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {/* دکمه قرار دادن کانفیگ */}
                        <button
                          type="button"
                          onClick={() => openLinkModal(purchase)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                            purchase.admin_config_link
                              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30'
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-500/30'
                          }`}
                        >
                          {purchase.admin_config_link ? 'ویرایش کانفیگ' : 'قرار دادن کانفیگ'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(purchase.id)}
                          className="bg-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <p className="text-center text-white/30 p-8">خریدی یافت نشد</p>
          )}
        </div>
      </div>

      {/* مودال قرار دادن کانفیگ */}
      {linkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !saving && setLinkModal(null)}
          />

          <div className="relative glass rounded-2xl w-full max-w-lg p-6 md:p-8">
            <button
              type="button"
              onClick={() => setLinkModal(null)}
              disabled={saving}
              className="absolute top-4 left-4 text-white/50 hover:text-white text-2xl disabled:opacity-30"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">قرار دادن کانفیگ</h2>
            <p className="text-white/50 text-sm mb-6">
              خریدار: <span className="text-white">{linkModal.profiles?.username || 'کاربر'}</span>
              {' — '}
              محصول:{' '}
              <span className="text-white">
                {linkModal.products
                  ? `${linkModal.products.name} (${linkModal.products.volume})`
                  : '—'}
              </span>
            </p>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm">
                {error}
              </div>
            )}

            <label className="block mb-6">
              <span className="block text-sm text-white/60 mb-2">لینک کانفیگ *</span>
              <textarea
                value={configLink}
                onChange={(e) => setConfigLink(e.target.value)}
                rows={4}
                dir="ltr"
                autoFocus
                className="admin-input w-full"
                placeholder="vless://..."
              />
            </label>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={confirmConfig}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}