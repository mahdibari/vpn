import { createClient } from '@supabase/supabase-js'

// این کلاینت فقط در Route Handlerهای سمت سرور استفاده می‌شود.
// هرگز آن را داخل Client Component ایمپورت نکنید.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
