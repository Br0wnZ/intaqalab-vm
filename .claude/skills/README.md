# 🤖 INTAQALAB Local Skills

This directory centralizes the AI assistants (skills) maintained at the **project level**. They are configured to enforce Nx Monorepo and Angular 21 (Zoneless, Signals-first) standards across the Intaqalab project, remaining 100% interoperable across Windows, macOS, and Linux with any harness (Antigravity, Claude Code, Copilot, Cursor).

## Consolidated Skills Catalog

### 🧑‍🎨 Frontend, UI & Data Visualization

1. **`ui-design-engineer`**: Builds pixel-perfect interfaces using Angular Material and inline TailwindCSS. Includes accessibility (A11y with `@angular/aria`), design tokens, 3-state skeleton views (`ui-skeleton`), and complete Execution Grid widget architecture (`BaseFormWidgetComponent`, `WidgetStateService`).
2. **`interface-design`**: UX/UI advisor focused on dashboards, admin panels, and interactive tooling.
3. **`chartjs-expert`**: Rendering optimization, plugins, and advanced time-series visualizations with Chart.js v4.
4. **`chartjs-intake`**: Structured intake flow for defining requirements before building complex charts.
5. **`dialog-patterns`**: Canonical patterns for opening, typing, and closing Angular Material dialogs (`MatDialog`).
6. **`view-state-pattern`**: Standardized 3-state view pattern (Loading skeleton, Error with i18n, Success with real components).
7. **`numeric-input-constraints`**: Angular directives and validation constraints for numeric inputs.

### ⚙️ Architecture, State & Business Logic

8. **`angular-architect`**: Lead architect and modernization engineer. Rules for Angular 21 Zoneless, Signals-first, stable Signal Forms (`{ when: () => condition }`), `@Service()` decorator, dedicated mappers (`<feature>-mapper.service.ts`), `@intaqalab/utils` utilities, and RxJS-to-Signals migration guides.
9. **`angular-developer`**: General Angular knowledge base and official API references.
10. **`signalstore-expert`**: State management with `@ngrx/signals`, functional composition (`withState`, `withComputed`, `withMethods`, `withEntities`, `withHooks`), private injection, and rapid generation mode.
11. **`signal-trigger-pattern`**: Mandatory data-fetching pattern with `httpResource` and private trigger signals.
12. **`i18n-expert`**: Management of translation keys in `es/en/de` via `@ngx-translate`, namespace conventions, and synchronization auditing.
13. **`master-data-specialist`**: Domain specialist for Master Data catalogs and generic shell patterns (`libs/domain/master-data`).
14. **`planning-specialist`**: Domain specialist for Trial Planning data models, series, shots, armaments, and munitions (`libs/domain/trial/planning`).
15. **`execution-domain-expert`**: Domain specialist for Trial Execution (state machine, readiness, firing sequences).
16. **`widget-service-integration`**: GET+PUT service integration for execution widgets connecting to stores and mock APIs.

### 🔌 Backend Mocks & APIs

17. **`mock-server-expert`**: Manages the local Express development server (`mocks/`), mock routes, Zod validation, simulated latency, pagination, and JSON fixtures.
18. **`swagger-api-architect`**: End-to-End generator. Generates TypeScript models, `httpResource` services, SignalStore integrations, and Express mock server routes from Swagger JSON.

### 🧪 Testing

19. **`angular-testing-expert`**: QA engineer for Vitest and Angular Testing Library (ATL), behavior-driven DOM testing, Angular Material Component Harnesses, `createMockResource()`, `provideTestingEnvironment()`, and known testing issue resolutions.

### 🏗️ Workspace Tooling (Nx)

20. **`nx-generator-expert`**: Scaffolding with Nx CLI. Ensures libraries are tagged properly (`--tags`) to satisfy ESLint Module Boundaries.
21. **`create-feature`**: Standardized scaffolding for new domain features.
22. **`nx-workspace`**: Explores dependencies and analyzes the Nx project graph.
23. **`nx-run-tasks`**: Helper for running `test`, `lint`, `e2e`, and `build` tasks via Nx.
24. **`nx-plugins`**: Discovers, installs, and configures Nx ecosystem plugins.

---

> [!NOTE]
> Generic platform-agnostic skills (CI monitors, AI architecture prompts, generic tooling) are promoted to the **system global level** (`~/.gemini/config/`) to keep this local workspace clean and focused.
