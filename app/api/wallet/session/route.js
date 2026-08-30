import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return Response.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .maybeSingle()

    if (userError || !user) {
      return Response.json({ error: 'کاربر پیدا نشد' }, { status: 404 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        token,
        user_id: user.id,
        expires_at: expiresAt,
      })

    if (sessionError) throw sessionError

    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .upsert(
        { user_id: user.id },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )

    if (walletError) throw walletError

    return Response.json({ token })
  } catch (error) {
    console.error('Wallet session error:', error)
    return Response.json({ error: 'خطا در ایجاد نشست کیف پول' }, { status: 500 })
  }
}
