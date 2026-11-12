-- supabase/migrations/0006_create_invitations_and_parent_children.sql
-- Vinculación padre ↔ niño: enums, tablas `invitations` y `parent_children`,
-- helper RLS `private.is_staff_in_child` (patrón 0004/0005) y las funciones
-- SECURITY DEFINER `public.lookup_invitation` (validación anónima pre-login)
-- y `public.accept_invitation` (acepte autenticado).
-- Sigue los campos exactos de la referencia @db-schema §5 y §6.

-- 1. Enums de dominio
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- 2. Tabla invitations (código corto generado por el staff para vincular familias)
CREATE TABLE invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  invited_by   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  full_name    text NOT NULL,
  email        text NOT NULL,
  relationship relationship_type NOT NULL,
  code         text UNIQUE NOT NULL,
  status       invitation_status NOT NULL DEFAULT 'pending',
  expires_at   timestamptz NOT NULL,
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla parent_children (vínculo padre ↔ niño, varios-a-varios)
CREATE TABLE parent_children (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id     uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

-- 4. RLS habilitado en ambas tablas
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- 5. Helper SECURITY DEFINER (patrón 0004): ¿el usuario actual es staff de la
-- guardería dueña de la sala del niño? JOIN children → rooms → users con
-- auth.uid(); al ser SECURITY DEFINER no dispara recursión RLS.
CREATE OR REPLACE FUNCTION private.is_staff_in_child(target_child_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.children c
    JOIN public.rooms r
      ON r.id = c.room_id
    JOIN public.users u
      ON u.daycare_id = r.daycare_id
    WHERE c.id = target_child_id
      AND u.id = (SELECT auth.uid())
      AND u.role = 'staff'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff_in_child(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff_in_child(uuid) TO authenticated;

-- 6. Políticas RLS sobre invitations: solo staff de la guardería del niño
-- (SELECT/INSERT/UPDATE; sin DELETE expuesto — gestión de invitaciones es otra spec).
CREATE POLICY "invitations select staff"
ON public.invitations
FOR SELECT
TO authenticated
USING (private.is_staff_in_child(child_id));

CREATE POLICY "invitations insert staff"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (private.is_staff_in_child(child_id));

CREATE POLICY "invitations update staff"
ON public.invitations
FOR UPDATE
TO authenticated
USING (private.is_staff_in_child(child_id))
WITH CHECK (private.is_staff_in_child(child_id));

-- 7. Políticas RLS sobre parent_children: lectura para el padre propio o el
-- staff del niño. Sin políticas de escritura: todo INSERT pasa por
-- accept_invitation (SECURITY DEFINER).
CREATE POLICY "parent children select own parent or staff"
ON public.parent_children
FOR SELECT
TO authenticated
USING (
  parent_id = (SELECT auth.uid())
  OR private.is_staff_in_child(child_id)
);

-- 8. public.lookup_invitation(p_code): validación anónima del código para la
-- pantalla /activate-account (pre-login). Retorna NULL si no existe y solo
-- campos mínimos (sin invited_by ni ids internos). statusDerivado marca
-- 'expired' para pendientes vencidas sin escribir en la tabla.
CREATE OR REPLACE FUNCTION public.lookup_invitation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'childFirstName', split_part(c.full_name, ' ', 1),
    'childRoomName', r.name,
    'fullName', i.full_name,
    'relationship', i.relationship::text,
    'email', i.email,
    'statusDerivado', CASE
      WHEN i.status = 'pending' AND i.expires_at < now() THEN 'expired'
      ELSE i.status::text
    END,
    'expiresAt', i.expires_at
  )
  INTO v_result
  FROM public.invitations i
  JOIN public.children c ON c.id = i.child_id
  JOIN public.rooms r ON r.id = c.room_id
  WHERE i.code = p_code;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_invitation(text) TO anon, authenticated;

-- 9. public.accept_invitation(p_code, p_email): acceptance completo en una
-- sola transacción. Requiere sesión (auth.uid()), bloquea concurrencia con
-- FOR UPDATE, exige pendiente no vencida y email case-insensitive, crea el
-- vínculo y marca la invitación como aceptada. Errores con mensajes fijos
-- que la capa TS mapea a español.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_code text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_id uuid := (SELECT auth.uid());
  v_invitation public.invitations%ROWTYPE;
  v_inserted integer;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  IF v_invitation.status <> 'pending' OR v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  IF lower(trim(v_invitation.email)) <> lower(trim(p_email)) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  INSERT INTO public.parent_children (parent_id, child_id, relationship)
  VALUES (v_parent_id, v_invitation.child_id, v_invitation.relationship)
  ON CONFLICT (parent_id, child_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RAISE EXCEPTION 'already_linked';
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, text) TO authenticated;
