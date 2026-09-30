# ADR-015: Sistema de Versionado SemVer y Sincronización para AGENTS.md y Skills

**Estado:** Aceptado  
**Fecha:** 2026-09-29  
**Autores:** Javier Moreno Valle

---

## Contexto

El proyecto INTAQALAB ha acumulado un ecosistema crítico de directrices de arquitectura y asistentes especializados: el fichero raíz `AGENTS.md` (configuración del sistema, estándares Zoneless/Signals-first, reglas de Clean Code) y 24 skills locales ubicados en `.agents/skills/`.

A medida que el equipo y los modelos de IA evolucionan las reglas, surgieron tres problemas clave:

1. **Falta de Trazabilidad y SemVer:** No existía indicador de versión ni historial formal de cambios en `AGENTS.md` ni en el frontmatter de los skills, dificultando detectar regresiones o saber qué versión de las reglas está activa en cada rama/entorno.
2. **Desincronización de Entornos (`.agents` vs `.claude`):** Existían carpetas duplicadas (`.agents/skills` y `.claude/skills`) cuyos contenidos habían comenzado a divergir sin un mecanismo automatizado de sincronización.
3. **Ausencia de Validación en CI / Pre-commit:** No existía comprobación de que un cambio funcional o de directriz estuviese acompañado de un incremento de versión y registro en changelog.

## Decisión

Implementar un **sistema formal de versionado semántico independiente**, verificación por checksums SHA-256, sincronización unidireccional y tooling automatizado mediante Node.js:

1. **Fuente Única de Verdad (Single Source of Truth):**
   - `.agents/skills/` es la única fuente de verdad para todos los skills.
   - `AGENTS.md` es la única fuente de verdad para directrices globales.
   - `.claude/skills/` se mantiene como espejo sincronizado automáticamente mediante el script `scripts/agents-version.mjs sync`.

2. **Esquema de Versionado SemVer Independiente:**
   - **`AGENTS.md`:** Incorpora la etiqueta canónica `<!-- AGENTS_VERSION: X.Y.Z | UPDATED: YYYY-MM-DD -->`.
   - **Skills (`.agents/skills/*/SKILL.md`):** Incorporan en su frontmatter YAML los campos obligatorios `name`, `version`, `last-updated` y `description`.
   - Cada skill avanza de forma desacoplada (`MAJOR.MINOR.PATCH`):
     - `MAJOR`: Cambios de paradigma, breaking changes en reglas de arquitectura o APIs incompatibles.
     - `MINOR`: Nuevos skills, nuevas pautas funcionales o extensiones de reglas sin rotura.
     - `PATCH`: Correcciones de redacción, pequeños ajustes en prompts o ejemplos.

3. **Manifiesto Central (`.agents/versions.json`):**
   - Registra el estado consolidado de todo el ecosistema de IA: versiones activas, rutas, descripciones y checksums SHA-256 deterministas (incluyendo directorios completos de cada skill con sus subficheros de `references/`).

4. **Registro de Cambios (`.agents/CHANGELOG.md`):**
   - Sigue el estándar [Keep a Changelog](https://keepachangelog.com/), documentando por target y versión cada alteración.

5. **Tooling CLI (`scripts/agents-version.mjs` y scripts npm):**
   - `npm run agents:status`: Diagnóstico visual del estado de sincronización y modificaciones sin versionar.
   - `npm run agents:check`: Validación estricta para CI/pre-commit (valida frontmatters, SemVer, correspondencia con el manifiesto y checksums).
   - `npm run agents:bump <target> [patch|minor|major] -- --msg "..."`: Automatiza el bump de versión, actualización de frontmatter/manifiesto, entrada en el changelog y sincronización hacia `.claude/skills/`.
   - `npm run agents:sync`: Sincronización limpia entre `.agents/skills/` y `.claude/skills/`.

## Consecuencias

### Positivas

- **Trazabilidad Absoluta:** Cualquier asistente de IA o desarrollador puede consultar la versión exacta activa de cada directriz y skill.
- **Prevención de Regresiones:** El comando de verificación `agents:check` permite auditar en CI que ninguna regla cambie silenciosamente sin trazabilidad.
- **Cero Duplicidad:** Sincronización transparente de `.claude/skills/`, garantizando paridad total entre Claude Code, Antigravity, Copilot y Cursor.
- **Zero External Dependencies:** El script utiliza exclusivamente APIs nativas de Node.js (`fs`, `path`, `crypto`), sin añadir dependencias npm adicionales al repositorio.

### A vigilar

- Asegurar que los desarrolladores y agentes de IA ejecuten `npm run agents:bump` al modificar cualquier skill o directriz de `AGENTS.md`.
