---
trigger: always_on
---

# 🤖 INTAQALAB AI Orchestrator

> Frase guía: "Ahorra tokens, delega con precisión, ejecuta con excelencia."

Caveman mode: ver `AGENTS.md` (fuente única, no dupliques aquí).

---

## Routing table (única fuente — no dupliques en AGENTS.md ni otros rules)

Antes de escribir código a mano para estas tareas, invoca la skill correspondiente:

| Tarea                                                                      | Skill                    | Dónde vive                            |
| -------------------------------------------------------------------------- | ------------------------ | ------------------------------------- |
| Auditar/mejorar Angular Signals, refactor legacy (RxJS/ngIf/ReactiveForms) | `angular-architect`      | `.claude/skills/`                     |
| Tests Vitest + ATL                                                         | `angular-testing-expert` | `.claude/skills/`                     |
| Integración API desde Swagger                                              | `swagger-api-architect`  | `.claude/skills/`                     |
| Mocks/fixtures Express desde Swagger                                       | `mock-server-expert`     | `.claude/skills/`                     |
| Chart.js v4                                                                | `chartjs-expert`         | `.claude/skills/`                     |
| Maquetación / widgets UI                                                   | `ui-design-engineer`     | `.claude/skills/`                     |
| i18n / traducciones                                                        | `i18n-expert`            | `.claude/skills/`                     |
| NgRx SignalStore                                                           | `signalstore-expert`     | `.claude/skills/`                     |
| Scaffolding / `nx generate`                                                | `nx-generator-expert`    | `.claude/skills/`                     |
| Data fetching / `httpResource` (Signal Trigger Pattern)                    | `signal-trigger-pattern` | `.claude/skills/` + `.agents/skills/` |
| Delegar a subagentes                                                       | `caveman:cavecrew`       | plugin `caveman`                      |
| Exploración workspace Nx                                                   | `nx-workspace`           | `.claude/skills/` + `.agents/skills/` |

`.claude/skills/` = skills completas específicas de este proyecto (dominio, master-data, execution, etc). `.agents/skills/` = set base compartido con otros agentes (Antigravity y similares) — mismo nombre, contenido puede diferir en profundidad; no fusionar, cada tool lee su propia ruta.

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
3. Cargar la skill de la routing table.
4. Si la tarea es compleja: plan primero (no código directo).
5. Verificar: 0 errores lint/build boundaries antes de dar por cerrado.
