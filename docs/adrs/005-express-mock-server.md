# ADR-005: Mock Server Express + json-server para desarrollo

**Estado:** Aceptado
**Fecha:** 2026-07-10 (retroactivo — decisión ya implementada)
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

El desarrollo frontend necesita datos de API sin depender del backend real (des/pre/prod) para iterar rápido y para los tests E2E. El proyecto expone specs Swagger (`apis/*.json`: execution, fire-trials, planning, users, warehouse) que describen los contratos reales de esas APIs.

## Decisión

El proyecto `mocks` (`apps/mock-data` vía Nx, target `mock-data:serve`) es una app Express que monta `json-server` bajo el prefijo `/api`, sirviendo fixtures desde `mocks/src/db` + assets estáticos, con CORS habilitado (`mocks/src/main.ts`). Se arranca junto a la app (`npm run start:dev`) o en modo proxy (`start:mocks:app` con `PROXY_TARGET=mocks`). Los mocks se generan/mantienen con la skill `mock-server-expert`, alineados con los Swagger de `apis/`.

**Alternativa rechazada:** MSW (Mock Service Worker) contract-first compartiendo mocks entre tests y dev — no adoptado en este repo; los tests unitarios mockean servicios directamente (Vitest) y no comparten fixtures con el mock server de desarrollo.

## Consecuencias

### Positivas

- Desarrollo frontend desacoplado de la disponibilidad del backend real.
- `json-server` da CRUD + paginación out-of-the-box sobre JSON planos, rápido de extender.

### Negativas

- `json-server` (`0.17.4`) es un paquete con mantenimiento limitado — riesgo de CVEs no parcheadas a largo plazo.
- Los fixtures de `mocks/` no están verificados automáticamente contra los Swagger de `apis/` — pueden desincronizarse en silencio.
- Los tests unitarios no reutilizan los mismos fixtures que el mock server de desarrollo (a diferencia de un enfoque contract-first tipo MSW), duplicando esfuerzo de mantenimiento de datos de prueba.

### Pendiente

- Evaluar migración del routing de mocks a Express plano (ya presente como dependencia) para poder retirar `json-server`.
- Añadir verificación de drift entre `apis/*.json` (Swagger) y los fixtures de `mocks/src/db`.

## Referencias

- `mocks/src/main.ts`
- `mocks/project.json`
- `apis/*.json`
- `.claude/skills/mock-server-expert/SKILL.md`
