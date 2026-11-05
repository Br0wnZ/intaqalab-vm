# 04 — Parent Widget and Child Tabs

Guía de arquitectura e implementación para widgets de ejecución (`BaseFormWidgetComponent`), dirty tracking por valor, selection guard y contrato con sub-tabs.

---

## 1. Reglas Críticas del Widget Padre

1. **NO sobreescribir `ngOnInit()`:** `BaseFormWidgetComponent` registra la instancia automáticamente en `WidgetStateService`.
2. **`isDirty` = OR de los `isDirty()` de las tabs:** NUNCA incluir los selectores de serie o disparo.
3. **Carga inicial idempotente:** Usar `#lastLoadedActiveSelection` para evitar múltiples loads del mismo disparo.
4. **Selection guard:** Usar `createSelectionGuard` + `ticket.isFresh()` para descartar respuestas asíncronas desactualizadas al cambiar rápido de disparo.
5. **`[class.hidden]` en tabs:** Usar `[class.hidden]` en lugar de `@if` o `@switch` para preservar el estado interno del DOM de cada tab.
6. **`saveForm()` ejecuta `tab.save()`:** Tras un PUT exitoso, sincroniza el snapshot de dirty tracking en cada tab (`syncSnapshot()`).
7. **Widgets autónomos (`autonomousWidgetType`):** Si un widget gestiona su propio ciclo de polling (como `SeguimientoWidget`), definir `protected override readonly autonomousWidgetType = WidgetId.<ID>;`.

---

## 2. Implementación Canónica del Widget Padre

```typescript
@Component({
  selector: 'inta-<widget-name>',
  imports: [
    FormField, ReadonlyContentDirective, FormTouchDirective,
    MatButtonModule, MatFormFieldModule, MatSelectModule, TranslateModule,
    <IdentTab>Component, <PesosTab>Component, <AcondTab>Component,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-2 flex flex-col gap-2 overflow-auto">
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Navegación: Selectores de serie y disparo (NO dirty) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'...' | translate"
            [formField]="selectorForm.serie"
            (selectionChange)="onSerieSelected($event.value)">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'...' | translate"
            [formField]="selectorForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.<WIDGET_KEY>.CURRENT_SHOT_BTN' | translate }}
        </button>
        <div class="flex-1"></div>
        <!-- Tab chips -->
        <div class="flex items-center gap-1 shrink-0">
          @for (tab of ['identificacion', 'pesos', 'acondicionamiento']; track tab) {
            <button type="button"
              class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
              [class]="activeTab() === tab
                ? 'bg-[var(--inta-button)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'"
              (click)="activeTab.set($any(tab))">
              {{ 'TRIAL_EXECUTION.WIDGETS.<WIDGET_KEY>.TAB_' + tab.toUpperCase() | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Tab bodies: [class.hidden] para preservar estado en memoria -->
      <div intaReadonlyContent intaFormTouch #touch="intaFormTouch" class="flex-1 min-h-0">
        <inta-<ident-tab> [class.hidden]="activeTab() !== 'identificacion'" />
        <inta-<pesos-tab> [class.hidden]="activeTab() !== 'pesos'" />
        <inta-<acond-tab> [class.hidden]="activeTab() !== 'acondicionamiento'" />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Widget> extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  protected readonly activeTab = signal<TabType>('identificacion');

  readonly identTab = viewChild(<IdentTab>Component);
  readonly pesosTab = viewChild(<PesosTab>Component);
  readonly acondTab = viewChild(<AcondTab>Component);
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());

  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#store.planningSeries(),
      this.#store.<widgetCamelName>().serieOptions,
    ),
  );

  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.selectorFormModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#store.planningSeries(),
      storedOptions: this.#store.<widgetCamelName>().disparoOptions,
    }),
  );

  protected readonly selectorFormModel = signal<{ serie: string | null; disparo: string | null }>({
    serie: this.#store.<widgetCamelName>().serie,
    disparo: this.#store.<widgetCamelName>().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // Dirty tracking por composición de tabs
  protected readonly isDirty = computed(
    () =>
      (this.identTab()?.isDirty() ?? false) ||
      (this.pesosTab()?.isDirty() ?? false) ||
      (this.acondTab()?.isDirty() ?? false),
  );

  protected readonly isValid = computed(
    () =>
      this.selectorForm().valid() &&
      (this.identTab()?.isValid() ?? true) &&
      (this.pesosTab()?.isValid() ?? true) &&
      (this.acondTab()?.isValid() ?? true),
  );

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.isValid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId();
      const activeShotId = this.#store.activeShotId();

      if (!fireTrialId || !activeSerieId || !activeShotId) return;

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) return;

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    const current = this.selectorFormModel();
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : null;
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({ ...current, disparo });
    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;
    this.#setSelection(serie, disparo);
  }

  // Contrato BaseFormWidgetComponent (invocado por WidgetStateService.saveAllDirtyForms)
  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.update<Widget>Selector({ serie, disparo });

    if (fireTrialId && serie && disparo) {
      const identUpdates = this.identTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().identificacion;
      const pesosUpdates = this.pesosTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().pesos;
      const acondUpdates = this.acondTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().acondicionamiento;

      const componentId =
        identUpdates.componente ??
        pesosUpdates.componente ??
        acondUpdates.componente ??
        this.#store.<widgetCamelName>().componenteOptions[0]?.value ??
        'granada-01';

      const payload = map<Widget>StateToRequest({
        componentId,
        identificacion: identUpdates,
        pesos: pesosUpdates,
        acondicionamiento: acondUpdates,
      });

      try {
        await this.#executionService.update<Resource>(fireTrialId, serie, disparo, payload);
        this.identTab()?.save();
        this.pesosTab()?.save();
        this.acondTab()?.save();
      } catch (error) {
        console.error('Failed to save <widget name>', error);
        throw error;
      }
    } else {
      this.identTab()?.save();
      this.pesosTab()?.save();
      this.acondTab()?.save();
    }
  }

  resetForm(): void {
    const stored = this.#store.<widgetCamelName>();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.identTab()?.reset();
    this.pesosTab()?.reset();
    this.acondTab()?.reset();
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) return;

    try {
      const response = await this.#executionService.fetch<Resource>(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) return;
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) return;
      this.#applyRemoteShotData({ munitionData: [] });
    }
  }

  #applyRemoteShotData(response: <Resource>Response): void {
    const mapped = mapRemoteTo<Widget>State(response);
    if (mapped.identificacion && Object.keys(mapped.identificacion).length > 0) {
      this.#store.update<Widget>Identification(mapped.identificacion);
      this.identTab()?.applyData(mapped.identificacion);
    }
    if (mapped.pesos && Object.keys(mapped.pesos).length > 0) {
      this.#store.update<Widget>Pesos(mapped.pesos);
      this.pesosTab()?.applyData(mapped.pesos);
    }
    if (mapped.acondicionamiento && Object.keys(mapped.acondicionamiento).length > 0) {
      this.#store.update<Widget>Acondicionamiento(mapped.acondicionamiento);
      this.acondTab()?.applyData(mapped.acondicionamiento);
    }
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.update<Widget>Selector({ serie, disparo });
  }

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) return false;
    return (
      this.#store.executionProgress()
        ?.series.some((s) => s.seriesId === serie && s.shots.some((shot) => shot.shotId === disparo))
      ?? false
    );
  }
}
```

---

## 3. Contrato de las Tabs Hijas

Cada tab presentacional implementa el contrato:
`{ isDirty, isValid, getFormUpdates(), applyData(), save(), reset() }`

```typescript
@Component({
  selector: 'inta-<widget-ident-tab>',
  imports: [FormField, MatFormFieldModule, MatSelectModule, MatInputModule, TranslateModule],
  template: `<!-- campos del tab -->`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Widget>IdentTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly identFormModel = signal<FormModel>({
    componente: this.#store.<widgetCamelName>().identificacion.componente,
    denominacion: this.#store.<widgetCamelName>().identificacion.denominacion,
    lote: this.#store.<widgetCamelName>().identificacion.lote,
    modoFuncionamiento: this.#store.<widgetCamelName>().identificacion.modoFuncionamiento,
  });
  readonly identForm = form(this.identFormModel);

  readonly observacionesField = signal<string | null>(
    this.#store.<widgetCamelName>().identificacion.observaciones,
  );

  readonly #dirtyTracker = createDirtyTracker(() => ({
    componente: this.identFormModel().componente,
    denominacion: this.identFormModel().denominacion,
    lote: this.identFormModel().lote,
    modoFuncionamiento: this.identFormModel().modoFuncionamiento,
    observaciones: this.observacionesField(),
  }));

  readonly isDirty = this.#dirtyTracker.isDirty;
  readonly isValid = computed(() => this.identForm().valid());

  // Cascadas reactivas con untracked()
  constructor() {
    effect(() => {
      const opts = this.filteredDenominacionOptions();
      const current = this.identFormModel().denominacion;
      if (current && !opts.some((d) => d.value === current)) {
        untracked(() =>
          this.identFormModel.update((m) => ({ ...m, denominacion: null, lote: null })),
        );
      }
    });
  }

  getFormUpdates(): Partial<<Widget>IdentificationState> {
    const { componente, denominacion, lote, modoFuncionamiento } = this.identFormModel();
    return {
      componente, denominacion, lote, modoFuncionamiento,
      observaciones: this.observacionesField(),
    };
  }

  applyData(data: Partial<<Widget>IdentificationState>): void {
    this.identFormModel.update((m) => ({
      ...m,
      componente: data.componente !== undefined ? data.componente : m.componente,
      denominacion: data.denominacion !== undefined ? data.denominacion : m.denominacion,
      lote: data.lote !== undefined ? data.lote : m.lote,
      modoFuncionamiento: data.modoFuncionamiento !== undefined ? data.modoFuncionamiento : m.modoFuncionamiento,
    }));
    if (data.observaciones !== undefined) this.observacionesField.set(data.observaciones);
    this.#dirtyTracker.syncSnapshot(); // Form queda limpio
  }

  save(): void {
    const updates = this.getFormUpdates();
    this.#store.update<Widget>Identification(updates);
    this.#dirtyTracker.syncSnapshot();
  }

  reset(): void {
    const stored = this.#store.<widgetCamelName>().identificacion;
    this.identFormModel.set({
      componente: stored.componente,
      denominacion: stored.denominacion,
      lote: stored.lote,
      modoFuncionamiento: stored.modoFuncionamiento,
    });
    this.observacionesField.set(stored.observaciones);
    this.#dirtyTracker.syncSnapshot();
  }
}
```
