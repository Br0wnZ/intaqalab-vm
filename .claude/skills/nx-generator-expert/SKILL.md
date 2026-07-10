---
name: nx-generator-expert
description: 'Experto en scaffolding de Nx. Usa esta skill ANTES de escribir código manualmente para generar librerías, componentes y servicios. Garantiza el correcto uso de directorios, flags `--tags` para ESLint Boundaries y compatibilidad Angular 21.'
argument-hint: "Ej: 'Genera la librería feature para gestión de almacén', 'Crea el componente de tarjeta en la lib ui-shared', o '/create-feature'."
user-invocable: true
---

# 🤖 Nx Generator Expert

Eres el responsable de estructurar físicamente el monorepo usando **Nx Generators**, asegurando que las reglas de Module Boundaries (ESLint) y la arquitectura en capas se respeten de forma automática.

## 🚀 Principios Clave

1. **Scaffolding Automático:** NUNCA sugieras crear archivos (TS/HTML) a mano si se trata de un nuevo módulo (feature, ui, data-access). Usa siempre el generador primero.
2. **`--no-interactive`:** Añade siempre esta flag a los comandos Nx.
3. **Dry-Run:** Antes de ejecutar un comando complejo, si dudas del directorio, puedes proponer `--dry-run` para validar.

---

## 🏗️ Reglas Obligatorias para Nuevas Librerías (Capas de Dominio)

El código de negocio no vive en `apps/`. Se encapsula en `libs/domain/<nombre-dominio>/<tipo-libreria>`.
**CRÍTICO**: Siempre debes incluir `--directory` y `--tags`.

### 1. Feature (Componentes Inteligentes y Contenedores)

Contienen componentes que inyectan Stores e interactúan con la lógica.

```bash
nx g @nx/angular:library feature-[nombre-feature] \
  --directory="libs/domain/[nombre-dominio]/feature-[nombre-feature]" \
  --tags="scope:[nombre-dominio],type:feature" \
  --no-interactive
```

_Si el usuario pide un "Create Feature" completo, proporciona el comando arriba, un componente shell con `ChangeDetectionStrategy.OnPush`, Tailwind inline, inyección de store (`#store = inject(...)`), configuración de rutas y ejemplos de claves i18n._

### 2. UI (Componentes Puros Presentacionales)

No saben de stores. Solo `input()`, `output()`, y estilos.

```bash
nx g @nx/angular:library ui-[nombre-ui] \
  --directory="libs/domain/[nombre-dominio]/ui-[nombre-ui]" \
  --tags="scope:[nombre-dominio],type:ui" \
  --no-interactive
```

### 3. Data Access (State Management y Services)

NgRx SignalStores y servicios HTTP (httpResource).

```bash
nx g @nx/angular:library data-access-[nombre-entidad] \
  --directory="libs/domain/[nombre-dominio]/data-access-[nombre-entidad]" \
  --tags="scope:[nombre-dominio],type:data-access" \
  --no-interactive
```

### 4. Utils (Helpers Puros)

Funciones compartidas y tipos genéricos de un dominio.

```bash
nx g @nx/angular:library util-[nombre-util] \
  --directory="libs/domain/[nombre-dominio]/util-[nombre-util]" \
  --tags="scope:[nombre-dominio],type:util" \
  --no-interactive
```

---

## 🧩 Creación de Componentes/Servicios/Directivas Individuales

Si el proyecto (librería) ya existe y solo necesitas agregar elementos dentro, usa la bandera `--project`:

**Componente:**

```bash
nx g @nx/angular:component [nombre] --project=[nombre-proyecto-nx] --no-interactive
```

_⚠️ **REGLA DE NAMING (2025 Style Guide)**: Renombra el archivo generado para eliminar el sufijo de tipo técnico (ej. `example.component.ts` -> `example.ts`, `example.component.spec.ts` -> `example.spec.ts`) y elimina el sufijo de la clase (ej. `ExampleComponent` -> `Example`)._

**Servicio:**

```bash
nx g @nx/angular:service [nombre] --project=[nombre-proyecto-nx] --no-interactive
```

_⚠️ **REGLA DE NAMING (2025 Style Guide)**: Los servicios mantienen su sufijo de tipo técnico (`example.service.ts` y la clase `ExampleService`). No los renombre._

---

## 🛠️ Descubrimiento de Generadores

Si te piden scaffolding de algo diferente, descubre los generadores de la siguiente manera:

- Listar generadores de Angular: `npx nx list @nx/angular`
- Verifica opciones con `npx nx g [generador] --help`
- Para librerías, por defecto son **no-buildables** (consumidas por apps y compiladas por el bundler de la app) a menos que se indique explícitamente (`--bundler=vite`).
