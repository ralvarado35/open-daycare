# SPEC 01 — Home: pantalla Feed

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-10-24
> **Objetivo:** Implementar la pantalla Feed de `references/pantallas/feed.dc.html` como Home (`/`), visualmente idéntica en desktop y con adaptación móvil (top bar + drawer + FAB), sin autenticación ni base de datos.

## Por qué existe esta spec

Es la primera pantalla portada y establece el **sistema de diseño** que heredarán todas las futuras: tokens de la paleta cálida, fuentes Fredoka/Nunito y el Sidebar compartido.

## Scope

**In:**

- Reemplazo total del scaffold de create-next-app en `app/page.tsx`, `app/layout.tsx` y `app/globals.css`.
- Tokens Tailwind v4 (`@theme`) con la paleta cálida del comp (fondo `#F6ECDF`, tarjeta `#FFFDF9`, texto `#3F362E`, acento `#F2A78E`, bordes `#ECE0D0`) y fuentes Fredoka + Nunito vía `next/font/google`.
- Componentes reutilizables: `Sidebar` (desktop, ítem activo configurable), `MobileNav` (mini top bar + drawer + FAB) y `PostCard` (variantes logro / actividad / anuncio).
- Datos mock tipados en `lib/feed-data.ts` con las 3 publicaciones del comp.
- Adaptación móvil <768px: sidebar oculto, top bar con logo + avatar, drawer superpuesto activado por hamburguesa, FAB «Nueva publicación».
- Todos los links a pantallas inexistentes como `href="#"`.
- Contenido 100% estático, hardcodeado tal cual el comp.

**Out of scope (para futuras specs):**

- Autenticación y logout real.
- Base de datos y cualquier persistencia.
- Rutas reales de Niños, Avisos, Mi cuenta, crear/editar publicación, detalle y foto.
- Interactividad de reacciones y comentarios (contadores estáticos).
- Fotos reales (se mantiene el placeholder punteado del comp).
- Responsive más allá de lo definido (tablets landscape, pantallas ultra anchas).

## Data model

```ts
// lib/feed-data.ts
// Internal code in English; user-facing strings stay in Spanish (as in the comps).
type PostKind = "achievement" | "activity" | "announcement";

type Post = {
  id: string;
  kind: PostKind;
  authorLabel: string;   // rendered as "Mateo" | "Anuncio general"
  timeLabel: string;     // rendered as "14:20 · publicado por vos"
  audienceLabel: string; // rendered as "Para: familia de Mateo" | "Para: toda la sala"
  body: string;
  photoCaption?: string; // rendered as "Foto · pintando con témperas" (activity only)
  likes: number;
  comments: number;
};
```

```ts
// lib/nav.ts
type NavKey = "feed" | "children" | "notices" | "account";
type NavItem = { key: NavKey; label: string; href: string };
// `label` holds the Spanish UI text: "Feed", "Niños", "Avisos", "Mi cuenta".
```

Los valores semánticos de `PostKind` y `NavKey` son ingleses; la capa de presentación los mapea a las etiquetas visibles en español — `PostCard` renderiza «LOGRO», «ACTIVIDAD», «ANUNCIO» según `kind`, y los estilos por variante (chip, avatar, colores) viven en el componente, no en los datos. Los `href` de rutas futuras quedan centralizados en `lib/nav.ts` para re-cablearlos en un solo lugar cuando existan.

## Plan de implementación

1. `app/globals.css`: `@theme` con la paleta cálida, body base (Nunito, fondo crema), scrollbar custom. Quitar dark mode y el look Geist. *Manual: dev server muestra fondo crema.*
2. `app/layout.tsx`: Geist → Fredoka + Nunito (`next/font/google`, variables CSS), `lang="es"`, metadata `title: "OpenDayCare"`. *Manual: títulos en Fredoka.*
3. `lib/feed-data.ts` + `lib/nav.ts`: tipos y datos mock de las 3 publicaciones y los 4 ítems de nav.
4. `app/components/post-card.tsx`: tarjeta con las 3 variantes y el mapeo `kind` → etiqueta del chip en español. *Manual: un post de cada tipo renderiza bien.*
5. `app/components/sidebar.tsx`: sidebar desktop (248px sticky, logo, CTA, nav, usuario) con prop `active`. *Manual: idéntico al comp a ≥768px.*
6. `app/components/mobile-nav.tsx` (client): top bar + FAB + drawer (`useState`, backdrop clicable, cierre con Escape). *Manual: a <768px todo funciona.*
7. `app/page.tsx`: componer saludo, composer, divisor «PUBLICADO HOY» y lista de posts sobre los componentes. *Manual: `/` muestra el feed completo.*
8. Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (desktop y móvil) contra el comp.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] A 1280px, screenshot del home visualmente idéntico al comp (layout, colores, tipografías, espaciados, sombras).
- [ ] El saludo dice «Buenas, Caro», «12 niños · martes 17 jun» y el eyebrow «GUARDERÍA · SALA SOLES».
- [ ] Se renderizan los 3 posts: logro (chip verde), actividad (chip celeste + placeholder de foto), anuncio (chip azul + megáfono).
- [ ] Contadores de reacciones (3, 5, 8) y comentarios (1, 2, 0) coinciden con el comp.
- [ ] Todos los links a pantallas inexistentes usan `href="#"` y no navegan.
- [ ] A ≥768px el sidebar está fijo con «Feed» activo; a <768px está oculto.
- [ ] A <768px: top bar (logo + Sala Soles + avatar C), FAB «+» abajo a la derecha, drawer que abre con la hamburguesa y cierra con backdrop o Escape.
- [ ] Fredoka y Nunito cargan vía `next/font`, sin `<link>` a Google Fonts.
- [ ] No queda rastro del scaffold (Geist, ilustraciones, inglés) ni dark mode por defecto.
- [ ] El código interno está en inglés (identificadores, tipos, valores de uniones, comentarios, nombres de archivo); los textos visibles de la UI quedan en español.
- [ ] Sin errores en consola del navegador.

## Decisiones

- **Sí:** Tailwind v4 + tokens `@theme` (convención del repo) con utilidades arbitrarias para valores exactos (`w-[248px]`, `rounded-[20px]`).
- **No:** estilos inline literales del comp — irían contra la convención del proyecto.
- **Sí:** `Sidebar` + `PostCard` reutilizables; futuras pantallas heredan el sidebar con la prop `active`.
- **Sí:** mock tipado en `lib/`; el swap futuro a DB solo cambia la fuente de datos.
- **Sí:** `href="#"` en links futuros (decisión del usuario): cero 404s durante el desarrollo visual; hrefs centralizados en `lib/nav.ts` para re-cablear después.
- **Sí:** responsive básico <768px con drawer hamburguesa + top bar + FAB, diseñado con el lenguaje visual del comp (no existe comp móvil).
- **No:** menú inferior fijo ni rail de iconos (alternativas descartadas para móvil).
- **Sí:** `next/font/google` — self-hosted, sin request externo ni FOUT.
- **No:** fecha ni contadores dinámicos; todo estático igual al comp.
- **No:** dependencias nuevas — íconos SVG inline copiados del comp.
- **Sí:** UI en español con `lang="es"` — los textos visibles son contenido de UI, no identificadores.
- **Sí:** código interno en inglés (identificadores, tipos, valores semánticos de `PostKind`/`NavKey`, comentarios y nombres de archivo) según las reglas de código limpio del repo; los valores ingleses se mapean a etiquetas españolas en la capa de presentación.

## Riesgos

| Riesgo                                                                       | Mitigación                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| El diseño móvil no tiene comp de referencia → desviarse del lenguaje visual  | Reutilizar exactamente los mismos tokens, radios, sombras y componentes; solo cambia el patrón de navegación. |
| Re-cableado posterior de los `href="#"`                                      | Hrefs centralizados en `lib/nav.ts`: un solo lugar a cambiar.                |

## Lo que **no** está en esta spec

- Autenticación, logout y sesiones.
- Base de datos, persistencia y APIs.
- Rutas de las demás pantallas (Niños, Avisos, Mi cuenta, publicaciones, foto).
- Interactividad de reacciones/comentarios y subida de fotos.
