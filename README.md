# Intaqalab Monorepo

Monorepo basado en **Nx** y **Angular 21** para la gestión de aplicaciones modulares, librerías compartidas y funcionalidades escalables.

---

## 🧱 Stack tecnológico

- Nx
- Angular 21
- Vitest
- Tailwind CSS
- NgRx (signals & operators)
- Vite

---

## ⚙️ Requisitos del sistema

- Node.js 22

---

## 🚀 Puesta en marcha

### Instalación

```bash id="7nl6t4"
npm install
```

### Desarrollo

```bash id="pnr7ta"
npm run start
```

Modo desarrollo con mocks:

```bash id="0v6m70"
npm run start:dev
```

### Entornos

```bash id="p1o5mr"
npm run start:des
npm run start:pre
npm run start:prod
```

Con proxy configurable:

```bash id="h5y9mx"
npm run proxy:des
npm run proxy:pre
npm run proxy:pro
```

---

## 🏗️ Build

```bash id="k1y2nb"
npm run build
```

Build por entorno:

```bash id="dptu0z"
npm run build:dev
npm run build:des
npm run build:pre
npm run build:prod
```

---

## 🌍 Trazabilidad de Entornos y Versiones Desplegadas (`version.json`)

El proyecto incluye un sistema automatizado e independiente de GitLab para saber con exactitud **qué commit, rama e imagen Docker están físicamente desplegados** en cada entorno (**DES**, **PRE** y **PRO**) y obtener un informe detallado de diferencias entre ellos.

### ⚙️ ¿Cómo funciona?

1. **Generación automática en tiempo de compilación (`prebuild`):**
   Cada vez que se ejecuta un build (`npm run build`, `npm run build:des`, `npm run build:pre` o `npm run build:prod`), el hook `prebuild` ejecuta automáticamente [`scripts/generate-version.mjs`](scripts/generate-version.mjs).
2. **Extracción de metadatos (GitLab CI + Git local):**
   El script lee las variables de entorno inyectadas por el runner de GitLab (`CI_COMMIT_SHA`, `CI_COMMIT_SHORT_SHA`, `CI_COMMIT_BRANCH`, `CI_COMMIT_TITLE`, `CI_PIPELINE_IID`) o hace fallback a comandos `git` locales y genera el fichero `apps/intaqalab/src/assets/version.json`.
   > **Nota:** Este fichero está incluido en `.gitignore` para no ensuciar el repositorio local ni provocar bucles de commits en CI. Solo viaja dentro del artefacto compilado (`dist/intaqalab/assets/version.json`) y de la imagen Docker servida por Nginx.
3. **Exposición HTTP sin caché:**
   Nginx está configurado en [`nginx.conf`](nginx.conf) con `Cache-Control: no-cache, no-store, must-revalidate` para `/assets/version.json`, garantizando que cualquier consulta devuelva siempre la versión real en ejecución:

| Entorno                 | Rama CI   | URL de la Aplicación            | Endpoint de Versión (`version.json`)                |
| ----------------------- | --------- | ------------------------------- | --------------------------------------------------- |
| **DES** (Desarrollo)    | `develop` | `https://intaqalab.des.inta.es` | `https://intaqalab.des.inta.es/assets/version.json` |
| **PRE** (Preproducción) | `preprod` | `https://intaqalab.pre.inta.es` | `https://intaqalab.pre.inta.es/assets/version.json` |
| **PRO** (Producción)    | `master`  | `https://intaqalab.inta.es`     | `https://intaqalab.inta.es/assets/version.json`     |

### 📄 Estructura de `/assets/version.json`

```json
{
  "app": "@intaqalab/source",
  "version": "0.0.0",
  "environment": "des",
  "commit": {
    "sha": "400fc2a2...",
    "shortSha": "400fc2a2",
    "branch": "develop",
    "tag": null,
    "subject": "feat(execution): ...",
    "author": "Nombre Autor",
    "committedAt": "2026-11-11T10:27:33+01:00"
  },
  "build": {
    "builtAt": "2026-11-11T10:30:17.104Z",
    "pipelineId": "12345",
    "pipelineIid": "42",
    "jobId": "67890",
    "imageTag": "1.0.42"
  }
}
```

### 🔍 Cómo consultar qué hay en cada entorno y comparar diferencias

El script [`scripts/compare-envs.mjs`](scripts/compare-envs.mjs) consulta los `version.json` remotos (o referencias Git locales), cruza los SHAs con el historial de Git local y agrupa todos los commits por tipo de **Conventional Commits** (`feat`, `fix`, `refactor`, etc.), módulos (`scopes`) y tickets detectados:

#### 1. Informe completo de estado (DES, PRE y PRO)

Muestra la tabla con la versión desplegada en los 3 entornos y calcula automáticamente qué hay en **PRE pendiente de subir a PRO** y qué hay en **DES pendiente de pasar a PRE**:

```bash
npm run env:report
```

#### 2. Comparar dos entornos concretos

```bash
# ¿Qué hay en PRE que todavía no está en PRO?
npm run env:diff -- pre pro

# ¿Qué hay en DES que todavía no está en PRE?
npm run env:diff -- des pre
```

#### 3. Saber si un componente concreto está en DES, PRE y PROD (`npm run env:check`)

Para responder a preguntas del tipo: _"¿Está el Widget de Armamento o el Diálogo de Borrado en DES y PRE pero no en PROD?"_:

```bash
# Comprobar un componente por nombre o palabra clave
npm run env:check -- "armament"
npm run env:check -- "confirm-delete"
npm run env:check -- "munition-introduction"
npm run env:check -- "radar-metcmq"
```

El comando inspecciona los commits reales de DES, PRE y PRO y genera una tabla con diagnóstico directo:

- ✅ **SÍ existe:** Desplegado en ese entorno (indicando commit y fecha).
- 🟡 **Desactualizado:** Existe en el entorno, pero con código antiguo (faltan mejoras de PRE o DES).
- ❌ **NO existe:** Componente nuevo aún no desplegado en ese entorno.

_(Si estás sin VPN de INTA, puedes simular contra referencias Git locales añadiendo `--des=HEAD --pre=HEAD~3 --pro=HEAD~6`)._

#### 4. Comparar ramas, tags o commits locales (sin necesidad de red/VPN)

También acepta nombres de ramas, tags o SHAs de Git directamente:

```bash
# Comparar ramas locales/remotas tras un git fetch
npm run env:diff -- origin/develop origin/preprod
npm run env:diff -- preprod master

# Comparar dos commits o rangos concretos
npm run env:diff -- HEAD HEAD~10
npm run env:diff -- 400fc2a2 687151dc
```

#### 5. Sobrescribir URLs por variables de entorno (opcional)

Si cambian las URLs de algún entorno o se quiere apuntar a un port-forward / entorno temporal:

```bash
ENV_URL_DES=https://intaqalab.des.inta.es \
ENV_URL_PRE=https://intaqalab.pre.inta.es \
ENV_URL_PRO=https://intaqalab.inta.es \
npm run env:report
```

---

## 🧪 Testing

### Ejecutar todos los tests

```bash id="63ktyl"
npm run test
```

### Tests por proyecto

Ejemplo:

```bash id="dnqv9i"
npm run test:admin
npm run test:planning
```

Modo watch:

```bash id="b0y67l"
npm run test:admin:watch
```

UI interactiva:

```bash id="i2rx8n"
npm run test:admin:ui
```

### Ejecutar múltiples proyectos

```bash id="rbsy0n"
npm run test:all
```

### Cobertura

```bash id="u9kq5q"
npm run test:coverage
```

Cobertura completa:

```bash id="j0z0xf"
npm run coverage:full
```

---

## 🧹 Lint & Formato

Lint de proyectos afectados:

```bash id="8l6o8y"
npm run affected:lint
```

Lint global:

```bash id="y0r3jk"
npm run lint:all
```

Formateo:

```bash id="6db8v4"
npm run format
```

---

## 🛡️ Verificación Determinista y Watcher

El repositorio incluye un sensor determinista para validar el linter y la consistencia de i18n de forma homogénea en macOS, Linux y Windows:

### Verificación completa (Pre-commit / CI)

```bash
npm run verify
# O directamente:
bash tools/verify/verify.sh
```

### Verificación incremental rápida

```bash
# Linter de un proyecto específico sin verificar i18n (<200ms)
bash tools/verify/verify.sh --project execution --no-i18n
```

### Watcher en reposo (Verify on Idle)

Monitorea cambios en `libs/` y `apps/` y ejecuta la verificación automáticamente tras 2.5 segundos de inactividad (por defecto en modo rápido con `--no-i18n`):

```bash
npm run verify:watch
```

- **En VS Code:** Disponible como tarea de fondo en `Terminal -> Run Task... -> Verify on Idle (Watch)`.
- **En Antigravity / Claude Code:** Se puede invocar directamente en la terminal integrada o lanzar como proceso daemon de fondo.

---

## 🤖 AI Agent Harness (SOTA 2026)

Este monorepo está diseñado bajo la arquitectura de **Harness Engineering**:

$$\text{Agent} = \text{Model} + \text{Harness}$$

El arnés proporciona el entorno determinista, guías estáticas, herramientas de análisis de AST (Repowise MCP, RTK) y sensores de retroalimentación para que cualquier LLM (Anthropic Claude, OpenAI, Google Gemini, DeepSeek o modelos locales) opere con máxima autonomía, mínima alucinación y el menor consumo de tokens posible.

### Principios Fundamentales

1. **Agnóstico de LLM y Editor:**
   Funciona de manera idéntica en **Antigravity**, **Claude Code**, **Cursor**, **GitHub Copilot**, **Codex** y herramientas CLI como **Aider**.
2. **Estabilidad de Prefijo (KV-Cache Optimization, ADR-021):**
   `AGENTS.md` mantiene un prefijo 100% inmutable para maximizar la tasa de acierto de caché de contexto entre turnos y versiones.
3. **Divulgación Progresiva (Progressive Disclosure, ADR-022):**
   Las skills en `.agents/skills/` se estructuran en orquestadores ligeros (`SKILL.md` < 150 líneas) con plantillas y código de referencia bajo demanda en carpetas `references/`, ahorrando hasta un 90% de tokens de entrada.
   Consulta el catálogo en [.agents/skills/README.md](.agents/skills/README.md).
4. **Memoria Persistente en Disco (TASK.md Protocol, ADR-023):**
   Para tareas multi-paso, los agentes registran su plan y estado en `.agents/TASK.md` (instanciado desde `.agents/TASK.template.md`). Si la sesión se reinicia o el contexto se compacta (`/compact`), el agente reanuda desde la primera tarea incompleta.
5. **Sensor Feedback & Sharding de Contexto (ADR-024):**
   Prohibido cargar ficheros OpenAPI gigantescos (>50KB) al contexto principal; la exploración se delega a subagentes efímeros o scripts reductores.

### Comandos de Gestión de Agentes y Skills (SemVer)

- `npm run agents:status`: Consulta el estado de versión, fecha y sincronización de `AGENTS.md` y cada skill.
- `npm run agents:check`: Valida el cumplimiento de SemVer, schemas de frontmatter y detección de cambios no versionados (ejecutado en CI).
- `npm run agents:bump <skill|agents|all> [patch|minor|major] -- --msg "..."`: Incrementa la versión, actualiza el manifest central, añade entrada en el changelog y sincroniza con `.claude/skills/`.
- `npm run agents:sync`: Refleja el directorio canónico `.agents/skills/` hacia `.claude/skills/`.

---

## 🧩 Estructura del monorepo

El workspace sigue la filosofía de Nx:

- **Apps**
  - `intaqalab` → aplicación principal
  - `mock-data` → servidor de datos mock

- **Librerías**
  - `admin`
  - `planning`
  - `calendar-trials`
  - `trial-management`
  - `data-access`
  - `ui`
  - `core`
  - `utils`
  - `shared-theme`
  - `warehouse-management`
  - etc.

---

## 🔧 Comandos Nx útiles

Ejecutar tareas:

```bash id="z2m18h"
nx serve <app>
nx build <app>
nx test <project>
```

Ejecutar en múltiples proyectos:

```bash id="0uz3cg"
nx run-many --target=test --all
```

Solo afectados:

```bash id="9k4gqa"
nx affected --target=build
nx affected --target=test
nx affected --target=lint
```

---

## 🧪 Mocks

Servidor de mocks:

```bash id="ngrmad"
npm run start:mocks
```

Incluido en:

```bash id="p2nn3n"
npm run start:dev
```

---

## 🛠️ Buenas prácticas

## 🛡️ Module Boundaries (Nx)

El monorepo aplica reglas estrictas de boundaries para mantener la arquitectura limpia y predecible. Estas reglas se configuran en ESLint (`eslint.base.config.mjs`) usando los tags `type` y `scope` en cada proyecto.

**Resumen de reglas:**

- **App** (`type:app`): puede importar features, core, shared, ui, data-access, util, theme y demo.
- **Feature** (`type:feature`): puede importar ui, data-access, util, core, theme y otras features.
- **Core** (`type:core`): puede importar ui, data-access, util, theme.
- **UI** (`type:ui`): solo puede importar util y theme.
- **Data-access** (`type:data-access`): solo puede importar util.
- **Util** (`type:util`): solo puede importar otras util.
- **Theme** (`type:theme`): no puede depender de nada.
- **Demo/Mock** (`type:demo`, `type:mock`): acceso completo solo para desarrollo.

Estas reglas se aplican automáticamente según los tags definidos en cada `project.json`.

---

## 🤖 Nx Code Generation Cheat Sheet

Para mantener la arquitectura y los boundaries, **todas las librerías y componentes deben generarse usando Nx CLI** con los tags correctos.

### Librerías por capa

- **Feature**:
  ```bash
  nx g @nx/angular:library feature-[feature-name] --directory="libs/domain/[domain-name]/feature-[feature-name]" --tags="scope:[domain-name],type:feature"
  ```
- **UI**:
  ```bash
  nx g @nx/angular:library ui-[ui-name] --directory="libs/domain/[domain-name]/ui-[ui-name]" --tags="scope:[domain-name],type:ui"
  ```
- **Data Access**:
  ```bash
  nx g @nx/angular:library data-access-[entity-name] --directory="libs/domain/[domain-name]/data-access-[entity-name]" --tags="scope:[domain-name],type:data-access"
  ```
- **Util**:
  ```bash
  nx g @nx/angular:library util-[util-name] --directory="libs/domain/[domain-name]/util-[util-name]" --tags="scope:[domain-name],type:util"
  ```

### Componentes y servicios

- **Componentes**:
  ```bash
  nx g @nx/angular:component [component-name] --project=[project-name-in-workspace]
  ```
- **Servicios / Stores / Utils**:
  ```bash
  nx g @nx/angular:service [service-name] --project=[project-name-in-workspace]
  ```

> **Importante:** Siempre especifica los tags `scope` y `type` al generar librerías para que Nx pueda aplicar correctamente las reglas de boundaries.

---

Para normas de estilo, arquitectura, convenciones y flujo de trabajo, consultar el archivo **`CONTRIBUTING.md`**.

---

## 🔐 Hooks y calidad

- Uso de **Husky** para hooks de git
- Integración con lint y formateo antes de commits

---

## 📌 Notas

- Los tests están gestionados con Vitest
- Se utiliza Vite como bundler en lugar de Webpack en varios casos
- El proyecto soporta múltiples entornos y proxies dinámicos
