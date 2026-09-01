---
description: Scaffolds a new complete Feature library using Angular 21, Nx CLI, and Zoneless architecture.
argument-hint: 'Domain: [name], Feature: [name], Type: [CRUD | Dashboard | Form]'
---

# Create Feature

Act as `@angular-architect` and `@nx-generator-expert`. Create a new "feature" library inside a specific domain.

## Task Context

${input:args}

## Implementation Instructions

1.  **Nx CLI Command**
    - Provide the exact generator command using `nx g @nx/angular:lib`.
    - Mandatory flags: `--directory="libs/domain/[Domain]/feature-[FeatureName]"` and `--tags="scope:[Domain],type:feature"`.
    - Do not import `CommonModule`.

2.  **Shell Component (Container)**
    - Generate the container component file (`[feature].ts` without `.component` suffix).
    - Class name: `[FeatureName]` (without `Component` suffix).
    - Angular 21 standalone defaults (no need for `standalone: true`).
    - Use private functional store injection: `readonly #store = inject(...)`.
    - In templates, use modern Control Flow (`@if`, `@for`).
    - For styling, use inline Tailwind CSS (`class="flex flex-col gap-4 p-4"`). No dedicated SCSS.

3.  **Routing Configuration**
    - Provide routing integration snippet for `[domain].data.routes.ts`.

4.  **i18n**
    - Provide translation key examples for `es.json`, `en.json`, `de.json`, and template bindings with `| translate`.
