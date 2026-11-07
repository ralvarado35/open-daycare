# SPEC 02 — Niños: listado y perfil del niño

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-07
> **Objetivo:** Portar las pantallas `references/pantallas/ninos.dc.html` (lista de niños) y `references/pantallas/perfil-nino.dc.html` (perfil) a las rutas `/kids` y `/kids/[childId]`, visualmente idénticas al comp en desktop y con adaptación móvil, sin lógica real de datos.

## Por qué existe esta spec

Es la primera pantalla con navegación interna real (la lista enlaza a los perfiles) y la primera con ruta dinámica. Reutiliza el sistema de diseño y los componentes heredados de SPEC 01 (`Sidebar`, `MobileNav`, tokens `@theme`, `lib/nav.ts`) sin duplicarlos.

## Scope

**In:**

- Rutas reales `/kids` (lista) y `/kids/[childId]` (perfil), ambas estáticas (cada perfil se genera con `generateStaticParams`).
- Re-cableado de `lib/nav.ts`: el ítem «Niños» apunta a `/kids`; nuevos placeholders `addChildHref`, `editChildHref`, `daySummaryHref`, `linkParentHref` para los links aún inexistentes.
- Datos mock tipados en `lib/kids-data.ts` (código interno en inglés, textos visibles en español) con los 8 niños exactos del comp: nombres, edades, subtítulos, colores de avatar y badges (MANÍ, LACTOSA, VINCULAR).
- Datos de perfil completos para los 8 niños: el de Mateo Fernández copiado literal del comp (fecha de nacimiento, sala, ingreso, nota de alergias, padres Lucía y Diego); los otros 7 con datos mock plausibles en los mismos campos.
- Componentes nuevos: `KidCard` (card de la lista con 3 colas posibles: badge de alergia, badge VINCULAR, chevron) y `LinkedParentRow` (fila de padre vinculado con estado ACTIVA/PENDIENTE).
- Buscador «Buscar niño…» solo visual (input estático, sin lógica de filtrado).
- Links a pantallas no implementadas como `href="#"` (decisión heredada de SPEC 01): Editar, Agregar niño, Resumen del día, Vincular otro padre.
- Adaptación móvil <768px reutilizando `MobileNav` (top bar + drawer + FAB) y apilando el layout con el lenguaje visual del comp (no existe comp móvil).

**Out of scope (para futuras specs):**

- Autenticación, base de datos y cualquier persistencia.
- Formularios Agregar/Editar niño (`agregar-nino.dc.html`), pantalla Resumen del día, flujo Vincular padre.
- Lógica de búsqueda o filtrado (el input es decorativo).
- Familia / vistas de familia (`familia-*.dc.html`).
- Demo real de generación de rutas desde una API (los datos quedan en el módulo mock).

## Data model

```ts
// lib/kids-data.ts
// Internal code in English; user-facing strings stay in Spanish (as in the comps).
type ParentStatus = "active" | "pending";

type Parent = {
  id: string;
  initials: string;        // "L", "D" (avatar circle)
  avatarBg: string;        // "#C9B6E8"
  name: string;            // "Lucía Fernández"
  relationLabel: string;   // "Mamá · activa" | "Papá · invitación enviada"
  status: ParentStatus;
};

type Kid = {
  id: string;              // "mateo-fernandez" → URL /kids/mateo-fernandez
  firstName: string;       // "Mateo"
  lastName: string;        // "Fernández" (initial used as avatar letter)
  ageLabel: string;        // "3 años"
  parentsLinkedLabel: string; // "2 padres vinculados" | "sin padres vinculados"
  avatarBg: string;        // "#A9D9E8"
  avatarFg: string;        // "#1F7A93"
  allergyTag?: string;     // "MANÍ" | "LACTOSA" (renders the pill badge)
  needsLinking?: boolean;  // renders the VINCULAR pill instead of the chevron
  birthDateLabel: string;  // "12 mar 2022"
  roomLabel: string;       // "Soles"
  enrolledLabel: string;   // "feb 2025"
  allergyNotice?: string;  // text of the red "Alergias y notas" banner
  parents: Parent[];
};
```

```ts
// lib/nav.ts (adiciones)
export const addChildHref = placeholderHref;
export const editChildHref = placeholderHref;
export const daySummaryHref = placeholderHref;
export const linkParentHref = placeholderHref;
```

Los 8 niños del comp: Mateo Fernández, Sofía Méndez, Benjamín Ruiz, Valentina Soto, Tomás Díaz, Emma Castro, Lucas Romero y Olivia Vega. Solo los datos de Mateo vienen del comp (`perfil-nino.dc.html`); el resto se completa con mock en los mismos campos, sin crear campos nuevos durante la implementación.

## Plan de implementación

1. `lib/kids-data.ts`: tipos `Kid`, `Parent`, `ParentStatus` y los 8 niños con sus datos completos. *Manual: importar en el REPL del build y validar que el array tiene 8 entradas.*
2. `lib/nav.ts`: `children` → `/kids` y los 4 nuevos placeholders. *Manual: el sidebar navega a `/kids` (no `#`).*
3. `app/components/kid-card.tsx`: card con avatar redondo inicial, nombre Fredoka, subtítulo «X años · Y padres vinculados» y cola condicional: badge de alergia (MANÍ/LACTOSA), badge VINCULAR o chevron. *Manual: las 3 variantes renderizan como el comp.*
4. `app/kids/page.tsx`: eyebrow «GESTIÓN», título «Niños», CTA «Agregar niño», buscador, divisor «SALA SOLES · 8 niños» y grid de 2 columnas (1 columna <768px). `Sidebar` y `MobileNav` con `active="children"`. *Manual: `/kids` idéntica al comp a ≥768px.*
5. `app/kids/[childId]/page.tsx` con `generateStaticParams` (y `dynamicParams = false`): header con avatar, nombre, edad+sala, botón Editar; banner rojo «Alergias y notas» (solo si `allergyNotice`); card de datos (fecha de nacimiento / sala / ingreso); al lado, card de «PADRES VINCULADOS» con CTA negro «Resumen del día», filas de padres con chips ACTIVA/PENDIENTE y link dashed «Vincular otro padre». Layout con `flex-wrap`: las dos columnas se apilan a <768px. *Manual: `/kids/mateo-fernandez` idéntica al comp; cada card de la lista navega a su perfil con sus datos.*
6. Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (desktop y móvil de ambas rutas) contra los comps.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] A 1280px, screenshot de `/kids` visualmente idéntico al comp de la lista (eyebrow, título, CTA, buscador, divisor, grid 2×4, sombras y radios).
- [ ] A 1280px, screenshot de `/kids/mateo-fernandez` visualmente idéntico al comp del perfil (banner de alergias, card de datos, panel de padres, CTA Resumen del día).
- [ ] `/kids` muestra exactamente los 8 niños del comp con sus avatares, colores, subtítulos y badges correctos (MANÍ en Mateo y Tomás, VINCULAR en Valentina, chevron en el resto).
- [ ] Cada card de la lista navega al perfil de su propio niño: `/kids/mateo-fernandez`, `/kids/sofia-mendez`, etc., con los datos mock correspondientes.
- [ ] Los links Editar, Agregar niño, Resumen del día, Vincular otro padre y Cerrar sesión usan `href="#"` y no navegan.
- [ ] «Volver a Niños» regresa a `/kids`.
- [ ] El buscador es un input estático: escribir en él no filtra ni cambia nada.
- [ ] A ≥768px el sidebar está visible con «Niños» activo en ambas rutas; a <768px está oculto y aparece top bar + FAB + drawer funcionando (abre con hamburguesa, cierra con backdrop o Escape).
- [ ] A <768px la lista se ve en 1 columna y el perfil apila sus dos columnas sin desbordes.
- [ ] `generateStaticParams` genera los 8 perfiles como rutas estáticas (`/kids/[childId]` no produce 404 ni render dinámico en el build).
- [ ] No hay dependencias nuevas; los SVG se copian inline de los comps.
- [ ] El código interno está en inglés (identificadores, tipos, valores de uniones, comentarios, nombres de archivo; rutas `/kids`); los textos visibles quedan en español.
- [ ] Sin errores en consola del navegador.

## Decisiones

- **Sí:** rutas en inglés `/kids` y `/kids/[childId]` (decisión del usuario), coherente con la regla de código interno en inglés.
- **No:** `/ninos` como ruta — descartada al elegir el slug en inglés.
- **Sí:** ruta dinámica con `generateStaticParams` + `dynamicParams = false`: 8 páginas estáticas, sin coste en runtime y compatible con `cacheComponents`.
- **No:** pasar los datos del niño como props de cliente o en query strings.
- **Sí:** buscador solo visual (decisión del usuario): «solo interfaces», todo el render queda en server components.
- **No:** client component de filtrado — reintroduciría JS innecesario para una demo estática.
- **Sí:** datos mock completos para los 8 niños (no solo Mateo): evita perfiles a medio armar al hacer click en cualquier card; solo los de Mateo se copian literal del comp.
- **Sí:** placeholders `href="#"` centralizados en `lib/nav.ts` (decisión arrastrada de SPEC 01), añadiendo `addChildHref`, `editChildHref`, `daySummaryHref`, `linkParentHref`.
- **Sí:** reutilizar `Sidebar`, `SidebarContent` y `MobileNav` tal cual; el único cambio en ellos es el cableado del href de «Niños».
- **Sí:** adaptación móvil siguiendo el patrón de SPEC 01 (decisión del usuario), sin comp de referencia móvil.
- **No:** pantallas de Agregar/Editar, Resumen del día ni Vinculación de padres — specs futuras propias.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `cacheComponents` cambia la semántica de params/prefetch en rutas dinámicas | Consultar la doc de Next 16 (Context7) antes de implementar el paso 5; el patrón `generateStaticParams` + `dynamicParams = false` evita render bajo demanda. |
| Datos inventados para 7 de los 8 perfiles pueden desviar el look del comp | El comp solo describe el perfil de Mateo; se reutilizan exactamente los mismos estilos y estructuras, cambiando solo valores. El comp es la fuente de verdad de Mateo. |
| Layout del perfil a ancho medio (1 columna estrecha + panel de 300px) | Usar `flex-wrap` con `min-width` como en el comp y verificar screenshot a 1024px además de 1280px y móvil. |

## Lo que **no** está en esta spec

- Formulario de agregar/editar niño y su flujo.
- Pantalla de resumen del día y su flujo.
- Flujo de vinculación de padres (invitaciones, estados reales).
- Búsqueda/filtrado funcional y persistencia de datos.
- Vistas de familia y autenticación.

Cada uno de esos, si aterriza, va en su propia spec.
