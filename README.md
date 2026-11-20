# Open DayCare

Reimplementación open source de una app de guardería (feed de novedades, niños, invitaciones a familias, resumen del día). El dominio y los textos visibles están en español; el código interno está en inglés.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** (config CSS-first con `@theme` en `app/globals.css`)
- **Supabase** (Postgres, Auth y RLS) — proyecto alojado, no local
- **Resend** para el envío de mails de invitación
- **ESLint** (flat config de `eslint-config-next`)

> El proyecto **no usa la base local de Supabase** (`supabase start`): trabaja contra un proyecto alojado en Supabase. No necesitás Docker para levantar la app.

---

## Requisitos

- **Node.js 20+** y **npm**
- Una cuenta de **Supabase** con acceso a la organización del proyecto (te la da un Owner/Administrator del equipo)
- **Supabase CLI** (solo si vas a aplicar migraciones o vincular el proyecto desde la terminal)
- Opcional: **OpenCode** con el MCP de Supabase para trabajar con la base desde el agente

---

## 1. Poner a punto el proyecto

```bash
git clone <repo-url>
cd 06-open-daycare
npm install
```

### Variables de entorno

El repo trae `.env.template` con todas las variables. Creá tu archivo local a partir de él:

```bash
cp .env.template .env.local
```

En Windows (PowerShell):

```powershell
Copy-Item .env.template .env.local
```

Completá los valores:

| Variable | Para qué sirve | Dónde se obtiene |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (`https://<ref>.supabase.co`) | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Key pública (`sb_publishable_...`) que usa el cliente | Supabase Dashboard → Project Settings → API Keys |
| `SUPABASE_DB_PASSWORD` | Password de Postgres, **solo para el CLI** (`db push`) | La comparte el Owner del proyecto; no se usa en runtime |
| `RESEND_API_KEY` | Envío de mails de invitación | [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM` | Remitente del mail | En modo test de Resend: `Open DayCare <onboarding@resend.dev>` |
| `APP_URL` | URL base para los links de activación | En local: `http://localhost:3000` |

Notas:

- `.env*` está en `.gitignore`; **nunca** commitees `.env.local`.
- `NEXT_PUBLIC_*` se expone en el navegador. Ahí va únicamente la **publishable key**; nunca la `service_role` ni la secret key.
- Si ya tenés un `.env` andando, Next.js también lo lee. `.env.local` tiene prioridad.

---

## 2. Autenticación del equipo en Supabase

### 2.1 Acceso al proyecto (una sola vez por persona)

Cada integrante usa **su propia cuenta** de Supabase. Nunca se comparten cuentas, tokens ni la password de la base.

1. Un **Owner** o **Administrator** de la organización invita al integrante desde:
   **Dashboard → Organization → Team → Invite** (`https://supabase.com/dashboard/org/_/team`).
2. La invitación llega por mail y **vence a las 24 horas**.
3. Al aceptarla, el integrante ya puede ver el proyecto en el Dashboard.

Roles de organización recomendados:

| Rol | Uso sugerido |
| --- | --- |
| **Owner / Administrator** | Solo para quienes gestionan la organización, el proyecto y la base |
| **Developer** | Desarrollo diario: lee y escribe datos, no cambia configuración del proyecto |
| **Read-Only** | Consulta y diagnóstico (disponible en planes Team/Enterprise) |

> Si el integrante no ve el proyecto después de aceptar, verificá que el rol sea a nivel organización o que tenga un rol *project-scoped* sobre ese proyecto.

### 2.2 Login del Supabase CLI

El CLI se autentica contra la **Management API** con un **personal access token (PAT)**. El flujo normal abre el navegador y guarda el token en el keyring del sistema:

```bash
supabase login
```

Alternativas:

```bash
# Sin abrir el navegador (te pide pegar el token)
supabase login --no-browser

# Token directo, útil en CI o entornos sin navegador
supabase login --token sbp_xxxxxxxxxxxxxxxxx
```

Los tokens se generan en **Dashboard → Account → Access tokens**: <https://supabase.com/dashboard/account/tokens>.

Verificá con:

```bash
supabase whoami
supabase projects list
```

`supabase projects list` debe mostrar el proyecto del equipo. Si no aparece, el problema es de permisos de la organización, no del CLI.

Para cerrar sesión:

```bash
supabase logout
```

> **Recomendación de seguridad:** usá tokens **scoped** (empiezan con `sbp_fc...`) limitados a la organización/proyecto y a los permisos que necesitás. El flujo del navegador crea un token clásico con acceso total a la cuenta. En CI definí `SUPABASE_ACCESS_TOKEN` con un token scoped en lugar de hacer `supabase login`.

### 2.3 Vincular el repo al proyecto

Una vez logueado, vinculá el checkout con el proyecto remoto. El **project ref** está en la URL del Dashboard o en **Project Settings → General** (también lo lista `supabase projects list`):

```bash
supabase link --project-ref <project-ref>
```

- Te va a pedir la **database password** (podés dejarla vacía y usar `SUPABASE_DB_PASSWORD`).
- El CLI guarda el ref en `supabase/.temp/project-ref` (ignorado por git).

`supabase link` necesita los permisos **Project Settings**, **API Keys** y **API Key Secrets** (lectura) del token.

### 2.4 Autenticación del MCP de Supabase

El repo usa el **Supabase MCP server** (`https://mcp.supabase.com/mcp`) para que el agente consulte la base, lea logs y aplique migraciones.

El servidor puede configurarse globalmente (`~/.config/opencode/opencode.json`) o por proyecto (`opencode.json` en la raíz). Forma recomendada, limitada a este proyecto:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "type": "remote",
        "url": "https://mcp.supabase.com/mcp?project_ref=<project-ref>",
        "enabled": true
      }
    }
  }
}
```

Opcionalmente podés acotar más la superficie con query params:

- `read_only=true` — solo lecturas (ideal para diagnóstico)
- `features=database,docs` — habilita solo esos grupos de tools

Autenticá el MCP con OAuth (abre el navegador):

```bash
opencode mcp auth supabase
```

Completá el flujo eligiendo la **organización que contiene el proyecto** y verificá la conexión:

```bash
opencode mcp list
```

> El MCP usa OAuth 2.1 y **no necesita un PAT**. El acceso se apoya en los permisos de tu cuenta dentro de la organización: si no sos miembro, el flujo de OAuth no va a habilitar las tools.
>
> En CI o entornos sin navegador, configurá el header `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>` con un token scoped. No pongas tokens en archivos versionados.

### 2.5 Resumen del onboarding

1. Un Owner invita a la persona a la organización y le da rol **Developer**.
2. La persona acepta la invitación y crea su PAT en el Dashboard.
3. `supabase login` → `supabase whoami` → `supabase projects list`.
4. `supabase link --project-ref <project-ref>`.
5. `opencode mcp auth supabase` y elegir la organización correcta.
6. Completar `.env.local` con la URL, la publishable key y (si hace falta) `SUPABASE_DB_PASSWORD`.

---

## 3. Base de datos y migraciones

Las migraciones viven en `supabase/migrations/` y son la **única fuente de verdad** del schema. Nunca se cambia la base remota sin una migración correspondiente.

Migraciones actuales:

| Archivo | Contenido |
| --- | --- |
| `0001_create_daycares.sql` | Tabla `daycares` + seed |
| `0002_create_users.sql` | Tabla `users`, trigger de alta y seed del usuario staff |
| `0003_fix_auth_user_seed.sql` | Corrección del seed de `auth.users` / `auth.identities` |
| `0004_fix_users_rls_recursion.sql` | Corrección de recursión en políticas RLS |
| `0005_create_rooms_and_children.sql` | Tablas `rooms` y `children` + seed |
| `0006_create_invitations_and_parent_children.sql` | Invitaciones y vínculo `parent_children` |
| `0007_fix_handle_new_user_search_path.sql` | Fix de `search_path` en el trigger de alta |
| `0008_set_parent_daycare_on_accept.sql` | Asigna la guardería al aceptar una invitación |

### Opción A — Aplicar por MCP / Dashboard (sin CLI)

Pedile al agente que aplique la migración pendiente vía MCP (`apply_migration`), o pegá el SQL en **Dashboard → SQL Editor**. Es el camino más simple si solo necesitás el schema al día.

### Opción B — Aplicar con el CLI

Requiere el proyecto vinculado (`supabase link`) y `SUPABASE_DB_PASSWORD` disponible.

```bash
# Si el repo no tiene supabase/config.toml, generá uno una sola vez
supabase init

# Ver qué se va a aplicar, sin tocar la base
supabase db push --dry-run

# Aplicar
supabase db push

# Ver el estado local vs. remoto
supabase migration list
```

En PowerShell, para la password del entorno:

```powershell
$env:SUPABASE_DB_PASSWORD="tu-password"
```

En bash:

```bash
export SUPABASE_DB_PASSWORD="tu-password"
```

> `db push` pide confirmación antes de tocar la base remota y, en ejecuciones no interactivas, requiere `--yes`. Los comandos que usan la password de la base no están limitados por los permisos del PAT.

### Nueva migración

```bash
supabase migration new <descripcion_en_snake_case>
```

Editá el archivo generado, probá el SQL y recién después aplicalo. Después de cualquier cambio de schema:

```bash
npm run lint
npm run build
```

---

## 4. Levantar la app

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El proxy (`proxy.ts`) redirige a `/login` si no hay sesión y protege `/` y `/kids`.

**Credenciales de desarrollo** (creadas por la migración `0002`): `roberto@gmail.com` / `123456`.

> Ese usuario existe solo si las migraciones se aplicaron sobre la base. Si el login devuelve "credenciales inválidas", primero verificá que las migraciones estén al día.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Dev server con Turbopack |
| `npm run build` | Build de producción (incluye chequeo de tipos) |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

Verificación mínima antes de abrir un PR: `npm run lint` + `npm run build`.

---

## Estructura del repo

```
app/                  Rutas y pantallas (login, activate-account, kids, feed)
app/components/       Componentes de UI
lib/                  Lógica de dominio (auth, children, invitations, feed)
utils/supabase/       Clientes de Supabase (server, client, middleware)
supabase/migrations/  Migraciones SQL (fuente de verdad del schema)
proxy.ts              Protección de rutas y refresh de sesión
references/           Comps HTML y screenshots del app original
specs/                Especificaciones funcionales
```

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `supabase: command not found` | CLI no instalado o fuera del PATH | Instalarlo ([guía oficial](https://supabase.com/docs/guides/local-development/cli/getting-started)) o usar `npx supabase ...` |
| `Cannot find project ref. Have you run supabase link?` | El checkout no está vinculado | `supabase link --project-ref <ref>` |
| `supabase projects list` vacío o 403 | La cuenta no pertenece a la organización o el token no tiene permisos | Pedir la invitación / revisar el scope del PAT |
| MCP sin tools o error de auth | Falta OAuth o el proyecto está fuera del scope | `opencode mcp auth supabase`, elegir la org correcta, `opencode mcp list` |
| `supabaseUrl is required` / `Invalid API key` | Faltan variables de entorno | Completar `.env.local` y reiniciar `npm run dev` |
| Login: "credenciales inválidas" con el usuario demo | Migraciones sin aplicar | Aplicar migraciones (`db push` o MCP) |
| Errores de RLS / `permission denied for table` | Políticas desactualizadas o sesión sin usuario | Revisar la migración correspondiente y que haya sesión activa |
| Mail de invitación no llega | Resend en modo test o `RESEND_FROM` inválido | Usar `onboarding@resend.dev` como remitente o verificar el dominio |

---

## Seguridad

- No commitees `.env.local`, tokens (`sbp_...`) ni la database password.
- Usá tokens **scoped** para CLI, MCP en CI y agentes.
- La `service_role` / secret key nunca va en el cliente ni en variables `NEXT_PUBLIC_*`.
- Para diagnósticos y agentes, preferí conexiones con `read_only=true` y solo el `project_ref` del proyecto.
- Cada persona usa su propia cuenta; el acceso se revoca quitándola de la organización.

## Docs

- [Next.js](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Personal Access Tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)
- [Access Control (roles de organización)](https://supabase.com/docs/guides/platform/access-control)
