# SPEC 09 — Panel de padres vinculados con datos reales

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 08, SPEC de BD 10
> **Fecha:** 2026-11-11
> **Objetivo:** Reemplazar el panel "PADRES VINCULADOS" vacío del perfil de niño (`/kids/[childId]`) por filas reales — vínculos aceptados de `parent_children` con chip ACTIVA e invitaciones pendientes con chip PENDIENTE — y poner el contador real "N padres vinculados" en las tarjetas de la lista `/kids`, reutilizando el componente `LinkedParentRow` ya existente, sin acciones por fila ni rutas nuevas.

## Por qué existe esta spec

SPEC 08 dejó en la base los datos que faltaban (`parent_children` e `invitations`) pero, por scope deliberado, el panel siguió como lo dejó SPEC 05: solo el trigger "Vincular otro padre". El componente `LinkedParentRow` ya está implementado con los dos chips (ACTIVA/PENDIENTE) y el formato de label del comp `perfil-nino.dc.html`, esperando datos reales. Esta spec conecta una cosa con la otra, y de paso corrige el label fijo `"sin padres vinculados"` que hoy muestra siempre la lista `/kids` (`lib/children.ts`).

## Scope

**In:**

- Módulo server `lib/linked-parents.ts` con `getLinkedParents(childId)`: devuelve las filas del panel combinando dos fuentes — (a) vínculos aceptados: `parent_children` del niño joined a `users` (nombre, `status` activo) con chip ACTIVA y label `"Mamá · activa"` / `"Papá · activa"` / `"Tutor/a · activa"` según `relationship`; (b) invitaciones: filas de `invitations` del niño con `status = 'pending'` y `expires_at > now()` con chip PENDIENTE y label `"· invitación enviada"` (nombre del `full_name` de la invitación).
- Render de esas filas en el panel "PADRES VINCULADOS" de `app/kids/[childId]/kid-profile-content.tsx` con `LinkedParentRow`, encima del trigger "Vincular otro padre" (que sigue igual). Orden fiel al comp: aceptadas arriba, pendientes abajo.
- Contador real en las tarjetas de la lista `/kids`: `parentsLinkedLabel` deja de ser el fijo `"sin padres vinculados"` y pasa a computar por niño — `"sin padres vinculados"` con 0, `"1 padre vinculado"`, `"N padres vinculados"` — contando solo vínculos aceptados.
- `revalidatePath("/kids/" + childId)` en `sendParentInvitation` (`app/kids/actions.ts`) para que la fila PENDIENTE nueva aparezca en el perfil al cerrar el modal con "Listo", sin recarga manual.
- Verificación: `npm run lint` + `npm run build` + screenshots Playwright MCP (panel con vínculo aceptado, con pendiente y vacío, desktop y móvil) contra el comp `references/pantallas/perfil-nino.dc.html`.

**Out of scope (para futuras specs):**

- Acciones por fila: botones para desvincular un padre o cancelar una invitación pendiente (con su confirmación).
- Mostrar el email del padre en las filas del panel.
- Avatares con foto: se sigue usando el círculo con inicial y color de paleta.
- Actualización en tiempo real (push/websocket) del panel.
- Vista de familia (lo que ve el padre logueado) y cualquier pantalla nueva.
- Badge o fila para invitaciones vencidas: una invitación con `expires_at` pasado simplemente desaparece del panel.

## Data model

Esta spec no introduce tablas ni migraciones nuevas. Reutiliza `parent_children`, `users` e `invitations` tal como las dejó SPEC de BD 10 / SPEC 08. Estructura de vista:

```ts
// app/components/linked-parent-row.tsx (ya existe, sin cambios)
type ParentStatus = "active" | "pending";

// lib/linked-parents.ts (nuevo)
export type LinkedParentView = {
  id: string;            // parent_children.id o invitations.id
  initials: string;      // "L"
  avatarBg: string;      // paleta por fila: "#C9B6E8", "#A9C7E8", ...
  name: string;          // "Lucía Fernández"
  relationLabel: string; // "Mamá · activa" | "Papá · invitación enviada"
  status: ParentStatus;  // "active" | "pending"
};
```

- Mapeo de `relationship` a texto en español (igual que SPEC 08): `father → Papá`, `mother → Mamá`, `guardian → Tutor/a`.
- La fila aceptada solo muestra chip ACTIVA si `users.status = 'active'`; el label usa `"· activa"` en ese caso.
- Pendiente: `invitations.status = 'pending'` **y** `expires_at > now()`. Canceladas, aceptadas y vencidas no se muestran.
- En `lib/children.ts`, `parentsLinkedLabel` pasa a calcularse con el conteo de `parent_children` por niño (una query agregada para toda la guardería, no una por niño).

## Plan de implementación

1. `lib/linked-parents.ts`: `getLinkedParents(childId)` con el patrón de `lib/children.ts` (`'use cache: private'` + `cacheLife({ stale: 0 })`): dos selects (vínculos con `users`, invitaciones pendientes vigentes), merge, mapeo a `LinkedParentView` y asignación de color de avatar por índice. Errores de query → `[]` con `console.error` (el panel queda vacío, no rompe el perfil). *Manual: `npx tsc --noEmit` limpio.*
2. `lib/children.ts`: contador real de vínculos para la lista `/kids` — una query extra sobre `parent_children` de los niños de la guardería (agrupada en TypeScript, sin N+1) y `parentsLinkedLabel` calculado por niño. *Manual: `/kids` muestra "1 padre vinculado" en David y "sin padres vinculados" en el resto.*
3. `app/kids/[childId]/kid-profile-content.tsx`: en el panel "PADRES VINCULADOS", renderizar las filas con `LinkedParentRow` encima del `LinkParentTrigger` existente. *Manual: el perfil de David muestra a Lucía (ACTIVA) sobre el trigger; un niño sin vínculos queda igual que hoy.*
4. `app/kids/actions.ts`: agregar `revalidatePath("/kids/" + childId)` en `sendParentInvitation` para refrescar el perfil tras enviar. *Manual: enviar invitación desde el modal y cerrar con "Listo" muestra la fila PENDIENTE sin recargar.*
5. Verificación: `npm run lint` + `npm run build` + screenshots Playwright MCP (panel con aceptado, con pendiente, vacío; desktop y móvil sin overflow) contra `perfil-nino.dc.html`; consola del navegador sin errores.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] El panel "PADRES VINCULADOS" muestra una fila ACTIVA por cada vínculo de `parent_children` del niño: nombre real, label `"Mamá · activa"` / `"Papá · activa"` / `"Tutor/a · activa"`, chip ACTIVA.
- [ ] El panel muestra una fila PENDIENTE por cada invitación `pending` no vencida del niño: nombre invitado, label `"· invitación enviada"`, chip PENDIENTE.
- [ ] Las invitaciones vencidas (`expires_at` pasado), canceladas y ya aceptadas no aparecen como PENDIENTE.
- [ ] Un niño sin vínculos ni invitaciones pendientes muestra el panel igual que hoy: solo el trigger "Vincular otro padre".
- [ ] El orden del panel es fiel al comp: filas aceptadas primero, pendientes después, trigger al final.
- [ ] Tras enviar una invitación desde el modal y cerrarlo con "Listo", la fila PENDIENTE aparece en el perfil sin recarga manual.
- [ ] Las tarjetas de `/kids` muestran el contador real: `"sin padres vinculados"` con 0, `"1 padre vinculado"`, `"N padres vinculados"` con N ≥ 2, contando solo vínculos aceptados.
- [ ] A 1280px, screenshot del panel con una fila ACTIVA y una PENDIENTE es visualmente idéntico al comp `perfil-nino.dc.html` (avatares circulares con inicial, chips de color, tipografías Fredoka/Nunito).
- [ ] A <768px el panel y las tarjetas se renderizan sin desbordes (`scrollWidth == clientWidth`).
- [ ] La fila aceptada muestra chip ACTIVA solo si el `users.status` del padre es `active`.
- [ ] Sin errores en consola del navegador al cargar `/kids` y `/kids/[childId]`.

## Decisiones

- **Sí:** panel muestra aceptadas + pendientes (respuesta del usuario) — fiel al comp, que muestra exactamente una de cada, y reutiliza `LinkedParentRow` que ya tiene ambos chips.
- **Sí:** contador real en `/kids` incluido en esta spec (respuesta del usuario) — es la misma fuente de datos y elimina el label fijo falso.
- **Sí:** estado vacío del panel = solo el trigger (respuesta del usuario) — el comp no define estado vacío y el panel actual ya se ve así.
- **No:** acciones por fila (desvincular/cancelar) (respuesta del usuario) — va en su propia spec cuando exista.
- **Sí:** el contador de `/kids` cuenta solo vínculos aceptados — una invitación pendiente todavía no es un padre vinculado; el criterio de texto singular/plural queda `"1 padre vinculado"` / `"N padres vinculados"`.
- **Sí:** invitaciones vencidas desaparecen del panel — el estado derivado `expired` de BD SPEC 10 ya las considera muertas; mostrarlas como "invitación enviada" sería mentir.
- **Sí:** colores de avatar por índice de fila con la paleta del comp (`#C9B6E8`, `#A9C7E8`, …) — el comp usa un color distinto por fila y no hay foto real.
- **Sí:** `revalidatePath` del perfil en la action de invitación — sin eso la fila nueva recién aparecería tras otra navegación.
- **No:** tiempo real ni polling — el panel es Server Component y se re-renderiza por navegación/`revalidatePath`; suficiente para este caso.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| RLS: `parent_children`/`invitations` solo devuelven filas si el staff pertenece a la guardería del niño (`is_staff_in_child`) | Las queries corren server-side con la sesión del usuario; ante error se devuelve `[]` con `console.error` y el panel queda en su estado vacío, sin romper el perfil |
| N+1 si el contador de `/kids` se consulta por niño | Una sola query de `parent_children` para todos los niños de la guardería, agrupada en TypeScript |
| Invitación mostrada como PENDIENTE aunque ya esté vencida | El filtro `expires_at > now()` se aplica en la query; el estado derivado de BD SPEC 10 ya define esa semántica |

## Qué es **no** está en esta spec

- Desvincular un padre o cancelar una invitación (otra spec si aterriza).
- Email del padre visible en las filas.
- Avatares con foto.
- Tiempo real / actualización automática sin navegación.
- Vista de familia y pantallas nuevas.

Cada uno de esos, si aterriza, va en su propia spec.
