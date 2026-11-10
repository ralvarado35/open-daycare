-- supabase/migrations/0002_create_users.sql
-- Enums y tabla de usuarios siguiendo el esquema de referencia en @db-schema.
-- Relación: daycares 1─┬─< users (un usuario pertenece a un daycare; un daycare tiene muchos usuarios).

-- 1. Extensión pgcrypto (requerida por gen_random_uuid y crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Enumeraciones (valores en inglés, según convención del esquema)
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

-- 3. Tabla users
-- Perfil de aplicación vinculado a Supabase Auth. Padres y staff comparten tabla,
-- diferenciados por `role`. La autenticación (email, contraseña) vive en auth.users;
-- esta tabla solo guarda datos de dominio.
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid REFERENCES daycares(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Cada usuario autenticado lee su propia fila.
CREATE POLICY "users read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- El staff lee todos los usuarios de su propio daycare.
CREATE POLICY "users read staff daycare"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'staff'
      AND u.daycare_id = users.daycare_id
  )
);

-- Escritura (INSERT) restringida a staff.
CREATE POLICY "users insert staff only"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'staff'
  )
);

-- Escritura (UPDATE) restringida a staff.
CREATE POLICY "users update staff only"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'staff'
  )
);

-- Escritura (DELETE) restringida a staff.
CREATE POLICY "users delete staff only"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'staff'
  )
);

-- 6. Función SECURITY DEFINER para rellenar users desde auth.users al signup.
-- Lee daycare_id, role y full_name de raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_daycare_id uuid;
  v_role user_role;
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_daycare_id := NULLIF(NEW.raw_user_meta_data->>'daycare_id', '')::uuid;
    v_role := NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role;
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
    COALESCE(v_role, 'parent'),
    'active',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Usuario'),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger AFTER INSERT en auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Seed: usuario staff de prueba (roberto@gmail.com / 123456) en Guardería Sala Soles.
-- Se crea en auth.users; el trigger (punto 7) rellena la fila en users.
DO $$
DECLARE
  v_daycare_id uuid;
  v_user_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_daycare_id FROM daycares WHERE name = 'Guardería Sala Soles' LIMIT 1;

  IF v_daycare_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'roberto@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'authenticated',
      'authenticated',
      'roberto@gmail.com',
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'daycare_id', v_daycare_id::text,
        'role', 'staff',
        'full_name', 'Roberto Staff'
      ),
      now(),
      now()
    );
  END IF;
END $$;


