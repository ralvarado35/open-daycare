# SPEC 08 — Tabla de usuarios y enums respectivos

> **Estado:** Aprobado
> **Depende de:** SPEC 07
> **Fecha:** 2026-11-08
> **Objetivo:** Crear los enums `user_role` y `user_status` y la tabla `users` mediante un archivo de migración SQL en `supabase/migrations/0002_create_users.sql`, aplicar RLS, crear el trigger de `auth.users` y dejar un usuario staff listo para pruebas, siguiendo el esquema de referencia en `@db-schema`.

## Por qué existe esta spec

Hasta ahora el proyecto solo tiene la tabla `daycares` (SPEC 07) y datos mock en `lib/`. La tabla `users` es la segunda entidad del esquema de referencia: depende de `daycares` (FK `daycare_id`) y de `auth.users` (Supabase Auth). Todos los usuarios (padres y staff) comparten esta tabla, diferenciados por `role`. Esta spec establece los enums, la tabla, RLS, el trigger de onboarding y un usuario staff de prueba para poder validar el flujo de autenticación posterior.

## Scope

**In:**

- Archivo de migración SQL `supabase/migrations/0002_create_users.sql` con:
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
  - `CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');`.
  - `CREATE TYPE user_status AS ENUM ('pending', 'active');`.
  - `CREATE TABLE users (...)` con todas las columnas del esquema de referencia (`id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`) y FKs correctas.
  - `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`.
  - Políticas RLS: cada usuario lee su propia fila; el staff lee todos los usuarios de su daycare; escritura (`INSERT`/`UPDATE`/`DELETE`) restringida a staff.
  - Función `SECURITY DEFINER` + trigger `AFTER INSERT ON auth.users` que rellena `users` desde `raw_user_meta_data` (`daycare_id`, `role`, `full_name`).
  - Seed del usuario staff de prueba `roberto@gmail.com` / `123456` vinculado a `Guardería Sala Soles`.
- Aplicar la migración al proyecto de Supabase (vía Supabase MCP o dashboard SQL Editor) para que la tabla `users`, los enums y el trigger existan en la base de datos remota.
- Verificación: `npm run lint` + `npm run build` sin errores y confirmación de que la tabla `users`, los enums y el staff existen en Supabase.

**Out of scope (para futuras specs):**

- Crear el cliente de Supabase en `lib/supabase.ts` (se acordó: solo la migración de la tabla).
- Crear las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc. (cada una en su propia spec).
- Pantallas de UI (login, registro, perfil, etc.).
- Cualquier código de Next.js que consuma la tabla.

## Data model

```sql
-- supabase/migrations/0002_create_users.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (ver archivo SQL completo para los detalles de cada política)
-- "users read own profile": auth.uid() = id
-- "users read staff daycare": staff lee usuarios de su daycare
-- "users insert/update/delete staff only": escritura restringida a staff

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Seed: roberto@gmail.com / 123456, rol staff, daycare Guardería Sala Soles.
```

Convenciones del esquema respetadas: PK `id` tipo `uuid` con `gen_random_uuid()`, `created_at` / `updated_at` tipo `timestamptz`, nombres de tabla y columnas en inglés, enums en inglés, FK `id` → `auth.users(id)` con `ON DELETE CASCADE` (implícita por la vinculación de Supabase Auth), FK `daycare_id` → `daycares(id)`.

## Datos de ejemplo (seed)

Se inserta un usuario staff de prueba para poder validar el flujo:

- Email: `roberto@gmail.com`
- Contraseña: `123456`
- Rol: `staff`
- Estado: `active`
- Nombre completo: `Roberto Staff`
- Daycare: `Guardería Sala Soles` (uno de los 4 seed de SPEC 07)

El usuario se crea en `auth.users` mediante el bloque `DO` de la migración; el trigger `on_auth_user_created` rellena la fila correspondiente en `users` leyendo `raw_user_meta_data`.

## Plan de implementación

1. Crear el archivo `supabase/migrations/0002_create_users.sql` con el SQL del Data model (enums, tabla, RLS, políticas, función con fallback en caso de `full_name` nulo, trigger, seed). *Manual: el archivo es sintácticamente válido para Postgres y referencia `daycares` de SPEC 07.*
2. Aplicar la migración al proyecto de Supabase (vía Supabase MCP ejecutando el SQL, o dashboard SQL Editor). *Manual: la tabla `users`, los enums y el trigger aparecen en el editor de tablas/funciones de Supabase. El bloque `DO` del seed inserta `roberto@gmail.com` en `auth.users` y el trigger lo propaga a `public.users`.*
3. Verificación: ejecutar `npm run lint` y `npm run build` para confirmar que no hay regresiones, y consultar Supabase para confirmar que la tabla `users` existe con sus columnas, los enums `user_role` / `user_status` están definidos, el trigger existe y el staff `roberto@gmail.com` es consultable. *Manual: lint y build pasan; la tabla, el trigger y el staff están en Supabase.*

## Criterios de aceptación

- [x] El archivo `supabase/migrations/0002_create_users.sql` existe.
- [x] La migración incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
- [x] Se definen los enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`).
- [x] La tabla `users` tiene las columnas `id` (uuid PK, default `gen_random_uuid()`), `daycare_id` (uuid FK → `daycares`), `role` (`user_role`), `status` (`user_status`, default `active`), `full_name` (text), `avatar_url` (text, nullable), `notify_on_post` (boolean default `true`), `daily_summary_enabled` (boolean default `true`), `created_at` / `updated_at` (timestamptz), tal como el esquema de `@db-schema`.
- [x] RLS está habilitado en `users` (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [x] Existe una política `SELECT` para que cada usuario lea su propia fila (`auth.uid() = id`).
- [x] Existe una política `SELECT` para que el staff lea los usuarios de su daycare.
- [x] Existen políticas `INSERT`/`UPDATE`/`DELETE` restringidas a `role = 'staff'`.
- [x] Existe una función `SECURITY DEFINER` + trigger `AFTER INSERT ON auth.users` que rellena `users` desde `raw_user_meta_data`.
- [x] La migración se aplicó al proyecto de Supabase y la tabla `users` es consultable allí.
- [x] El usuario staff `roberto@gmail.com` / `123456` existe y está vinculado a `Guardería Sala Soles`.
- [x] `npm run lint` y `npm run build` pasan sin errores.

### Reporte de verificación (spec-verifier)

| # | Criterio | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | Archivo `0002_create_users.sql` existe | ✅ | Leído, en `supabase/migrations/` |
| 2 | `CREATE EXTENSION IF NOT EXISTS pgcrypto;` | ✅ | Línea 6 del archivo SQL |
| 3 | Enums `user_role` / `user_status` | ✅ | Ambos existen en `pg_type` del proyecto remoto |
| 4 | Tabla `users` con todas las columnas | ✅ | 10 columnas verificadas en `information_schema.columns` |
| 5 | RLS habilitado | ✅ | `relrowsecurity = true` en `pg_class` |
| 6 | Política SELECT propia fila | ✅ | `users read own profile` (cmd=r) en `pg_policy` |
| 7 | Política SELECT staff daycare | ✅ | `users read staff daycare` (cmd=r) en `pg_policy` |
| 8 | Políticas INSERT/UPDATE/DELETE staff only | ✅ | 3 políticas (cmd=a, w, d) en `pg_policy` |
| 9 | Función SECURITY DEFINER + trigger | ✅ | `prosecdef=true` en `pg_proc`; trigger `on_auth_user_created` en `auth.users` |
| 10 | Migración aplicada, tabla consultable | ✅ | Tabla `public.users` existe en Supabase remoto |
| 11 | Usuario `roberto@gmail.com` / `123456` | ✅ | Verificado en `auth.users` y `public.users` vinculado a daycare `Guardería Sala Soles` |
| 12 | `npm run lint` + `npm run build` | ✅ | Ambos pasaron sin errores |

**Nota:** El seed del usuario staff `roberto@gmail.com` se ejecutó exitosamente. El usuario existe tanto en `auth.users` como en `public.users` con rol `staff` y vinculado a `Guardería Sala Soles`. Adicionalmente la función trigger maneja fallback de `full_name` para evitar fallos de constraint NOT NULL al registrar usuarios desde cualquier interfaz.

## Decisiones

- **Sí:** `supabase/migrations/0002_create_users.sql` como ubicación y nombre, siguiendo el patrón Supabase CLI (respuesta del usuario).
- **Sí:** Enums y tabla en la misma migración para que quede atómico (respuesta del usuario).
- **Sí:** RLS con política (a): usuario lee su propia fila; staff lee todos los usuarios de su daycare (respuesta del usuario).
- **Sí:** Trigger `AFTER INSERT` en `auth.users` (función `SECURITY DEFINER`) incluido en esta migración (respuesta del usuario).
- **Sí:** Seed de usuario staff `roberto@gmail.com` / `123456`, rol `staff`, en `Guardería Sala Soles` (respuesta del usuario).
- **Sí:** El seed se crea en `auth.users` mediante bloque `DO` y el trigger rellena `users` automáticamente.
- **No:** No se crea `lib/supabase.ts` en esta spec (respuesta del usuario; el cliente va en una spec posterior).
- **No:** No se crean las demás tablas del esquema (`rooms`, `children`, ...); cada una irá en su propia spec.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| No se tiene token/configuración de Supabase MCP para aplicar la migración automáticamente | Dejar el archivo SQL listo y aplicar manualmente vía dashboard SQL Editor si el MCP no está autenticado. |
| La tabla `auth.users` puede tener constraints que impidan el insert directo del seed | El bloque `DO` verifica `NOT EXISTS (email)` antes de insertar sin depender de `auth.instances` (innecesario en Supabase alojado) y el trigger maneja fallback de `full_name`. |
| `gen_random_uuid()` falla si `pgcrypto` no está instalada | Se incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto;` al inicio de la migración (ya instalada en SPEC 07). |
| El trigger podría crear filas duplicadas en `users` si se re-aplica la migración | El INSERT en la función usa `ON CONFLICT (id) DO NOTHING`. |

## Lo que **no** está en esta spec

- Cliente de Supabase (`lib/supabase.ts`) ni cualquier código de Next.js que consulte la tabla.
- Las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc. del esquema de referencia.
- Pantallas de la UI (login, registro, perfil, etc.).

Cada uno de esos, si aterriza, va en su propia spec.
