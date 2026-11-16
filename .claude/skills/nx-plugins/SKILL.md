---
name: nx-plugins
version: 1.1.0
last-updated: 2026-11-13
description: Find and add Nx plugins. USE WHEN user wants to discover available plugins, install a new plugin, or add support for a specific framework or technology to the workspace.
---

## Finding and Installing new plugins

- INTAQALAB runs **Nx `24.0.6`**, **Angular `22.2.6`**, **`@nx/vitest` `24.0.6`**, and **`@analogjs/vitest-angular` `2.9.7`**.
- **Package Manager (MANDATORY):** Always use `npm` / `npx` (NEVER `pnpm` — fails with `EPERM` / `configured to use npm`).
- List plugins: `npx nx list`
- Install plugins: `npx nx add <plugin>`. Example: `npx nx add @nx/angular`.
