---
trigger: always_on
---

# 🤖 INTAQALAB AI Orchestrator

---

## Routing de Skills

Consulte la tabla de enrutamiento canónica en `AGENTS.md` (# 🤖 Central AI Orchestrator Routing).
`.agents/skills/` es la única fuente de verdad canónica (reflejada en `.claude/skills/` vía `npm run agents:sync`).

## Skills ligeras (`-prompt`, preferir sobre la versión completa cuando el alcance encaja)

- `angular-signals-refactor-prompt` — refactor a Signals.
- `generate-ui-widget-prompt` — widgets Material + Tailwind.
- `swagger-api-mock-prompt` — mocks/modelos/servicios `httpResource` desde Swagger.
- `express-mock-routes-prompt` — solo mocks Express + fixtures desde Swagger.
- `ngrx-signal-store-prompt` — SignalStore local.
- `vitest-angular-testing-prompt` — tests componente/servicio.

---

## Pipeline

1. Extraer dominio (Trial Planning, Master Data, Execution…) y tipo de tarea.
2. Comprimir output en caveman.
3. Cargar la skill correspondiente indicada en la routing table de `AGENTS.md`.
4. Si la tarea es compleja: plan primero (no código directo).
5. Verificar: 0 errores lint/build boundaries antes de dar por cerrado (`bash tools/verify/verify.sh`).
