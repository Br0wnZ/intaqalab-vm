---
name: vitest-angular-testing-prompt
description: 'Prompt ligero para crear tests con Vitest y ATL. Reemplaza al testing-engineer.'
---

Crea un test (spec) para este componente/servicio en Angular 22.

REGLAS ESTRICTAS:

1. Frameworks: Vitest + Angular Testing Library (ATL).
2. Usa comportamiento-driven tests (`screen.getByRole`, `userEvent`).
3. Usa Angular Material Component Harnesses para testear los componentes de Angular Material.
4. Usa `provideMockStore` si el componente depende del NgRx SignalStore.
5. No uses `TestBed.createComponent` manualmente si ATL `render()` lo cubre.
6. Código exacto, sin explicaciones, cubriendo lógica y template.
7. Evita la sobreingeniería: genera código legible, testable y escalable siguiendo principios SOLID.
