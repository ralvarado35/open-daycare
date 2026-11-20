---
description: Audita y corrige accesibilidad (WCAG 2.2 AA) en las rutas indicadas (Context7/W3C + npm run lint/build + Playwright)
agent: accessibility-checker
---

Audita y corrige la accesibilidad (WCAG 2.2 nivel AA) en estas rutas: $ARGUMENTS

Audita primero, contrasta cada cambio con WCAG 2.2 y la documentación actual vía Context7, aplica solo correcciones mínimas respaldadas por la doc y cierra con el reporte completo (tabla de hallazgos con criterio WCAG, severidad, cambio, evidencia; resultado de `npm run lint` y `npm run build`; no aplicados y pendientes).

Si no se indican rutas, pídeme la lista antes de empezar. Si se pide solo revisión (sin editar), entrega el reporte sin aplicar cambios.