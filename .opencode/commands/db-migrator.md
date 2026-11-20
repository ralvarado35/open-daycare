---
description: Asegura que existan las migraciones en supabase/migrations/ y las aplica al proyecto de Supabase (inventario local vs remoto, drift, migraciones faltantes, advisors, lint/build)
agent: db-migrator
---

Ejecuta el flujo de DB Migrator con este alcance: $ARGUMENTS

Si no se indica alcance, sincroniza todo: inventario local vs remoto, aplica las migraciones pendientes en orden, reporta drift y migraciones faltantes, corre advisors y cierra con `npm run lint` + `npm run build`. Si se indica una spec (`specs/databases/...`), una tabla/entidad o un número de migración, enfócate en eso.

Antes de crear migraciones nuevas (especialmente con seed o SECURITY DEFINER), muéstramelas y pide confirmación si incluyen statements destructivos.