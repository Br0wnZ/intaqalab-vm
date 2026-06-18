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

import type { JltShotDataState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type InputFieldValue = { value: string; unit: string } | null;

interface JltShotDataSelectForm {
  serie: string | null;
  disparo: string | null;
  equipoAtacado: string | null;
  equipoRetroceso: string | null;
}

@Component({
  selector: 'inta-jlt-shot-data',
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
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center shrink-0">
            <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          </div>
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
            {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.SERIE_PLACEHOLDER' | translate"
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
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- Fields grid: 4 cols, 2 rows (last col = Observaciones spanning 2 rows) -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-1 min-h-0 content-start">
        <!-- ── Row 1 ──────────────────────────────────────────────── -->

        <!-- JET -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_LABEL' | translate }}</mat-label>
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_PLACEHOLDER' | translate"
            [value]="jetField() ?? ''"
            (input)="jetField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- Equipo Atacado -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_ATACADO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_ATACADO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoAtacado"
          >
            @for (opt of equipoAtacadoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Atacado (numérico + unidad) -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_LABEL' | translate"
          [opciones]="mmOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_PLACEHOLDER' | translate"
          [value]="atacadoField()"
          (valueChange)="atacadoField.set($event)"
        />

        <!-- Observaciones (spans 2 rows) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- ── Row 2 ──────────────────────────────────────────────── -->

        <!-- Operador de la pieza -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_LABEL' | translate }}</mat-label>
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_PLACEHOLDER' | translate"
            [value]="operadorPiezaField() ?? ''"
            (input)="operadorPiezaField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- Equipo Retroceso -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_RETROCESO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_RETROCESO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoRetroceso"
          >
            @for (opt of equipoRetrocesoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Retroceso (numérico + unidad) -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_LABEL' | translate"
          [opciones]="mmOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_PLACEHOLDER' | translate"
          [value]="retrocesoField()"
          (valueChange)="retrocesoField.set($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JltShotData extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly mmOptions = [{ value: 'mm', label: 'mm' }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.jltShotData().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.jltShotData().disparoOptions);
  protected readonly equipoAtacadoOptions = computed(() => this.#store.jltShotData().equipoAtacadoOptions);
  protected readonly equipoRetrocesoOptions = computed(() => this.#store.jltShotData().equipoRetrocesoOptions);

  // ── Estado del disparo (read-only output) ─────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.jltShotData().estadoDisparo) {
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
    switch (this.#store.jltShotData().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-700';
      case 'EJECUTADA':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

  // ── Numeric fields with units (ui-input-select) ────────────────────────────
  protected readonly atacadoField = signal<InputFieldValue>(this.#numToField(this.#store.jltShotData().atacado, 'mm'));
  protected readonly retrocesoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltShotData().retroceso, 'mm'),
  );

  // ── Plain text signals ─────────────────────────────────────────────────────
  protected readonly jetField = signal<string | null>(this.#store.jltShotData().jet);
  protected readonly operadorPiezaField = signal<string | null>(this.#store.jltShotData().operadorPieza);
  protected readonly observacionesField = signal<string | null>(this.#store.jltShotData().observaciones);

  // ── Select form (FormField) ────────────────────────────────────────────────
  protected readonly formModel = signal<JltShotDataSelectForm>({
    serie: this.#store.jltShotData().serie,
    disparo: this.#store.jltShotData().disparo,
    equipoAtacado: this.#store.jltShotData().equipoAtacado,
    equipoRetroceso: this.#store.jltShotData().equipoRetroceso,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    jet: this.jetField(),
    operadorPieza: this.operadorPiezaField(),
    observaciones: this.observacionesField(),
    atacado: this.atacadoField(),
    retroceso: this.retrocesoField(),
  });

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.jetField() !== snap.jet ||
      this.operadorPiezaField() !== snap.operadorPieza ||
      this.observacionesField() !== snap.observaciones ||
      JSON.stringify(this.atacadoField()) !== JSON.stringify(snap.atacado) ||
      JSON.stringify(this.retrocesoField()) !== JSON.stringify(snap.retroceso)
    );
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
    this.formModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  resetForm(): void {
    const stored = this.#store.jltShotData();
    this.jetField.set(stored.jet);
    this.operadorPiezaField.set(stored.operadorPieza);
    this.observacionesField.set(stored.observaciones);
    this.atacadoField.set(this.#numToField(stored.atacado, 'mm'));
    this.retrocesoField.set(this.#numToField(stored.retroceso, 'mm'));
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      equipoAtacado: stored.equipoAtacado,
      equipoRetroceso: stored.equipoRetroceso,
    });
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, equipoAtacado, equipoRetroceso } = this.formModel();
    const updates: Partial<JltShotDataState> = {
      serie,
      disparo,
      equipoAtacado,
      equipoRetroceso,
      jet: this.jetField(),
      operadorPieza: this.operadorPiezaField(),
      observaciones: this.observacionesField(),
      atacado: this.#parseNum(this.atacadoField()),
      retroceso: this.#parseNum(this.retrocesoField()),
    };
    this.#store.updateJltShotData(updates);
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
      jet: this.jetField(),
      operadorPieza: this.operadorPiezaField(),
      observaciones: this.observacionesField(),
      atacado: this.atacadoField(),
      retroceso: this.retrocesoField(),
    });
  }
}
