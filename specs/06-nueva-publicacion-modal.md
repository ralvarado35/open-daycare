# SPEC 06 — Nueva publicación: modal de creación

> **Estado:** Draft
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-07
> **Objetivo:** Implementar el modal "Nueva publicación" de `references/pantallas/crear-publicacion.dc.html` disparado desde el CTA "Nueva publicación" del sidebar, con PARA (múltiple, Mateo preseleccionado), TIPO (único, sin preselección), DESCRIPCIÓN (vacía) y FOTOS (1 miniatura + "Agregar" estático), cierre por Cancelar/backdrop/Escape y toast "Publicación creada" al publicar, sin backend ni rutas nuevas.

## Por qué existe esta spec

Es el primer formulario de creación de contenido del feed (SPEC 01/02/03/04/05 son listas, perfiles y modales de datos de niños). Convierte el placeholder `newPostHref = "#"` del CTA "Nueva publicación" del sidebar en un disparador real de un dialog cliente, manteniendo la regla "solo interfaces": no hay persistencia, ni feed real de publicaciones, ni backend. Sigue exactamente el patrón de SPEC 04 (`AddChildDialog`) y SPEC 05 (`LinkParentDialog`): componente de cliente aislado, sin rutas nuevas, valores hardcodeados como los comps.

## Scope

**In:**

- Componente de cliente `NewPostDialog` (modal/dialog) con la tarjeta del comp `crear-publicacion.dc.html`: header "Cancelar" / "Nueva publicación" / "Publicar", sección PARA (Mateo, Sofía, Benjamín, Toda la sala como chips seleccionables), sección TIPO (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio), DESCRIPCIÓN (textarea), FOTOS (1 miniatura de foto ya puesta + botón "Agregar" estático que no hace nada).
- PARA: selección múltiple; Mateo inicia seleccionado (chip oscuro como el comp); tocar un chip alterna su selección; "Toda la sala" es un destinatario más.
- TIPO: selección única; ningún tipo inicia seleccionado; elegir uno lo marca y desmarca el previo.
- DESCRIPCIÓN: vacío al abrir, solo placeholder "Contá cómo le fue hoy…".
- **Publicar:** valida (DESCRIPCIÓN no vacía), cierra el modal, limpia el formulario y muestra toast "Publicación creada" (mock, sin backend). Si DESCRIPCIÓN está vacía, muestra error bajo el campo y no cierra.
- **Cancelar:** descarta, resetea el formulario y cierra el modal sin toast.
- Cierre del modal: botón Cancelar, clic fuera (backdrop) y tecla Escape.
- Cableado en `app/components/sidebar.tsx`: el CTA "Nueva publicación" deja de ser `<Link href={newPostHref}>` y se convierte en botón que abre el dialog mediante `onClick` (estado `open`); se renderiza `<NewPostDialog open={open} onClose={setOpen(false)} />`. `newPostHref` de `lib/nav.ts` queda como `"#"` documentado como trigger del dialog.
- El acceso directo "Compartí un momento…" del feed y el enlace "Editar" de las tarjetas de post mantienen `href="#"` (no navegan, no abren el modal) — fuera de alcance de esta spec.
- Textos visibles 100% en español exactos del comp; código interno en inglés.
- Modal centrado en desktop; a <768px ocupa casi todo el ancho sin desbordes (patrón móvil de SPEC 01/02/04/05, no hay comp móvil de referencia del modal).
- Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (modal abierto, desktop y móvil) contra el comp.

**Out of scope (para futuras specs):**

- Ruta independiente `/nueva-publicacion` o `/publicaciones/nueva` (se descarta: el usuario pidió modal desde el sidebar).
- El acceso directo "Compartí un momento…" y el enlace "Editar" abriendo el modal (quedan como `href="#"`).
- Persistencia, backend, feed real de publicaciones, detalle de publicación, subida de fotos reales.
- Autenticación, guards y cualquier cosa que requiera sesión.
- Vistas de familia, resumen del día, agregar/editar niño, vinculación de padres.
- Responsive más allá de desktop (≥768px) y móvil (<768px dialog ancho completo).

## Data model

Introduce estructuras pequeñas de formulario (código interno en inglés, textos visibles en español):

```ts
// app/components/new-post-dialog.tsx
type Recipient = {
  id: string;        // "mateo" | "sofia" | "benjamin" | "toda-la-sala"
  label: string;     // "Mateo" | "Sofía" | "Benjamín" | "Toda la sala"
  initials: string;  // "M" | "S" | "B" | undefined
  avatarBg: string;  // color de fondo del avatar circular
  avatarFg: string;  // color de las iniciales del avatar
};

type PostType = {
  id: string;        // "comida" | "siesta" | "actividad" | "logro" | "animo" | "foto" | "anuncio"
  label: string;     // "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio"
  bg: string;        // color de fondo del chip
  color: string;     // color del texto del chip
};

type NewPostForm = {
  recipients: string[]; // PARA: IDs seleccionados (Mateo por defecto)
  typeId: string | null; // TIPO: ninguno inicialmente
  description: string;  // DESCRIPCIÓN: vacío inicialmente
};

type FormErrors = {
  description?: string;
};

const RECIPIENTS: Recipient[] = [
  { id: "mateo", label: "Mateo", initials: "M", avatarBg: "#A9D9E8", avatarFg: "#1F7A93" },
  { id: "sofia", label: "Sofía", initials: "S", avatarBg: "#F4B8CC", avatarFg: "#C44A7A" },
  { id: "benjamin", label: "Benjamín", initials: "B", avatarBg: "#B9DEC4", avatarFg: "#3E8B62" },
  { id: "toda-la-sala", label: "Toda la sala", initials: "", avatarBg: "", avatarFg: "" },
];

const POST_TYPES: PostType[] = [
  { id: "comida", label: "Comida", bg: "#9A7B1E", color: "#fff" },
  { id: "siesta", label: "Siesta", bg: "#E7DCF6", color: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bg: "#2E89A6", color: "#fff" },
  { id: "logro", label: "Logro", bg: "#CFEBD8", color: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bg: "#F9D2DE", color: "#C56486" },
  { id: "foto", label: "Foto", bg: "#FBD8CC", color: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bg: "#CCD8F4", color: "#4E72C8" },
];
```

No se crea módulo `lib/` nuevo: los datos van hardcodeados dentro del componente, como hacen los comps.

## Plan de implementación

1. `app/components/new-post-dialog.tsx`: componente de cliente (Dialog) con el formulario del comp, PARA múltiple (Mateo preseleccionado), TIPO único (ninguno preseleccionado), DESCRIPCIÓN vacía, FOTOS estático (1 miniatura + "Agregar" no-op), validación de DESCRIPCIÓN al publicar (error bajo el campo + foco), toast "Publicación creada", abrir/cerrar y reset de formulario, cierre con backdrop y Escape. *Manual: el dialog renderiza aislado igual al comp a 1280px y pasa la validación de DESCRIPCIÓN vacía.*
2. `app/components/sidebar.tsx`: el CTA "Nueva publicación" pasa de `<Link href={newPostHref}>` a botón que abre el dialog (`onClick`); se importa y renderiza `<NewPostDialog open={open} onClose={setOpen(false)} />`. *Manual: el sidebar igual al comp y el CTA abre el modal sin navegar.*
3. `lib/nav.ts`: `newPostHref = placeholderHref` se documenta como trigger del dialog (no navega a ningún lado). No cambia su valor. *Manual: el build resuelve la importación sin error.*
4. Verificación: `npm run lint` + `npm run build` + screenshots Playwright MCP (modal abierto desktop y móvil) contra el comp; checks de PARA múltiple, TIPO único, toast, cierre (Cancelar/backdrop/Escape) y validación de DESCRIPCIÓN vacía.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] El CTA "Nueva publicación" del sidebar abre el modal en lugar de navegar a `#` (no hay navegación).
- [ ] El modal renderiza la tarjeta del comp: título "Nueva publicación", Cancelar, Publicar, sección PARA (Mateo preseleccionado, Sofía, Benjamín, Toda la sala), sección TIPO (7 tipos), DESCRIPCIÓN vacía con placeholder "Contá cómo le fue hoy…", FOTOS (1 miniatura + "Agregar" estático).
- [ ] PARA es selección múltiple: tocar alterna selección; Mateo inicia seleccionado; "Toda la sala" es un destinatario más.
- [ ] TIPO es selección única: elegir un tipo lo marca y desmarca el previo; ninguno inicia seleccionado.
- [ ] Al publicar con DESCRIPCIÓN vacía: aparece error debajo del campo, foco en el textarea, y el modal permanece abierto.
- [ ] Al publicar con DESCRIPCIÓN completa: el modal se cierra, el formulario se limpia y aparece el toast "Publicación creada".
- [ ] Cancelar cierra el modal sin toast y reseta el formulario (descarta).
- [ ] El modal se cierra con clic fuera (backdrop) y con la tecla Escape.
- [ ] A 1280px, screenshot del sidebar con el modal abierto es visualmente idéntico al comp `crear-publicacion.dc.html` (colores, radios, tipografías Fredoka/Nunito, sombras).
- [ ] A <768px el modal se abre sin desbordes (ancho casi completo, campos legibles).
- [ ] Los textos visibles están en español exactos del comp; el código interno está en inglés.
- [ ] No hay rutas nuevas ni dependencias nuevas.
- [ ] Sin errores en consola del navegador.

## Decisiones

- **Sí:** disparo solo desde el CTA "Nueva publicación" del sidebar (respuesta del usuario); composer "Compartí un momento…" y enlace "Editar" mantienen `href="#"` y no abren el modal.
- **Sí:** PARA múltiple con Mateo preseleccionado (respuesta del usuario); chips con iniciales y colores de avatar del comp.
- **Sí:** TIPO selección única, ninguno preseleccionado (respuesta del usuario).
- **Sí:** DESCRIPCIÓN vacío al abrir, solo placeholder (respuesta del usuario).
- **Sí:** FOTOS estático: 1 miniatura ya puesta y "Agregar" no hace nada (respuesta del usuario; regla "solo interfaces").
- **Sí:** Publicar = validación de DESCRIPCIÓN + toast mock "Publicación creada" + cierre + limpieza (como SPEC 04 "Guardar"; respuesta del usuario).
- **Sí:** cierre con botón Cancelar + clic fuera (backdrop) + Escape (respuesta del usuario).
- **Sí:** código interno en inglés (identificadores, tipos, comentarios, nombres de archivo), rutas en inglés, textos visibles de UI en español; `lang="es"` se conserva.
- **No:** ruta independiente ni `lib/new-post-data.ts` ni persistencia — valores hardcodeados en el componente, como los comps.
- **No:** acceso directo del feed ni enlace "Editar" abriendo el modal — quedan como `href="#"` (fuera de alcance).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El modal necesita estado cliente (`open/abierto`) dentro de un shell de server components | Componente de cliente aislado `NewPostDialog`; el resto del sidebar/feed sigue siendo server (patrón de `AddChildDialog` en SPEC 04 y `LinkParentDialog` en SPEC 05). No hay rutas nuevas que `cacheComponents` afecte. |
| Sin comp móvil de referencia para el modal → desviación a <768px | Reusar exactamente los mismos tokens, radios, sombras y placeholders; solo cambia el ancho (casi completo) y padding en móvil; verificar screenshot a 390px. |
| Validación sin backend puede sentirse "falsa" | Se acepta a conciencia: regla "solo interfaces" de SPEC 01/02; el toast es un mock de confirmación visual. |

## Lo que **no** está en esta spec

- Pantalla independiente de Nueva publicación ni rutas nuevas.
- El acceso directo "Compartí un momento…" y el enlace "Editar" abriendo el modal (quedan como `href="#"`).
- Persistencia, backend, feed real de publicaciones, detalle de publicación, subida de fotos reales.
- Autenticación, guards y cualquier cosa que requiera sesión.
- Vistas de familia, resumen del día, agregar/editar niño, vinculación de padres.

Cada uno de esos, si aterriza, va en su propia spec.
