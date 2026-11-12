# SPEC 09 — Mantenimiento de niños: salas y niños desde Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (daycares) y SPEC 08 (users) de `specs/databases/`; SPEC 02 (niños); SPEC 04 (agregar niño); SPEC 07 (autenticación)
> **Fecha:** 2026-11-10
> **Objetivo:** Crear las tablas `rooms` y `children` con RLS y seed de tres salas (Soles, Luna y Estrellas en Guardería Sala Soles) mediante `supabase/migrations/0005_create_rooms_and_children.sql` y conectar `/kids`, su modal «Agregar niño» y el perfil `/kids/[childId]` a Supabase para listar y crear niños reales, sin seed de niños.

## Por qué existe esta spec

Es la primera pantalla que consume datos reales: `/kids` hoy renderiza el mock `lib/kids-data.ts` y el modal de SPEC 04 guardaba con un toast falso. Las salas del modal están hardcodeadas; esta spec las reemplaza por las tres salas seed y establece el patrón Server Component + Server Action + `revalidatePath` que reutilizarán las futuras pantallas de mantenimiento.

## Scope

**In:**

- Migración `supabase/migrations/0005_create_rooms_and_children.sql`: `pgcrypto`, tabla `rooms`, enum `child_status`, tabla `children`, RLS staff-only en ambas, helper `private.is_staff_in_room()` y seed de 3 salas.
- Aplicar la migración al proyecto de Supabase (MCP o SQL Editor).
- `lib/children.ts` (reemplaza a `lib/kids-data.ts`): queries server-side (`getStaffDaycareId`, `listRoomsWithChildren`, `getChildById`), tipos de vista `RoomView`/`ChildView` y mappers (edad, fechas en español, etiquetas de alergia, paleta de avatares).
- `app/kids/page.tsx`: lista desde BD; un divisor por sala con conteo real (`SALA SOLES · 0 niños`, etc.) ordenado por `created_at`; grid vacío sin niños.
- `AddChildDialog`: select SALA alimentado desde BD (prop `rooms`); Guardar llama un Server Action (`app/kids/actions.ts`) que inserta en `children`; toast «Niño agregado» real; `revalidatePath('/kids')`.
- `app/kids/[childId]`: perfil dinámico por `uuid` real con guard `notFound()`; sin `generateStaticParams`.
- `KidCard`: tipo `ChildView`; subtítulo «X años · sin padres vinculados»; badge de alergia solo desde `allergy_tags`; sin badge VINCULAR.
- Panel PADRES VINCULADOS del perfil sin filas, con «Vincular otro padre» como `#`.
- Eliminación de `lib/kids-data.ts` y limpieza de imports.
- Verificación: `npm run lint` + `npm run build` + Playwright + prueba funcional con `roberto@gmail.com`.

**Out of scope (para futuras specs):**

- `parent_children`, `invitations` y cualquier vínculo real de padres; el modal Vincular padre (SPEC 05) sigue mock.
- Edición de niño y borrado lógico (`status = 'archived'` existe en el schema, sin UI).
- Mantenimiento de salas (CRUD de `rooms` en UI).
- Búsqueda/filtrado funcional de la lista.
- `photo_consent` y `avatar_url`: columnas con defaults, sin UI.
- Feed (`/`) contra BD y perfil real del sidebar.

## Data model

```sql
-- supabase/migrations/0005_create_rooms_and_children.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE child_status AS ENUM ('active', 'archived');

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

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER (patrón de 0004: esquema private, search_path='')
-- private.is_staff_in_room(target_room_id uuid) → staff de la guardería dueña de la sala

-- Políticas (SELECT/INSERT/UPDATE/DELETE) en ambas tablas, solo para rol staff
-- de la guardería correspondiente; sin acceso de padres aún (no existe parent_children).

-- Seed: 3 salas de «Guardería Sala Soles», en orden estable por created_at
INSERT INTO rooms (daycare_id, name, created_at)
SELECT d.id, s.name, now() + (s.ord * interval '1 second')
FROM daycares d
CROSS JOIN (VALUES ('Soles', 0), ('Luna', 1), ('Estrellas', 2)) AS s(name, ord)
WHERE d.name = 'Guardería Sala Soles';
```

```ts
// lib/children.ts — código interno en inglés, textos visibles en español
export type RoomView = { id: string; label: string };

export type ChildView = {
  id: string;                 // children.id (uuid) → URL /kids/{uuid}
  firstName: string;          // full_name.split(" ")[0]
  lastName: string;           // resto; inicial usada en el avatar (convención SPEC 02)
  ageLabel: string;           // "3 años", calculado desde birth_date
  parentsLinkedLabel: string; // fijo: "sin padres vinculados" (hasta spec de parent_children)
  avatarBg: string;           // paleta determinista: hash(id) % pares
  avatarFg: string;
  allergyTag?: string;        // allergy_tags[0] traducido: peanut→MANÍ, lactose→LACTOSA, gluten→GLUTEN; fallback: tag.toUpperCase()
  birthDateLabel: string;     // "12 mar 2022" (meses abreviados es)
  roomLabel: string;          // nombre de la sala (JOIN rooms)
  enrolledLabel: string;      // "feb 2025"
  allergyNotice?: string;     // medical_notes (banner rojo solo si viene)
};
```

- **Alergias:** el input libre del modal («maní, lactosa») se parte por coma, se traduce a tags en inglés (`maní→peanut`, `lactosa→lactose`, `gluten→gluten`; desconocidos se guardan tal cual en minúscula) y se almacena en `allergy_tags text[]` (nota del schema: UI traduce, BD guarda inglés).
- **Fecha del modal:** `dd/mm/aaaa` → `yyyy-mm-dd` antes del insert.
- **Insert del Server Action:** `{ room_id, full_name, birth_date, allergy_tags, medical_notes }`; `enrolled_at` usa el default `CURRENT_DATE`; `status`/`photo_consent` usan defaults.
- **Paleta de avatares:** pares `{bg, fg}` extraídos de los colores de SPEC 02 (`#A9D9E8/#1F7A93`, `#C9B6E8/#5E4392`, etc.); índice = hash estable del uuid.

## Plan de implementación

1. Crear `supabase/migrations/0005_create_rooms_and_children.sql` (tabla `rooms`, enum `child_status`, tabla `children`, RLS, helper `private.is_staff_in_room()`, políticas staff-only en las 4 operaciones de ambas tablas, seed de 3 salas). *Manual: SQL sintácticamente válido; FKs a `daycares` y `rooms`.*
2. Aplicar la migración vía Supabase MCP (o SQL Editor). *Manual: `rooms` tiene 3 filas (Soles, Luna, Estrellas) en Guardería Sala Soles; `children` existe con 0 filas; políticas visibles en `pg_policy`.*
3. Crear `lib/children.ts`: queries con `createClient` de `@/utils/supabase/server` + tipos `RoomView`/`ChildView` + mappers (edad, formato de fecha es, mapa de alergias, paleta). Consultar la doc de Next 16 (Context7) sobre `cacheComponents` + `cookies()` antes de cablear. *Manual: tipos y funciones compilan.*
4. `app/kids/page.tsx`: server component async — obtiene el `daycare_id` del staff (`users` own row), lista salas con sus niños `status = 'active'`; un divisor por sala con su conteo; `AddChildDialog` recibe `rooms` como prop. *Manual: `/kids` muestra 3 divisores con 0 niños, idéntica al comp en estructura.*
5. `app/kids/actions.ts`: Server Action `addChild` — valida servidor (nombre, fecha, sala), inserta en `children`, `revalidatePath('/kids')`, retorna `{ error }`. *Manual: insert visible en Supabase.*
6. `AddChildDialog`: eliminar `ROOMS` hardcodeado; `handleSave` invoca la acción vía form; toast solo en éxito; error de servidor bajo el form. *Manual: alta real de un niño lo hace aparecer en su sala.*
7. `KidCard` + `kid-profile-content`: migrar a `ChildView`; quitar rama VINCULAR y los datos mock; perfil sin `generateStaticParams` (Suspense + `params`), fetch por uuid con guard `notFound()`; panel de padres sin filas. Tipos `Parent`/`ParentStatus` se mueven a `linked-parent-row.tsx` (archivo queda sin uso visible hasta la spec de padres). *Manual: `/kids/{uuid}` de un niño real renderiza sus datos; uuid inválido → 404.*
8. Borrar `lib/kids-data.ts` y sus imports residuales.
9. Verificación final: `npm run lint` + `npm run build`, screenshots Playwright (`.playwright-mcp/`) desktop+móvil del estado vacío y con un niño creado, contra `references/pantallas/ninos.dc.html`.

## Criterios de aceptación

- [x] `supabase/migrations/0005_create_rooms_and_children.sql` existe e incluye `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
- [x] `rooms` tiene `id` (uuid PK), `daycare_id` (FK → `daycares`), `name` (text), `created_at`; `children` tiene las 9 columnas del esquema `@db-schema` (`id`, `room_id` FK → `rooms`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags text[]`, `photo_consent`, `status child_status`, `created_at`/`updated_at`).
- [x] Enum `child_status` con valores `active` / `archived`.
- [x] RLS habilitado en ambas tablas con políticas SELECT/INSERT/UPDATE/DELETE solo-staff (vía `private.is_staff_in_daycare` / `private.is_staff_in_room`, `SECURITY DEFINER` con `SET search_path = ''`).
- [x] Migración aplicada en Supabase: exactamente 3 salas seed (Soles, Luna, Estrellas) en «Guardería Sala Soles» y `children` en 0 filas.
- [x] `/kids` con sesión de staff muestra tres divisores «SALA SOLES · 0 niños», «SALA LUNA · 0 niños», «SALA ESTRELLAS · 0 niños» en ese orden, sin ningún niño mock.
- [x] El select SALA del modal lista las 3 salas de la BD; no queda ningún array `ROOMS` hardcodeado.
- [x] «Guardar» con campos válidos inserta una fila real en `children` (fecha ISO, `room_id` correcto, `allergy_tags` en inglés, `enrolled_at` = hoy, `status` = `active`), muestra el toast y la card aparece bajo su sala sin recargar manualmente.
- [x] La validación del modal (obligatorios + máscara de fecha) sigue funcionando; un error del servidor se muestra en el modal y no cierra.
- [x] La card muestra «X años · sin padres vinculados», avatar determinista y badge de alergia (MANÍ/LACTOSA/…) solo si `allergy_tags` tiene valores; no existe el badge VINCULAR.
- [x] `/kids/[childId]` lee el niño real por uuid (nacimiento «12 mar 2022», sala, ingreso «feb 2025», banner rojo solo con `medical_notes`); uuid desconocido → `notFound()`.
- [x] El buscador sigue siendo decorativo; «Volver a Niños» y logout siguen funcionando.
- [x] `lib/kids-data.ts` eliminado, sin imports rotos; `linked-parent-row.tsx` conserva sus tipos propios.
- [x] `npm run lint` + `npm run build` pasan; sin errores en consola; internal code en inglés, UI en español.

## Decisiones

- **Sí:** una sola migración `0005` para ambas tablas — son un par atómico (`children` FK a `rooms`) y fue la opción elegida por el usuario.
- **No:** dos archivos separados (patrón 0001/0002) — descartada por el usuario en la pregunta de granularidad.
- **Sí:** salas seed = Soles, Luna y Estrellas (los nombres del modal de SPEC 04), solo en «Guardería Sala Soles», daycare del staff seed `roberto@gmail.com` (respuesta del usuario).
- **No:** crear 3 salas por cada uno de los 4 daycares seed — descartado; basta la guardería con usuario de prueba.
- **No:** seed de niños — «no ocupamos ningún niño en la tabla» (respuesta del usuario); la creación se prueba con el modal.
- **Sí:** estado vacío = divisores por sala con 0 niños (respuesta del usuario).
- **Sí:** RLS solo-staff reutilizando los helpers de 0004; nuevo `private.is_staff_in_room()` para la política de `children` — evita consultar `rooms` dentro de la política con su propio RLS.
- **No:** dar lectura de salas/niños a todos los autenticados — no hay `parent_children` todavía; se abre en la spec de padres.
- **Sí:** `parentsLinkedLabel` fijo «sin padres vinculados», avatar por hash del uuid, sin badge VINCULAR, panel de padres vacío (respuesta del usuario).
- **Sí:** `enrolled_at DEFAULT CURRENT_DATE` porque el modal no pide fecha de ingreso; `photo_consent`/`status` usan defaults.
- **Sí:** alergias guardadas en inglés (`peanut`) y traducidas en la UI (nota del `@db-schema`), con mapa fijo `maní→peanut`, `lactosa→lactose`, `gluten→gluten` y passthrough para desconocidas.
- **Sí:** perfil pasa a dinámico (sin `generateStaticParams`): con BD no hay lista estable al build; el guard `notFound()` rechaza uuid inválidos.
- **No:** pantallas de editar/archivar niño, CRUD de salas y buscador real — specs futuras.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `cacheComponents` puede cachear `/kids` y no reflejar sesiones/inserciones | El server client lee `cookies()` (dinámico); verificar con Context7 la semántica de `revalidatePath` antes del paso 4; probar alta real en el navegador. |
| Recursión RLS en políticas de `children` al validar la sala | Helper `private.is_staff_in_room()` SECURITY DEFINER con `SET search_path = ''`, mismo patrón que resolvió 0004. |
| Conversión `dd/mm/aaaa` → ISO incorrecta (p. ej. 31/12, bisiestos) | Validador del modal ya existe (SPEC 04); revalidar en el Server Action con prueba explícita de fechas límite. |
| `full_name` con un solo token rompe `lastName`/avatar | Mapper con fallback: si no hay apellido, inicial del primer nombre; probado en la verificación manual. |
| RLS bloquea la lectura si `users.daycare_id` del staff no coincide con la sala seed | Seed atado al mismo daycare del staff `roberto@gmail.com`; prueba de smoke con esa cuenta. |

## Lo que **no** está en esta spec

- Vinculación real de padres (`parent_children`, `invitations`) y estados ACTIVA/PENDIENTE reales.
- Editar niño, archivar (`status = 'archived'`) y borrado.
- Alta/edición de salas (UI de `rooms`).
- Búsqueda y filtrado funcionales; feed `/` contra BD.
- UI de `photo_consent`, `avatar_url` y consentimiento de fotos.

Cada uno de esos, si aterriza, va en su propia spec.
