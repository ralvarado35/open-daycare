# SPEC 04 — Agregar niño: modal de alta

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-07
> **Objetivo:** Implementar el modal "Agregar niño" de `references/pantallas/agregar-nino.dc.html` disparado desde el CTA "Agregar niño" del header de `/kids` (SPEC 02), con los campos obligatorios NOMBRE COMPLETO, FECHA DE NACIMIENTO y SALA (salas Soles, Luna y Estrellas hardcodeadas), validación de campos obligatorios al guardar y toast de confirmación, sin backend ni rutas nuevas.

## Por qué existe esta spec

Es la primera interacción de formulario de la app (SPEC 01/02/03 son solo interfaces estáticas sin inputs funcionales). Convierte el placeholder `addChildHref = "#"` de SPEC 02 en un disparador real que abre el modal, manteniendo la regla "solo interfaces": no hay persistencia, ni lista real de niños, ni backend.

## Scope

**In:**

- Componente de cliente `AddChildDialog` (modal/dialog) con la tarjeta del comp `agregar-nino.dc.html`: título "Agregar niño", botones Cancelar / Guardar y los 5 campos (NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA, ALERGIAS (ETIQUETAS), NOTAS MÉDICAS) con el mismo estilo (tokens, radios, bordes y placeholders del comp).
- El select SALA hardcodea 3 salas: **Soles** (valor inicial, como el comp), **Luna** y **Estrellas**.
- Los 3 campos obligatorios (nombre completo, fecha de nacimiento, sala) se validan al hacer clic en Guardar: mensaje de error debajo de cada campo vacío, foco en el primero con error, y Guardar no cierra el modal.
- **Guardar:** cierra el modal, limpia el formulario y muestra toast "Niño agregado" (mock, sin backend). **Cancelar:** descarta, resetea el formulario y cierra.
- Cableado en `app/kids/page.tsx`: el CTA "Agregar niño" del header abre el modal en lugar de navegar a `#`; `addChildHref` de `lib/nav.ts` deja de ser un placeholder muerto.
- Textos visibles 100% en español exactos del comp; código interno en inglés.
- Modal centrado en desktop; a <768px ocupa casi todo el ancho sin desbordes (patrón móvil de SPEC 01/02, no hay comp móvil de referencia del modal).
- Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (modal abierto, desktop y móvil) contra el comp.

**Out of scope (para futuras specs):**

- Ruta independiente `/agregar-nino` o `/kids/agregar-nino` (se descarta: el usuario pidió modal).
- Pantalla de listado/edición de niños reales, persistencia, backend, base de datos, autenticación, guards.
- Alergias como chips interactivos (se queda como input de texto plano, fiel al comp).
- Vistas de familia, resumen del día, vinculación de padres.
- Responsive más allá de desktop (<768px) y móvil (<768px dialog ancho completo).

## Data model

Introduce estructuras pequeñas de formulario (código interno en inglés, textos visibles en español):

```ts
// app/components/add-child-dialog.tsx
type Room = {
  id: string;      // "soles" | "luna" | "estrellas"
  label: string;   // "Soles" | "Luna" | "Estrellas"
};

type KidForm = {
  fullName: string;     // NOMBRE COMPLETO
  birthDate: string;    // FECHA DE NACIMIENTO (dd/mm/aaaa)
  roomId: string;       // SALA
  allergies: string;    // ALERGIAS (ETIQUETAS), opcional
  medicalNotes: string; // NOTAS MÉDICAS, opcional
};

type FormErrors = {
  fullName?: string;
  birthDate?: string;
  roomId?: string;
};

const ROOMS: Room[] = [
  { id: "soles", label: "Soles" },
  { id: "luna", label: "Luna" },
  { id: "estrellas", label: "Estrellas" },
];
```

No se crea módulo `lib/` nuevo: los datos van hardcodeados dentro del componente, como hacen los comps.

## Plan de implementación

1. `app/components/add-child-dialog.tsx`: componente de cliente (Dialog) con el formulario del comp, 3 salas hardcodeadas, validación al hacer clic en Guardar (errores bajo campos obligatorios + foco en el primero), toast "Niño agregado", abrir/cerrar y reset de formulario. *Manual: el dialog renderiza aislado igual al comp y pasa la validación de los 3 campos obligatorios.*
2. `app/kids/page.tsx`: el CTA "Agregar niño" del header abre el dialog (`onClick` en lugar de `href="#"`); se importa y renderiza `<AddChildDialog />` con estado `open`. *Manual: `/kids` igual al comp a 1280px y el CTA abre el modal.*
3. `lib/nav.ts`: `addChildHref` queda documentado como trigger del dialog (no navega a ningún lado). *Manual: el build resuelve la importación sin error.*
4. Verificación: `npm run lint` + `npm run build` + screenshots Playwright MCP (modal abierto desktop y móvil) contra el comp; checks de validación, toast y cierre con Cancelar.

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` pasan sin errores.
- [x] `/kids` a 1280px es visualmente idéntico al comp (incluye el CTA "Agregar niño" en el header).
- [x] Clic en "Agregar niño" abre el modal con la tarjeta del comp: título "Agregar niño", Cancelar, Guardar y los 5 campos con los placeholders del comp.
- [x] Al hacer clic en Guardar con los 3 obligatorios vacíos, aparece error debajo de cada uno, foco en el primero, y el modal permanece abierto.
- [x] Completando los 3 obligatorios y haciendo clic en Guardar: el modal se cierra, el formulario se limpia y aparece el toast "Niño agregado".
- [x] Cancelar cierra el modal sin toast y reseta el formulario (descarta).
- [x] El select de SALA muestra exactamente Soles, Luna y Estrellas, con Soles seleccionado inicialmente.
- [x] A <768px el modal se abre sin desbordes y es usable (ancho casi completo, campos legibles).
- [x] Los textos visibles están en español exactos del comp; el código interno está en inglés.
- [x] No hay dependencias nuevas ni rutas nuevas.
- [x] Sin errores en consola del navegador.

## Decisiones

- **Sí:** modal/dialog disparado desde el CTA "Agregar niño" de `/kids` (respuesta del usuario), no página independiente — reusa `addChildHref` de SPEC 02 y no agrega rutas.
- **Sí:** 3 campos obligatorios (nombre completo, fecha de nacimiento, sala); ALERGIAS y NOTAS MÉDICAS opcionales, tal como el comp.
- **Sí:** salas Soles, Luna y Estrellas, con Soles preseleccionado (fiel al comp); respuesta del usuario.
- **Sí:** validación con mensajes de error bajo cada campo obligatorio + foco en el primero (respuesta del usuario), no solo botón deshabilitado.
- **Sí:** Guardar = toast mock "Niño agregado" + cierre + limpieza; Cancelar = descarta y cierra (respuesta del usuario; regla "solo interfaces", sin backend).
- **Sí:** código interno en inglés (identificadores, tipos, comentarios, nombres de archivo), rutas en inglés (`/kids`), textos visibles de UI en español; `lang="es"` se conserva.
- **No:** ruta `/agregar-nino` o `/kids/agregar-nino` — descartada porque el usuario pidió explícitamente un modal y no hay comp de página entera para ella.
- **No:** `lib/add-child-data.ts` ni persistencia — valores hardcodeados en el componente, como los comps; la lista real de niños es otra spec.
- **No:** chips interactivos de alergias — input de texto plano, fiel al comp.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El modal necesita estado cliente (`open/abierto`) dentro de un shell de server components | Componente de cliente aislado `AddChildDialog`; el resto de `/kids` sigue siendo server (patrón de `MobileNav` en SPEC 01). No hay rutas nuevas que `cacheComponents` afecte. |
| Sin comp móvil de referencia para el modal → desviación a <768px | Reusar exactamente los mismos tokens, radios, sombras y placeholders; solo cambia el ancho (casi completo) y padding en móvil; verificar screenshot a 390px. |
| Validación sin backend puede sentirse "falsa" | Se acepta a conciencia: regla "solo interfaces" de SPEC 01/02; el toast es un mock de confirmación visual. |

## Lo que **no** está en esta spec

- Pantalla independiente de Agregar niño ni rutas nuevas.
- Persistencia, backend, lista real de niños, pantalla de edición.
- Autenticación, guards y cualquier cosa que requiera sesión.
- Vistas de familia, resumen del día, vinculación de padres.

Cada uno de esos, si aterriza, va en su propia spec.
