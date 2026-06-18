# 🛠️ Nx: Tags & Code Generation

INTAQALAB depende de las capacidades del CLI de Nx para generar código estructurado que cumpla con las reglas estáticas y el *module boundary definition* del linter.

## 1. Importancia Crítica de los Tags

Nx pre-inyecta configuraciones de dependencias basadas en "Tags". Estas etiquetas (`scope:` y `type:`) son el corazón que valida que un módulo puro presentacional UI jamás importe directamente lógica pesada de NgRx de un módulo Data-Access.

**ES OBLIGATORIO** incluir explícitamente `--tags=scope:...,type:...` cada vez que se genera una librería en la carpeta de Dominio. Si lo olvidas, la librería perderá protección estática y fallará el pipeline.

## 2. Cheat Sheet de Generación

Usa siempre Nx Console o el CLI. No crees las carpetas "a mano".

### Capas Base (`type`)
- **Feature** (Componentes Inteligentes e integración de Stores):
  ```bash
  nx g @nx/angular:library feature-[feature-name] --directory="libs/domain/[domain-name]/feature-[feature-name]" --tags="scope:[domain-name],type:feature"
  ```
- **UI** (Componentes puros orientados a Tailwind):
  ```bash
  nx g @nx/angular:library ui-[ui-name] --directory="libs/domain/[domain-name]/ui-[ui-name]" --tags="scope:[domain-name],type:ui"
  ```
- **Data Access** (Servicios, NgRx SignalStore, httpResource):
  ```bash
  nx g @nx/angular:library data-access-[entity-name] --directory="libs/domain/[domain-name]/data-access-[entity-name]" --tags="scope:[domain-name],type:data-access"
  ```
- **Util** (Helpers sin lógica visual):
  ```bash
  nx g @nx/angular:library util-[util-name] --directory="libs/domain/[domain-name]/util-[util-name]" --tags="scope:[domain-name],type:util"
  ```

## 3. Elementos Aislados (Configurados vía nx.json)
Los esquemas de Nx ya heredan de forma predeterminada Standalone Components, Inline Styles/Templates, ChangeDetection OnPush y Signal inputs.
```bash
nx g @nx/angular:component [component-name] --project=[project-name-in-workspace]
nx g @nx/angular:service [service-name] --project=[project-name-in-workspace]
```
