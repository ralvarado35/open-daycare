# SPEC 07 — Autenticación email/password y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-11-09
> **Objetivo:** Implementar autenticación real de email y contraseña contra Supabase Auth y proteger las rutas `/` (feed) y `/kids` (niños) con el proxy de Next.js (`proxy.ts`), redirigiendo a no autenticados a `/login` y a autenticados que entren a `/login` o `/activate-account` de vuelta a `/`, con logout funcional.

## Por qué existe esta spec

SPEC 03 dejó la autenticación real, las sesiones y los guards fuera de alcance ("solo interfaces"). Hoy `/login` y `/activate-account` son pantallas estáticas sin backend, y `/` y `/kids` son accesibles sin sesión. Esta spec añade la autenticación real contra Supabase (solo email + password) y la protección de rutas, dejando la app funcional para un usuario autenticado (el seed `roberto@gmail.com / 123456` ya existe en `auth.users` vía la migración 0002).

## Scope

**In:**

- `/login`: pasa de pantalla estática a formulario real de inicio de sesión (email + password) contra `supabase.auth.signInWithPassword`; en éxito redirige a `/`; en error muestra un mensaje en pantalla. Conserva el diseño visual del comp de SPEC 03 (panel degradado, 2 columnas, etiquetas `EMAIL`/`CONTRASEÑA`, CTA "Iniciar sesión", link "Activá tu cuenta").
- Logout real: el botón de la user card del sidebar (`SidebarContent`) pasa de `<Link href={logoutHref}>` a un botón que llama `supabase.auth.signOut()` y redirige a `/login`.
- `proxy.ts` (nuevo, raíz): proxy de Next.js con `createServerClient` de `@supabase/ssr`; obtiene la sesión con `supabase.auth.getUser()`. Rutas protegidas `/` y `/kids` (incluido `/kids/[childId]`) redirigen a `/login` si no hay sesión. Rutas públicas `/login` y `/activate-account` redirigen a `/` si hay sesión. Matcher excluye `_next/static`, `_next/image`, `favicon.ico` y archivos de imagen.
- `lib/nav.ts`: se elimina `logoutHref` (ya no usado); se mantienen `loginHref`, `activateAccountHref`, `forgotPasswordHref` y `familyFeedHref`.
- No hay nueva migración SQL: Supabase Auth gestiona `auth.users`; el trigger de la migración 0002 ya cubre la creación de perfiles en `users` para futuros sign-ups.

**Out of scope (para futuras specs):**

- Registro / sign-up de nuevos usuarios (no hay pantalla de alta; se usa el seed existente).
- Confirmación de email (se define después; el flujo no bloquea en la app).
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" sigue como `#`).
- Vistas de familia (`familyFeedHref` sigue como `#`).
- Perfil de usuario dinámico en el sidebar (la user card sigue siendo mock visual).
- Cualquier ruta protegida más allá de `/`, `/kids` y `/kids/[childId]`.

## Data model

Esta feature **no introduce estructuras de datos nuevas**. Reusa `auth.users` de Supabase Auth y la tabla `users` (migración 0002). No se crea ninguna tabla ni migración nueva.

## Plan de implementación

1. `proxy.ts` (nuevo, raíz): proxy de Next.js con `createServerClient` de `@supabase/ssr`; lee la sesión con `supabase.auth.getUser()`. `/` y `/kids` (prefijo, cubre `/kids/[childId]`) redirigen a `/login` sin sesión; `/login` y `/activate-account` redirigen a `/` con sesión. Matcher excluye static, imágenes y favicon. *Manual: `next build` compila el proxy sin errores.*
2. `app/login/actions.ts` (nuevo): Server Action (`'use server'`) con `createServerClient(await cookies())` y `signInWithPassword({ email, password })`; retorna `{ error }` o hace `redirect('/')`. *Manual: se invoca desde el form de `/login`.*
3. `app/login/page.tsx`: convierte la página estática en formulario real (`'use client'` + Server Action) que llama al login; éxito redirige a `/`; error muestra mensaje. Conserva el diseño visual del comp de SPEC 03. *Manual: `/login` acepta credenciales y redirige a `/`.*
4. `app/components/sidebar.tsx`: el botón de logout de la user card deja de ser `<Link href={logoutHref}>` y pasa a ser un `<button>` que llama `supabase.auth.signOut()` (cliente, `createClient` de `@/utils/supabase/client`) y `router.push('/login')`. *Manual: clic en "Cerrar sesión" cierra la sesión y lleva a `/login`.*
5. `lib/nav.ts`: elimina `logoutHref` (export huérfano); deja el resto intacto. *Manual: `lib/nav.ts` compila sin exports sin uso.*
6. Verificación: `npm run lint` + `npm run build` + prueba funcional (login con `roberto@gmail.com / 123456` → `/`; logout → `/login`; acceso a `/` y `/kids` sin sesión → `/login`; acceso a `/login` con sesión → `/`).

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` pasan sin errores (incluye TypeScript y el proxy).
- [x] El proxy protege `/` y `/kids`: sin sesión, acceder a ellas redirige a `/login`.
- [x] El proxy redirige a `/` si un usuario autenticado accede a `/login` o `/activate-account`.
- [x] `/login` permite iniciar sesión con email y contraseña reales contra Supabase; credenciales válidas (`roberto@gmail.com / 123456`) redirigen a `/`.
- [x] `/login` muestra un mensaje de error cuando las credenciales son inválidas.
- [x] El botón "Cerrar sesión" del sidebar cierra la sesión (`signOut`) y redirige a `/login`.
- [x] Tras el logout, acceder a `/` o `/kids` redirige a `/login`.
- [x] El código interno está en inglés; los textos visibles de la UI quedan en español.
- [x] No hay dependencias nuevas (`@supabase/ssr` y `@supabase/supabase-js` ya están instaladas).
- [x] No se agrega ninguna migración SQL nueva.

## Decisiones tomadas y descartadas

- **Sí:** Middleware de Next.js (raíz `proxy.ts`) para la protección de rutas, patrón documentado por Next.js (`protectedRoutes`/`publicRoutes` + `NextResponse.redirect`). Es la forma estándar y cubre el render del lado del servidor sin flash de contenido.
- **No:** Proteger rutas solo en Server Components con `redirect()` — requeriría tocar cada página/layout y deja huecos en el proxy.
- **Sí:** Server Action para el login (`signInWithPassword` con `createServerClient(await cookies())`) — la cookie de sesión la escribe el servidor y es compatible con el proxy de `@supabase/ssr`.
- **No:** `signInWithPassword` directo desde el cliente con `createBrowserClient` — funciona, pero el Server Action mantiene la lógica de sesión en el servidor y es el patrón recomendado de Supabase + Next.js App Router.
- **Sí:** Proteger `/` y `/kids` (prefijo `/kids` cubre `/kids/[childId]`); dejar `/login` y `/activate-account` públicos.
- **No:** Proteger solo `/login` — no tiene sentido; las rutas que guardan datos son `/` y `/kids`.
- **Sí:** Logout en el sidebar (user card), botón cliente con `signOut()` + `router.push('/login')`.
- **No:** Logout como enlace `<Link href>` — `signOut` es una mutación, no una navegación GET.
- **Sí:** No hay migración nueva; Supabase Auth gestiona `auth.users` y el trigger de 0002 rellena `users` al registrarse (futuro).
- **No:** Crear tabla o migración para auth en esta spec — `auth.users` es gestionada por Supabase.
- **Sí:** Registro/sign-up fuera de alcance; se usa el seed `roberto@gmail.com / 123456` de la migración 0002.
- **No:** Pantalla de alta de usuarios en esta spec.
- **Sí:** "¿Olvidaste tu contraseña?" y "Activar mi cuenta" siguen como `#` (fuera de alcance).
- **No:** Implementar recuperación de contraseña ni activación real por invitación.
- **Sí:** Sidebar user card sigue como mock visual ("Caro Giménez"); no se trae el perfil real de Supabase.
- **No:** Consultar `users`/`auth` para mostrar nombre/avatar del usuario logueado (requiere otra spec de perfiles).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El proxy redirige `/` a `/login` y queda en un loop si la cookie de sesión no se escribe | Probar el flujo completo login → `/` → logout → `/login`; verificar cookies en DevTools. |
| `cacheComponents` / `partialPrefetching` de Next 16 afectan la detección de sesión | El proxy se ejecuta en cada request antes del render; la sesión se lee de cookies, no de la caché de componentes. |
| `signInWithPassword` en Server Action y `redirect('/')` no propagan la cookie de sesión | Usar `createServerClient(await cookies())` exactamente como en `utils/supabase/server.ts`; verificar en build y prueba real. |
| `/kids/[childId]` no queda protegido si solo se matchea `/kids` exacto | Usar `pathname.startsWith('/kids/')` además de `pathname === '/kids'`. |
