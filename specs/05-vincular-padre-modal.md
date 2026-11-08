# SPEC 05 — Vincular padre: modal de invitación

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-07
> **Objetivo:** Implementar el modal "Vincular padre" de `references/pantallas/vincular-padre.dc.html` disparado desde el link "Vincular otro padre" del perfil de niño (`/kids/[childId]`), con campos Nombre del padre/madre, Email, Parentesco (Mamá/Papá/Tutor/a) y Código de invitación `7K4P9` fijo no editable, botón "Enviar invitación" como placeholder sin backend, cierre por X/backdrop/Escape y el nombre del niño dinámico según el perfil — sin rutas nuevas ni persistencia.

## Por qué existe esta spec

Es la primera vez que un placeholder `href="#"` de SPEC 02 (`linkParentHref`, usado por "Vincular otro padre" en `/kids/[childId]`) se convierte en un disparador real de un dialog cliente. Sigue exactamente el patrón de SPEC 04 (`AddChildDialog`): componente de cliente aislado, sin backend, sin rutas nuevas, "solo interfaces". Permite avanzar el flujo de familia sin tocar el shell ni las rutas estáticas existentes.

## Scope

**In:**

- Componente de cliente `LinkParentDialog` (modal/dialog) con la tarjeta del comp `vincular-padre.dc.html`: encabezado "Vincular padre" + "a <Nombre del niño>", aviso "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo.", campos NOMBRE DEL PADRE/MADRE, EMAIL, PARENTESCO (radios Mamá/Papá/Tutor/a, Mamá seleccionada inicialmente como el comp), CÓDIGO DE INVITACIÓN `7K4P9` como texto fijo no editable y CTA "Enviar invitación".
- El botón "Enviar invitación" es un placeholder muerto: al hacer clic no navega, no muestra toast, no modifica nada (regla "solo interfaces", sin backend), igual que SPEC 01/02/03.
- Cableado en `app/kids/[childId]/page.tsx`: el link "Vincular otro padre" deja de navegar a `linkParentHref` y abre el dialog mediante `onClick` (estado `open`); se renderiza `<LinkParentDialog />` pasando el `childId` para mostrar el nombre del niño. `linkParentHref` de `lib/nav.ts` queda como `"#"` documentado como trigger del dialog.
- El nombre del niño se lee de los datos mock del perfil activo (`/kids/mateo-fernandez` → "a Mateo Fernández"; otro kid → su nombre).
- Cierre del modal: flecha/X del header, clic fuera (backdrop) y tecla Escape.
- Textos visibles 100% en español exactos del comp; código interno en inglés.
- Modal centrado en desktop; a <768px ocupa casi todo el ancho sin desbordes (patrón móvil de SPEC 01/02/04, no hay comp móvil de referencia del modal).
- Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (modal abierto, desktop y móvil) contra el comp.

**Out of scope (para futuras specs):**

- Ruta independiente `/vincular-padre` o `/kids/[childId]/vincular-padre` (se descarta: el usuario pidió modal).
- Persistencia, backend, lista real de invitaciones, estados reales de padre vinculado, guarda de contacto.
- Autenticación, guards y cualquier cosa que requiera sesión.
- Vistas de familia, resumen del día, agregar/editar niño.
- Demo real de envío de correo ni generación de códigos dinámicos.

## Data model

Introduce una pequeña estructura de formulario (código interno en inglés, textos visibles en español):

```ts
// app/components/link-parent-dialog.tsx
type Relation = "mama" | "papa" | "tutor";

type LinkParentForm = {
  fullName: string;   // NOMBRE DEL PADRE/MADRE
  email: string;      // EMAIL
  relation: Relation; // PARENTESCO
};

const INVITATION_CODE = "7K4P9";
```

No se crea módulo `lib/` nuevo: el código y los valores se hardcodean en el componente, como hacen los comps. Se reutiliza `kid.name` de `lib/kids-data.ts` (ya existente) solo para mostrar el nombre del niño en el encabezado.

## Plan de implementación

1. `app/components/link-parent-dialog.tsx`: componente de cliente (Dialog) con el formulario del comp, código `7K4P9` fijo no editable, radios de parentesco (Mamá/Papá/Tutor/a con Mamá seleccionada por defecto), botón "Enviar invitación" placeholder (sin acción), abrir/cerrar mediante props `open` y `onClose`, cierre con backdrop y Escape. *Manual: el dialog renderiza aislado igual al comp a 1280px y el botón no navega al hacer clic.*
2. `app/kids/[childId]/page.tsx`: el link "Vincular otro padre" abre el dialog mediante `onClick` en lugar de navegar a `linkParentHref`; se importa y renderiza `<LinkParentDialog open={open} onClose={setOpen(false)} />` pasando el `childId` para mostrar el nombre del niño. `linkParentHref` queda como `"#"` (ya es `placeholderHref`). *Manual: `/kids/mateo-fernandez` igual al comp y el link abre el modal sin navegar.*
3. `lib/nav.ts`: `linkParentHref = placeholderHref` se documenta como trigger del dialog (no navega a ningún lado). No cambia su valor. *Manual: el build resuelve la importación sin error.*
4. Verificación: `npm run lint` + `npm run build` + screenshots Playwright MCP (modal abierto desktop y móvil) contra el comp; checks de cierre (X, backdrop, Escape), código fijo `7K4P9`, placeholder del botón y nombre dinámico del niño.

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` pasan sin errores.
- [x] El link "Vincular otro padre" en `/kids/[childId]` abre el modal en lugar de navegar a `#` (no hay navegación).
- [x] El modal renderiza la tarjeta del comp: encabezado "Vincular padre" + "a <Nombre del niño>", aviso de correo, campos NOMBRE DEL PADRE/MADRE, EMAIL, PARENTESCO (Mamá/Papá/Tutor/a), CÓDIGO DE INVITACIÓN `7K4P9` y CTA "Enviar invitación".
- [x] El código de invitación se muestra como texto fijo `7K4P9` (no editable), igual que el comp.
- [x] Al hacer clic en "Enviar invitación" no pasa nada (placeholder): no navega, no muestra toast, no modifica el perfil (regla "solo interfaces").
- [x] El modal se cierra con la flecha/X del header, con clic fuera (backdrop) y con la tecla Escape.
- [x] El nombre del niño se toma del perfil activo (`/kids/mateo-fernandez` → "a Mateo Fernández"; otro kid → su nombre).
- [x] A 1280px, screenshot del perfil con el modal abierto es visualmente idéntico al comp `vincular-padre.dc.html` (colores, radios, tipografías Fredoka/Nunito, sombras).
- [x] A <768px el modal se abre sin desbordes (ancho casi completo, campos legibles).
- [x] Los textos visibles están en español exactos del comp; el código interno está en inglés.
- [x] No hay rutas nuevas ni dependencias nuevas.
- [x] Sin errores en consola del navegador.

## Decisiones

- **Sí:** dialog/disparado desde "Vincular otro padre" del perfil (respuesta del usuario), no página independiente — reusa `linkParentHref` de SPEC 02 y no agrega rutas.
- **Sí:** "Enviar invitación" es placeholder muerto (respuesta del usuario), coherente con SPEC 01/02/03; regla "solo interfaces", sin backend que lo justifique.
- **Sí:** nombre del niño dinámico desde `/kids/[childId]` (respuesta del usuario); el header dice "Vincular padre a <Nombre>".
- **Sí:** cierre con flecha/X del header + clic fuera (backdrop) + Escape (respuesta del usuario).
- **Sí:** código `7K4P9` como texto fijo no editable, fiel al comp (respuesta del usuario).
- **Sí:** radios Mamá/Papá/Tutor/a, Mamá seleccionada inicialmente (fiel al comp; Mamá es el primer radio y Lucía aparece como "Mamá · activa").
- **Sí:** código interno en inglés (identificadores, tipos, comentarios, nombres de archivo), rutas en inglés (`/kids/[childId]`), textos visibles de UI en español; `lang="es"` se conserva.
- **No:** ruta independiente `/vincular-padre` o `/kids/[childId]/vincular-padre` — descartada porque el usuario pidió explícitamente un modal y no hay comp de página entera para ella.
- **No:** `lib/link-parent-data.ts` ni persistencia — valores hardcodeados en el componente, como los comps.
- **No:** estado real de invitación ni fila PENDIENTE agregada al perfil — sin backend ni persistencia, el estado se perdería al recargar.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El modal necesita estado cliente (`open/abierto`) dentro de un shell de server components | Componente de cliente aislado `LinkParentDialog`; el resto de `/kids/[childId]` sigue siendo server (patrón de `AddChildDialog` en SPEC 04 y `MobileNav` en SPEC 01). No hay rutas nuevas que `cacheComponents` afecte. |
| Sin comp móvil de referencia para el modal → desviación a <768px | Reusar exactamente los mismos tokens, radios, sombras y placeholders; solo cambia el ancho (casi completo) y padding en móvil; verificar screenshot a 390px. |
| `cacheComponents` y `params` resuelto tras Suspense en la página dinámica | El dialog se monta dentro de `KidProfileContent` (ya dentro de `<Suspense>`); el `childId` está disponible tras `await params`. |

## Lo que **no** está en esta spec

- Pantalla independiente de Vincular padre ni rutas nuevas.
- Persistencia, backend, lista real de invitaciones, estados reales de padre vinculado.
- Autenticación, guards y cualquier cosa que requiera sesión.
- Vistas de familia, resumen del día, agregar/editar niño.

Cada uno de esos, si aterriza, va en su propia spec.
