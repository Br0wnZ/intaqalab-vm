import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { InputSelect } from '@intaqalab/ui';
import type { MaoTopographyState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import type { MaoTopographyMassConfigDialogResult } from './mao-topography-mass-config-dialog';
import { MaoTopographyMassConfigDialog } from './mao-topography-mass-config-dialog';

type InputFieldValue = { value: string; unit: string } | null;

interface MaoTopographySelectForm {
  serie: string | null;
  disparo: string | null;
  observador: string | null;
}

@Component({
  selector: 'inta-mao-topography',
  standalone: true,
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-2 flex flex-col gap-1.5">

      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
            <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
          </div>
          <h3 class="text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.DISPARO_PLACEHOLDER' | translate"
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
          class="!text-xs !h-8 !px-3"
          color="primary"
          type="button"
          (click)="setCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button
          mat-flat-button
          class="!text-xs !h-8 !px-3"
          color="primary"
          type="button"
          (click)="openMassConfig()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_BTN' | translate }}
        </button>

        <!-- En curso badge -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.STATUS_ACTIVE' | translate }}
        </span>
      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 shrink-0"></div>

      <!-- Fields: 4 columns × 2 rows — order matches design -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-4 gap-x-3 gap-y-1 min-h-0">

        <!-- Row 1: Pieza X | Pieza Y | Pieza Z | Blanco X -->

        <!-- Pieza X -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_PIEZA_PLACEHOLDER' | translate"
          [value]="xPiezaField()"
          (valueChange)="xPiezaField.set($event)"
        />

        <!-- Pieza Y -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_PIEZA_PLACEHOLDER' | translate"
          [value]="yPiezaField()"
          (valueChange)="yPiezaField.set($event)"
        />

        <!-- Pieza Z -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_PIEZA_PLACEHOLDER' | translate"
          [value]="zPiezaField()"
          (valueChange)="zPiezaField.set($event)"
        />

        <!-- Blanco X -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_BLANCO_PLACEHOLDER' | translate"
          [value]="xBlancoField()"
          (valueChange)="xBlancoField.set($event)"
          [textColor]="blancoEnabled() ? null : '#94a3b8'"
        />

        <!-- Row 2: Blanco Y | Blanco Z | OLT | Observador -->

        <!-- Blanco Y -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_BLANCO_PLACEHOLDER' | translate"
          [value]="yBlancoField()"
          (valueChange)="yBlancoField.set($event)"
          [textColor]="blancoEnabled() ? null : '#94a3b8'"
        />

        <!-- Blanco Z -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_BLANCO_PLACEHOLDER' | translate"
          [value]="zBlancoField()"
          (valueChange)="zBlancoField.set($event)"
          [textColor]="blancoEnabled() ? null : '#94a3b8'"
        />

        <!-- OLT para diferencia angular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_PLACEHOLDER' | translate"
          [value]="oltField()"
          (valueChange)="oltField.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_PLACEHOLDER' | translate"
            [formField]="selectForm.observador"
          >
            @for (opt of observadorOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaoTopography extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #dialog = inject(MatDialog);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly observadorOptions = computed(() => this.#store.maoTopography().observadorOptions);
  protected readonly blancoEnabled = computed(() => this.#store.maoTopography().blancoEnabled);
  protected readonly serieOptions = computed<{ value: string; label: string }[]>(() => []);
  protected readonly disparoOptions = computed<{ value: string; label: string }[]>(() => []);

  // ── Numeric field signals (ui-input-select) ───────────────────────────────
  protected readonly oltField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().olt, 'oo', 3),
  );
  protected readonly xPiezaField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().xPieza, 'm', 1),
  );
  protected readonly yPiezaField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().yPieza, 'm', 1),
  );
  protected readonly zPiezaField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().zPieza, 'm', 1),
  );
  protected readonly xBlancoField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().xBlanco, 'm', 1),
  );
  protected readonly yBlancoField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().yBlanco, 'm', 1),
  );
  protected readonly zBlancoField = signal<InputFieldValue>(
    this.#numToField(this.#store.maoTopography().zBlanco, 'm', 1),
  );

  // ── Select form (Signal Forms for dirty tracking of selectors) ────────────
  protected readonly formModel = signal<MaoTopographySelectForm>({
    serie: this.#store.maoTopography().serie,
    disparo: this.#store.maoTopography().disparo,
    observador: this.#store.maoTopography().observador,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Snapshot for numeric dirty tracking ───────────────────────────────────
  readonly #savedSnapshot = signal<{
    olt: InputFieldValue;
    xPieza: InputFieldValue;
    yPieza: InputFieldValue;
    zPieza: InputFieldValue;
    xBlanco: InputFieldValue;
    yBlanco: InputFieldValue;
    zBlanco: InputFieldValue;
  }>({
    olt: this.oltField(),
    xPieza: this.xPiezaField(),
    yPieza: this.yPiezaField(),
    zPieza: this.zPiezaField(),
    xBlanco: this.xBlancoField(),
    yBlanco: this.yBlancoField(),
    zBlanco: this.zBlancoField(),
  });

  // ── Dirty: select form OR any numeric field differs from snapshot ─────────
  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.oltField())    !== JSON.stringify(snap.olt)    ||
      JSON.stringify(this.xPiezaField()) !== JSON.stringify(snap.xPieza) ||
      JSON.stringify(this.yPiezaField()) !== JSON.stringify(snap.yPieza) ||
      JSON.stringify(this.zPiezaField()) !== JSON.stringify(snap.zPieza) ||
      JSON.stringify(this.xBlancoField()) !== JSON.stringify(snap.xBlanco) ||
      JSON.stringify(this.yBlancoField()) !== JSON.stringify(snap.yBlanco) ||
      JSON.stringify(this.zBlancoField()) !== JSON.stringify(snap.zBlanco)
    );
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId:   this.widgetId(),
    dirty:      this.isDirty(),
    touched:    this.isDirty(),
    valid:      this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  resetForm(): void {
    const stored = this.#store.maoTopography();
    this.formModel.set({
      serie:      stored.serie,
      disparo:    stored.disparo,
      observador: stored.observador,
    });
    this.oltField.set(this.#numToField(stored.olt, 'oo', 3));
    this.xPiezaField.set(this.#numToField(stored.xPieza, 'm', 1));
    this.yPiezaField.set(this.#numToField(stored.yPieza, 'm', 1));
    this.zPiezaField.set(this.#numToField(stored.zPieza, 'm', 1));
    this.xBlancoField.set(this.#numToField(stored.xBlanco, 'm', 1));
    this.yBlancoField.set(this.#numToField(stored.yBlanco, 'm', 1));
    this.zBlancoField.set(this.#numToField(stored.zBlanco, 'm', 1));
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, observador } = this.formModel();
    const olt    = this.#parseNum(this.oltField());
    const xPieza = this.#parseNum(this.xPiezaField());
    const yPieza = this.#parseNum(this.yPiezaField());
    const zPieza = this.#parseNum(this.zPiezaField());
    const xBlanco = this.#parseNum(this.xBlancoField());
    const yBlanco = this.#parseNum(this.yBlancoField());
    const zBlanco = this.#parseNum(this.zBlancoField());

    const updates: Partial<MaoTopographyState> = {
      serie, disparo, observador,
      olt, xPieza, yPieza, zPieza,
      xBlanco, yBlanco, zBlanco,
    };

    this.#store.updateMaoTopography(updates);

    // Propagate to radar trayectography widget
    this.#store.updateRadarTrayectographyMaoData({
      xPieza,
      yPieza,
      zPieza,
      difAngularTopografia: olt,
    });

    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    this.formModel.update(m => ({
      ...m,
      serie:   activeSerieId() ?? m.serie,
      disparo: activeShotId() ?? m.disparo,
    }));
  }

  openMassConfig(): void {
    const ref = this.#dialog.open<MaoTopographyMassConfigDialog, unknown, MaoTopographyMassConfigDialogResult>(
      MaoTopographyMassConfigDialog, {
      width: '800px',
      maxWidth: '800px',
      data: {
        serieOptions: this.serieOptions(),
        observadorOptions: this.observadorOptions(),
        current: {
          xPieza:    this.xPiezaField(),
          yPieza:    this.yPiezaField(),
          zPieza:    this.zPiezaField(),
          xBlanco:   this.xBlancoField(),
          yBlanco:   this.yBlancoField(),
          zBlanco:   this.zBlancoField(),
          olt:       this.oltField(),
          observador: this.formModel().observador,
        },
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.action !== 'apply') return;

      // Apply values to local form signals
      if (result.xPieza   !== undefined) this.xPiezaField.set(result.xPieza);
      if (result.yPieza   !== undefined) this.yPiezaField.set(result.yPieza);
      if (result.zPieza   !== undefined) this.zPiezaField.set(result.zPieza);
      if (result.xBlanco  !== undefined) this.xBlancoField.set(result.xBlanco);
      if (result.yBlanco  !== undefined) this.yBlancoField.set(result.yBlanco);
      if (result.zBlanco  !== undefined) this.zBlancoField.set(result.zBlanco);
      if (result.olt      !== undefined) this.oltField.set(result.olt);
      if (result.observador !== undefined) {
        this.formModel.update(m => ({ ...m, observador: result.observador ?? null }));
      }
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #numToField(v: number | null, unit: string, decimals: number): InputFieldValue {
    return v !== null ? { value: v.toFixed(decimals), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const n = parseFloat(field.value.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      olt:    this.oltField(),
      xPieza: this.xPiezaField(),
      yPieza: this.yPiezaField(),
      zPieza: this.zPiezaField(),
      xBlanco: this.xBlancoField(),
      yBlanco: this.yBlancoField(),
      zBlanco: this.zBlancoField(),
    });
  }
}
