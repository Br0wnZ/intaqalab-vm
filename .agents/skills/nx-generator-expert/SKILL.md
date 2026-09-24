---
name: nx-generator-expert
description: 'Nx Scaffolding Expert. Use this skill BEFORE writing code manually when creating libraries, components, and services. Enforces proper directory placement, `--tags` flags for ESLint Module Boundaries, and Angular 21 compatibility.'
argument-hint: "E.g. 'Generate feature library for warehouse management', 'Create card component in ui-shared lib', or '/create-feature'."
user-invocable: true
---

# 🤖 Nx Generator Expert

You are responsible for scaffolding code in the monorepo using **Nx Generators**, ensuring that ESLint Module Boundaries and layered architecture rules are automatically enforced.

## 🚀 Key Principles

1. **Automatic Scaffolding:** NEVER create full library directories or boilerplate files manually. Always execute the appropriate Nx generator first.
2. **`--no-interactive`:** Always add this flag to CLI commands.
3. **Dry-Run:** Use `--dry-run` to validate generator output and paths when unsure.

---

## 🏗️ Mandatory Rules for New Libraries (Domain Layers)

Business code does not live in `apps/`. It is encapsulated under `libs/domain/<domain-name>/<library-type>`.
**CRITICAL:** Always provide `--directory` and `--tags`.

### 1. Feature (Smart Components & Containers)

Contains smart components that inject stores and coordinate user workflows.

```bash
nx g @nx/angular:library feature-[feature-name] \
  --directory="libs/domain/[domain-name]/feature-[feature-name]" \
  --tags="scope:[domain-name],type:feature" \
  --no-interactive
```

### 2. UI (Pure Presentational Components)

Knows nothing about stores or data access. Only `input()`, `output()`, and template styling.

```bash
nx g @nx/angular:library ui-[ui-name] \
  --directory="libs/domain/[domain-name]/ui-[ui-name]" \
  --tags="scope:[domain-name],type:ui" \
  --no-interactive
```

### 3. Data Access (State Management & Services)

NgRx SignalStores and `httpResource` data services.

```bash
nx g @nx/angular:library data-access-[entity-name] \
  --directory="libs/domain/[domain-name]/data-access-[entity-name]" \
  --tags="scope:[domain-name],type:data-access" \
  --no-interactive
```

### 4. Utils (Pure Helpers & Models)

Domain types, interfaces, and pure helper functions.

```bash
nx g @nx/angular:library util-[util-name] \
  --directory="libs/domain/[domain-name]/util-[util-name]" \
  --tags="scope:[domain-name],type:util" \
  --no-interactive
```

---

## 🧩 Generating Individual Elements

When adding elements into an existing library, use `--project`:

**Component:**

```bash
nx g @nx/angular:component [name] --project=[nx-project-name] --no-interactive
```

_⚠️ **NAMING CONVENTION (2025 Style Guide)**: Strip technical type suffixes from generated file names (e.g. `example.component.ts` -> `example.ts`, `example.component.spec.ts` -> `example.spec.ts`) and class names (e.g. `ExampleComponent` -> `Example`)._

**Service:**

```bash
nx g @nx/angular:service [name] --project=[nx-project-name] --no-interactive
```

_⚠️ **NAMING CONVENTION (2025 Style Guide)**: Services keep their technical suffix (`example.service.ts` and class `ExampleService`)._

---

---

## ⚡ Nx 23.2.1 Standards & Inferred Targets (Project Crystal)

1. **Zero Manual `lint`/`test` in `project.json`**:
   - 🚫 **PROHIBITED:** Manually defining `lint` (`@nx/eslint:lint`) or `test` (`@nx/vitest:test`) targets in `project.json`.
   - In Nx 23+, targets are inferred automatically by `@nx/eslint/plugin` and `@nx/vitest`.
   - Inspect full resolved targets using `npx nx show project <name> --json`.

2. **Library `vite.config.mts` Rules**:
   - All library `vite.config.mts` files MUST use:
     ```ts
     plugins: [angular({ tsconfig: './tsconfig.spec.json' }), nxViteTsPaths()],
     ```
   - 🚫 **PROHIBITED:** `nxCopyAssetsPlugin` (deprecated in Nx 23, removed in Nx 24).
   - 🚫 **PROHIBITED:** Bare `angular()` without `{ tsconfig: './tsconfig.spec.json' }` (causes Analog to fail searching for non-existent `tsconfig.app.json`).

3. **Register New Libraries in Vitest Root Config**:
   - When generating a library with tests, add its `vite.config.mts` path to the `projects` array in `vitest.config.ts`.
   - 🚫 **PROHIBITED:** Creating or restoring `vitest.workspace.ts` (deprecated and ignored by Vitest 4).

---

## 🛠️ Generator Discovery

- List available Angular generators: `npx nx list @nx/angular`
- Check options: `npx nx g [generator] --help`
- By default, libraries are **non-buildable** (bundled directly by consuming applications).

