# SPEC 03 — Login y activar cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-07
> **Objetivo:** Portar las pantallas `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` a las rutas estáticas `/login` y `/activate-account`, visualmente idénticas a los comps en desktop y móvil, sin el toggle Personal/Familia y sin autenticación real.

## Por qué existe esta spec

Son las primeras pantallas fuera del shell con `Sidebar` (el resto de la app construye sobre SPEC 01/02). Establecen el patrón de pantallas **standalone full-screen sin guard**, reutilizando los tokens y `SunIcon` existentes sin duplicarlos, y formalizan el descarte del toggle de rol (decisión explícita del usuario).

## Scope

**In:**

- Rutas reales `/login` y `/activate-account`, ambas **server components estáticas sin JavaScript**, standalone full-screen sin `Sidebar`/`MobileNav` y sin guard (el Feed `/` y `/kids` quedan accesibles directo, igual que en SPEC 01/02).
- `/login` (desktop): cuadrícula de 2 columnas — panel degradado con logo (`SunIcon`), titular «El día de cada niño, compartido con su familia.», subtítulo y pie «🌿 Guardería Sala Soles» + formulario (título «Iniciar sesión», `EMAIL` con `defaultValue="caro@opendaycare.com"`, `CONTRASEÑA` tipo password con dots, «¿Olvidaste tu contraseña?», CTA «Iniciar sesión» real a `/`, link «Activá tu cuenta» real a `/activate-account`). **Sin botones Personal/Familia** y sin estado de rol.
- `/activate-account` (desktop): columna centrada `max-w-[440px]` — badge con `SunIcon`, título «Bienvenida a OpenDayCare», card «Te invitaron a seguir a Mateo · Sala Soles» (avatar `M`), inputs `CÓDIGO DE INVITACIÓN` (`defaultValue="7K4P9"`), `EMAIL` (`lucia.fernandez@gmail.com`), `CREAR CONTRASEÑA` (password), checkbox de autorización de fotos con `defaultChecked`, CTA «Activar mi cuenta» como `#` (familia-feed aún no existe) y link «Iniciar sesión» real a `/login`.
- `lib/nav.ts`: `loginHref = "/login"`, `activateAccountHref = "/activate-account"`, `forgotPasswordHref` y `familyFeedHref` como placeholders `"#"` (convención SPEC 01/02).
- Reutilización total: tokens `@theme` existentes, `SunIcon` de `app/components/icons.tsx`, valores arbitrarios solo para el degradado exacto (`#F6A98E→#EC7E62`), círculos semitransparentes del panel y sombras del comp. Sin dependencias nuevas.
- Textos visibles 100% en español exactos del comp (rioplatense: «Ingresá», «Activá», «¿Te invitó la guardería?»); código interno en inglés.
- Adaptación móvil `<768px`: `/login` apilada (panel compacto arriba con logo + titular corto, formulario debajo); `/activate-account` centrada con padding sin desbordes.

**Out of scope (para futuras specs):**

- Toggle Personal/Familia, estado de rol y redirect diferenciado (`feed` vs `familia-feed`).
- Autenticación real, sesiones, persistencia y guard que proteja `/` o `/kids`.
- Validación, mensajes de error, loading, show/hide de contraseña y submit con backend (`required`, `action`, async).
- Flujo real de recuperación de contraseña («¿Olvidaste tu contraseña?»).
- Vistas de familia (`familia-*.dc.html`) y cualquier pantalla posterior al activar.
- Base de datos, APIs y cualquier persistencia entre sesiones.
- Responsive más allá de lo definido (tablets landscape, pantallas ultra anchas).
- Módulo `lib/auth-data.ts` (valores hardcodeados en el JSX, como los comps).

## Data model

Esta feature **no introduce estructuras de datos nuevas**. Los valores (email prellenado, código `7K4P9`, card de Mateo) se hardcodean en el JSX tal cual los comps. No se crea `lib/auth-data.ts`.

Valores literales usados por las páginas (no modelados, solo para fijar fidelidad):

```ts
// app/login/page.tsx (server, sin estado)
emailDefault = "caro@opendaycare.com"
loginCtaHref = "/"               // lib/nav.ts: loginHref + "/" real
activateHref = "/activate-account"

// app/activate-account/page.tsx (server, sin estado)
invitationDefault = "7K4P9"
emailDefault = "lucia.fernandez@gmail.com"
activateSubmitHref = "#"         // placeholder futuro familia-feed
```

## Plan de implementación

1. `lib/nav.ts`: añadir `loginHref`, `activateAccountHref`, `forgotPasswordHref` y `familyFeedHref`. *Manual: el build resuelve las importaciones sin error.*
2. `app/login/page.tsx` (server): cuadrícula 2 columnas desktop (panel degradado + form), `SunIcon` reutilizado, inputs con `defaultValue`, CTA y links conectados a `lib/nav.ts` (`/` real, `/activate-account` real, olvidar `#`). *Manual: `/login` a 1280px idéntica al comp; ningún rastro de Personal/Familia en el DOM.*
3. `app/activate-account/page.tsx` (server): columna centrada, card de Mateo, código/email/contraseña con `defaultValue`, checkbox `defaultChecked` accesible, CTA `#` e «Iniciar sesión» real a `/login`. *Manual: `/activate-account` a 1280px idéntica al comp.*
4. Adaptación móvil `<768px`: `/login` apilada (panel compacto con logo + titular corto arriba, form debajo), `/activate-account` con padding sin scroll horizontal. *Manual: ambas rutas a 390px sin desbordes y panel de login reconocible.*
5. Verificación: `npm run lint` + `npm run build` + screenshots con Playwright MCP (desktop y móvil de ambas rutas) contra los comps.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` pasan sin errores.
- [ ] A 1280px, screenshot de `/login` visualmente idéntico al comp (panel degradado, 2 columnas, tipografías Fredoka/Nunito, espaciados, radios y sombras).
- [ ] A 1280px, screenshot de `/activate-account` visualmente idéntico al comp (columna centrada, card de Mateo, inputs, checkbox, CTA y sombras).
- [ ] `/login` muestra el email prellenado `caro@opendaycare.com`, password con dots y los textos exactos del comp.
- [ ] En `/login` no existe ningún botón ni texto «Personal» o «Familia» (toggle totalmente fuera).
- [ ] CTA «Iniciar sesión» navega a `/` real; «Activá tu cuenta» navega a `/activate-account` real.
- [ ] «¿Olvidaste tu contraseña?», «Activar mi cuenta» usan `href="#"` y no navegan.
- [ ] `/activate-account` muestra card «Mateo · Sala Soles», código `7K4P9`, email `lucia.fernandez@gmail.com` y checkbox marcado por defecto.
- [ ] «Iniciar sesión» en `/activate-account` navega a `/login` real.
- [ ] A <768px, `/login` se apila en una columna (panel compacto arriba) sin desbordes; `/activate-account` tampoco desborda.
- [ ] Ambas pantallas son full-screen sin `Sidebar`, top bar ni drawer.
- [ ] No hay dependencias nuevas; `SunIcon` se reutiliza de `app/components/icons.tsx`.
- [ ] El código interno está en inglés; los textos visibles quedan en español; `lang="es"` se conserva.
- [ ] Sin errores en consola del navegador.

## Decisiones

- **Sí:** rutas en inglés `/login` y `/activate-account` (convención SPEC 02 `/kids`, código interno en inglés).
- **No:** ruta en español `/activar-cuenta` — rompe la convención de código en inglés.
- **Sí:** solo visual, sin guard ni auth (decisión del usuario); `/` sigue siendo el Feed accesible directo.
- **No:** guard con redirect a `/login` — implicaría sesión real, fuera del alcance de «solo interfaces».
- **Sí:** `Iniciar sesión → /` real y `Activar mi cuenta → #` (placeholder familia-feed, convención SPEC 01/02 centralizada en `lib/nav.ts`).
- **No:** enviar ambos CTA a `/` — perdería el placeholder futuro de la vista familia.
- **Sí:** form único con email `caro@opendaycare.com` (comp staff) y sin toggle (decisión explícita del usuario: no usar Personal/Familia).
- **No:** email vacío o email familia — desvía del comp sin ganar nada.
- **Sí:** 2 `page.tsx` standalone server sin componentes nuevos; `SunIcon` y tokens reutilizados.
- **No:** `BrandPanel` o `AuthForm` genérico — overkill para 2 pantallas con estructura distinta.
- **Sí:** server estático sin JS (`defaultValue`/`defaultChecked`), igual que el buscador de SPEC 02.
- **No:** inputs controlados con `useState`, show/hide ni validación — añadirían JS sin backend que los justifique.
- **Sí:** sin `lib/auth-data.ts`; valores hardcodeados como en los comps.
- **No:** módulo mock tipado — no hay datos reutilizables que modelar.
- **Sí:** checkbox real accesible con `defaultChecked` (fiel al comp, pero semántico).
- **No:** bloque visual con solo un span con tilde — menos accesible que un input.
- **Sí:** móvil login apilada con panel compacto arriba (conserva la marca).
- **No:** ocultar el panel o mantener 2 columnas apretadas a 390px — pierden identidad/legibilidad.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El móvil de `/login` no tiene comp → panel compacto puede desviarse del lenguaje visual | Reutilizar exactamente los mismos tokens, degradado, radios y `SunIcon`; solo cambia el apilado (patrón SPEC 01/02). |
| El comp de activar incluye `value="contraseña"` literal en el input password | Renderizar como `defaultValue` en un input `type="password"` (dots visibles, igual que en el comp). No exponer lógica de show/hide. |

## Lo que **no** está en esta spec

- Toggle Personal/Familia y redirect por rol.
- Autenticación real, sesiones, guards y logout.
- Validación, estados de error/loading y backend de formularios.
- Flujo «¿Olvidaste tu contraseña?» y vistas de familia.
- Base de datos, persistencia y APIs.

Cada uno de esos, si aterriza, va en su propia spec.
