-- supabase/migrations/0001_create_daycares.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daycares read for authenticated"
ON daycares
FOR SELECT
TO authenticated
USING (true);

-- Escritura: por ahora cualquier usuario autenticado puede escribir.
-- La restricción a solo 'staff' se añadirá cuando exista la tabla users
-- (relación daycares 1─< users) en una especificación posterior.
CREATE POLICY "daycares write for authenticated"
ON daycares
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Datos de ejemplo (seed) para la tabla daycares
INSERT INTO daycares (name) VALUES
  ('Guardería Sala Soles'),
  ('Guardería Arcóiris'),
  ('Guardería Semillitas'),
  ('Guardería Estrellitas');
