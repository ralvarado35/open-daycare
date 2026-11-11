-- supabase/migrations/0003_fix_auth_user_seed.sql
-- Corrige el usuario staff de prueba (roberto@gmail.com) para Supabase Auth:
-- 1. Asigna instance_id = '00000000-0000-0000-0000-000000000000' en auth.users (GoTrue lo requiere en proyectos alojados).
-- 2. Asigna cadena vacía '' a tokens/campos de auth que GoTrue escanea como strings no nulos (confirmation_token, recovery_token, email_change_token_new, email_change).
-- 3. Crea el registro en auth.identities para el proveedor 'email', necesario para signInWithPassword.

DO $$
BEGIN
  -- 1. Actualizar instance_id y columnas de token en auth.users
  UPDATE auth.users
  SET
    instance_id = '00000000-0000-0000-0000-000000000000',
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '')
  WHERE email = 'roberto@gmail.com';

  -- 2. Insertar identidad en auth.identities si no existe
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    id,
    id,
    jsonb_build_object('sub', id::text, 'email', email),
    'email',
    id::text,
    now(),
    now(),
    now()
  FROM auth.users
  WHERE email = 'roberto@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = auth.users.id AND provider = 'email'
    );
END $$;
