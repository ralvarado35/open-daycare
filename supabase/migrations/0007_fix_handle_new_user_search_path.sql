-- supabase/migrations/0007_fix_handle_new_user_search_path.sql
-- Corrige public.handle_new_user() (trigger de 0002 sobre auth.users): al
-- ejecutar desde GoTrue (rol supabase_auth_admin) el search_path viene vacío,
-- la función no fijaba el suyo y declaraba `user_role` sin cualificar →
-- ERROR 42704 "type user_role does not exist" en toda señal real por
-- signUp ("Database error saving new user"), rompiendo la activación de
-- cuentas de SPEC 08. Se aplica el mismo patrón de 0004/0006: SECURITY
-- DEFINER + SET search_path = '' + todos los nombres fully-qualified.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
    DECLARE
      v_daycare_id uuid;
      v_role public.user_role;
    BEGIN
      IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_daycare_id := NULLIF(NEW.raw_user_meta_data->>'daycare_id', '')::uuid;
        v_role := NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role;
      END IF;

      INSERT INTO public.users (
        id,
        daycare_id,
        role,
        status,
        full_name,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        v_daycare_id,
        COALESCE(v_role, 'parent'::public.user_role),
        'active'::public.user_status,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Usuario'),
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;

      RETURN NEW;
    END;
    $$;
