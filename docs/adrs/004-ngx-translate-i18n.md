# ADR-004: ngx-translate como librería de i18n

**Estado:** Aceptado
**Fecha:** 2026-07-10 (retroactivo — decisión ya implementada)
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

INTAQALAB soporta 3 idiomas (es/en/de) con ficheros JSON estáticos por locale (`apps/intaqalab/public/i18n/{es,en,de}.json`). Se necesitaba una librería de traducción con pipe puro (compatible OnPush/zoneless) y carga de traducciones vía HTTP.

## Decisión

Se usa `@ngx-translate/core` + `@ngx-translate/http-loader` (`provideTranslateService()` en `app.config.ts`). Las claves siguen la nomenclatura jerárquica `<DOMINIO>.<SECCIÓN>.<COMPONENTE>.<PROPIEDAD>` (ver `docs/I18N.md`). Texto duro en templates/componentes está prohibido — todo pasa por el pipe `{{ 'KEY' | translate }}` o `TranslateService` desde TypeScript cuando el string debe resolverse antes de llegar a la vista.

**Alternativa rechazada:** Transloco — no evaluada formalmente en este repo (a diferencia de otros monorepos Angular de referencia que sí lo adoptaron); ngx-translate ya estaba integrado y con las traducciones existentes en producción, migrar tendría coste de reescritura sin beneficio claro a corto plazo.

## Consecuencias

### Positivas

- Pipe puro compatible con Zoneless/OnPush (ver ADR-002).
- Carga de traducciones desacoplada del bundle (JSON servido como asset estático).
- Convención de claves jerárquica homogénea y auditable.

### Negativas

- Sin namespacing por librería nativo (a diferencia de Transloco): todo vive en 3 ficheros JSON monolíticos por idioma, que ya han mostrado desincronización real entre locales (ver `tools/verify/check-i18n.mjs` y su baseline de deuda).
- Sin lazy-loading de traducciones por feature — se carga el JSON completo del idioma activo.

### Pendiente

- Evaluar partición de los JSON por dominio/feature con loaders múltiples si el fichero sigue creciendo (actualmente ~2.000 claves en `en.json`).
- `tools/verify/check-i18n.mjs` (ratchet de paridad de claves + literales hardcoded) es la guardarraíl mecánica mientras tanto — mantenerlo en `verify.sh`.

## Referencias

- `docs/I18N.md`
- `apps/intaqalab/src/app/app.config.ts`
- `apps/intaqalab/public/i18n/{es,en,de}.json`
- `tools/verify/check-i18n.mjs`
