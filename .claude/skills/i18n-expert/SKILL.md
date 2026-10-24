---
name: i18n-expert
version: 1.0.1
last-updated: 2026-10-24
description: Internationalization Specialist with @ngx-translate. Use when adding, updating or auditing es/en/de translation keys, namespaces, templates, locale-dependent decimal display, numeric input or language switching. Keeps localized view strings separate from numeric backend values.
argument-hint: "E.g. 'Add i18n keys for munition creation component' or 'Create WAREHOUSE.AMMUNITION_NEW namespace with these keys...'."
user-invocable: true
---

# 🌐 I18n Engineer & Keys Management — Intaqalab Standard

You are the **I18n Engineer** for the Intaqalab project. Your mission is to maintain synchronized, professional translation files using `@ngx-translate`, adhering strictly to naming conventions and architecture rules.

## Numeric Locale Contract (Mandatory)

Before modifying decimal presentation or parsing, load [numeric-input-constraints](../numeric-input-constraints/SKILL.md), the source of truth for precision, controls, mappers and payloads.

- Translate labels, not numeric state or HTTP values. ES input `3,46` and EN input `3.46` must both produce JSON number `3.46`; never serialize a formatted number.
- Use reactive `LOCALE_SIGNAL` with `formatPreciseNumber` or `intaDecimal` from `@intaqalab/utils`. Do not hardcode separators or rely on `DecimalPipe`, default `toLocaleString()` or a fixed maximum fraction precision for measurements.
- Inspect `libs/shared/utils/src/lib/tokens/locale-signal.token.ts`, `libs/shared/data-access/src/lib/core/language-service.ts` and `locale-signal.provider.ts` before adding or testing a locale. Currently `AppLocale` is `es-ES | en-US`, and `SupportedLanguage` is `es | en`; the German translation catalog does NOT imply runtime `de-DE` support.
- Adding German or another runtime locale requires updating language selection, locale typing/provider, shared input separator handling and numeric regression tests together. German decimals use comma; never classify every non-Spanish locale as English. Do not silently extend runtime support during a translation-only task.
- A language switch may reformat the view but must not change values, dirty state or payload. Check loaded values, grouping separators, focus/blur and readonly fields before and after switching languages.

## 📂 Translation Files

Always edit all **3 language files** in parallel. Never leave missing keys in any language.
**Critical Rule:** Any key existing in `es.json` MUST exist in `en.json` and `de.json`.

- `apps/intaqalab/public/i18n/es.json` — Spanish (primary source of truth)
- `apps/intaqalab/public/i18n/en.json` — English
- `apps/intaqalab/public/i18n/de.json` — German

## 📜 Naming Convention

```
DOMAIN.SECTION.ELEMENT.PROPERTY
```

### Standard Hierarchy

| Level         | Examples                                                                                                 | Description                         |
| ------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Root (domain) | `TRIAL_MANAGEMENT`, `WAREHOUSE`, `MASTER_DATA`, `TRIAL_EXECUTION`, `MENU_LEFT`, `COMMONS`, `VALIDATIONS` | Functional domain or global context |
| Section       | `DIALOGS`, `FIELDS`, `ACTIONS`, `MESSAGES`, `OPTIONS`                                                    | Section within domain               |
| Element       | `CONFIRM_DELETE`, `CREATE_FORM`, `DETAIL_CARD`                                                           | Specific component or UI element    |
| Property      | `TITLE`, `DESCRIPTION`, `PLACEHOLDER`, `ERROR`, `LABEL`                                                  | Visual property                     |

### Examples:

- `TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE`
- `MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_NEW`
- `COMMONS.ACCEPT`

### Rules:

- All keys in **SCREAMING_SNAKE_CASE**.
- Reusable action verbs belong under `COMMONS`: `ACCEPT`, `CONFIRM`, `SAVE`, `CANCEL`, `CREATE`, `EDIT`, `DELETE_DATA`, `RETURN`, `SEARCH`. Never duplicate common actions in domain namespaces.
- Maximum nesting depth: 4 levels.

## ⚙️ Template Usage (Angular)

```html
<!-- Basic interpolation -->
{{ 'NAMESPACE.SECTION.KEY' | translate }}

<!-- Attribute bindings -->
[placeholder]="'NAMESPACE.KEY' | translate" [aria-label]="'NAMESPACE.KEY' | translate" [matTooltip]="'NAMESPACE.KEY' |
translate"

<!-- With interpolation parameters -->
{{ 'NAMESPACE.KEY' | translate: { name: entity.name, count: total() } }}
```

## ⚙️ TypeScript Class Usage

Use only when template pipes cannot be used (guards, toasts, programmatic alerts):

```typescript
readonly #translate = inject(TranslateService);

// Instant synchronous retrieval
const msg = this.#translate.instant('NAMESPACE.KEY');

// Reactive signal stream
readonly errorMsg = toSignal(this.#translate.stream('NAMESPACE.KEY'));
```

## ✅ Workflow for Adding New Keys

1. **Identify Namespace:** Determine domain root based on library path (`TRIAL_EXECUTION.*`, `WAREHOUSE.*`, `MASTER_DATA.*`, `COMMONS.*`).
2. **Extract Literals:** Extract all user-visible strings (labels, placeholders, tooltips, buttons, errors).
3. **Write to All 3 Files:** Provide high-quality professional translations in `es.json`, `en.json`, and `de.json`.
4. **Update Template:** Replace hardcoded strings with `| translate` pipes.
