---
name: create-feature
version: 1.1.0
last-updated: 2026-11-13
description: Scaffolds a new complete Feature library using Angular 22, Nx CLI, and Zoneless architecture.
argument-hint: "Domain: [name], Feature: [name], Type: [CRUD | Dashboard | Form]"
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

2.  **Shell Component (Container) & Store**
    - Generate the container component file (`[feature].ts` without `.component` suffix) and class name `[FeatureName]` (without `Component` suffix).
    - Rely on Angular 22.2 standalone and `OnPush` defaults (never declare `standalone` or `changeDetection` metadata).
    - Use private functional store injection: `readonly #store = inject(...)`, composing stores with `withProps()` / `withLinkedState()`, and wrapping paginated `httpResource` queries with `extendResource(..., withPreviousValueOnLoading())`.
    - Use `<form [formRoot]="...">` + `submit()` for feature forms.
    - In templates, use modern Control Flow (`@if`, `@for`, `@switch` + `resource.snapshot()`).
    - For styling, use inline Tailwind CSS (`class="flex flex-col gap-4 p-4"`). No dedicated SCSS.

3.  **Routing Configuration**
    - Provide routing integration snippet for `[domain].data.routes.ts` (leverage `[routerOutletData]` / `ROUTER_OUTLET_DATA` when passing parent context, compatible with root `withAutoCleanupInjectors()`).

4.  **i18n**
    - Provide translation key examples for `es.json`, `en.json`, `de.json`, template bindings with `TranslatePipe` (`| translate`), or reactive `translate()` signal function (`@ngx-translate/core` v18.1) in TypeScript classes.
