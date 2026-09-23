import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, StopClick } from '@intaqalab/ui';
import { deepEqual } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore, type MunitionIntroWeightState } from '../../../../+state/execution.store';
import type { InputFieldValue } from '../munition-introduction';
import { resolveBalanceKey } from '../munition-introduction.mapper';

export interface WeightFormModel {
  componente: string | null;
  balance: string | null;
}

interface BalanceFields {
  weight: number | null;
  weightAdded: number | null;
  weightRemoved: number | null;
  observations: string | null;
  weighingDateTime: string | null;
}

@Component({
  selector: 'inta-munition-pesos-tab',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
    StopClick,
  ],
  template: `
    <div class="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-x-2 gap-y-1 min-h-0 content-start">
      <!-- Componente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
          [formField]="weightForm.componente"
          (selectionChange)="onComponentChange($event.value)"
        >
          @for (opt of componenteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Balance (Equipo) -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
          [formField]="weightForm.balance"
          (selectionChange)="onBalanceChange($event.value)"
        >
          @for (opt of balanceOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
        <button uiStopClick mat-icon-button matSuffix type="button" class="flex items-center justify-center">
          <ui-inta-icon name="settings" color="var(--inta-button)" class="!h-full !w-full scale-80" />
        </button>
      </mat-form-field>

      <!-- Weight -->
      @if (!isPolvo()) {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_PLACEHOLDER' | translate"
          [value]="weightField()"
          (valueChange)="weightField.set($event)"
        />
      } @else {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_ANADIDO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_ANADIDO_PLACEHOLDER' | translate"
          [value]="weightAddedField()"
          (valueChange)="weightAddedField.set($event)"
        />
      }

      <!-- Observations -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
        <textarea
          matInput
          rows="4"
          class="resize-none"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
          [value]="observationsField() ?? ''"
          (input)="observationsField.set($any($event.target).value || null)"
        ></textarea>
      </mat-form-field>

      <!-- Row 2 -->

      <!-- Weighing date-time -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_LABEL' | translate }}</mat-label>
        <input
          matInput
          [value]="weighingDateTimeField() ?? ''"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_BTN' | translate"
          (input)="weighingDateTimeField.set($any($event.target).value || null)"
        />
        <button mat-icon-button matSuffix type="button" (click)="captureWeighingDateTime()">
          <mat-icon class="!text-[16px] text-slate-400">schedule</mat-icon>
        </button>
      </mat-form-field>

      <!-- Weighing range (read-only, from API) -->
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.RANGO_PESADA_LABEL' | translate }}
        </span>
        <div class="flex h-[44px] rounded-lg border border-slate-200 overflow-hidden">
          <div class="flex-1 flex items-center px-3 bg-white">
            <span class="text-sm font-semibold text-green-600 tabular-nums">
              {{ weighingRangeValue() ?? '—' }}
            </span>
          </div>
          <div
            class="flex items-center gap-0.5 px-2 border-l border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 min-h-[44px] justify-center"
          >
            {{ weighingRangeUnit() ?? '—' }}
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <!-- Weight removed (powder only) -->
      @if (isPolvo()) {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_RETIRADO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_RETIRADO_PLACEHOLDER' | translate"
          [value]="weightRemovedField()"
          (valueChange)="weightRemovedField.set($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionPesosTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly componentChange = output<string>();

  readonly weightFormModel = signal<WeightFormModel>({
    componente: this.#store.munitionIntroduction().weight.componente,
    balance: this.#store.munitionIntroduction().weight.balance,
  });
  readonly weightForm = form(this.weightFormModel);

  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  readonly weightField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().weight.weight, 'g'),
  );
  readonly weightAddedField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().weight.weightAdded, 'g'),
  );
  readonly weightRemovedField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().weight.weightRemoved, 'g'),
  );

  readonly observationsField = signal<string | null>(this.#store.munitionIntroduction().weight.observations);
  readonly weighingDateTimeField = signal<string | null>(this.#store.munitionIntroduction().weight.weighingDateTime);

  // ── Active balance tracking (decoupled from immediate formField model update) ──
  readonly #activeBalanceKey = signal<string | null>(this.#store.munitionIntroduction().weight.balance);

  // ── Pristine baseline tracking for all balances of the active component ─────
  readonly #pristineBalances = signal<Record<string, BalanceFields>>({});

  #extractBalanceFields(entry: Partial<MunitionIntroWeightState> | null | undefined): BalanceFields {
    return {
      weight: entry?.weight ?? null,
      weightAdded: entry?.weightAdded ?? null,
      weightRemoved: entry?.weightRemoved ?? null,
      observations: entry?.observations ?? null,
      weighingDateTime: entry?.weighingDateTime ? entry.weighingDateTime.substring(0, 16) : null,
    };
  }

  #syncPristineSnapshot(): void {
    const map = this.#store.munitionIntroduction().weightDataByBalance;
    const snapshot: Record<string, BalanceFields> = {};
    for (const [key, entry] of Object.entries(map)) {
      snapshot[key] = this.#extractBalanceFields(entry);
    }
    const activeKey = this.#activeBalanceKey() ?? this.weightFormModel().balance;
    if (activeKey && !snapshot[activeKey]) {
      snapshot[activeKey] = this.#extractBalanceFields(this.#buildCurrentWeightState(activeKey));
    }
    this.#pristineBalances.set(snapshot);
  }

  // ── Dirty tracking: checks whether any balance differs from pristine server baseline ─────
  // Selecting a balance is a selector and does NOT mark the form dirty.
  readonly isDirty = computed(() => {
    const pristine = this.#pristineBalances();
    const activeKey = this.#activeBalanceKey() ?? this.weightFormModel().balance;
    const storeMap = this.#store.munitionIntroduction().weightDataByBalance;

    const allKeys = new Set([...Object.keys(pristine), ...Object.keys(storeMap)]);
    if (activeKey) allKeys.add(activeKey);

    for (const key of allKeys) {
      const pristineForBalance = pristine[key] ?? {
        weight: null,
        weightAdded: null,
        weightRemoved: null,
        observations: null,
        weighingDateTime: null,
      };

      const currentForBalance: BalanceFields =
        key === activeKey
          ? {
              weight: this.#parseNum(this.weightField()),
              weightAdded: this.#parseNum(this.weightAddedField()),
              weightRemoved: this.#parseNum(this.weightRemovedField()),
              observations: this.observationsField(),
              weighingDateTime: this.weighingDateTimeField(),
            }
          : this.#extractBalanceFields(storeMap[key]);

      if (!deepEqual(currentForBalance, pristineForBalance)) {
        return true;
      }
    }

    return false;
  });

  readonly isValid = computed(() => this.weightForm().valid());

  readonly gramosOptions = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
  ];

  readonly componenteOptions = computed(() => this.#store.munitionIntroduction().componenteOptions);

  /**
   * Balanzas disponibles para el componente activo.
   * Filtra según los datos recibidos del backend en remoteMunitionResponse para este componente.
   */
  readonly balanceOptions = computed(() => {
    const catalog = this.#store.munitionIntroduction().balanzaOptions;
    const remote = this.#store.munitionIntroduction().remoteMunitionResponse;
    const selectedComponentId =
      this.weightFormModel().componente ?? this.#store.munitionIntroduction().selectedComponentId;

    const comp = remote?.munitionData?.find((c) => c.componentId === selectedComponentId);
    if (comp?.weightData && comp.weightData.length > 0) {
      return comp.weightData.map((entry) => {
        const key = resolveBalanceKey(entry.balanceId) ?? String(entry.balanceId);
        const fromCatalog = catalog.find((b) => b.value === key);
        if (fromCatalog) return fromCatalog;
        return {
          value: key,
          label: entry.weighingRange ? `Balanza (${entry.weighingRange})` : `Balanza ${key}`,
          rangoMin: undefined,
          rangoMax: undefined,
          unit: entry.weightUnit?.toLowerCase() ?? 'g',
        };
      });
    }

    const inMemoryKeys = Object.keys(this.#store.munitionIntroduction().weightDataByBalance);
    if (inMemoryKeys.length > 0) {
      return inMemoryKeys.map((key) => {
        const fromCatalog = catalog.find((b) => b.value === key);
        if (fromCatalog) return fromCatalog;
        return { value: key, label: `Balanza ${key}`, unit: 'g' };
      });
    }

    return catalog;
  });

  readonly isPolvo = computed(() => {
    const componente = this.weightFormModel().componente;
    return this.componenteOptions().find((c) => c.value === componente)?.category === 'polvo';
  });

  readonly weighingRangeValue = computed(() => {
    const balanceKey = this.weightFormModel().balance;
    const stored = balanceKey ? this.#store.munitionIntroduction().weightDataByBalance[balanceKey] : null;
    if (stored?.weighingRange) return stored.weighingRange;
    const activeWeight = this.#store.munitionIntroduction().weight;
    if (activeWeight.weighingRange && activeWeight.balance === balanceKey) return activeWeight.weighingRange;
    // Fallback: derive from balance option range
    const opt = this.balanceOptions().find((b) => b.value === balanceKey);
    if (!opt || opt.rangoMin === undefined || opt.rangoMax === undefined) return null;
    return `${opt.rangoMin} - ${opt.rangoMax}`;
  });

  readonly weighingRangeUnit = computed(() => {
    const balanceKey = this.weightFormModel().balance;
    return this.balanceOptions().find((b) => b.value === balanceKey)?.unit ?? null;
  });

  constructor() {
    this.#syncPristineSnapshot();
  }

  readonly balanceChange = output<string>();

  /**
   * Called when the user selects a different balance.
   * Persists current form data into the store for the previous balance,
   * then loads the persisted data for the newly selected balance.
   * Selecting a balance does NOT mark the form as dirty or touched.
   */
  onBalanceChange(newBalanceKey: string | null): void {
    if (!newBalanceKey) return;

    const prevBalance =
      this.#activeBalanceKey() && this.#activeBalanceKey() !== newBalanceKey
        ? this.#activeBalanceKey()
        : this.weightFormModel().balance !== newBalanceKey
          ? this.weightFormModel().balance
          : this.#activeBalanceKey();

    // 1. Persist current edits for the old balance before switching
    if (prevBalance && prevBalance !== newBalanceKey) {
      this.#store.updateMunitionIntroductionWeightByBalance(prevBalance, this.#buildCurrentWeightState(prevBalance));
    }

    // 2. Track new active balance
    this.#activeBalanceKey.set(newBalanceKey);
    this.weightFormModel.update((m) => ({ ...m, balance: newBalanceKey }));

    // 3. Switch active balance in the store (loads persisted or empty data)
    this.#store.setActiveMunitionBalance(newBalanceKey);

    // 4. Apply the stored data for the new balance to local fields
    const stored =
      this.#store.munitionIntroduction().weightDataByBalance[newBalanceKey] ??
      this.#store.munitionIntroduction().weight;
    this.#applyWeightState(stored);

    // 5. Notify parent so it can keep touched state clean
    this.balanceChange.emit(newBalanceKey);
  }

  onComponentChange(componente: string | null): void {
    if (componente) {
      this.componentChange.emit(componente);
    }
  }

  captureWeighingDateTime(): void {
    this.weighingDateTimeField.set(new Date().toISOString().substring(0, 16));
  }

  getFormUpdates(): Partial<MunitionIntroWeightState> {
    const activeBalance = this.#activeBalanceKey() ?? this.weightFormModel().balance;
    return this.#buildCurrentWeightState(activeBalance);
  }

  applyData(data: Partial<MunitionIntroWeightState>): void {
    this.#applyWeightState(data);
    this.#activeBalanceKey.set(data.balance ?? null);
    this.#syncPristineSnapshot();
  }

  save(): void {
    const activeBalance = this.#activeBalanceKey() ?? this.weightFormModel().balance;
    const weightUpdates = this.#buildCurrentWeightState(activeBalance);
    if (activeBalance) {
      this.#store.updateMunitionIntroductionWeightByBalance(activeBalance, weightUpdates);
    }
    this.#store.updateMunitionIntroductionWeight(weightUpdates);
    this.#syncPristineSnapshot();
  }

  reset(): void {
    const stored = this.#store.munitionIntroduction().weight;
    this.#applyWeightState(stored);
    this.#activeBalanceKey.set(stored.balance ?? null);
    this.#syncPristineSnapshot();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #buildCurrentWeightState(balanceKey: string | null): Partial<MunitionIntroWeightState> {
    const { componente } = this.weightFormModel();
    const existing = balanceKey ? this.#store.munitionIntroduction().weightDataByBalance[balanceKey] : null;
    return {
      componente,
      balance: balanceKey,
      weight: this.#parseNum(this.weightField()),
      weightAdded: this.#parseNum(this.weightAddedField()),
      weightRemoved: this.#parseNum(this.weightRemovedField()),
      weighingDateTime: this.weighingDateTimeField(),
      weighingRange: existing?.weighingRange ?? null,
      observations: this.observationsField(),
    };
  }

  #applyWeightState(data: Partial<MunitionIntroWeightState>): void {
    this.weightFormModel.update((m) => ({
      ...m,
      componente: data.componente !== undefined ? data.componente : m.componente,
      balance: data.balance !== undefined ? data.balance : m.balance,
    }));
    this.weightField.set(data.weight !== undefined && data.weight !== null ? this.#numToField(data.weight, 'g') : null);
    this.weightAddedField.set(
      data.weightAdded !== undefined && data.weightAdded !== null ? this.#numToField(data.weightAdded, 'g') : null,
    );
    this.weightRemovedField.set(
      data.weightRemoved !== undefined && data.weightRemoved !== null
        ? this.#numToField(data.weightRemoved, 'g')
        : null,
    );
    this.observationsField.set(data.observations ?? null);
    this.weighingDateTimeField.set(data.weighingDateTime ? data.weighingDateTime.substring(0, 16) : null);
  }
}
