<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## El proyecto

Open DayCare: reimplementación open source de una app de guardería. El scaffold de Next.js está recién creado (`app/` solo tiene el layout, la página y estilos del template); el trabajo real es portar las pantallas que están en `references/`.

- `references/pantallas/*.dc.html` — comps HTML autocontenidos de cada pantalla del app original (login, feed, niños, perfil de niño, resumen del día, publicaciones, avisos, cuenta y vistas de familia). `index.dc.html` es la galería con enlaces a todas. Se abren directo en el navegador (traen su propio runtime en `support.js`); no forman parte del build de Next.
- `references/screenshots/*.png` — capturas del app original.
- Diseño de referencia: fuentes Fredoka (títulos) + Nunito (texto) y paleta cálida (fondo `#f6ecdf`, tarjetas `#fffdf9`, texto `#3f362e`, acento `#f2a78e`). Ojo: `app/globals.css` aún tiene el look por defecto de create-next-app (Geist).
- El dominio está en español (niños, avisos, resumen del día); conserva los términos al implementar.

## Comandos

- `npm run dev` — dev server con Turbopack.
- `npm run lint` — ESLint (flat config de `eslint-config-next`).
- `npm run build` — build de producción; también corre el chequeo de tipos. No hay script aparte de typecheck ni suite de tests. Verificación mínima: `npm run lint` + `npm run build`.

## Quirks del stack

- `cacheComponents` y `partialPrefetching` están activos en `next.config.ts` — cambian la semántica de caché/prefetch; consulta la doc de Next 16 antes de asumir los defaults.
- Tailwind v4 sin `postcss.config` ni `tailwind.config`: se cablea vía `turbopack.rules` (loader `@tailwindcss/turbopack`) y se configura CSS-first con `@theme` en `app/globals.css`. No agregues config de PostCSS.
- Imports: `@/*` mapea a la raíz del repo (`@/app/...`, `@/lib/...`); no existe `src/`.
- Los bloques `nextjs-agent-*` de este archivo los escribe `next dev` (`experimental.agentFeedback`): no los borres del diff; commitea el archivo con tus cambios.
- `__MACOSX/` es basura de un unzip de macOS que quedó commiteada; ignórala, no es código.

## MCPs

- Playwright: los screenshots y cualquier cosa relacionada con Playwright tienen que estar en la carpeta `.playwright-mcp` (está en .gitignore).
- Context7: usar este MCP para traer la documentación actualizada del framework.
- Supabase: servidor MCP en `https://mcp.supabase.com/mcp`. Úsalo para operaciones de base de datos, auth, storage, Edge Functions, migraciones, diagnósticos (logs) y gestión de proyectos. Requiere autenticación OAuth 2.1 o un token de acceso personal scoped en `Authorization: Bearer`. Ver `.mcp.json` en la raíz del proyecto.

## Supabase + Next.js (acceso a base de datos)

La app usa los paquetes oficiales de Supabase para consultar y mutar la base de datos desde Next.js:

- `@supabase/supabase-js` — cliente de Supabase (querys, auth, storage, etc.).
- `@supabase/ssr` — helpers de cliente para Server Components, Browser Components y middleware.

Archivos creados en `utils/supabase/`:

- `server.ts` — `createClient(cookieStore)` para Server Components (usa `createServerClient`).
- `client.ts` — `createClient()` para Browser Components (usa `createBrowserClient`).
- `middleware.ts` — `createClient(request)` helper para renovar sesiones de auth en cada request.

Las variables de entorno viven en `.env.local` (no se commitea, está en `.gitignore` bajo `.env*`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Uso recomendado: importar `createClient` desde `@/utils/supabase/server` en Server Components y desde `@/utils/supabase/client` en componentes cliente. No consultes la base de datos directamente desde el navegador sin pasar por estos clientes.


## Migraciones de base de datos

Siempre que se manipule la base de datos (crear tablas, alterar columnas, insertar seed data, etc.), debe hacerse a través de un archivo de migración SQL en `supabase/migrations/`, siguiendo el patrón de Supabase CLI (nombre en `snake_case` con prefijo numérico, ej. `0001_create_daycares.sql`). No se realizan cambios directos en la base de datos remota sin una migración correspondiente. Cada migración se aplica al proyecto de Supabase vía Supabase MCP o dashboard SQL Editor, y se verifica con `npm run lint` + `npm run build`.

## Spec Driven Development - Skills y agente

Skills instaladas (registradas en `skills-lock.json` y disponibles en `.agents/skills/`):

- `spec` (fuente: `klerith/fernando-skills`) — para crear especificaciones de funcionalidades. Comando `/spec`.
- `spec-impl` (fuente: `klerith/fernando-skills`) — para implementar a partir de una especificación. Comando `/spec-impl`.
- `supabase` (fuente: `supabase/agent-skills`, versión 0.1.2) — usar para CUALQUIER tarea que involucre Supabase: base de datos, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues; integraciones de cliente y SSR (`supabase-js`, `@supabase/ssr`) en Next.js; problemas de auth (sesiones, JWT, cookies, RLS); Supabase CLI o MCP server; cambios de esquema, migraciones, esquemas declarativos, auditorías de seguridad; depuración de errores de Supabase (HTTP, Postgres, PostgREST, RLS, storage, Edge Functions, logs). Guía detallada en `.agents/skills/supabase/SKILL.md`.

- `/spec` — crear las especificaciones.
- `/spec-impl` — usar esta skill para hacer las implementaciones.
- `/verify-spec` — comando (`.opencode/commands/verify-spec.md`) para verificar los criterios de aceptación de un spec: se delega en el agente verificador y acepta la ruta del spec como argumento (ej. `/verify-spec specs/02-ninos.md`); sin argumento revisa todos los specs de `specs/*.md`.
- Especs de base de datos: cualquier archivo de especificación que tenga que ver con la base de datos (tablas, esquemas, consultas, migraciones complementarias, etc.) debe ir en la carpeta `spec/database/`.


## Agente spec-verifier

El agente `spec-verifier` (definido en `.opencode/agents/spec-verifier.md`) es el único que marca/desmarca los checks del bloque "Criterios de aceptación" de los specs en `specs/*.md`, siempre con evidencia real:

- Verifica criterios automáticos con `npm run lint` / `npm run build`, criterios de código leyendo el código (consultando Context7 de Next.js antes de juzgar convenciones del framework) y criterios visuales comparando screenshots de Playwright contra los comps de `references/pantallas/` o los screenshots de `references/screenshots/`.
- Solo edita el bloque "Criterios de aceptación" de los specs: si encuentra un bug de código, desmarca el criterio y reporta la corrección necesaria, pero no toca `app/`, `lib/`, configs ni ningún otro archivo.
- No confía en checks previos: re-verifica cada criterio aunque ya esté marcado `[x]`, y deja un reporte con tabla de veredictos (✅ / ❌ / ⚠️) y lista de pendientes.
- Ya está disponible como subagente (`agent: spec-verifier`), y el comando `/verify-spec` lo invoca por nosotros.

## Reglas de codigo
- Usar codigo limpio, nombres, funciones, variables, clases y todo lo demas en ingles


