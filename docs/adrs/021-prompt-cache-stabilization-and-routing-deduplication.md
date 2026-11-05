# ADR-021: Prompt Cache Stabilization and Routing Table Deduplication for Agent Harness

**Estado:** Aceptado
**Fecha:** 2026-11-04
**Autores:** INTAQALAB Architecture Team

## Contexto

En el diseño moderno de Agent Harnesses (SOTA 2026, OpenAI Codex, Anthropic Prompt Caching Architecture), la optimización del consumo de tokens y la latencia en inferencia multi-turno dependen críticamente de dos factores fundamentales:

1. **Estabilidad de Prefijo KV-Cache (Immutable Prefix Pattern):**
   Los mecanismos de caché de contexto (Anthropic Prompt Caching, OpenAI Prefix Caching, DeepSeek y Google Gemini) se basan en la coincidencia exacta byte a byte del prefijo estático inicial del prompt del sistema.
   Hasta la fecha, en [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md), la etiqueta dinámica de versión y fecha (`<!-- AGENTS_VERSION: X.Y.Z | UPDATED: YYYY-MM-DD -->`) se ubicaba en la cabecera (línea 28). Cada vez que se ejecutaba un bump de versión o se modificaba la fecha, se invalidaba completamente la memoria caché de tokens de los más de 15.000 caracteres de [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md) y las instrucciones subsecuentes en cada sesión, forzando un recálculo masivo e innecesario de tokens de entrada.

2. **Duplicación de Tablas de Enrutamiento y Reglas en Multi-Harness:**
   El proyecto soporta múltiples entornos de agentes (Antigravity, Claude Code, Cursor, Codex). Se detectó una duplicación redundante de la tabla de enrutamiento y directivas entre [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md) y los ficheros [.claude/rules/ai-orchestrator.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/.claude/rules/ai-orchestrator.md) y [.claude/rules/angular-nx-architect.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/.claude/rules/angular-nx-architect.md). Además de consumir el doble de tokens en el prompt inicial de herramientas como Claude Code, existían inconsistencias normativas (por ejemplo, reglas que indicaban `httpResource` para todo HTTP cuando ADR-020 exige estrictamente `HttpClient` para mutaciones).

## Decisión

Se establecen las siguientes medidas de optimización de arnés y consumo de tokens:

1. **Aislamiento de Metadatos Volátiles al Final del Prefijo Estático:**
   Se traslada la etiqueta `<!-- AGENTS_VERSION: X.Y.Z | UPDATED: YYYY-MM-DD -->` al pie (final absoluto) de [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md). De esta forma, el cuerpo normativo, directivas Nx, Caveman Mode y estándares arquitectónicos permanecen 100% byte-inmutables al inicio del prompt, maximizando la tasa de acierto de KV-cache independientemente del LLM utilizado. La herramienta de versionado [scripts/agents-version.mjs](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/scripts/agents-version.mjs) mantiene su compatibilidad total ya que utiliza búsqueda por expresión regular en todo el documento.

2. **Fuente Única de Verdad para Enrutamiento (Single Source of Truth):**
   [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md) se consolida como la única fuente canónica para la tabla de enrutamiento de skills y estándares de arquitectura.
   - En [.claude/rules/ai-orchestrator.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/.claude/rules/ai-orchestrator.md), se elimina la tabla redundante y se referencia formalmente a [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md).
   - En [.claude/rules/angular-nx-architect.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/.claude/rules/angular-nx-architect.md), se corrigen las directivas obsoletas, alineándolas con ADR-020 (HttpClient para mutaciones) y delegando la arquitectura base a [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md).

## Consecuencias

### Positivas

- **Ahorro masivo de tokens y coste:** Máxima tasa de acierto de KV-Cache (prompt caching hit rate) en sesiones recurrentes y tras bumps de versión menores.
- **Reducción de consumo de contexto:** Eliminación de cientos de tokens duplicados inyectados por reglas concurrentes en Claude Code y otros agentes.
- **Coherencia normativa unificada:** Eliminación de discrepancias entre reglas locales de IDEs y la guía maestra [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md).
- **Compatibilidad agnóstica:** Totalmente interoperable con cualquier proveedor o modelo (OpenAI, Anthropic, Gemini, DeepSeek, open weights locales).

### Negativas / Consideraciones

- Los desarrolladores o agentes que actualicen manualmente las etiquetas deben recordar mantener `<!-- AGENTS_VERSION -->` al final de [AGENTS.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/AGENTS.md), o utilizar el comando oficial `npm run agents:bump`.
