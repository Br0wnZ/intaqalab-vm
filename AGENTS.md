<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `npx nx run`, `npm exec nx test`) instead of using the underlying tooling directly or using pnpm (this project uses `npm` / `npx`).
- Prefix nx commands with `npx` or `npm exec` (e.g., `npx nx test execution`, `npm exec nx test <project>`). NEVER use `pnpm` (fails with `EPERM` / `configured to use npm`).
- Nx project names match exact `name` in `project.json` or `nx show projects` output (e.g., `execution` instead of import path `domain-trial-execution`). Run `npx nx show projects` or `npx nx show project <name>` to inspect exact names and configurations.
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

# ⚙️ System Configuration & Execution Rules

- **Comments & Encoding:** Strict **UTF-8** format for all code and docs (accent marks, ñ, special chars).
- **Auto-Load Rules & Skills:** Antigravity, Claude Code, GitHub Copilot, and Cursor implicitly follow all instructions in `AGENTS.md` and dynamically load skills from `.agents/skills/`.
- **Definition of Done:** Zero lint errors, passing Vitest unit tests (`npx nx test <project>`), and zero broken imports.

---

# 🤖 Central AI Orchestrator Routing

Route tasks to specialized skills in `.agents/skills/`:

- **Signals Audit / Modernization:** `angular-architect`
- **Vitest & ATL Testing:** `angular-testing-expert`
- **Swagger / OpenAPI Integration:** `swagger-api-architect`
- **Chart.js v4 Visualizations:** `chartjs-expert`
- **UI Layout, Tailwind & A11y:** `ui-design-engineer`
- **Execution Grid Widgets:** `ui-design-engineer`
- **i18n & Translations (`es/en/de`):** `i18n-expert`
- **Express Mock Server & Fixtures:** `mock-server-expert`
- **NgRx SignalStore:** `signalstore-expert`
- **Nx Scaffolding & CLI (`nx generate`):** `nx-generator-expert`
- **Data Fetching (`httpResource`):** `signal-trigger-pattern`
- **Numeric Constraints & Directives:** `numeric-input-constraints`
- **3-State Views (Skeleton):** `view-state-pattern`
- **Trial Planning Domain:** `planning-specialist`
- **Trial Execution Domain:** `execution-domain-expert`
- **Master Data Domain:** `master-data-specialist`

## 🚀 Optimized Fast Prompts (Lightweight Mode)

Each consolidated skill in `.agents/skills/` contains a **⚡ Quick Mode** subsection to output direct code without explanations when saving context:

- **Refactoring to Signals:** Quick mode in `angular-architect`.
- **UI Widgets (Material + Tailwind):** Quick mode in `ui-design-engineer`.
- **Mocks & Models from Swagger:** Quick mode in `swagger-api-architect`.
- **Express Routes & JSON Fixtures:** Quick mode in `mock-server-expert`.
- **Local NgRx SignalStore:** Quick mode in `signalstore-expert`.
- **Vitest + ATL Testing:** Quick mode in `angular-testing-expert`.

---

# 🏗️ Architecture & Angular 21 Standards (Zoneless & Signals-first)

## 🌟 Golden Path Reference

> [!IMPORTANT]
> `libs/domain/master-data` is the **Golden Path** of the INTAQALAB repository.
> Every agent building new domains, async features, `httpResource` integrations, or `SignalStores` **MUST** use `libs/domain/master-data` as the canonical template and review its `README.md`.

## Technology Stack 🛠️

- **Angular 21:** `signals`, `httpResource`, `signal-forms`. Standalone by default (omit `standalone: true`).
- **Nx Monorepo:** Layered modular libraries (`data-access`, `feature`, `ui`, `util`). Keep business logic in `data-access`.
- **Tailwind CSS 4.1:** Inline classes and Angular Material (Aria/Headless). Prohibit dedicated component SCSS files.
- **Testing:** Vitest + Angular Testing Library (ATL). **MANDATORY:** All `it()` descriptions MUST be written in English.
- **Backend:** Clean ExpressJS mock server with Zod schema validation.

## Component Design & Best Practices 🧩

- **Maximal Cohesion:** Small, single-responsibility components (Clean Code & SOLID, zero over-engineering).
- **Naming Conventions (2025/2026 Style Guide):**
  - **Files:** Omit technical type suffixes for components/directives/pipes (e.g. `user-profile.ts` instead of `user-profile.component.ts`). **Services** maintain `.service.ts` (e.g. `user-profile.service.ts`).
  - **Classes:** Omit technical suffixes for components/directives/pipes (e.g. `UserProfile` instead of `UserProfileComponent`). **Services** maintain `Service` suffix (e.g. `UserProfileService`).
  - **Types & Enums:** MUST be declared under the `models` or `utils-models` directory of the respective library. Never inline in components or services.
- **Dedicated Mappers (`<feature>-mapper.service.ts`):** Extract all heavy backend ↔ frontend transformation logic and catalog operations into a dedicated service (e.g. `ArmamentMapperService`). Components must remain slim.
- **Save/Submit Button (`ui-save-button`):** ⚡ **MANDATORY.** For form mutations, submissions, and save actions, use `<ui-save-button>` from `@intaqalab/ui` (`SaveButton`) with `[isSaving]="resource.isLoading()"`. Never use raw `mat-flat-button` for form submissions.
- **Inputs & Selects:** ⚡ **MANDATORY.** All `matInput` and `mat-select` controls MUST have floating labels via `<mat-label>{{ '...' | translate }}</mat-label>` inside `<mat-form-field>` and placeholder i18n (`[placeholder]="'...' | translate"`).
- **Store Injection in Components:** 🚫 **PROHIBITED accessing stores in templates (`store.prop()`).** Stores are injected privately (`readonly #store = inject(Store)`). Templates access data exclusively through exposed computed signals.
- **State Decision Hierarchy:**
  1. `readonly #store = inject(Store)` — Private store injection; component exposes computed signals for template.
  2. `model()` — Two-way local state (forms, toggles).
  3. `linkedSignal()` — Derived writable state synchronized with store.
  4. `input()` + `output()` — Pure UI presentational components.

## Advanced Reactive Patterns 🔬

- **Deep Cloning:** 🚫 **PROHIBITED:** `JSON.parse(JSON.stringify(obj))`. Always use native `structuredClone(obj)`.
- **Project Utilities (`@intaqalab/utils`):** It is **MANDATORY** to use utilities from `@intaqalab/utils` (see [UTILITIES.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/docs/UTILITIES.md)) for debounce, throttle, query parameters as signals, storage persistence, countdowns, and idle tracking.
- **Derived Writable State:** Use `linkedSignal()` instead of signal+effect. E.g.: `readonly selected = linkedSignal(() => this.items()[0] ?? null);`
- **RxJS (Restricted Interop Only):**
  - ✅ Permitted: `toSignal(observable$)`, `firstValueFrom(observable$)`.
  - ❌ **PROHIBITED:** `.subscribe()` in components without `takeUntilDestroyed()`.
- **Signal Forms:** Use modern `form()` API. **ELIMINATE** `ReactiveFormsModule` and `FormBuilder`. The model (`signal`) is the source of truth. Read and reset state via the model (`this.model()`, `this.model.set(initial)`), never via `form().reset()`.
- **Safe Effects:** Read all signals before the first `await`. Use `untracked()` for non-reactive reads. For DOM manipulation, use `afterRenderEffect()`.
- **httpResource:** Use `resource.hasValue()` as type guard.
- **Control Flow:** Use native `@if`, `@for` (with mandatory `track`), `@switch`, `@empty`. Use `@defer` (`@placeholder`, `@loading`) for lazy rendering.

## 🏛️ Architecture Decision Records (ADRs)

> [!IMPORTANT]
> When making significant architectural decisions or changes, create or update the appropriate document in `docs/adrs/`.

Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:

- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
- Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
- Pattern: [thing] [action] [reason]. [next step].
- Not: "Sure! I'd be happy to help you with that."
- Yes: "Bug in auth middleware. Fix:"

Switch level: /caveman lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra
Stop: "stop caveman" or "normal mode"

Auto-Clarity: drop caveman for security warnings, irreversible actions, user confused. Resume after.

Boundaries: code/commits/PRs written normal.
