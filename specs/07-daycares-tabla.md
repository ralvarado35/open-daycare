# SPEC 07 — Primera tabla de base de datos: daycares

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-11-08
> **Objetivo:** Crear la primera tabla de base de datos (`daycares`) mediante un archivo de migración SQL en `supabase/migrations/0001_create_daycares.sql`, aplicarlo al proyecto de Supabase y habilitar RLS, siguiendo el esquema de referencia en `@docs` (opendaycare-database-schema.md).

## Por qué existe esta spec

Hasta ahora el proyecto solo usa datos mock en `lib/` (feed-data.ts, kids-data.ts, nav.ts) y no tiene capa de persistencia ni cliente de Supabase. `daycares` es la entidad raíz del esquema de referencia: todos los usuarios (`users`) y salas (`rooms`) dependen de ella, por lo que es la tabla que debe crearse primero. Esta spec establece el patrón de migraciones que usarán las futuras tablas del esquema.

## Scope

**In:**

- Archivo de migración SQL `supabase/migrations/0001_create_daycares.sql` con:
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (requerido por `gen_random_uuid()`).
  - `CREATE TABLE daycares (...)` con `id uuid PK default gen_random_uuid()`, `name text`, `created_at timestamptz`.
  - `ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;`
  - Política de lectura: `SELECT` para usuarios autenticados (`auth.role() = 'authenticated'`).
  - Política de escritura: `INSERT` restringida (nota: la comprobación de rol `staff` se endurecerá cuando exista la tabla `users` en una especificación posterior, pues hoy no hay tabla de usuarios contra la que hacer join).
- Aplicar la migración al proyecto de Supabase (vía Supabase MCP o dashboard SQL) para que la tabla `daycares` exista en la base de datos remota.
- Verificación: `npm run lint` + `npm run build` sin errores y confirmación de que la tabla `daycares` existe en Supabase.

**Out of scope (para futuras specs):**

- Crear el cliente de Supabase en `lib/supabase.ts` (se acordó en las respuestas de clarificación: solo la migración de la tabla).
- Crear las tablas `users`, `rooms`, `children`, etc. del esquema (cada una en su propia spec).
- Triggers de `auth.users`, función `SECURITY DEFINER`, RLS fina por rol `staff` (requiere la tabla `users`).
- Cualquier código de Next.js (páginas, componentes, API routes) que consuma la tabla.

## Data model

```sql
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
```

Convenciones del esquema respetadas: PK `id` tipo `uuid` con `gen_random_uuid()`, `created_at` tipo `timestamptz`, nombres de tabla y columnas en inglés.

## Plan de implementación

1. Crear el directorio `supabase/migrations/` y el archivo `0001_create_daycares.sql` con el SQL del Data model. *Manual: el archivo existe y el SQL es sintácticamente válido para Postgres.*
2. Aplicar la migración al proyecto de Supabase (vía Supabase MCP ejecutando el SQL, o dashboard SQL Editor). *Manual: la tabla `daycares` aparece en el editor de tablas de Supabase con las columnas id, name y created_at.*
3. Verificación: ejecutar `npm run lint` y `npm run build` para confirmar que no hay regresiones, y consultar Supabase para confirmar que la tabla `daycares` existe. *Manual: lint y build pasan; la tabla está en Supabase.*

## Criterios de aceptación

- [ ] El archivo `supabase/migrations/0001_create_daycares.sql` existe.
- [ ] La migración incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
- [ ] La tabla `daycares` tiene las columnas `id` (uuid PK, default `gen_random_uuid()`), `name` (text) y `created_at` (timestamptz), tal como el esquema de `@docs`.
- [ ] RLS está habilitado en `daycares` (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [ ] Existe una política `SELECT` para usuarios autenticados.
- [ ] La migración se aplicó al proyecto de Supabase y la tabla `daycares` es consultable allí.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** `supabase/migrations/0001_create_daycares.sql` como ubicación y nombre, siguiendo el patrón Supabase CLI (respuesta del usuario).
- **Sí:** Incluir `CREATE EXTENSION IF NOT EXISTS pgcrypto;` porque `id` usa `gen_random_uuid()` (respuesta del usuario).
- **Sí:** Aplicar la migración ahora a Supabase vía MCP/dashboard (respuesta del usuario).
- **Sí:** RLS habilitado con lectura para autenticados y escritura restringida (respuesta del usuario).
- **No:** No se crea `lib/supabase.ts` en esta spec (respuesta del usuario; el cliente va en una spec posterior).
- **No:** No se crean las demás tablas del esquema (`users`, `rooms`, ...) ni triggers de `auth.users`; cada una irá en su propia spec.
- **Nota:** La política de escritura usa `auth.uid() IS NOT NULL` porque la tabla `users` (con el rol `staff`) aún no existe; la comprobación de rol se añadirá cuando se implemente la tabla `users`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| No se tiene token/configuración de Supabase MCP para aplicar la migración automáticamente | Dejar el archivo SQL listo y aplicar manualmente vía dashboard SQL Editor si el MCP no está autenticado; el criterio de aceptación de "tabla en Supabase" se verifica entonces por consulta directa. |
| La tabla `users` no existe aún, por lo que no se puede hacer join para restringir escritura a `staff` | Política de escritura usa `auth.uid() IS NOT NULL` como medida transitoria; se endurece cuando exista `users` (futura spec). Documentado en Decisiones. |
| `gen_random_uuid()` falla si `pgcrypto` no está instalada | Se incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto;` al inicio de la migración. |

## Lo que **no** está en esta spec

- Cliente de Supabase (`lib/supabase.ts`) ni cualquier código de Next.js que consulte la tabla.
- Las tablas `users`, `rooms`, `children`, `posts`, etc. del esquema de referencia.
- Triggers de `auth.users`, función `SECURITY DEFINER`, `raw_user_meta_data`, RLS fina por rol.
- Pantallas de la UI (día del registro de guardería, listado, etc.).

Cada uno de esos, si aterriza, va en su propia spec.
