import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    // پیدا کردن کاربر با یوزرنیم
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return Response.json({ error: 'یوزرنیم یا رمز عبور اشتباه است' }, { status: 400 })
    }

    // مقایسه رمز عبور وارد شده با رمز هش شده در دیتابیس
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return Response.json({ error: 'یوزرنیم یا رمز عبور اشتباه است' }, { status: 400 })
    }

    // ساخت سشن کیف پول برای همین کاربر؛ کاربر نباید دوباره وارد کیف پول شود
    const walletToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        token: walletToken,
        user_id: user.id,
        expires_at: expiresAt,
      })

    if (sessionError) {
      console.error('Wallet session error:', sessionError)
      return Response.json({ error: 'خطا در ایجاد نشست کاربر' }, { status: 500 })
    }

    // اگر کیف پول کاربر هنوز ساخته نشده باشد، آن را ایجاد می‌کنیم
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

    if (walletError) {
      console.error('Wallet creation error:', walletError)
      return Response.json({ error: 'خطا در ایجاد کیف پول' }, { status: 500 })
    }

    return Response.json({
      message: 'ورود موفقیت آمیز بود!',
      user: { id: user.id, username: user.username },
      walletToken,
    })
  } catch (err) {
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}