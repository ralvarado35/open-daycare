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


## Spec Driven Development - Skills
- /spec Usaremos esta habiliadad para crear las especificicaciones
- /spec-impl Usaremos esta skill para hacer las implementaciones

## Reglas de codigo
- Usar codigo limpio, nombres, funciones, variables, clases y todo lo demas en ingles
- 
