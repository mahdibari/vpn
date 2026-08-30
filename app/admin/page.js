'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/UserContext'
import Header from '@/components/Header'

const emptyForm = {
  name: '',
  volume: '',
  server_name: '',
  location: '',
  best_ping: '',
  price: '',
  discount: 0,
  validity_days: '',
  is_featured: false,
}

export default function AdminPage() {
  const { user } = useUser()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    if (user.username !== 'admin') {
      router.replace('/')
      return
    }

    fetchProducts()
  }, [user, router])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'دریافت محصولات ناموفق بود')

      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'خطا در دریافت محصولات')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name ?? '',
      volume: product.volume ?? '',
      server_name: product.server_name ?? '',
      location: product.location ?? '',
      best_ping: product.best_ping ?? '',
      price: product.price ?? '',
      discount: product.discount ?? 0,
      validity_days: product.validity_days ?? '',
      is_featured: Boolean(product.is_featured),
    })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim() || !form.volume.trim() || !form.server_name.trim() ||
        !form.location.trim() || !form.best_ping.trim() ||
        form.price === '' || form.validity_days === '') {
      setError('لطفاً همه فیلدهای الزامی را کامل کنید.')
      return
    }

    const payload = {
      name: form.name.trim(),
      volume: form.volume.trim(),
      server_name: form.server_name.trim(),
      location: form.location.trim(),
      best_ping: form.best_ping.trim(),
      price: Number(form.price),
      discount: Number(form.discount || 0),
      validity_days: Number(form.validity_days),
      is_featured: Boolean(form.is_featured),
    }

    if (
      !Number.isInteger(payload.price) ||
      !Number.isInteger(payload.discount) ||
      !Number.isInteger(payload.validity_days)
    ) {
      setError('قیمت، تخفیف و مدت اعتبار باید عدد صحیح باشند.')
      return
    }

    if (payload.price < 0 || payload.discount < 0 || payload.validity_days <= 0) {
      setError('مقادیر عددی واردشده معتبر نیستند.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const res = await fetch(
        editingId ? `/api/products/${editingId}` : '/api/products',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'عملیات ناموفق بود')
      }

      closeModal()
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'خطا در ذخیره محصول')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این محصول مطمئن هستید؟')) return

    try {
      setDeletingId(id)
      setError('')

      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حذف محصول ناموفق بود')
      }

      setProducts((current) => current.filter((product) => product.id !== id))
    } catch (err) {
      setError(err.message || 'خطا در حذف محصول')
    } finally {
      setDeletingId(null)
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

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">پنل مدیریت محصولات</h1>
            <p className="text-white/40 mt-2">افزودن، ویرایش و حذف مستقیم از دیتابیس Supabase</p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/purchases"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              محصولات خریداری شده
            </a>
            
            <button
              type="button"
              onClick={openAddModal}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all"
            >
              + افزودن محصول جدید
            </button>
          </div>
        </div>

        {error && !modalOpen && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4">
            {error}
          </div>
        )}

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-white">
              <thead className="border-b border-white/10">
                <tr className="text-white/50 text-sm">
                  <th className="p-4">نام محصول</th>
                  <th className="p-4">حجم</th>
                  <th className="p-4">سرور</th>
                  <th className="p-4">قیمت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-white/70">{p.volume}</td>
                    <td className="p-4 text-white/70">{p.server_name}</td>
                    <td className="p-4">
                      {Number(p.price || 0).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-4">
                      {p.is_featured ? (
                        <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-lg border border-yellow-500/30">
                          ویژه
                        </span>
                      ) : (
                        <span className="bg-white/5 text-white/50 text-xs px-2 py-1 rounded-lg border border-white/10">
                          عادی
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                        >
                          ویرایش
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 disabled:opacity-50"
                        >
                          {deletingId === p.id ? 'در حال حذف...' : 'حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <p className="text-center text-white/30 p-8">هیچ محصولی وجود ندارد</p>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="absolute top-4 left-4 text-white/50 hover:text-white text-2xl disabled:opacity-30"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </h2>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="نام محصول *">
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="admin-input" required />
              </Field>

              <Field label="حجم *">
                <input value={form.volume} onChange={(e) => updateField('volume', e.target.value)} className="admin-input" placeholder="مثلاً 50GB" required />
              </Field>

              <Field label="نام سرور *">
                <input value={form.server_name} onChange={(e) => updateField('server_name', e.target.value)} className="admin-input" required />
              </Field>

              <Field label="موقعیت *">
                <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className="admin-input" placeholder="مثلاً آلمان" required />
              </Field>

              <Field label="بهترین پینگ *">
                <input value={form.best_ping} onChange={(e) => updateField('best_ping', e.target.value)} className="admin-input" placeholder="مثلاً 40ms" required />
              </Field>

              <Field label="قیمت (تومان) *">
                <input type="number" min="0" step="1" value={form.price} onChange={(e) => updateField('price', e.target.value)} className="admin-input" required />
              </Field>

              <Field label="تخفیف">
                <input type="number" min="0" step="1" value={form.discount} onChange={(e) => updateField('discount', e.target.value)} className="admin-input" />
              </Field>

              <Field label="مدت اعتبار (روز) *">
                <input type="number" min="1" step="1" value={form.validity_days} onChange={(e) => updateField('validity_days', e.target.value)} className="admin-input" required />
              </Field>

              <label className="md:col-span-2 flex items-center gap-3 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                  className="w-4 h-4"
                />
                محصول ویژه باشد
              </label>

              <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white disabled:opacity-50"
                >
                  {saving ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'افزودن محصول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-white/60 mb-2">{label}</span>
      {children}
    </label>
  )
}
