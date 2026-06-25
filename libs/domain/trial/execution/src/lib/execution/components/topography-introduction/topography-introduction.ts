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

import type { TopographyIntroductionState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type InputFieldValue = { value: string; unit: string } | null;

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
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent
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
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button
          mat-flat-button
          type="button"
          (click)="setCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Fields ───────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 min-h-0 items-end">
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
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Nº estelas de humo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.NUM_ESTELAS_LABEL' | translate }}</mat-label>
          <input
            matInput
            type="number"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.NUM_ESTELAS_PLACEHOLDER' | translate"
            [value]="numeroEstelaHumoField() ?? ''"
            (input)="numeroEstelaHumoField.set(+$any($event.target).value || null)"
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

  protected readonly sOptions = [{ value: 's', label: 's' }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly equipoOptions = computed(() => this.#store.topographyIntroduction().equipoOptions);
  protected readonly serieOptions = computed(() => this.#store.topographyIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.topographyIntroduction().disparoOptions);

  // ── Select form (Signal Forms for dirty tracking) ─────────────────────────
  protected readonly formModel = signal<TopographyFormModel>({
    serie: this.#store.topographyIntroduction().serie,
    disparo: this.#store.topographyIntroduction().disparo,
    equipo: this.#store.topographyIntroduction().equipo,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly tiempoVueloField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.topographyIntroduction().tiempoVuelo,
      this.#store.topographyIntroduction().tiempoVueloUnit,
    ),
  );
  protected readonly tiempoIluminacionField = signal<InputFieldValue>(
    this.#numToField(
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
  protected readonly estadoLabel = computed(() => {
    const estado = this.#store.topographyIntroduction().estadoDisparo;
    if (estado === 'EN_CURSO') return 'En curso';
    if (estado === 'PENDIENTE') return 'Pendiente';
    if (estado === 'EJECUTADA') return 'Ejecutada';
    return '—';
  });

  protected readonly estadoClass = computed(() => {
    const estado = this.#store.topographyIntroduction().estadoDisparo;
    if (estado === 'EN_CURSO') return 'bg-green-100 text-green-700';
    if (estado === 'PENDIENTE') return 'bg-yellow-100 text-yellow-700';
    if (estado === 'EJECUTADA') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    this.formModel.update((m) => ({
      ...m,
      serie: activeSerieId() ?? m.serie,
      disparo: activeShotId() ?? m.disparo,
    }));
  }

  resetForm(): void {
    const stored = this.#store.topographyIntroduction();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      equipo: stored.equipo,
    });
    this.tiempoVueloField.set(this.#numToField(stored.tiempoVuelo, stored.tiempoVueloUnit));
    this.tiempoIluminacionField.set(this.#numToField(stored.tiempoIluminacion, stored.tiempoIluminacionUnit));
    this.numeroEstelaHumoField.set(stored.numeroEstelaHumo);
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, equipo } = this.formModel();
    const updates: Partial<TopographyIntroductionState> = {
      serie,
      disparo,
      equipo,
      tiempoVuelo: this.#parseNum(this.tiempoVueloField()),
      tiempoVueloUnit: this.tiempoVueloField()?.unit ?? 's',
      tiempoIluminacion: this.#parseNum(this.tiempoIluminacionField()),
      tiempoIluminacionUnit: this.tiempoIluminacionField()?.unit ?? 's',
      numeroEstelaHumo: this.numeroEstelaHumoField(),
      observaciones: this.observacionesField(),
    };
    this.#store.updateTopographyIntroduction(updates);
    this.#syncSnapshot();
  }

  #numToField(num: number | null, unit: string): InputFieldValue {
    if (num === null) return null;
    return { value: num.toString(), unit };
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const parsed = Number(field.value);
    return isNaN(parsed) ? null : parsed;
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
