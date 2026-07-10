import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type InputFieldValue = { value: string; unit: string } | null;

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

interface DataFormModel {
  radarDoppler: string | null;
  antena: string | null;
}

@Component({
  selector: 'inta-velocity-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto justify-between">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.SERIE_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.serie">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.DISPARO_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.disparo">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 min-h-0 items-end">
        <!-- Row 1 -->

        <!-- Radar Doppler -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.RADAR_DOPPLER_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.RADAR_DOPPLER_PLACEHOLDER' | translate"
            [formField]="dataForm.radarDoppler"
          >
            @for (opt of radarDopplerOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Antena -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.ANTENA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.ANTENA_PLACEHOLDER' | translate"
            [formField]="dataForm.antena"
          >
            @for (opt of antenaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.VELOCIDAD_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.VELOCIDAD_PLACEHOLDER' | translate"
          [value]="velocidadField()"
          (valueChange)="velocidadField.set($event)"
        />

        <!-- Observaciones (spans 2 rows) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Incert. Software (read-only, procede del tarado) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.INCERT_SOFTWARE_LABEL' | translate }}</mat-label>
          <input
            matInput
            readonly
            class="tabular-nums italic text-slate-400"
            [value]="incertidumbreSoftwareDisplay()"
          />
          <span matSuffix class="pr-4 text-sm text-gray-700">m/s</span>
        </mat-form-field>

        <!-- Pérdida -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.PERDIDA_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.PERDIDA_PLACEHOLDER' | translate"
          [value]="perdidaField()"
          (valueChange)="perdidaField.set($event)"
        />

        <!-- Cadencia -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CADENCIA_LABEL' | translate"
          [opciones]="dpmOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CADENCIA_PLACEHOLDER' | translate"
          [value]="cadenciaField()"
          (valueChange)="cadenciaField.set($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VelocityIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];
  protected readonly dpmOptions = [{ value: 'dpm', label: 'dpm' }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.velocityIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.velocityIntroduction().disparoOptions);
  protected readonly radarDopplerOptions = computed(() => this.#store.velocityIntroduction().radarDopplerOptions);
  protected readonly antenaOptions = computed(() => this.#store.velocityIntroduction().antenaOptions);

  // ── Read-only: incertidumbre del software (pendiente del tarado) ───────────
  protected readonly incertidumbreSoftwareDisplay = computed(() => {
    const stored = this.#store.velocityIntroduction().incertidumbreSoftware;
    if (stored !== null) return stored.toString();
    const pendiente = this.#store.taradoVelocidadChart().regression?.pendiente ?? null;
    return pendiente !== null ? pendiente.toString() : '—';
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.velocityIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'En curso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EJECUTADA':
        return 'Ejecutada';
      default:
        return '—';
    }
  });

  protected readonly estadoClass = computed(() => {
    switch (this.#store.velocityIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-700';
      case 'EJECUTADA':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

  // ── Form models ────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.velocityIntroduction().serie,
    disparo: this.#store.velocityIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  protected readonly dataFormModel = signal<DataFormModel>({
    radarDoppler: this.#store.velocityIntroduction().radarDoppler,
    antena: this.#store.velocityIntroduction().antena,
  });
  protected readonly dataForm = form(this.dataFormModel);

  // ── Plain signals ──────────────────────────────────────────────────────────
  protected readonly velocidadField = signal<InputFieldValue>(
    this.#numToField(this.#store.velocityIntroduction().velocidad, 'm/s'),
  );
  protected readonly perdidaField = signal<InputFieldValue>(
    this.#numToField(this.#store.velocityIntroduction().perdida, 'm/s'),
  );
  protected readonly cadenciaField = signal<InputFieldValue>(
    this.#numToField(this.#store.velocityIntroduction().cadencia, 'dpm'),
  );
  protected readonly observacionesField = signal<string | null>(this.#store.velocityIntroduction().observaciones);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    velocidad: this.velocidadField(),
    perdida: this.perdidaField(),
    cadencia: this.cadenciaField(),
    observaciones: this.observacionesField(),
  });

  protected readonly isDirty = computed(() => {
    if (this.selectorForm().dirty() || this.dataForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.velocidadField()) !== JSON.stringify(snap.velocidad) ||
      JSON.stringify(this.perdidaField()) !== JSON.stringify(snap.perdida) ||
      JSON.stringify(this.cadenciaField()) !== JSON.stringify(snap.cadencia) ||
      this.observacionesField() !== snap.observaciones
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectorForm().valid() && this.dataForm().valid(),
    hasChanges: this.isDirty(),
  }));

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  resetForm(): void {
    const stored = this.#store.velocityIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.dataFormModel.set({ radarDoppler: stored.radarDoppler, antena: stored.antena });
    this.velocidadField.set(this.#numToField(stored.velocidad, 'm/s'));
    this.perdidaField.set(this.#numToField(stored.perdida, 'm/s'));
    this.cadenciaField.set(this.#numToField(stored.cadencia, 'dpm'));
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const { radarDoppler, antena } = this.dataFormModel();
    this.#store.updateVelocityIntroduction({
      serie,
      disparo,
      radarDoppler,
      antena,
      velocidad: this.#parseNum(this.velocidadField()),
      velocidadUnit: this.velocidadField()?.unit ?? 'm/s',
      perdida: this.#parseNum(this.perdidaField()),
      perdidaUnit: this.perdidaField()?.unit ?? 'm/s',
      cadencia: this.#parseNum(this.cadenciaField()),
      cadenciaUnit: this.cadenciaField()?.unit ?? 'dpm',
      observaciones: this.observacionesField(),
    });
    this.#syncSnapshot();
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      velocidad: this.velocidadField(),
      perdida: this.perdidaField(),
      cadencia: this.cadenciaField(),
      observaciones: this.observacionesField(),
    });
  }
}
