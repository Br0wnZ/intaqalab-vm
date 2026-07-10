---
name: i18n-keys
description: Manages translation keys for the Intaqalab project using @ngx-translate. USE WHEN adding new UI text, auditing missing translations, updating keys, or ensuring all 3 locales (es/en/de) are in sync. Covers naming conventions, file locations, and template usage.
---

# I18n Key Management — Intaqalab Standard

Sistema de internacionalización basado en `@ngx-translate/core` con 3 idiomas activos.

## Ficheros de Traducción

```
apps/intaqalab/public/i18n/
  es.json   ← Fuente de verdad (español)
  en.json   ← Inglés
  de.json   ← Alemán
```

**Regla crítica**: Toda clave que existe en `es.json` DEBE existir en `en.json` y `de.json`.

## Convención de Naming

```
DOMAIN.SECTION.ELEMENT.PROPERTY
```

### Niveles estándar

| Nivel          | Ejemplos                                                                                                 | Descripción                         |
| -------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Root (dominio) | `TRIAL_MANAGEMENT`, `WAREHOUSE`, `MASTER_DATA`, `TRIAL_EXECUTION`, `MENU_LEFT`, `COMMONS`, `VALIDATIONS` | Dominio funcional o contexto global |
| Section        | `DIALOGS`, `FIELDS`, `ACTIONS`, `MESSAGES`, `OPTIONS`                                                    | Sección dentro del dominio          |
| Element        | `CONFIRM_DELETE`, `CREATE_FORM`, `DETAIL_CARD`                                                           | Componente o elemento específico    |
| Property       | `TITLE`, `DESCRIPTION`, `PLACEHOLDER`, `ERROR`, `LABEL`                                                  | Propiedad visual                    |

### Ejemplos reales del proyecto

```json
"TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE"
"MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_NEW"
"COMMONS.ACCEPT"
"COMMONS.REQUIRED_FIELD"
"VALIDATIONS.INVALID_DATE"
```

## Claves COMMONS (reutilizables — no duplicar)

```json
{
  "COMMONS": {
    "ACCEPT": "Aceptar",
    "CONFIRM": "Confirmar",
    "CREATE": "Crear",
    "EDIT": "Editar",
    "SAVE": "Guardar",
    "CANCEL": "Cancelar",
    "RETURN": "Volver",
    "DELETE_DATA": "Borrar datos",
    "SEARCH": "Buscar",
    "OPTIONAL": "Opcional",
    "REGISTER": "Registrar",
    "REQUIRED_FIELD": "Valor requerido",
    "INVALID_DATE_FORMAT": "Formato de fecha no válido"
  }
}
```

> Referencia siempre `COMMONS.*` en lugar de duplicar verbos de acción.

## Uso en Templates Angular

```html
<!-- Interpolación básica -->
{{ 'NAMESPACE.SECTION.KEY' | translate }}

<!-- Binding a propiedad -->
[placeholder]="'NAMESPACE.KEY' | translate" [aria-label]="'NAMESPACE.KEY' | translate" [matTooltip]="'NAMESPACE.KEY' |
translate"

<!-- Con parámetros de interpolación -->
{{ 'NAMESPACE.KEY' | translate: { name: entity.name, count: total() } }}
```

JSON con parámetro:

```json
"TRIAL_MANAGEMENT.MESSAGES.ITEMS_COUNT": "{{count}} ensayos encontrados"
```

## Uso en Clase TypeScript

Solo cuando no hay alternativa en el template (guards, toasts, mensajes de error):

```typescript
readonly #translate = inject(TranslateService);

// instant — solo cuando el valor se necesita síncronamente
const msg = this.#translate.instant('NAMESPACE.KEY');

// stream — cuando necesitas reactividad al cambio de idioma
readonly errorMsg = toSignal(
  this.#translate.stream('NAMESPACE.KEY')
);
```

## Proceso para Añadir Nuevas Claves

### 1. Identifica el namespace

Mapea el componente a su dominio:

- `libs/domain/trial/execution/` → `TRIAL_EXECUTION.*`
- `libs/domain/warehouse-management/` → `WAREHOUSE.*`
- `libs/domain/master-data/` → `MASTER_DATA.*`
- `libs/domain/admin/` → `ADMIN.*`
- Elementos transversales → `COMMONS.*` o `VALIDATIONS.*`

### 2. Estructura el JSON a añadir

```json
// Nuevo bloque en es.json
"WAREHOUSE": {
  "AMMUNITION": {
    "FIELDS": {
      "LOT": "Lote",
      "CALIBER": "Calibre",
      "QUANTITY": "Cantidad"
    },
    "DIALOGS": {
      "CREATE": {
        "TITLE": "Nueva munición",
        "SUCCESS": "Munición registrada correctamente"
      }
    }
  }
}
```

### 3. Traduce y añade en los 3 ficheros

`en.json`:

```json
"WAREHOUSE": {
  "AMMUNITION": {
    "FIELDS": { "LOT": "Lot", "CALIBER": "Caliber", "QUANTITY": "Quantity" },
    "DIALOGS": { "CREATE": { "TITLE": "New ammunition", "SUCCESS": "Ammunition registered successfully" } }
  }
}
```

`de.json`:

```json
"WAREHOUSE": {
  "AMMUNITION": {
    "FIELDS": { "LOT": "Los", "CALIBER": "Kaliber", "QUANTITY": "Menge" },
    "DIALOGS": { "CREATE": { "TITLE": "Neue Munition", "SUCCESS": "Munition erfolgreich registriert" } }
  }
}
```

## Anti-patrones

```html
<!-- ❌ Texto hardcoded en template -->
<button>Cancelar</button>

<!-- ❌ String en inglés sin translate -->
<mat-label>Trial Name</mat-label>

<!-- ❌ Clave duplicando COMMONS -->
{{ 'TRIAL.DIALOGS.ACCEPT_BUTTON' | translate }}
<!-- usa COMMONS.ACCEPT -->
```

```json
// ❌ Más de 4 niveles de anidamiento
"DOMAIN.SECTION.ELEMENT.FIELD.LABEL.TEXT"

// ❌ Clave sin contexto
"FORM.LABEL1"
"COMPONENT.TEXT"
```

## Auditoría de Claves Faltantes

Para verificar sincronía entre idiomas:

```bash
# Script manual de revisión — compara top-level keys
node -e "
const es = require('./apps/intaqalab/public/i18n/es.json');
const en = require('./apps/intaqalab/public/i18n/en.json');
const missing = Object.keys(es).filter(k => !en[k]);
console.log('Missing in en.json:', missing);
"
```
