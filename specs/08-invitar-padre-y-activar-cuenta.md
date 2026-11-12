# SPEC 08 — Vincular padre: invitación real por correo y activación de cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (modal UI), SPEC 07 (autenticación), SPEC de BD 09 (rooms/children), SPEC de BD 10 (`invitations`/`parent_children`)
> **Fecha:** 2026-11-11
> **Objetivo:** Convertir el modal "Vincular padre" en un flujo real: crea la invitación en Supabase (código único de 5 caracteres, vence en 7 días), envía un correo con Resend que incluye el link de activación, y `/activate-account` valida el código para registrar al padre en Supabase Auth (`role parent`) y crear el vínculo `parent_children`, redirigiendo luego a `/login` con mensaje de éxito.

## Por qué existe esta spec

SPEC 05 dejó el modal como interfaz pura (código fijo `7K4P9`, CTA muerto); SPEC 07 trajo autenticación real con Supabase. Esta spec cierra el loop de onboarding staff→familia: aterriza las tablas `invitations` y `parent_children` de la referencia `@db-schema`, integra Resend por primera vez y convierte `/activate-account` (SPEC 03, estática) en un registro funcional. El usuario pidió explícitamente una sola spec para todo el flujo (modal → correo → activación).

## Scope

**In:**

- Migración `supabase/migrations/0006_create_invitations_and_parent_children.sql` (detalle completo en SPEC de BD 10, `specs/databases/10-invitations-y-parent-children.md`): enums `relationship_type` y `invitation_status`, tablas `invitations` y `parent_children`, RLS con helper `private.is_staff_in_child()`, y las funciones `SECURITY DEFINER` `public.lookup_invitation` (validación anónima) y `public.accept_invitation` (acepte autenticado). Aplicada vía Supabase MCP.
- Dependencia `resend` (paquete de Node que llama la API REST de Resend con `RESEND_API_KEY`) + variables server-only `RESEND_API_KEY`, `RESEND_FROM`, `APP_URL` en `.env` y `.env.template` (ninguna con prefijo `NEXT_PUBLIC`).
- `LinkParentDialog` real: el CTA "Enviar invitación" invoca una Server Action que genera el código, guarda la invitación `pending` (cancelando pendientes previas del mismo niño+email) y envía el correo. El bloque CÓDIGO DE INVITACIÓN muestra placeholder "— / Se genera al enviar" antes del envío y el código real + "Correo enviado a <email>" en el estado de éxito; botón "Listo" cierra el modal; errores visibles en español.
- Plantilla de correo HTML en español (marca cálida de la app): nombre del niño, código visible, vencimiento en 7 días y CTA a `${APP_URL}/activate-account?code=XXXXX`.
- `/activate-account` real: lee `?code=` para prellenar el campo, muestra la card del niño dinámica desde `lookup_invitation`, y su Server Action valida código+email+contraseña, hace `signUp` en Supabase Auth (`role: 'parent'`, `full_name` de la invitación — el trigger de 0002 crea la fila en `users`) y ejecuta `accept_invitation` (invitación → `accepted`, crea `parent_children` con el parentesco). Redirige a `/login?activated=1`.
- `/login` muestra banner de éxito "Cuenta activada. Iniciá sesión." cuando llega `?activated=1`.
- Mapeo de parentesco: Mamá→`mother`, Papá→`father`, Tutor/a→`guardian`.
- Paso manual documentado: desactivar "Confirm email" en Authentication → Sign In / Up del dashboard de Supabase (si no, el `signUp` no devuelve sesión y el login posterior falla).
- Verificación: `npm run lint` + `npm run build` + Playwright (estados del modal, activate-account con `?code=`, login con banner; desktop y móvil) + prueba E2E manual del flujo completo.

**Out of scope (para futuras specs):**

- Vista de familia / feed del padre (tras activar y loguear, el padre cae en `/` que hoy es el feed de staff).
- Contador dinámico "N padres vinculados" en el perfil del niño ni filas reales en el panel PADRES VINCULADOS (sigue el label fijo de SPEC de BD 09).
- Persistir la autorización de fotos (el checkbox queda visual; la referencia de schema no modela consent de invitación).
- UI de listado/gestión de invitaciones para staff (cancelar, reenviar), recordatorios de vencimiento, cron que marque `expired`.
- Vincular una cuenta existente a un segundo niño (email ya registrado = error).
- Dominio de envío verificado en Resend (se usa modo test `onboarding@resend.dev`: solo entrega a la dirección de la cuenta Resend).
- Recuperación de contraseña.

## Data model

El esquema completo (tablas, enums, RLS, funciones DEFINER) vive en la **SPEC de BD 10**. Resumen del contrato de aplicación:

```sql
invitations(id, child_id → children, invited_by → users, full_name, email,
            relationship relationship_type, code UNIQUE, status invitation_status,
            expires_at, accepted_at, created_at)

parent_children(id, parent_id → users, child_id → children,
                relationship relationship_type, created_at, UNIQUE (parent_id, child_id))
```

- La validación anónima del código (pre-login) usa `public.lookup_invitation(p_code)`; el acceptance usa `public.accept_invitation(p_code, p_email)` con `auth.uid()` interno. Ninguna tabla de `invitations` es legible por no-staff vía RLS normal.
- `signUp` pasa metadata `{ role: "parent", full_name: <invitación.full_name> }`; el trigger `handle_new_user` (0002) crea la fila `users` con `role parent`, `status active` y `daycare_id NULL`.

Tipos de aplicación (código interno en inglés, textos visibles en español):

```ts
// lib/invitations.ts
type Relation = "mama" | "papa" | "tutor";   // UI → mother | father | guardian

type SendInvitationResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

// app/activate-account/actions.ts
type ActivateAccountResult = { ok: true } | { ok: false; error: string };
```

Código de invitación: 5 caracteres del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin `0/1/I/O` ambiguos), generado con `crypto.randomInt` y retry en colisión de `UNIQUE`. Formato análogo al mock `7K4P9`.

## Plan de implementación

1. `supabase/migrations/0006_create_invitations_and_parent_children.sql` (SPEC de BD 10) y aplicarla vía Supabase MCP. *Manual: `list_migrations` + query MCP confirman tablas, enums, políticas RLS y las dos funciones.*
2. `npm i resend`; agregar `RESEND_API_KEY`, `RESEND_FROM` (default `Open DayCare <onboarding@resend.dev>`) y `APP_URL` (default `http://localhost:3000`) a `.env` y `.env.template`. *Manual: `npm run build` resuelve el import de `resend` sin exponerlo al cliente.*
3. `lib/invitations.ts`: `createInvitation({ childId, invitedBy, fullName, email, relationship })` — cancela `pending` previas del mismo niño+email, genera código anti-colisión, inserta con `expires_at = now() + 7 days`, retorna la fila. *Manual: invocada desde la acción del paso 5 crea la fila visible en Supabase.*
4. `lib/invitation-email.ts`: `sendInvitationEmail({ invitation, childName })` con cliente `Resend` y plantilla HTML en español + link `${APP_URL}/activate-account?code=<code>`. *Manual: en modo test el correo llega a la dirección de la cuenta Resend.*
5. `app/kids/actions.ts`: Server Action `sendParentInvitation(childId, formData)` — valida nombre/email/parentesco en servidor, obtiene el staff con `getCurrentUser()` (`lib/auth.ts`), corre pasos 3+4; si Resend falla, marca la invitación `cancelled` y retorna `{ error }`. *Manual: el modal abierto en `/kids/<uuid>` crea fila `pending` al enviar.*
6. `app/components/link-parent-dialog.tsx`: recibir prop `childId` (hoy solo recibe `childName`), llamar la acción con estados `pending`/éxito/error; CTA "Enviando…" deshabilitado durante el envío; estado de éxito con código real y botón "Listo"; placeholder "—" pre-envío. `app/kids/[childId]/kid-profile-content.tsx` pasa `childId`. *Manual: los tres estados del modal se ven en pantalla.*
7. `app/activate-account/actions.ts`: Server Action `activateAccount(formData)` — valida campos (contraseña ≥ 6), llama `lookup_invitation` y compara email (case-insensitive), `signUp` con metadata de rol/nombre, mapea "User already registered" a "Ese correo ya tiene una cuenta. Iniciá sesión.", ejecuta `accept_invitation` y `redirect("/login?activated=1")`. *Manual: verificación E2E del paso 10.*
8. `app/activate-account/page.tsx`: convertir en formulario (cliente + Server Action) con `searchParams.code` prellenado (mayúsculas), card del niño dinámica desde `lookup_invitation` (fallback neutro "Te invitaron a seguir el día de tu hijo" si el código no resuelve), quitar `defaultValue` de demo (`7K4P9`, `lucia.fernandez@gmail.com`, `contraseña`), errores de campo visibles. *Manual: `/activate-account?code=XXXXX` prellena y muestra el niño real.*
9. `app/login/page.tsx`: banner verde "Cuenta activada. Iniciá sesión." cuando `searchParams.activated === "1"`, conservando el diseño del comp (SPEC 03/07). *Manual: tras activar, `/login` muestra el banner.*
10. Verificación: paso manual del dashboard (desactivar "Confirm email") + `npm run lint` + `npm run build` + screenshots Playwright a `.playwright-mcp/` (modal inicial/loading/éxito/error desktop+móvil, activate-account, login con banner) + E2E: staff `roberto@gmail.com` invita a un email de prueba → verificar `invitations` → abrir el link → activar → verificar `auth.users`/`users` (`parent`), invitación `accepted`, `parent_children` con parentesco → login con credenciales nuevas.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] La migración `0006_create_invitations_and_parent_children.sql` existe y está aplicada vía MCP (tablas + enums + RLS + funciones; detalle verificable en SPEC de BD 10).
- [ ] Al enviar el modal con datos válidos se crea una fila `invitations` con `status='pending'`, `code` único de 5 caracteres sin `0/1/I/O`, `expires_at ≈ now()+7 días` e `invited_by` = staff de la sesión.
- [ ] Reinvitar al mismo email para el mismo niño pasa la pendiente anterior a `cancelled` en lugar de duplicarla.
- [ ] El modal muestra "—" + "Se genera al enviar" antes del envío y, tras él, el código real generado (no `7K4P9`) + "Correo enviado a <email>"; el botón "Listo" cierra el modal.
- [ ] Si Resend falla, el modal muestra un error visible en español y la invitación creada queda `cancelled` (sin pendientes huérfanas).
- [ ] El correo llega (modo test, a la dirección de la cuenta Resend) con asunto y cuerpo en español y link `${APP_URL}/activate-account?code=<código>` que abre la pantalla correcta.
- [ ] `/activate-account?code=XXXXX` prellena el código y muestra la card del niño real de la invitación; con código inexistente la card cae al texto neutro y el campo queda editable.
- [ ] Activar con código+email correctos y contraseña ≥ 6 crea el usuario en `auth.users`, la fila `users` con `role='parent'` (trigger 0002), marca la invitación `accepted` con `accepted_at` e inserta `parent_children` con el parentesco mapeado (mama→mother, papa→father, tutor→guardian).
- [ ] Código inválido/expirado o email que no coincide → error "El código de invitación no es válido o venció."; email ya registrado → "Ese correo ya tiene una cuenta. Iniciá sesión." y no se crea ninguna fila ni usuario.
- [ ] Tras activar, redirección a `/login?activated=1` con banner de éxito visible; el login con las credenciales nuevas funciona (confirm email desactivado).
- [ ] `RESEND_API_KEY`/`APP_URL` no tienen prefijo `NEXT_PUBLIC` y `resend` solo se importa en módulos server (`lib/invitation-email.ts`, Server Actions); nada de esto llega al bundle del cliente.
- [ ] Un padre autenticado no puede leer `invitations` directamente por RLS; solo ve sus propias filas en `parent_children`.
- [ ] A <768px el modal (todos sus estados) y `/activate-account` se renderizan sin desbordes.
- [ ] Textos visibles en español exactos; código interno en inglés.

## Decisiones

- **Sí:** una sola spec cubriendo invitación + correo + activación (decisión del usuario; el skill sugería dividirla, se respetó su elección — registrar aquí que fue "definición rápida en un solo contrato").
- **Sí:** código generado al enviar con estado de éxito en el modal (decisión del usuario) — evita invitaciones huérfanas por modal cerrado.
- **Sí:** bloque de código pre-envío con placeholder "—" + "Se genera al enviar" (decisión del usuario; conserva el layout del comp).
- **Sí:** correo con link de activación que prellena el código, más el código visible en el cuerpo por si el link se rompe (decisión del usuario).
- **Sí:** modo test de Resend con `onboarding@resend.dev` (decisión del usuario) — limitación documentada: solo entrega a la dirección de la cuenta Resend; la API llamada es real.
- **Sí:** tras activar, redirigir a `/login?activated=1` con banner (decisión del usuario) — la vista de familia no existe todavía.
- **Sí:** desactivar "Confirm email" en el dashboard de Supabase como paso manual (decisión del usuario) para que `signUp` dé sesión inmediata.
- **Sí:** email ya registrado = error que sugiere iniciar sesión (decisión del usuario); vincular cuentas existentes queda para otra spec.
- **Sí:** re-invitación cancela las pendientes anteriores del mismo niño+email (decisión del usuario).
- **Sí:** una única migración `0006` con ambas tablas, campos exactos de la referencia `@db-schema` (decisión del usuario).
- **Sí:** validación anónima vía `lookup_invitation` SECURITY DEFINER y aceptación vía `accept_invitation` con `auth.uid()` — el RLS normal no puede exponer `invitations` al padre pre-login sin filtrar nada.
- **Sí:** alfabeto del código sin caracteres ambiguos (`0/1/I/O` excluidos), longitud 5 como el mock.
- **No:** persistir el checkbox de consentimiento de fotos — la referencia de schema no modela consent en invitaciones; queda visual.
- **No:** UI de gestión de invitaciones, expiración automática por cron, contador "N padres vinculados" — cada uno merece su spec.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El modo test de Resend no entrega a terceros y se lee como bug | Documentado en scope; el E2E usa el email de la cuenta Resend; criterio explícito de "el correo llega". |
| Si "Confirm email" queda activo, `signUp` no devuelve sesión y el login posterior falla | Paso manual + criterio de verificación explícito; la acción muestra error orientativo si no hay sesión tras `signUp`. |
| El envío de correo falla después de crear la invitación y queda `pending` colgada | La Server Action la marca `cancelled` y muestra error (paso 5). |
| Activación doble o concurrente del mismo código | `accept_invitation` usa `SELECT ... FOR UPDATE` y guarda `status='pending'`; `UNIQUE(parent_id, child_id)` como respaldo. |
| `cacheComponents` con `/activate-account` y `/login` que ahora leen `searchParams` | Las páginas pasan a dinámicas por `searchParams`; las consultas de invitación siguen el patrón `'use cache: private'` de `lib/children.ts` cuando aplique; verificar con Context7 (Next 16) antes de cablear. |
| Funciones SECURITY DEFINER mal cercadas exponen datos | `SET search_path = ''`, nombres fully-qualified (patrón 0004), `REVOKE EXECUTE FROM PUBLIC`; `lookup_invitation` retorna solo campos mínimos. |
| Cuota/rate limit de Resend en desarrollo (free tier) | Suficiente para pruebas locales; ante error de Resend la acción muestra el error en español y permite reintentar. |

## Lo que **no** está en esta spec

- Vista de familia para padres y cualquier pantalla post-login del padre.
- Contador/fila real de padres vinculados en el perfil del niño.
- Persistencia del consentimiento de fotos en el flujo de invitación.
- Gestión UI de invitaciones (listar, cancelar, reenviar) y expiración programada.
- Vínculo de cuentas ya registradas a nuevos niños; recuperación de contraseña.
- Dominio de envío verificado en Resend.

Cada uno de esos, si aterriza, va en su propia spec.
