# ADR-022: Skill Modularization and Progressive Disclosure Architecture

**Estado:** Aceptado
**Fecha:** 2026-11-04
**Autores:** INTAQALAB Architecture Team

## Contexto

Con la evolución de los estándares del proyecto (Angular 21 Zoneless, Signals-first, Signal Forms, ADR-017, ADR-019, ADR-020), las skills de automatización en `.agents/skills/` acumularon una cantidad masiva de ejemplos completos de código, plantillas de servicios, mappers y fixtures mock.

El caso más extremo se presentó en `widget-service-integration/SKILL.md`, alcanzando 1.372 líneas y más de 54 KB (~14.000 tokens). En la arquitectura de agentes inteligentes (SOTA 2026), cuando un LLM invoca una skill:

1. **Saturación del Context Window:** Cargar 14k tokens de golpe eleva drásticamente la ocupación del contexto, superando el umbral del 40% donde la capacidad de razonamiento y atención del modelo comienza a degradarse.
2. **Explosión de Tokens y Latencia:** En cada turno subsecuente tras la carga de la skill, esos 14k tokens se reenvían al modelo, multiplicando el consumo de tokens y ralentizando la respuesta.
3. **Falta de Divulgación Progresiva (Progressive Disclosure):** Un agente habitualmente solo necesita conocer el checklist de pasos o reglas de un paso específico (ej. el mapper o el mock), pero se ve obligado a ingerir el componente completo, la suite de tests y las configuraciones de estado en un único archivo monolítico.

Otras skills del proyecto, como `angular-architect`, ya demostraron el éxito de segregar sus guías detalladas en una carpeta `references/` (`linked-signal.md`, `effect-best-practices.md`, etc.), manteniendo el `SKILL.md` principal en menos de 100 líneas.

## Decisión

Se establece el principio de **Progressive Disclosure (Arquitectura de Contexto en Capas)** para todas las skills del repositorio:

1. **Límite de Longitud para `SKILL.md`:**
   El fichero `SKILL.md` principal de cualquier skill debe actuar como un índice orquestador conciso (idealmente entre 80 y 200 líneas). Debe contener:
   - Frontmatter estandarizado (nombre, versión, descripción, argumentos, herramientas).
   - Rutas clave y checklist secuencial de pasos.
   - Reglas críticas y anti-patrones obligatorios.
   - Referencias explícitas (enlaces a `references/<tema>.md`) para profundizar bajo demanda en pasos específicos.

2. **Segregación Modular en `references/`:**
   Todo código fuente extenso, plantillas completas de componentes/servicios/mappers, especificaciones de tests y fixtures se extraen a ficheros dedicados en la subcarpeta `references/` de la respectiva skill.
   - En `widget-service-integration/`:
     - `references/01-service-and-models.md`: Endpoints Swagger, modelos TS y métodos en `ExecutionService`.
     - `references/02-feature-store.md`: Modelos de estado (`execution-state.models.ts`) y composición de feature store (`with<Widget>.ts`).
     - `references/03-bidirectional-mapper.md`: Lógica `mapRemoteToState`, `mapStateToRequest` y resolución de IDs.
     - `references/04-parent-widget-and-tabs.md`: Implementación del widget padre (`BaseFormWidgetComponent`), tabs hijas, dirty tracking y save flows.
     - `references/05-mock-server-fixtures.md`: Fixtures JSON y rutas Express con estados editables.
     - `references/06-vitest-testing.md`: Harness Vitest + ATL para widgets de ejecución.
     - `references/07-domain-integration.md`: Integración con asignación de equipos (Calibry) y datos de Planning/Almacén (ADR-017 / ADR-019).

3. **Carga Bajo Demanda por el Agente:**
   El agente lee el `SKILL.md` principal para conocer el flujo general, y utiliza la herramienta `read_file` sobre el archivo de `references/` correspondiente únicamente cuando llega al paso específico de implementación.

## Consecuencias

### Positivas

- **Reducción masiva de tokens:** El tamaño de entrada al activar `widget-service-integration` disminuye en más del 80% (de ~14.000 tokens a ~2.500 tokens).
- **Mayor fidelidad del LLM:** El contexto de trabajo se mantiene limpio y enfocado, previniendo alucinaciones y omisiones de código.
- **Mantenibilidad modular:** Las modificaciones en plantillas o tests se realizan en ficheros aislados sin alterar la orquestación general.
- **Sincronización automática:** El sistema de versionado (`scripts/agents-version.mjs`) calcula el hash SHA-256 de todo el árbol del directorio de la skill, garantizando integridad y sincronización con `.claude/skills/`.

### Negativas / Consideraciones

- Los agentes deben seguir los enlaces a `references/` cuando necesiten detalles de implementación exhaustivos de un paso concreto.
