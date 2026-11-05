# ADR-023: Persistent Filesystem Task Memory Protocol for LLM-Agnostic State Tracking

**Estado:** Aceptado
**Fecha:** 2026-11-04
**Autores:** INTAQALAB Architecture Team

## Contexto

El desarrollo asistido por IA en repositorios empresariales complejos involucra tareas multi-paso (refactorizaciones arquitectónicas, integración de widgets, migraciones de endpoints o generación de suites de tests). Históricamente, el seguimiento del progreso dependía exclusivamente del historial de mensajes del chat conversacional (context window).

Este modelo de memoria puramente conversacional presenta graves fallas en la práctica (SOTA 2026 / Harness Engineering):

1. **Pérdida de Estado en Compactación y Resets:** Cuando el contexto se compacta (`/compact`), la ventana supera el umbral del 40% de degradación o la sesión se reinicia (reinicio del servidor de lenguaje, caídas de IDE o alternancia de herramientas entre Claude Code, Cursor, Antigravity o Copilot), todo el plan y el progreso se destruyen.
2. **Re-lecturas Redundantes y Desperdicio de Tokens:** Al perder el hilo de qué archivos fueron editados o qué descubrimientos se hicieron en pasos previos, los LLMs tienden a re-ejecutar lecturas masivas de ficheros (`read_file`, `cat`, búsquedas grep) en cada turno, multiplicando el consumo de tokens de entrada.
3. **Falta de Interoperabilidad Multi-Modelo (LLM-Agnostic):** Modelos con ventanas de atención más estrictas o modelos locales (OpenAI, DeepSeek, Qwen, Gemini) se desorientan fácilmente en planes largos si no disponen de un artefacto externo determinista en disco que sirva como "fuente de verdad" operativa.
4. **Alucinación de Tareas Completadas:** Sin un checklist persistente e inmutable en el sistema de archivos, el modelo confunde intenciones declaradas con código efectivamente verificado.

## Decisión

Se adopta el patrón **Repository as System of Record** mediante el protocolo de memoria de ejecución en disco `.agents/TASK.md`:

1. **Fichero Canónico de Estado (`.agents/TASK.md`):**
   Para cualquier tarea que involucre más de 2 pasos o afecte a múltiples ficheros, el agente debe inicializar o actualizar el fichero `.agents/TASK.md` en el sistema de archivos local antes de modificar código fuente.
2. **Plantilla Estructurada (`.agents/TASK.template.md`):**
   Se crea una plantilla canónica versionada en `.agents/TASK.template.md` con las siguientes secciones obligatorias:
   - **Metadatos:** Objetivo general, dominio/proyecto afectado, estado global (`PLANNING`, `IN_PROGRESS`, `BLOCKED`, `DONE`).
   - **Checklist de Ejecución:** Tareas atómicas con checkboxes (`- [ ]`, `- [/]` para en progreso, `- [x]` para completado) y criterios de aceptación específicos.
   - **Memoria de Trabajo y Descubrimientos:** Rutas clave, endpoints identificados, notas de dependencias y decisiones técnicas inmediatas.
   - **Verificación Final:** Checklist determinista (`verify.sh`, `tsc --noEmit`, tests unitarios).
3. **Aislamiento en Git:**
   Se añade `.agents/TASK.md` a `.gitignore` para asegurar que los estados efímeros de trabajo local no generen ruido ni ensucien los commits del repositorio. Solo la plantilla `.agents/TASK.template.md` permanece versionada en git.
4. **Regla de Ejecución en `AGENTS.md`:**
   Se incorpora una directiva concisa en `AGENTS.md` obligando a cualquier agente o LLM a:
   - Leer `.agents/TASK.md` al retomar una sesión. Si el estado es `IN_PROGRESS`, reanudar inmediatamente desde la primera tarea no completada sin volver a preguntar al usuario.
   - Marcar cada paso en `.agents/TASK.md` a medida que se completa satisfactoriamente.
   - Mantener las respuestas de chat ultra-breves (Caveman Mode), evitando imprimir planes gigantescos en la conversación cuando ya residen en el archivo de tarea.

## Consecuencias

### Positivas

- **Resiliencia total a resets de contexto:** El agente puede reiniciar su contexto, cambiar de modelo o recuperar la sesión horas después sin perder el hilo de ejecución.
- **Ahorro masivo de tokens:** Evita re-lecturas redundantes de código exploratorio y elimina la necesidad de reimprimir planes extensos en el historial conversacional.
- **Interoperabilidad absoluta:** Funciona de forma idéntica en cualquier harness (Antigravity, Claude Code, Cursor, Codex, terminal CLI) y con cualquier familia de LLM.
- **Trazabilidad determinista:** El desarrollador humano puede inspeccionar `.agents/TASK.md` en tiempo real para auditar el avance del agente.

### Negativas / Consideraciones

- El agente realiza una operación de edición adicional en `.agents/TASK.md` al iniciar y finalizar hitos clave.
