-- supabase/migrations/0005_create_rooms_and_children.sql
-- Salas (rooms) y niños (children) siguiendo el esquema de referencia en @db-schema.
-- Relación: daycares 1─< rooms 1──< children.
-- RLS solo-staff por ahora (aún no existe parent_children; el acceso de padres
-- se abrirá en la spec correspondiente).

-- 1. Extensión pgcrypto (requerida por gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabla rooms (salas de la guardería)
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enum child_status (borrado lógico: active / archived)
CREATE TYPE child_status AS ENUM ('active', 'archived');

-- 4. Tabla children (niños inscritos)
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL DEFAULT CURRENT_DATE,
  medical_notes text,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  photo_consent boolean NOT NULL DEFAULT true,
  status child_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS habilitado en ambas tablas
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- 6. Helper SECURITY DEFINER (patrón de 0004: esquema private, search_path='')
-- private.is_staff_in_room(target_room_id) → ¿el usuario actual es staff de la
-- guardería dueña de la sala? Se resuelve la sala vía subconsulta sobre rooms;
-- al ser SECURITY DEFINER no dispara la recursión RLS sobre children.
CREATE OR REPLACE FUNCTION private.is_staff_in_room(target_room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms r
    JOIN public.users u
      ON u.daycare_id = r.daycare_id
    WHERE r.id = target_room_id
      AND u.id = (SELECT auth.uid())
      AND u.role = 'staff'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff_in_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff_in_room(uuid) TO authenticated;

-- 7. Políticas RLS sobre rooms: solo staff de la guardería dueña (4 operaciones)
CREATE POLICY "rooms select staff"
ON public.rooms
FOR SELECT
TO authenticated
USING (private.is_staff_in_daycare(daycare_id));

CREATE POLICY "rooms insert staff"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (private.is_staff_in_daycare(daycare_id));

CREATE POLICY "rooms update staff"
ON public.rooms
FOR UPDATE
TO authenticated
USING (private.is_staff_in_daycare(daycare_id))
WITH CHECK (private.is_staff_in_daycare(daycare_id));

CREATE POLICY "rooms delete staff"
ON public.rooms
FOR DELETE
TO authenticated
USING (private.is_staff_in_daycare(daycare_id));

-- 8. Políticas RLS sobre children: solo staff de la guardería de la sala (4 operaciones)
CREATE POLICY "children select staff"
ON public.children
FOR SELECT
TO authenticated
USING (private.is_staff_in_room(room_id));

CREATE POLICY "children insert staff"
ON public.children
FOR INSERT
TO authenticated
WITH CHECK (private.is_staff_in_room(room_id));

CREATE POLICY "children update staff"
ON public.children
FOR UPDATE
TO authenticated
USING (private.is_staff_in_room(room_id))
WITH CHECK (private.is_staff_in_room(room_id));

CREATE POLICY "children delete staff"
ON public.children
FOR DELETE
TO authenticated
USING (private.is_staff_in_room(room_id));

-- 9. Seed: 3 salas de «Guardería Sala Soles» en orden estable por created_at
-- (Soles → Luna → Estrellas). No hay seed de niños: se crean desde la UI.
INSERT INTO rooms (daycare_id, name, created_at)
SELECT d.id, s.name, now() + (s.ord * interval '1 second')
FROM daycares d
CROSS JOIN (VALUES ('Soles', 0), ('Luna', 1), ('Estrellas', 2)) AS s(name, ord)
WHERE d.name = 'Guardería Sala Soles';
