-- supabase/migrations/0004_fix_users_rls_recursion.sql
-- Corrige la recursión infinita (SQLSTATE 42P17) en las políticas RLS de public.users.
-- Las políticas anteriores consultaban `users` dentro de la propia política de `users`,
-- provocando recursión infinita en cualquier SELECT/INSERT/UPDATE/DELETE.
-- Solución recomendada por Supabase: funciones auxiliares SECURITY DEFINER en el esquema
-- privado `private` (no expuesto vía PostgREST), con `SET search_path = ''` y `auth.uid()` interno.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role = 'staff'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION private.is_staff_in_daycare(target_daycare_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role = 'staff'::public.user_role
      AND daycare_id = target_daycare_id
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff() TO authenticated;

REVOKE ALL ON FUNCTION private.is_staff_in_daycare(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff_in_daycare(uuid) TO authenticated;

DROP POLICY IF EXISTS "users read own profile" ON public.users;
CREATE POLICY "users read own profile"
ON public.users
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users read staff daycare" ON public.users;
CREATE POLICY "users read staff daycare"
ON public.users
FOR SELECT
TO authenticated
USING (private.is_staff_in_daycare(daycare_id));

DROP POLICY IF EXISTS "users insert staff only" ON public.users;
CREATE POLICY "users insert staff only"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (private.is_staff());

DROP POLICY IF EXISTS "users update staff only" ON public.users;
CREATE POLICY "users update staff only"
ON public.users
FOR UPDATE
TO authenticated
USING (private.is_staff())
WITH CHECK (private.is_staff());

DROP POLICY IF EXISTS "users delete staff only" ON public.users;
CREATE POLICY "users delete staff only"
ON public.users
FOR DELETE
TO authenticated
USING (private.is_staff());

