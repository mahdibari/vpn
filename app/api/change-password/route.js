import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { user_id, old_password, new_password } = await request.json()

    if (!user_id || !old_password || !new_password) {
      return Response.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    // دریافت اطلاعات کاربر
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (fetchError || !user) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    // بررسی رمز عبور فعلی
    const isMatch = await bcrypt.compare(old_password, user.password)
    if (!isMatch) {
      return Response.json({ error: 'رمز عبور فعلی اشتباه است' }, { status: 400 })
    }

    // هش کردن رمز جدید
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // آپدیت رمز در دیتابیس
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('id', user_id)

    if (updateError) throw updateError

    return Response.json({ message: 'رمز عبور با موفقیت تغییر کرد' })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
