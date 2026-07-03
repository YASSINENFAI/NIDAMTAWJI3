-- ============================================================
-- 1. جدول user_profiles (يُنشأ تلقائياً عند إنشاء مستخدم)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin','supplier','distributor','guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Admin يرى كل المستخدمين
CREATE POLICY "admin_read_all_profiles" ON public.user_profiles
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- كل مستخدم يرى نفسه فقط
CREATE POLICY "user_read_own_profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Trigger لإنشاء profile تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'guest'),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. تحديث Admin الحالي في user_profiles
-- ============================================================
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'azffhk@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
