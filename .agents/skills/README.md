# 🤖 INTAQALAB Skills Locales

Este directorio centraliza los asistentes de IA (skills) que permanecen a nivel de **proyecto** tras la separación de las skills globales. Están configurados específicamente para mantener los estándares del monorepo Nx y Angular 21 (Zoneless, Signals-first) en el proyecto Intaqalab.

## Catálogo de Skills Consolidados

### 🧑‍🎨 Frontend, UI & Data Visualization
1. **`ui-design-engineer`**: Construye interfaces pixel-perfect usando Angular Material y TailwindCSS inline. Implementa los complejos Widgets del Grid de Ejecución del proyecto.
2. **`interface-design`**: Asesor de UX/UI enfocado en dashboards, paneles de administración y herramientas interactivas.
3. **`chartjs-expert`**: Optimización, plugins y renderizado avanzado para gráficas con Chart.js v4.
4. **`chartjs-intake`**: Flujo estructurado inicial para definir requerimientos antes de construir gráficas complejas.
5. **`dialog-patterns`**: Patrones de apertura, tipado de datos y cierre para modales de Angular Material (`MatDialog`).

### ⚙️ Arquitectura, Estado y Negocio
6. **`signalstore-expert`**: Crea Stores locales/globales con `@ngrx/signals`, siguiendo la arquitectura reactiva exigida.
7. **`signal-trigger-pattern`**: Garantiza la aplicación estricta del patrón de data-fetching usando `httpResource` y señales trigger privadas.
8. **`i18n-expert`**: Gestiona las claves y literales en `es/en/de` a través de `@ngx-translate`.
9. **`master-data-specialist`**: Especialista con conocimiento profundo del patrón de catálogos y dominio de *Master Data* (`libs/domain/master-data`).
10. **`planning-specialist`**: Especialista en la estructura de datos compleja del módulo de *Trial Planning* (series, disparos, condiciones).

### 🔌 Backend Mocks & APIs
11. **`mock-server-expert`**: Gestiona el servidor Express local, rutas mock, delays simulados y JSON fixtures.
12. **`swagger-api-architect`**: Generador E2E. A partir de un Swagger, crea los modelos, servicio HTTP, integraciones al SignalStore y las rutas del mock server.

### 🧪 Testing
13. **`angular-testing-expert`**: Ingeniero de QA para Vitest y Angular Testing Library (ATL), orientado al testing de comportamiento interactuando con el DOM.

### 🏗️ Workspace Tooling (Nx)
14. **`nx-generator-expert`**: Experto en scaffolding. Garantiza que las librerías se creen con las etiquetas de scope/type correctas (`--tags`) para cumplir los *ESLint boundaries*.
15. **`create-feature`**: Skill enfocada en la creación rápida y estandarizada de nuevas features funcionales en el monorepo.
16. **`nx-workspace`**: Explora dependencias y configuración del *Nx graph*.
17. **`nx-run-tasks`**: Auxiliar para ejecutar comandos de test, lint, e2e o build a través de Nx.
18. **`nx-plugins`**: Ayuda a encontrar, instalar y configurar plugins adicionales del ecosistema Nx.

---

> [!NOTE]
> Las skills genéricas agnósticas (arquitectura AI, herramientas eficientes, monitores de CI, etc.) han sido promocionadas a **nivel de sistema** (globales) para estar disponibles en cualquier proyecto sin ensuciar este workspace local.
