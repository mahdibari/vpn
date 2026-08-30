import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const username = body.username
    const password = body.password

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ username: username, password: hashedPassword }])
      .select()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ message: 'ثبت نام با موفقیت انجام شد!' })
  } catch (err) {
    return Response.json({ error: 'خطای سرور داخلی' }, { status: 500 })
  }
}