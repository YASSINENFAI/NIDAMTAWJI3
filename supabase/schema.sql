-- ====================================================
-- 0. Trigger لربط الموردين والموزعين تلقائياً بجدول partners
-- ====================================================

CREATE OR REPLACE FUNCTION public.auto_create_partner()
RETURNS TRIGGER AS $$
DECLARE
  v_role  TEXT;
  v_name  TEXT;
  v_phone TEXT;
  v_type  TEXT;
BEGIN
  v_role  := NEW.raw_app_meta_data->>'role';
  v_name  := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'مجهول');
  v_phone := NEW.raw_user_meta_data->>'phone';

  IF v_role = 'supplier' THEN
    v_type := 'مورد';
  ELSIF v_role = 'distributor' THEN
    v_type := 'موزع';
  ELSE
    RETURN NEW; -- إذا كان الدور ليس مورّد أو موزّع، لا نفعل شيئاً
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.partners WHERE user_id = NEW.id) THEN
    INSERT INTO public.partners (name, type, phone, initial_letter, user_id)
    VALUES (
      TRIM(v_name),
      v_type,
      v_phone,
      LEFT(TRIM(v_name), 1),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_partner ON auth.users;
CREATE TRIGGER on_auth_user_created_partner
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_partner();
