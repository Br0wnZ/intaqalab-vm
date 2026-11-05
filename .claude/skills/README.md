# 🤖 INTAQALAB Local Skills & Agent Harness

Este directorio centraliza el catálogo de **asistentes especializados (skills)** mantenidos a nivel de proyecto. Están diseñados para hacer cumplir los estándares de **Nx Monorepo**, **Angular 21 (Zoneless, Signals-first)** y **Harness Engineering (SOTA 2026)**, garantizando una interoperabilidad del 100% en macOS, Linux y Windows con cualquier arnés (Antigravity, Claude Code, Cursor, GitHub Copilot, Codex, Aider).

---

## 🏛️ Arquitectura de Skills: Divulgación Progresiva (ADR-022)

Para evitar saturar la ventana de contexto del LLM y reducir el consumo de tokens hasta en un 90%, las skills siguen una arquitectura de contexto en 3 capas (**Progressive Disclosure**):

```
┌────────────────────────────────────────────────────────┐
│  Capa 1: Metadata Frontmatter (<100 tokens)            │  ← YAML header en SKILL.md
│  (Nombre, descripción, argumentos, herramientas)       │
├────────────────────────────────────────────────────────┤
│  Capa 2: Orquestador SKILL.md (<150 líneas)            │  ← Rutas clave, checklist secuencial,
│  (Flujo operativo general y anti-patrones)             │    y tabla de anti-patrones críticos
├────────────────────────────────────────────────────────┤
│  Capa 3: Referencias Bajo Demanda (references/*.md)   │  ← Código fuente, templates, mappers
│  (Cargadas por el agente SOLO en el paso correspondiente)│ y fixtures completas
└────────────────────────────────────────────────────────┘
```

> [!TIP]
> Al invocar una skill (ej. `widget-service-integration`), el agente solo consume ~1.300 tokens de orquestación. Si necesita implementar el mapper, lee específicamente `references/03-bidirectional-mapper.md` sin cargar todo el resto del código innecesariamente.

---

## 📚 Catálogo Consolidado de Skills

### 🧑‍🎨 Frontend, UI & Visualización de Datos

1. **`ui-design-engineer`**: Interfaces pixel-perfect con Angular Material y Tailwind CSS inline. Accesibilidad (A11y `@angular/aria`), tokens de diseño, vistas skeleton de 3 estados (`ui-skeleton`) y arquitectura de widgets del Execution Grid (`BaseFormWidgetComponent`, `WidgetStateService`).
2. **`interface-design`**: Asesor de UX/UI para dashboards, paneles de administración y herramientas interactivas.
3. **`chartjs-expert`**: Optimización de renderizado, plugins y visualizaciones de series temporales con Chart.js v4.
4. **`chartjs-intake`**: Flujo de toma de requisitos antes de construir gráficos complejos.
5. **`dialog-patterns`**: Patrones canónicos para apertura, tipado y cierre de modales con Angular Material Dialog (`MatDialog`).
6. **`view-state-pattern`**: Patrón estándar de vista en 3 estados (Carga skeleton, Error i18n, Éxito con componentes reales).
7. **`numeric-input-constraints`**: Directivas y validaciones para entradas numéricas y decimales localizadas sin pérdida de precisión.

### ⚙️ Arquitectura, Estado y Lógica de Negocio

8. **`angular-architect`**: Arquitecto principal y modernizador. Reglas de Angular 21 Zoneless, Signals-first, Signal Forms estables (`{ when: () => condition }`), decorador `@Service()`, mappers dedicados (`<feature>-mapper.service.ts`), utilidades `@intaqalab/utils` y migración RxJS a Signals.
9. **`angular-developer`**: Base de conocimiento de Angular moderno y referencias a la API oficial.
10. **`signalstore-expert`**: Gestión de estado con `@ngrx/signals`, composición funcional (`withState`, `withComputed`, `withMethods`, `withEntities`, `withHooks`), inyección privada y modo rápido de scaffolding.
11. **`signal-trigger-pattern`**: Patrón obligatorio de data-fetching: `httpResource` con triggers privados para GET, y `HttpClient` + `firstValueFrom` para mutaciones (ADR-020).
12. **`i18n-expert`**: Gestión de claves de traducción en `es/en/de` vía `@ngx-translate`, namespaces y auditoría de sincronización.
13. **`master-data-specialist`**: Especialista en catálogos de Datos Maestros y cascarón genérico (`libs/domain/master-data`, Golden Path del repositorio).
14. **`planning-specialist`**: Especialista en el dominio de Planificación de Ensayos (series, disparos, armamento y municiones en `libs/domain/trial/planning`).
15. **`execution-domain-expert`**: Especialista en el dominio de Ejecución de Ensayos (máquinas de estado, readiness, secuencias de tiro).
16. **`widget-service-integration`**: Integración completa GET+PUT para widgets del Execution Grid con `ExecutionStore`, mappers y mock APIs. Modularizado bajo ADR-022.

### 🔌 Backend Mocks & APIs

17. **`mock-server-expert`**: Servidor de desarrollo local Express (`mocks/`), rutas mock con validación Zod, latencia simulada, paginación y fixtures JSON realistas.
18. **`swagger-api-architect`**: Generador integral E2E. A partir de un Swagger JSON genera modelos TypeScript, servicios HTTP, SignalStores y rutas mock con fixtures.

### 🧪 Testing & Calidad

19. **`angular-testing-expert`**: QA para Vitest y Angular Testing Library (ATL), tests comportamentales basados en DOM, harnesses de Material, `provideTestingEnvironment()` y resolución de aserciones sin `!`.

### 🏗️ Herramientas de Monorepo (Nx)

20. **`nx-generator-expert`**: Scaffolding con Nx CLI garantizando tags (`--tags`) para cumplir los Module Boundaries de ESLint.
21. **`create-feature`**: Generación estandarizada de librerías de nuevas features de dominio.
22. **`nx-workspace`**: Exploración de dependencias y análisis del grafo de proyectos Nx.
23. **`nx-run-tasks`**: Asistente para ejecución de targets (`test`, `lint`, `build`).
24. **`nx-plugins`**: Descubrimiento y configuración de plugins del ecosistema Nx.

---

## 🛠️ Cómo Funciona el Arnés en Cualquier Entorno

### 1. Memoria de Tareas Multi-Paso (`.agents/TASK.md`, ADR-023)

Cuando una tarea requiere más de 2 pasos o toca varios archivos:

1. El agente copia `.agents/TASK.template.md` a `.agents/TASK.md` (fichero ignorado en git).
2. Registra el plan con checkboxes atómicos y descubrimientos técnicos.
3. Si el contexto se reinicia o compacta (`/compact`), cualquier LLM reanuda desde la primera tarea incompleta sin pedir explicaciones.

### 2. Sensores de Verificación y Watcher en Reposo (ADR-024)

- **Sensor rápido durante la edición:**
  ```bash
  bash tools/verify/verify.sh --project execution --no-i18n
  ```
- **Daemon Idle Watcher (en terminal o fondo de VS Code / Antigravity):**
  ```bash
  npm run verify:watch
  ```
  Vigila `libs/` y `apps/` y ejecuta el linter automáticamente 2.5s después de la última edición (modo `--no-i18n` por defecto).
- **Verificación completa antes de commit:**
  ```bash
  npm run verify
  ```

### 3. Sharding de Contexto para Archivos Grandes

Los esquemas OpenAPI (`apis/*.json`) pueden superar los 300 KB (~75.000 tokens). Está prohibido leerlos completos en el hilo principal. El agente delega su análisis a subagentes de solo lectura (`research`, scripts Python), inyectando solo el fragmento DTO necesario.

---

## 📦 Versionado y Sincronización (SemVer)

- `.agents/skills/` es la **única fuente de verdad canónica**.
- `.claude/skills/` es un espejo exacto generado automáticamente mediante sincronización.
- Comandos CLI:
  ```bash
  # Ver estado de todas las skills y AGENTS.md
  npm run agents:status

  # Validar integridad en CI o local
  npm run agents:check

  # Subir versión de una skill, actualizar manifest y sincronizar
  npm run agents:bump <nombre-skill> [patch|minor|major] -- --msg "Descripción del cambio"

  # Sincronizar manualmente hacia .claude/skills/
  npm run agents:sync
  ```
