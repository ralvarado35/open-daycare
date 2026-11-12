# SPEC 10 — Vinculación de padres: tablas `invitations` y `parent_children`

> **Estado:** Borrador
> **Depende de:** SPEC de BD 08 (users/trigger), SPEC de BD 09 (`rooms`/`children`); SPEC 08 de `specs/` (invitación + activación, consume estas tablas)
> **Fecha:** 2026-11-11
> **Objetivo:** Crear en `supabase/migrations/0006_create_invitations_and_parent_children.sql` los enums `relationship_type` e `invitation_status`, las tablas `invitations` y `parent_children` con RLS staff-only + lectura familiar, y las funciones `SECURITY DEFINER` `public.lookup_invitation` y `public.accept_invitation` que hacen posible invitar y activar cuentas sin exponer las invitaciones al público.

## Por qué existe esta spec

La referencia `@db-schema` define `invitations` y `parent_children` pero no existen en el proyecto (las migraciones llegan hasta 0005). El flujo de la SPEC 08 de `specs/` necesita validar códigos de invitación desde una página anónima (`/activate-account` pre-login) y crear el vínculo padre↔niño al activar — operaciones que el RLS normal no puede expresar sin funciones controladas. Esta spec fija el esquema exacto, las políticas y las funciones; la feature (modal, Resend, activation) vive en la SPEC 08 funcional.

## Scope

**In:**

- Migración `supabase/migrations/0006_create_invitations_and_parent_children.sql`:
  - Enums `relationship_type` (`father/mother/guardian`) e `invitation_status` (`pending/accepted/expired/cancelled`).
  - Tabla `invitations` con los campos exactos de `@db-schema` §6 (`id`, `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code UNIQUE`, `status`, `expires_at`, `accepted_at`, `created_at`).
  - Tabla `parent_children` con los campos de `@db-schema` §5 (`id`, `parent_id`, `child_id`, `relationship`, `created_at`, `UNIQUE (parent_id, child_id)`).
  - Helper `private.is_staff_in_child(target_child_id uuid)` siguiendo el patrón 0004/0005 (esquema `private`, `SECURITY DEFINER`, `SET search_path = ''`, fully-qualified, `REVOKE FROM PUBLIC` + `GRANT TO authenticated`).
  - RLS en ambas tablas (políticas abajo).
  - Funciones `public.lookup_invitation(p_code text)` (ejecutable por `anon`) y `public.accept_invitation(p_code text, p_email text)` (solo `authenticated`).
- Aplicar la migración vía Supabase MCP (o SQL Editor) y verificarla con queries.

**Out of scope (para futuras specs):**

- Toda la UI/feature (modal real, Resend, `/activate-account` funcional) — SPEC 08 de `specs/`.
- Expiración programada (cron que pase `pending` vencidas a `expired`) — `expires_at` se chequea en lectura; un job queda para otra spec.
- Columnas de consentimiento de fotos en invitaciones — no existen en la referencia de schema.
- Backfill de `parent_children` para cuentas seed existentes.

## Data model

```sql
-- supabase/migrations/0006_create_invitations_and_parent_children.sql
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

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

CREATE TABLE parent_children (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id     uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
```

### Helper RLS

```sql
-- private.is_staff_in_child(target_child_id) → ¿el usuario actual es staff de la
-- guardería dueña de la sala del niño? JOIN children→rooms→users con auth.uid(),
-- SECURITY DEFINER, SET search_path = '', nombres fully-qualified (patrón 0004).
```

### Políticas RLS

- `invitations` — SELECT/INSERT/UPDATE (sin DELETE expuesto al staff por UI, queda a futuro): `USING (private.is_staff_in_child(child_id))`. Sin políticas para `anon`/padres: la lectura pre-login es solo vía `lookup_invitation`.
- `parent_children` — SELECT: `USING (parent_id = (SELECT auth.uid()) OR private.is_staff_in_child(child_id))` (el padre ve sus vínculos; el staff del daycare también). INSERT/UPDATE/DELETE no se exponen: toda escritura pasa por `accept_invitation`.

### Funciones `SECURITY DEFINER`

```sql
-- public.lookup_invitation(p_code text) RETURNS jsonb — GRANT EXECUTE a anon y authenticated
--   Busca invitations por code; retorna NULL si no existe.
--   Campos mínimos: { childFirstName, childRoomName, fullName, relationship,
--                     email, statusDerivado, expiresAt }
--     statusDerivado = 'expired' si status='pending' y expires_at < now(),
--                      si no, el status guardado.
--   No expone invited_by ni ids internos del staff.

-- public.accept_invitation(p_code text, p_email text) RETURNS void
--   GRANT EXECUTE solo a authenticated; REVOKE FROM PUBLIC.
--   1. parent_id := auth.uid(); si NULL, RAISE.
--   2. SELECT ... FOR UPDATE de la invitación por code; debe existir,
--      status='pending' y expires_at >= now(); RAISE 'invalid_or_expired' si no.
--   3. email comparado case-insensitive (lower/trim); RAISE 'email_mismatch' si difiere.
--   4. INSERT parent_children (parent_id, child_id, relationship) — ON CONFLICT
--      (parent_id, child_id) DO NOTHING; si ya existía vínculo, RAISE 'already_linked'.
--   5. UPDATE invitations SET status='accepted', accepted_at=now().
```

- Errores como SQLSTATE custom o `RAISE EXCEPTION USING MESSAGE`; la capa TS (SPEC 08) los mapea a mensajes en español.
- Ambas funciones: `SET search_path = ''` + referencias fully-qualified (`public.*`, `auth.*`), igual que los helpers de 0004.

## Plan de implementación

1. Crear `supabase/migrations/0006_create_invitations_and_parent_children.sql` con el orden de arriba: extensiones no necesarias (`pgcrypto`/`gen_random_uuid` ya están por 0002/0005), enums, tablas, `is_staff_in_child`, políticas, `lookup_invitation`, `accept_invitation`, grants. *Manual: SQL sintácticamente válido; FKs a `children` y `users`.*
2. Aplicar la migración vía Supabase MCP. *Manual: `list_migrations` la muestra; `\d invitations` / `\d parent_children` (o query a `information_schema`) confirman columnas y constraints.*
3. Verificar RLS: *Manual: `pg_policy` muestra las políticas; un SELECT anon a `invitations` devuelve 0 filas/error; el padre seed (si se crea en la prueba E2E de SPEC 08) solo lee sus `parent_children`.*
4. Smoke de funciones: *Manual: insertar una invitación `pending` a mano (SQL Editor) → `lookup_invitation` anónimo devuelve el json esperado; `accept_invitation` con sesión de un usuario de prueba marca `accepted` e inserta el vínculo; con código inválido/expirado/email distinto levanta los errores definidos.*

## Criterios de aceptación

- [ ] Existe `supabase/migrations/0006_create_invitations_and_parent_children.sql` y está aplicada en el proyecto (visible en `list_migrations` vía MCP).
- [ ] `relationship_type` tiene `father/mother/guardian`; `invitation_status` tiene `pending/accepted/expired/cancelled`.
- [ ] `invitations` tiene las 11 columnas del `@db-schema` §6 con FKs a `children` (CASCADE) y `users` (RESTRICT) y `code` UNIQUE.
- [ ] `parent_children` tiene las 5 columnas del `@db-schema` §5 con FKs a `users`/`children` (CASCADE) y `UNIQUE (parent_id, child_id)`.
- [ ] RLS habilitado en ambas tablas; `invitations` accesible solo a staff del daycare del niño (`private.is_staff_in_child`, SECURITY DEFINER con `SET search_path = ''`, `REVOKE FROM PUBLIC`).
- [ ] `parent_children`: SELECT solo para el padre propio o staff del niño; sin políticas de escritura directas.
- [ ] `public.lookup_invitation(p_code)` es ejecutable por `anon`, retorna NULL para códigos inexistentes y `statusDerivado='expired'` para pendientes vencidas, sin exponer `invited_by`.
- [ ] `public.accept_invitation(p_code, p_email)` es ejecutable solo por `authenticated`, exige `auth.uid()`, bloquea concurrencia con `FOR UPDATE`, valida pendiente/no vencida/email case-insensitive, inserta `parent_children` y marca `accepted` + `accepted_at` en una sola transacción.
- [ ] Prueba manual: flujo aceptar → invitación `accepted`, `parent_children` creada, segunda pasada con el mismo código levanta error (no duplica).
- [ ] Ninguna política o función introduce recursión RLS (patrón 0004 verificado con SELECT reales por staff y por padre).

## Decisiones

- **Sí:** una sola migración `0006` para ambas tablas — son el contrato atómico del flujo de vinculación (patrón elegido por el usuario, igual que 0005).
- **Sí:** campos y enums exactos de la referencia `@db-schema` (decisión del usuario); `ON DELETE CASCADE` de `children` hacia ambas y `RESTRICT` de `invited_by` (borrar staff no borra la historia de invitaciones… pero CASCADE desde `users` al borrar padre sí rompe el historial → `invited_by RESTRICT`).
- **Sí:** `lookup_invitation` retorna solo campos mínimos (nombre del niño/sala, parentesco, estado derivado) — la card de `/activate-account` no necesita ids internos y el json mínimo reduce superficie si la función se expone mal.
- **Sí:** `accept_invitation` hace todo el acceptance (guard + vínculo + marca) en una transacción con `FOR UPDATE` — un solo punto de escritura, sin exposición de INSERT/UPDATE por RLS.
- **Sí:** el estado `expired` se deriva en lectura (y lo persiste solo opcionalmente el futuro cron); `expires_at` manda.
- **No:** exponer SELECT de `invitations` a padres con email matching — habilitaría enumeration por RLS; la validación anónima pasa solo por la función acotada.
- **No:** trigger de `handle_new_user` extendido ni cambios a `users` — la metadata de `signUp` ya cubre rol/nombre (0002).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `SET search_path = ''` con nombres partially-qualified rompe las funciones | Escribir SIEMPRE fully-qualified (`public.invitations`, `auth.uid()`, `private.*`) como en 0004; smoke del paso 4 en SQL Editor antes de cerrar. |
| Enum `expired` guardado vs derivado se desalinean si algún futuro job escribe | La capa de lectura usa `statusDerivado`; el job real queda fuera (otra spec) y al existir deberá reconciliar con `expires_at`. |
| Doble activación concurrente del mismo código por el mismo padre | `FOR UPDATE` + `UNIQUE(parent_id, child_id)` + chequeo `status='pending'` dentro de la misma transacción. |
| `lookup_invitation` habilita probing de códigos | Códigos de 5 chars de alfabeto reducido ≈ 38^5; el probe solo revela nombre del niño (dato que el invitado ya recibió por correo). Aceptado para MVP; rate-limiting futuro si se expande. |

## Lo que **no** está en esta spec

- Feature/UI del flujo (modal, Resend, `/activate-account`, `/login`) — SPEC 08 de `specs/`.
- Cron de expiración, gestión UI de invitaciones, consentimiento de fotos persistido.
- Backfill de vínculos para cuentas existentes.

Cada uno de esos, si aterriza, va en su propia spec.
