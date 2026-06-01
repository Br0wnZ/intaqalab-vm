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
  - `wharehouse-managment`
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
