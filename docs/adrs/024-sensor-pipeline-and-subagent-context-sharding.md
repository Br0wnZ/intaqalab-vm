# ADR-024: Fast Sensor Feedback Pipeline and Sub-Agent Context Sharding

**Estado:** Aceptado
**Fecha:** 2026-11-04
**Autores:** INTAQALAB Architecture Team

## Contexto

En el ciclo de vida de un Agent Harness para generación de código (SOTA 2026, OpenAI Codex, Anthropic Multi-Agent Architecture), dos cuellos de botella críticos limitan la eficiencia y disparan el consumo de tokens:

1. **Latencia y Amplitud de los Sensores de Verificación:**
   Actualmente, la verificación de integridad se delega exclusivamente a `tools/verify/verify.sh`, que ejecuta `nx affected --target=lint` sobre todo el workspace y el análisis completo de literales i18n (`check-i18n.mjs`). Durante iteraciones rápidas (ej. tras editar un único fichero `.ts`), esperar entre 15 y 35 segundos por cada micro-cambio ralentiza el bucle agéntico. Además, cuando ocurren errores de compilación o linting, la salida sin filtrar inunda la ventana de contexto con cientos de líneas de ruido irrelevante.

2. **Contaminación del Contexto por Ficheros de Gran Tamaño (OpenAPI / Swagger Bloat):**
   Las especificaciones OpenAPI del repositorio (`apis/execution-api.json` con 306 KB, `apis/planning-api.json` con 138 KB) superan ampliamente los 75.000 tokens. Cuando un agente lee directamente uno de estos archivos en el hilo conversacional principal, la ventana de contexto se satura instantáneamente. Esto incrementa de forma cuadrática el coste en tokens de cada turno posterior y degrada severamente la capacidad de razonamiento del LLM.

## Decisión

Se implementan dos mecanismos deterministas en el arnés de agentes:

### 1. Sensor Pipeline Rápido y Filtrado (`tools/verify/verify.mjs`)

- Se dota a `tools/verify/verify.mjs` de soporte para ejecución focalizada:
  - `--project <nombre>`: Ejecuta el linter exclusivamente sobre el proyecto editado (`npx nx run <project>:lint`), reduciendo el tiempo de feedback a milisegundos cuando la caché de Nx aplica.
  - `--no-i18n`: Omite la verificación global de traducciones en tareas estrictamente internas (servicios, stores, mappers, tests).
  - Por defecto (sin flags), mantiene la verificación exhaustiva de todo el ámbito afectado para pre-commit y el hook `Stop`.
- Se fomenta el uso de `rtk` o `repowise distill` como proxy de comandos de terminal para podar automáticamente el 90% de la salida ruidosa y exponer exclusivamente los códigos de error y líneas afectadas.

### 2. Protocolo de Sharding de Contexto con Subagentes (Context Sharding)

- **Prohibición de Lectura Directa de APIs Masivas:** Se prohíbe terminantemente la lectura directa con `read_file` o `cat` de especificaciones OpenAPI completas (>500 líneas / >50 KB) en el hilo principal del agente.
- **Delegación a Subagentes Efímeros:** Para tareas de exploración de Swagger o búsqueda transversal en el repositorio:
  1. El agente principal delega la exploración a un subagente efímero de solo lectura (`research`, subagente `read-only` o script Python específico como el establecido en las skills).
  2. El subagente analiza el documento en su propio contexto aislado.
  3. El subagente retorna al agente principal únicamente el extracto comprimido (~50-150 tokens) con los endpoints, métodos HTTP, query parameters y esquemas DTO requeridos.

## Consecuencias

### Positivas

- **Reducción radical de tokens:** Evita la inyección de más de 75.000 tokens en la sesión principal al explorar contratos Swagger o esquemas masivos.
- **Feedback instantáneo:** La verificación incremental con `--project` reduce el ciclo de prueba de ~30s a <1s durante la edición activa.
- **Preservación del contexto principal:** La ventana de contexto del agente principal se mantiene por debajo del 20-30% de ocupación, garantizando máxima velocidad y mínima tasa de alucinación.

### Negativas / Consideraciones

- Los agentes deben seleccionar el sensor adecuado (`--project` para micro-iteraciones, `verify.sh` completo antes de dar la tarea por finalizada).
