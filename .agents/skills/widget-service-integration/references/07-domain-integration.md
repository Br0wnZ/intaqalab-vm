# 07 — Domain Integration (Equipment & Planning/Warehouse Reads)

Guía para consumir equipos asignados (Calibry) y datos de planificación/almacén por disparo cumpliendo estrictamente con ADR-017 y ADR-019.

---

## 1. Consumo de Equipos Asignados (Calibry / Selector de Equipos)

Muchos widgets del panel de ejecución (`MunitionIntroduction`, `PiezoPressureIntroduction`, `VelocityIntroduction`, etc.) filtran desplegables según los equipos previamente asignados en el modal de equipos (funcional 4.3).

```typescript
readonly #store = inject(ExecutionStore);

// Derivar opciones reactivas para la serie y disparo actualmente seleccionados
readonly activeChamberOptions = computed(() => {
  const activeSerieId = this.#store.activeSerieId();
  const activeShotId = this.#store.activeShotId();
  if (!activeSerieId || !activeShotId) return [];

  return this.#store
    .equipmentSelector()
    .selections
    .filter(
      (sel) =>
        sel.categoryId === EquipmentTypeEnum.CLIMATIC_CHAMBER &&
        sel.series.includes(activeSerieId) &&
        sel.disparos.includes(activeShotId),
    )
    .map((sel) => ({ value: sel.itemId, label: sel.itemId }));
});
```

---

## 2. Lecturas de Planning y Almacén por Disparo (ADR-017 & ADR-019)

> [!IMPORTANT]
>
> - El patrón de `ExecutionService` (trigger privado + `httpResource`) es **exclusivo para `/execution/`**.
> - Todas las lecturas de `/planning/...` deben provenir de `@intaqalab/data-access-planning`. Está PROHIBIDO declarar endpoints `/planning/` en el dominio de ejecución (`npm run check:planning-urls` en pre-commit fallará).
> - **ADR-019:** Está PROHIBIDO duplicar llamadas o parsing local en widgets. Deben consumirse los handles reactivos centralizados de `libs/domain/trial/execution/src/lib/data-access/`.

### Patrón Canónico en el Widget Padre

```typescript
import {
  type ShotMunitionComponentOption,
  injectComponentDenominations,
  injectDenominationBatches,
  injectShotMunitionComponents,
} from '@intaqalab/domain-trial-execution';

export class MyWidgetComponent extends BaseFormWidgetComponent {
  readonly #store = inject(ExecutionStore);

  // 1. Selector reactivo de componentes planificados para el disparo activo
  readonly #shotComponentsHandle = injectShotMunitionComponents({
    fireTrialId: computed(() => this.#store.fireTrialId()),
    seriesId: computed(() => this.selectorFormModel().serie),
    shotId: computed(() => this.selectorFormModel().disparo),
  });

  // 2. Opciones computadas expuestas para tabs hijas
  readonly componenteOptions = this.#shotComponentsHandle.options;

  constructor() {
    super();
    effect(() => {
      const opts = this.componenteOptions();
      const current = this.identTab()?.identFormModel().componente;
      if (!current && opts.length > 0) {
        untracked(() => {
          this.identTab()?.applyData({ componente: opts[0].value });
        });
      }
    });
  }
}
```

### Contrato en las Tabs Hijas

```typescript
export class MyWidgetIdentTabComponent {
  readonly componenteOptions = input<ShotMunitionComponentOption[]>([]);

  readonly #denominationsHandle = injectComponentDenominations({
    munitionTypeId: computed(() => this.identFormModel().componente),
    planned: computed(() => this.selectedComponent()?.planned ?? null),
  });

  readonly #batchesHandle = injectDenominationBatches({
    denominationId: computed(() => this.identFormModel().denominacion),
    plannedBatch: computed(() => this.selectedComponent()?.planned.batch ?? null),
  });

  readonly filteredDenominacionOptions = this.#denominationsHandle.options;
  readonly filteredLoteOptions = this.#batchesHandle.options;
}
```

Etiquetas de disparo: `formatShotLabel(globalNumber, index, 'plain' | 'padded')`.
Documentación complementaria: `docs/WIDGET_SYSTEM.md` y [docs/adrs/019-execution-shot-scoped-read-helpers.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/docs/adrs/019-execution-shot-scoped-read-helpers.md).
