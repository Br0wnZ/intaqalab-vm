# ADR-014: Evaluación y Descarte de Oxlint y Oxfmt en el Workspace

**Estado:** Aceptado  
**Fecha:** 2026-09-23  
**Autores:** Javier Moreno Valle

---

## Contexto

Nx 23.2 introdujo integración nativa experimental con `@nx/oxlint` (linter ultrarrápido en Rust) y soporte para `oxfmt` (formateador en Rust alternativo a Prettier). Se evaluó su viabilidad técnica para acelerar los ciclos de linting y formateo en INTAQALAB.

## Decisión

**Descartar la adopción de `oxfmt` y `oxlint` en el estado actual de las herramientas.**

### Razones Técnicas

1. **Incompatibilidad de Oxfmt con Plugins de Prettier**:
   - El workspace depende de dos plugins críticos de Prettier:
     - `prettier-plugin-organize-attributes`: obligatorio para garantizar el orden canónico de atributos HTML/Angular (`$ANGULAR_STRUCTURAL_DIRECTIVE`, `$ID`, `$CLASS`, etc.).
     - `@trivago/prettier-plugin-sort-imports`: para el orden uniforme de imports.
   - `oxfmt` no soporta plugins de Prettier (issue #15665 abierto). Adoptar `oxfmt` rompería la consistencia visual y de plantillas de Angular.

2. **Limitaciones de Oxlint en Ecosistema Angular**:
   - `oxlint` no parsea ni valida plantillas HTML de Angular ni expresiones de bindings.
   - El cuello de botella principal en tiempo de linting del proyecto no es el parseo sintáctico general de TypeScript, sino la regla `@nx/enforce-module-boundaries` con validación exhaustiva de dependencias cruzadas entre librerías. La ganancia real de `oxlint` con `enforce-module-boundaries` activo es marginal (14.9s vs 17.9s).
   - Mantener dos linters en paralelo (ESLint para plantillas/fronteras y Oxlint para sintaxis TS) añade complejidad innecesaria sin un ROI significativo.

## Consecuencias

### Positivas

- Preservación íntegra de las convenciones de formato de plantillas Angular y orden de atributos.
- Configuración de linting unificada y predecible mediante ESLint 9 Flat Config.
- Cero fricción o divergencias entre el entorno local y las pipelines de CI/CD.

### A vigilar

- Reevaluar `oxfmt` y `oxlint` en futuros ciclos (2027) cuando exista soporte maduro para plugins y análisis semántico de plantillas Angular.
