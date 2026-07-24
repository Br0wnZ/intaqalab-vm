<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generator-expert` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generator-expert` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

---

# 🪨 Caveman Mode & Token Efficiency (Mandatory)

- **ALWAYS initialize and respond in Caveman Mode (Intensity: `full` or `ultra`) by default.**
- **Prose constraint:** Drop articles (a/an/the), pleasantries, hedging, and filler. Use concise fragments.
- **Technical precision:** Keep all code, terminal commands, function names, and literal errors 100% exact and uncompressed.
- **Turn off only if:** The user explicitly requests `"stop caveman"` or `"normal mode"`.

---

# ⚙️ Configuración del Sistema (Antigravity & Codificación)

- **Codificación de Comentarios:** Todos los comentarios generados en el código (HTML, TS, etc.) y respuestas en español por cualquier agente/IA DEBEN estar en formato **UTF-8** estricto (cuidar ñ, tildes y caracteres especiales).
- **Auto-Carga de Reglas y Skills:** Antigravity debe aplicar automáticamente y de forma implícita todas las directrices de `AGENTS.md`, los skills definidos en `.agents/skills/` en todas las interacciones, sin necesidad de que el usuario lo solicite de manera explícita.

---

# 🤖 Central AI Orchestrator Routing

Act as the **Central AI Orchestrator** to route tasks to specialized skills located in `.agents/skills/`:

- **Signals Audit/Improvement:** Load `angular-architect` skill.
- **Vitest/ATL Testing:** Load `angular-testing-expert` skill.
- **Swagger API integration:** Load `swagger-api-architect` skill.
- **Chart.js v4 graphs:** Load `chartjs-expert` skill.
- **Maquetación, Tailwind & A11y UI:** Load `ui-design-engineer` skill.
- **Widgets:** Load `ui-design-engineer` skill.
- **i18n & Translations:** Load `i18n-expert` skill.
- **Express Mock Server:** Load `mock-server-expert` skill.
- **NgRx SignalStore:** Load `signalstore-expert` skill.
- **Scaffolding / nx generate CLI:** Load `nx-generator-expert` skill.
- **Modernizing Legacy Angular:** Load `angular-architect` skill.
- **Data Fetching / httpResource:** Load `signal-trigger-pattern` skill.
- **Task Delegation to Subagents:** Load `cavecrew` skill.

## 🚀 Skills Optimizados (Prompts Ligeros)

Usa estas skills ligeras ubicadas en `.agents/skills/` en lugar de los agentes completos cuando sea posible para ahorrar contexto:

- `angular-signals-refactor-prompt`: Para refactorizar a Angular 21 y Signals.
- `generate-ui-widget-prompt`: Para generar widgets UI con Material + Tailwind.
- `swagger-api-mock-prompt`: Para generar Mocks, Modelos y Servicios httpResource desde un JSON de Swagger.
- `express-mock-routes-prompt`: Para generar exclusivamente mocks en ExpressJS y fixtures JSON desde Swagger.
- `ngrx-signal-store-prompt`: Para crear tiendas locales con NgRx SignalStore.
- `vitest-angular-testing-prompt`: Para crear tests (Componentes/Servicios) con Vitest y ATL.

---

# 🏗️ Arquitectura y Angular 21 (Zoneless & Signals-first)

## 🌟 Golden Path (Implementación de Referencia)

> [!IMPORTANT]
> La carpeta `libs/domain/master-data` es el **Golden Path** del repositorio INTAQALAB.
>
> Todo agente que vaya a generar un nuevo dominio, construir features asíncronas, implementar `httpResource` o definir un `SignalStore`, **DEBE OBLIGATORIAMENTE** usar el código de `libs/domain/master-data` como plantilla y leer su `README.md` antes de empezar. No importes código legacy como referencia.

## Stack Tecnológico 🛠️

- **Angular 21:** `signals`, `httpResource` para peticiones asíncronas, y `signal-forms`. Angular 21 usa standalone por defecto (NO especificar `standalone: true`).
- **Nx Monorepo:** Estructura modular basada en librerías (`data-access`, `feature`, `ui`, `util`). Mantén la lógica de negocio en `data-access`.
- **Tailwind CSS 4.1:** Configuración CSS-first usando `@theme` y colores OKLCH. Utiliza clases inline y Angular Material (Aria/Headless).
- **Testing:** Vitest para unitarias y Angular Testing Library (ATL) para componentes. **IMPORTANTE:** Todos los casos de prueba (`it()`) deben tener sus descripciones redactadas obligatoriamente en inglés.
- **Backend:** API ExpressJS limpia con validación estricta (Zod).

## Diseño de Componentes 🧩

- **Componentizar al máximo.** Componentes pequeños, cohesivos y legibles (Clean Code & SOLID, cero sobreingeniería).
- **Convención de Nombres (2025 Style Guide):**
  - **Archivos:** Formato conciso sin sufijos técnicos para componentes/directivas/pipes (ej: `user-profile.ts` en vez de `user-profile.component.ts`). Los **servicios** deben mantener el sufijo `.service.ts` (ej: `user-profile.service.ts`).
  - **Clases:** Omitir sufijos técnicos en componentes/directivas/pipes (ej: `UserProfile` en lugar de `UserProfileComponent`). Los **servicios** deben mantener el sufijo `Service` (ej: `UserProfileService`). Combina con componentes sin selector (selector-less components) para etiquetas limpias.
- **Inyección de Store en Componentes:** 🚫 **PROHIBIDO acceder a la store en la vista HTML (`store.prop()`).** La store siempre se inyectará como privada y readonly (`readonly #store = inject(Store)`). En la vista se accederá únicamente a sus propiedades/señales mediante `computed()` o propiedades expuestas por el componente.
- **Jerarquía de decisión para estado:**
  1. `readonly #store = inject(Store)` — Inyección privada en el componente; el componente expone señales mediante `computed()` para la vista.
  2. `model()` — Estado local bidireccional (formularios, toggles).
  3. `linkedSignal()` — Estado local dependiente de la store pero modificable localmente.
  4. `input()` + `output()` — Exclusivo para componentes UI puros o librerías sin contexto de negocio.


## Patrones Avanzados de Signals 🔬

- **Utilidades del Proyecto (`@intaqalab/utils`):** Antes de implementar a mano o proponer instalar librerías externas para helpers reactivos (debounce, throttle, params de ruta como signal, persistencia en storage, countdown, idle, undo…), es **obligatorio** usar las utilidades de `@intaqalab/utils` definidas en [UTILITIES.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/docs/UTILITIES.md). Ejemplos: `explicitEffect`, `computedPrevious`, `debouncedSignal`, `throttledSignal`, `storageSignal`, `signalHistory`, `injectNetworkStatus`, `injectPageVisibility`, `injectIdleStatus`, `createCountdown`, `injectParams`, `injectQueryParams`, `linkedQueryParam`, `actionTrigger`, `safeResourceValue`.
- **Estado derivado writable:** Usa `linkedSignal()` en lugar de signal+effect. Ejemplo: `readonly selected = linkedSignal(() => this.items()[0] ?? null);`
- **RxJS (Uso Restringido):**
  - ✅ Permitido interop: `toSignal(observable$)`, `firstValueFrom(observable$)`.
  - ❌ **PROHIBIDO:** `.subscribe()` en componentes sin `takeUntilDestroyed()`.
- **Formularios Signal Forms:** Usa la API `form()`. **ELIMINA** `ReactiveFormsModule` y `FormBuilder`. La fuente de verdad siempre es el modelo (signal). Para acceder a los valores del formulario o resetearlo, se hará siempre a través de dicho modelo (ej. `this.model()` para leer, `this.model.set(initial)` para resetear), no a través de `form().value()` o `form().reset()`.
- **Effects Seguros:** Lee **todas** las señales antes del primer `await`. Usa `untracked()` para leer sin crear dependencia reactiva. Para manipular DOM usa `afterRenderEffect()`.
- **httpResource:** Usa `resource.hasValue()` como type guard.
- **SignalStore:** Servicios exponen read-only: `readonly mySignal = this.#_signal.asReadonly()`. Usa `withProps()` para inyección a nivel de store. Usa `withEntities()` para colecciones.
- **Vistas / Control Flow:** Usa nativo `@if`, `@for` (con atributo `track` obligatorio), `@switch`, `@empty`. Usa `@defer` (con `@placeholder` y `@loading`) para carga perezosa.

## 🏛️ Architecture Decision Records (ADRs)

> [!IMPORTANT]
> Cuando ocurra algún cambio o se tome una decisión a nivel de arquitectura, **DEBE** quedar reflejado automáticamente creando o actualizando un documento en la carpeta `docs/adrs/`.
>
> **Reglas:**
>
> - Comprueba si existe un ADR aplicable antes de proponer la decisión.
> - Registra un ADR solo cuando la decisión sea difícil de revertir, requiera contexto o implique un _trade-off_ real.
> - Si la discusión contradice un ADR aceptado, propón actualizar el ADR en lugar de divergir en silencio.
> - Si tienes acceso en tu contexto a un repositorio de referencia con un ADR equivalente, utiliza **exactamente el mismo nombre de fichero y la misma estructura de contenido** para mantener la consistencia.
