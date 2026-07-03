-- ====================================================
-- نظام سحاب ERP — Supabase Schema
-- شغّل هذا الملف في Supabase > SQL Editor
-- ====================================================

-- 1. جدول المنتجات
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT,
  stock         INTEGER NOT NULL DEFAULT 0,
  barcode       TEXT NOT NULL DEFAULT '',
  buy_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  sell_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_margin NUMERIC(5,2) NOT NULL DEFAULT 0,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. جدول الفواتير (Sales)
CREATE TABLE IF NOT EXISTS public.invoices (
  id            TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_vat  TEXT,
  date          DATE NOT NULL,
  due_date      DATE NOT NULL,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL CHECK (status IN ('مدفوعة', 'مستحقة')),
  items         JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. جدول الشركاء (موردين + موزعين)
CREATE TABLE IF NOT EXISTS public.partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('مورد', 'موزع')),
  phone           TEXT,
  total_earned    NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_growth  NUMERIC(5,2) NOT NULL DEFAULT 0,
  initial_letter  TEXT NOT NULL DEFAULT 'م',
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. جدول فواتير الشركاء
CREATE TABLE IF NOT EXISTS public.partner_invoices (
  id               TEXT PRIMARY KEY,
  partner_id       UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  products_summary TEXT NOT NULL,
  amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL CHECK (status IN ('مكتملة', 'قيد المعالجة')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. جدول إعدادات التطبيق (لإعدادات المستقبل)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- دالة لزيادة total_earned
CREATE OR REPLACE FUNCTION public.increment_partner_earned(
  p_id     UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
  UPDATE public.partners
  SET total_earned = total_earned + p_amount
  WHERE id = p_id;
$$ LANGUAGE SQL;

-- ====================================================
-- RLS Policies
-- ====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;

-- Products: admin (authenticated) can do everything, anon cannot
CREATE POLICY "admin_all_products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoices: admin only
CREATE POLICY "admin_all_invoices" ON public.invoices
  FOR ALL USING (auth.role() = 'authenticated');

-- Partners: admin sees all; partner sees only their own row
CREATE POLICY "admin_all_partners" ON public.partners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "partner_sees_self" ON public.partners
  FOR SELECT USING (auth.uid() = user_id);

-- Partner invoices: admin sees all; partner sees only their own
CREATE POLICY "admin_all_partner_invoices" ON public.partner_invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "partner_sees_own_invoices" ON public.partner_invoices
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );
