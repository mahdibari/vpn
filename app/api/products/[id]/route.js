import { supabase } from '@/lib/supabase'

const allowedFields = [
  'name',
  'volume',
  'server_name',
  'location',
  'best_ping',
  'price',
  'discount',
  'validity_days',
  'is_featured',
]

function cleanProduct(body = {}) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  )
}

function validateProduct(product) {
  const requiredText = ['name', 'volume', 'server_name', 'location', 'best_ping']

  for (const field of requiredText) {
    if (typeof product[field] !== 'string' || !product[field].trim()) {
      return `فیلد ${field} الزامی است`
    }
  }

  if (!Number.isInteger(product.price) || product.price < 0) {
    return 'قیمت نامعتبر است'
  }

  if (!Number.isInteger(product.discount) || product.discount < 0) {
    return 'تخفیف نامعتبر است'
  }

  if (!Number.isInteger(product.validity_days) || product.validity_days <= 0) {
    return 'مدت اعتبار نامعتبر است'
  }

  if (typeof product.is_featured !== 'boolean') {
    return 'وضعیت ویژه نامعتبر است'
  }

  return null
}

// ویرایش محصول
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    const product = cleanProduct({
      ...body,
      price: Number(body.price),
      discount: Number(body.discount ?? 0),
      validity_days: Number(body.validity_days),
      is_featured: Boolean(body.is_featured),
    })

    const validationError = validateProduct(product)
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ message: 'محصول با موفقیت ویرایش شد', data })
  } catch (error) {
    return Response.json({ error: 'اطلاعات ارسالی نامعتبر است' }, { status: 400 })
  }
}

// حذف محصول
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return Response.json(
        { error: 'محصول پیدا نشد یا اجازه حذف آن وجود ندارد' },
        { status: 404 }
      )
    }

    return Response.json({ message: 'محصول با موفقیت حذف شد' })
  } catch (error) {
    return Response.json({ error: 'خطا در حذف محصول' }, { status: 500 })
  }
}
