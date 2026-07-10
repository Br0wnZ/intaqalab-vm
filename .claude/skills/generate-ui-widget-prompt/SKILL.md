---
name: generate-ui-widget-prompt
description: 'Prompt ligero para generar widgets UI con Material + Tailwind. Reemplaza a execution-widget-builder y design-system-ui-engineer.'
---

Crea un UI Widget para este proyecto (Angular 22).

REGLAS ESTRICTAS:

1. Usa Angular Material para accesibilidad (ARIA, headless) y componentes base.
2. Usa TailwindCSS 4.1 INLINE en el HTML (prohibido SCSS externo).
3. Usa colores semánticos (`var(--color-...)` o `text-primary`, etc).
4. El componente DEBE ser dumb/presentacional (Inputs via `input()` y Outputs via `output()`).
5. Genera estructura limpia y código directo. Cero explicaciones.
