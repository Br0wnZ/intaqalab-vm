import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoLeadingZerosDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { TopographyIntroductionState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotTopographyResponse } from '../../models/shot-topography.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { mapSelectedShotStatus, resolveInitialShotSelection } from '../utils/selection-options';
import { ShotEditButton } from '../utils/shot-edit-button';
import { injectShotFormLock } from '../utils/shot-form-lock';
import {
  type InputFieldValue,
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  mapRemoteToTopographyState,
  mapShotStatusToClass,
  mapShotStatusToLabel,
  mapTopographyStateToRequest,
  numToField,
  parseNum,
} from './topography-introduction.mapper';

interface TopographyFormModel {
  serie: string | null;
  disparo: string | null;
  equipo: string | null;
}

@Component({
  selector: 'inta-topography-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    ShotEditButton,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
    LocaleDecimalInputDirective,
    NoLeadingZerosDirective,
    NoNegativeValuesDirective,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2 overflow-auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <inta-shot-edit-button [lock]="shotLock" />

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Fields ───────────────────────────────────────────────────────── -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 min-h-0 items-end"
        [intaReadonlyContent]="shotLock.readOnly()"
      >
        <!-- Row 1 -->

        <!-- Equipo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipo"
          >
            @for (opt of equipoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Tiempo vuelo -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.TIEMPO_VUELO_LABEL' | translate"
          [opciones]="sOptions"
          [value]="tiempoVueloField()"
          (valueChange)="tiempoVueloField.set($event)"
        />

        <!-- Tiempo iluminación -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.TIEMPO_ILUMINACION_LABEL' | translate"
          [opciones]="sOptions"
          [value]="tiempoIluminacionField()"
          (valueChange)="tiempoIluminacionField.set($event)"
        />

        <!-- Observaciones (row-span-2) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="3"
            class="!resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="onObservacionesInput($event)"
          ></textarea>
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Nº estelas de humo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.NUM_ESTELAS_LABEL' | translate }}</mat-label>
          <input
            matInput
            type="number"
            libNoNegativeValues
            libNoLeadingZeros
            libLocalDecimal
            [decimals]="0"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.NUM_ESTELAS_PLACEHOLDER' | translate"
            [value]="numeroEstelaHumoField() ?? ''"
            (input)="onNumeroEstelaHumoInput($event)"
          />
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopographyIntroductionWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #executionService = inject(ExecutionService);
  readonly #trialShots = injectTrialShots();
  readonly #chronometerOptions = signal<Array<{ value: string; label: string }>>([]);

  readonly #selectionKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  protected readonly sOptions = [{ value: 's', label: 's' }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly equipoOptions = computed(() => {
    const labels = new Map(this.#chronometerOptions().map((option) => [option.value, option.label]));
    const selections = this.#store.equipmentSelectorRemote() ?? [];
    const options = new Map<string, { value: string; label: string }>();

    for (const group of selections) {
      for (const selection of group.selections) {
        if (selection.categoryId !== EquipmentTypeEnum.CHRONOMETER) continue;
        const id = selection.equipmentItemId ?? selection.equipmentDenominationId;
        if (id === undefined || id === null) continue;
        const value = String(id);
        options.set(value, { value, label: labels.get(value) ?? value });
      }
    }

    return [...options.values()];
  });
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#trialShots.series() ?? this.#store.planningSeries(),
      this.#store.topographyIntroduction().serieOptions,
    ),
  );
  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.formModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
      storedOptions: this.#store.topographyIntroduction().disparoOptions,
    }),
  );

  // ── Select form (Signal Forms for dirty tracking) ─────────────────────────
  protected readonly formModel = signal<TopographyFormModel>({
    serie: this.#store.topographyIntroduction().serie,
    disparo: this.#store.topographyIntroduction().disparo,
    equipo: this.#store.topographyIntroduction().equipo,
  });
  protected readonly selectForm = form(this.formModel);
  protected readonly shotLock = injectShotFormLock(() => ({
    serie: this.formModel().serie,
    disparo: this.formModel().disparo,
  }));

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly tiempoVueloField = signal<InputFieldValue>(
    numToField(this.#store.topographyIntroduction().tiempoVuelo, this.#store.topographyIntroduction().tiempoVueloUnit),
  );
  protected readonly tiempoIluminacionField = signal<InputFieldValue>(
    numToField(
      this.#store.topographyIntroduction().tiempoIluminacion,
      this.#store.topographyIntroduction().tiempoIluminacionUnit,
    ),
  );
  protected readonly numeroEstelaHumoField = signal<number | null>(
    this.#store.topographyIntroduction().numeroEstelaHumo,
  );
  protected readonly observacionesField = signal<string | null>(this.#store.topographyIntroduction().observaciones);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    tiempoVuelo: this.tiempoVueloField(),
    tiempoIluminacion: this.tiempoIluminacionField(),
    numeroEstelaHumo: this.numeroEstelaHumoField(),
    observaciones: this.observacionesField(),
  });

  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.tiempoVueloField()) !== JSON.stringify(snap.tiempoVuelo) ||
      JSON.stringify(this.tiempoIluminacionField()) !== JSON.stringify(snap.tiempoIluminacion) ||
      this.numeroEstelaHumoField() !== snap.numeroEstelaHumo ||
      this.observacionesField() !== snap.observaciones
    );
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoDisparo = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.formModel().serie,
      this.formModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.topographyIntroduction().estadoDisparo,
    ),
  );

  protected readonly estadoLabel = computed(() => mapShotStatusToLabel(this.estadoDisparo()));

  protected readonly estadoClass = computed(() => mapShotStatusToClass(this.estadoDisparo()));

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    this.#executionService.loadEquipmentItemsByCategories([EquipmentTypeEnum.CHRONOMETER]).then((itemsByCategory) => {
      const items = itemsByCategory[EquipmentTypeEnum.CHRONOMETER] ?? [];
      this.#chronometerOptions.set(items.map((item) => ({ value: item.id, label: item.label })));
    });

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions() ?? [],
        activeSerieId: this.#store.activeSerieId(),
        activeShotId: this.#store.activeShotId(),
        getShotOptions: (serieId) =>
          buildDisparoOptions({
            selectedSerie: serieId,
            executionProgress: this.#store.executionProgress(),
            planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
            storedOptions: this.#store.topographyIntroduction().disparoOptions,
          }),
      });
      const { serie: activeSerieId, disparo: activeShotId } = selection;

      if (!fireTrialId || !activeSerieId || !activeShotId) {
        return;
      }

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) {
        return;
      }

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    this.formModel.update((m) => ({ ...m, serie }));
    this.#setSelection(serie, this.disparoOptions()?.[0]?.value ?? null);
  }

  onDisparoSelected(disparo: string | null): void {
    this.formModel.update((m) => ({ ...m, disparo }));
    this.#store.updateTopographyIntroduction({ disparo });
    void this.#loadSelectedShotData();
  }

  onObservacionesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.observacionesField.set(input?.value || null);
  }

  onNumeroEstelaHumoInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.numeroEstelaHumoField.set(input?.value ? Number(input.value) : null);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.formModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));
    this.#store.updateTopographyIntroduction({ serie, disparo });
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    try {
      const response = await this.#executionService.fetchShotTopography(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
    }
  }

  #applyRemoteShotData(response: ShotTopographyResponse): void {
    const remote = mapRemoteToTopographyState(response);
    if (Object.keys(remote).length === 0) return;

    this.#store.updateTopographyIntroduction(remote);

    if (remote.equipo !== undefined) {
      this.formModel.update((m) => ({ ...m, equipo: remote.equipo ?? null }));
    }
    if (remote.tiempoVuelo !== undefined) {
      this.tiempoVueloField.set(numToField(remote.tiempoVuelo, remote.tiempoVueloUnit ?? 's'));
    }
    if (remote.tiempoIluminacion !== undefined) {
      this.tiempoIluminacionField.set(numToField(remote.tiempoIluminacion, remote.tiempoIluminacionUnit ?? 's'));
    }
    if (remote.numeroEstelaHumo !== undefined) {
      this.numeroEstelaHumoField.set(remote.numeroEstelaHumo ?? null);
    }
    if (remote.observaciones !== undefined) {
      this.observacionesField.set(remote.observaciones ?? null);
    }
    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.formModel().serie;
    const disparo = activeShotId() ?? this.formModel().disparo;
    this.#setSelection(serie, disparo);
  }

  resetForm(): void {
    const stored = this.#store.topographyIntroduction();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      equipo: stored.equipo,
    });
    this.tiempoVueloField.set(numToField(stored.tiempoVuelo, stored.tiempoVueloUnit));
    this.tiempoIluminacionField.set(numToField(stored.tiempoIluminacion, stored.tiempoIluminacionUnit));
    this.numeroEstelaHumoField.set(stored.numeroEstelaHumo);
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
    this.shotLock.lock();
  }

  async saveForm(): Promise<void> {
    if (this.shotLock.readOnly()) {
      return;
    }
    const { serie, disparo, equipo } = this.formModel();
    const tiempoVuelo = parseNum(this.tiempoVueloField());
    const tiempoIluminacion = parseNum(this.tiempoIluminacionField());
    const numeroEstelaHumo = this.numeroEstelaHumoField();
    const observaciones = this.observacionesField();

    const updates: Partial<TopographyIntroductionState> = {
      serie,
      disparo,
      equipo,
      tiempoVuelo,
      tiempoVueloUnit: this.tiempoVueloField()?.unit ?? 's',
      tiempoIluminacion,
      tiempoIluminacionUnit: this.tiempoIluminacionField()?.unit ?? 's',
      numeroEstelaHumo,
      observaciones,
    };
    this.#store.updateTopographyIntroduction(updates);

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      const payload = mapTopographyStateToRequest(updates);
      await this.#executionService.updateShotTopography(fireTrialId, serie, disparo, payload);
    }

    this.#syncSnapshot();
    this.shotLock.lock();
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      tiempoVuelo: this.tiempoVueloField(),
      tiempoIluminacion: this.tiempoIluminacionField(),
      numeroEstelaHumo: this.numeroEstelaHumoField(),
      observaciones: this.observacionesField(),
    });
  }
}
