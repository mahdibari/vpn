-- جدول خریدهای کاربران (purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  config_link text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT purchases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- ایجاد ایندکس برای جستجوی سریعتر
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- کامنت برای جدول
COMMENT ON TABLE public.purchases IS 'جدول خریدهای کاربران - شامل لینک کانفیگ پس از تحویل توسط ادمین';
COMMENT ON COLUMN public.purchases.config_link IS 'لینک کانفیگ که توسط ادمین پس از تایید خرید قرار داده می‌شود';
COMMENT ON COLUMN public.purchases.status IS 'وضعیت خرید: pending (در انتظار بررسی), completed (تکمیل شده), cancelled (لغو شده)';
