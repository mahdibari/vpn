import { supabase } from '@/lib/supabase'

// GET: دریافت خریدهای کاربر (برای پروفایل) یا همه خریدها (برای ادمین)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const isAdmin = searchParams.get('admin') === 'true'

    let query = supabase.from('purchases').select(`
      *,
      products (name, volume, price, server_name),
      profiles (username)
    `).order('created_at', { ascending: false })

    if (userId && !isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json(data || [])
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST: ثبت خرید جدید توسط کاربر
export async function POST(request) {
  try {
    const { user_id, product_id, product_price } = await request.json()

    if (!user_id || !product_id) {
      return Response.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    // بررسی موجودی کیف پول
    // نکته: اگر رکوردی نباشد، supabase خطای PGRST116 می‌دهد که ما آن را نادیده می‌گیریم
    const { data: wallet, error: walletFetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user_id)
      .maybeSingle() // استفاده از maybeSingle برای جلوگیری از خطا در صورت نبود رکورد

    if (walletFetchError) {
      console.error('Wallet fetch error:', walletFetchError)
      return Response.json({ error: 'خطا در دریافت اطلاعات کیف پول: ' + walletFetchError.message }, { status: 500 })
    }

    // اگر wallet وجود داشت balance را بگیر، وگرنه 0
    const walletBalance = wallet && wallet.balance !== undefined && wallet.balance !== null ? Number(wallet.balance) : 0
    const price = Number(product_price) || 0

    console.log('Debug - user_id:', user_id)
    console.log('Debug - wallet:', wallet)
    console.log('Debug - walletBalance:', walletBalance)
    console.log('Debug - product_price:', product_price)
    console.log('Debug - price:', price)
    console.log('Debug - walletBalance >= price:', walletBalance >= price)

    if (walletBalance < price) {
      return Response.json({ 
        error: 'موجودی کیف پول کافی نیست',
        details: { walletBalance, price }
      }, { status: 400 })
    }

    // کسر از کیف پول
    const newBalance = walletBalance - price
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)

    if (walletError) {
      console.error('Wallet update error:', walletError)
      throw walletError
    }

    // ثبت خرید در جدول config_purchases
    const { data: purchase, error: purchaseError } = await supabase
      .from('config_purchases')
      .insert({
        user_id,
        product_id,
        status: 'pending'
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Purchase insert error:', purchaseError)
      throw purchaseError
    }

    return Response.json({ message: 'خرید با موفقیت ثبت شد تا چن دقیقه دیگه تو صفحه بروفایلت برات لینک کانفیگ میدم', purchase })
  } catch (err) {
    console.error('General error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}