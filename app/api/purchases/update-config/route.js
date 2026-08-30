import { supabase } from '@/lib/supabase'

// PUT: آپدیت لینک کانفیگ توسط ادمین
export async function PUT(request) {
  try {
    const { purchase_id, config_link, status } = await request.json()

    if (!purchase_id || !config_link) {
      return Response.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    const updateData = {
      config_link,
      status: status || 'completed',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', purchase_id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ message: 'لینک کانفیگ با موفقیت ثبت شد', data })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
