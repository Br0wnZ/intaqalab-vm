---
name: nx-generator-assistant
description: >
  Asistente automatizado para la creación de librerías, componentes y servicios usando Nx.
  Garantiza el correcto tipado de tags (`--tags=scope:...,type:...`) y el path de los directorios 
  para mantener limpios los ESLint Module Boundaries de INTAQALAB. Actívalo siempre ANTES 
  de escribir código manualmente para un nuevo módulo.
---

# 🤖 Nx Generator Assistant

Eres el responsable de estructurar físicamente el monorepo asegurando que las reglas de Boundaries y la arquitectura en capas se respeten de forma automática.

## Reglas Obligatorias para Scaffolding

Antes de crear cualquier archivo, determina a qué capa pertenece y genera la librería o componente usando el comando estricto correspondiente.

### A. Capa de Dominio (Domain Libraries)

El código de negocio no vive en `apps/`. Se encapsula en `libs/domain/<nombre-dominio>/<tipo-libreria>`.

Siempre incluye `--directory` y `--tags`.

**1. Feature** (Componentes Inteligentes e Integración de Stores)

```bash
nx g @nx/angular:library feature-[nombre-feature] \
  --directory="libs/domain/[nombre-dominio]/feature-[nombre-feature]" \
  --tags="scope:[nombre-dominio],type:feature"
```

**2. UI** (Componentes puros presentacionales / Tailwind)

```bash
nx g @nx/angular:library ui-[nombre-ui] \
  --directory="libs/domain/[nombre-dominio]/ui-[nombre-ui]" \
  --tags="scope:[nombre-dominio],type:ui"
```

**3. Data Access** (Servicios HTTP y Stores)

```bash
nx g @nx/angular:library data-access-[nombre-entidad] \
  --directory="libs/domain/[nombre-dominio]/data-access-[nombre-entidad]" \
  --tags="scope:[nombre-dominio],type:data-access"
```

**4. Utils** (Helpers puros)

```bash
nx g @nx/angular:library util-[nombre-util] \
  --directory="libs/domain/[nombre-dominio]/util-[nombre-util]" \
  --tags="scope:[nombre-dominio],type:util"
```

### B. Componentes y Servicios Aislados

Si el proyecto ya existe y solo necesitas agregar elementos dentro, usa la bandera `--project`:

**Crear un Componente:**

```bash
nx g @nx/angular:component [nombre-componente] --project=[nombre-proyecto-nx]
```

**Crear un Servicio:**

```bash
nx g @nx/angular:service [nombre-servicio] --project=[nombre-proyecto-nx]
```

## 🚨 Advertencias Críticas

- **NUNCA generes una librería sin el parámetro `--tags`**. Es innegociable. Si lo omites, ESLint fallará silenciosamente para proteger el boundary.
- **NUNCA** sugieras crear los archivos (TS/HTML) a mano en el editor si se trata de un nuevo feature, ui o data-access completo. Ejecuta el comando primero.
