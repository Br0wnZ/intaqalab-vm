import type { Signal } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import type { MaoTopographyState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
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
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
    SoundLevelMeterInput,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-4 overflow-auto">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
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
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_BTN' | translate }}
        </button>

        <!-- En curso badge -->
        <span class="px-2.5 py-0.5 rounded-full text-md font-medium bg-green-100 text-green-700 shrink-0">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.STATUS_ACTIVE' | translate }}
        </span>
      </div>

      <!-- Fields: 4 columns layout -->
      <div
        intaReadonlyContent
        class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 items-end content-start min-h-0 pt-2.5 pb-2 overflow-y-auto"
      >
        <!-- Pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-3"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="readOnly()"
          [value]="piezaPosition()"
          (valueChange)="piezaPosition.set($event)"
        />

        <!-- OLT para diferencia angular -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_PLACEHOLDER' | translate"
          [value]="oltField()"
          (valueChange)="oltField.set($event)"
        />

        <!-- Blanco Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-3"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.BLANCO_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="readOnly() || !blancoEnabled()"
          [value]="blancoPosition()"
          (valueChange)="blancoPosition.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="col-span-1 md:col-span-1 w-full">
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
  styles: [
    `
      inta-mao-topography ui-sound-level-meter-input {
        width: 100%;
      }
      inta-mao-topography ui-sound-level-meter-input .flex {
        gap: 0.25rem !important;
        padding-left: 0.375rem !important;
        padding-right: 0.375rem !important;
      }
      inta-mao-topography ui-sound-level-meter-input input {
        max-width: 2rem;
      }
    `,
  ],
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

  // ── ReadOnly State ─────────────────────────────────────────────────────────
  protected readonly readOnly = computed(() => this.#store.isTrialReadOnly());

  // ── OLT Field signal ──────────────────────────────────────────────────────
  protected readonly oltField = signal<InputFieldValue>(null);

  // ── Position signals ──────────────────────────────────────────────────────
  protected readonly piezaPosition = signal<SoundLevelMeterValue | null>(null);
  protected readonly blancoPosition = signal<SoundLevelMeterValue | null>(null);

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
    piezaPosition: SoundLevelMeterValue | null;
    blancoPosition: SoundLevelMeterValue | null;
  }>({
    olt: this.oltField(),
    piezaPosition: this.piezaPosition(),
    blancoPosition: this.blancoPosition(),
  });

  // ── Dirty: select form OR any numeric field differs from snapshot ─────────
  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.oltField()) !== JSON.stringify(snap.olt) ||
      JSON.stringify(this.piezaPosition()) !== JSON.stringify(snap.piezaPosition) ||
      JSON.stringify(this.blancoPosition()) !== JSON.stringify(snap.blancoPosition)
    );
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();
    this.#applyFieldsFromStore();
    this.#syncSnapshot();
  }

  resetForm(): void {
    const stored = this.#store.maoTopography();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      observador: stored.observador,
    });
    this.#applyFieldsFromStore();
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, observador } = this.formModel();
    const olt = this.#parseNum(this.oltField());
    const pieza = this.#fromPosition(this.piezaPosition());
    const blanco = this.#fromPosition(this.blancoPosition());

    const xPieza = this.#parseNum(pieza.x);
    const yPieza = this.#parseNum(pieza.y);
    const zPieza = this.#parseNum(pieza.z);
    const xBlanco = this.#parseNum(blanco.x);
    const yBlanco = this.#parseNum(blanco.y);
    const zBlanco = this.#parseNum(blanco.z);

    const updates: Partial<MaoTopographyState> = {
      serie,
      disparo,
      observador,
      olt,
      xPieza,
      yPieza,
      zPieza,
      xBlanco,
      yBlanco,
      zBlanco,
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
    this.formModel.update((m) => ({
      ...m,
      serie: activeSerieId() ?? m.serie,
      disparo: activeShotId() ?? m.disparo,
    }));
  }

  async openMassConfig(): Promise<void> {
    const pieza = this.#fromPosition(this.piezaPosition());
    const blanco = this.#fromPosition(this.blancoPosition());

    const ref = this.#dialog.open<MaoTopographyMassConfigDialog, unknown, MaoTopographyMassConfigDialogResult>(
      MaoTopographyMassConfigDialog,
      {
        width: '800px',
        maxWidth: '800px',
        data: {
          serieOptions: this.serieOptions(),
          observadorOptions: this.observadorOptions(),
          current: {
            xPieza: pieza.x,
            yPieza: pieza.y,
            zPieza: pieza.z,
            xBlanco: blanco.x,
            yBlanco: blanco.y,
            zBlanco: blanco.z,
            olt: this.oltField(),
            observador: this.formModel().observador,
          },
        },
      },
    );

    const result = await firstValueFrom(ref.afterClosed());

    if (result?.action !== 'apply') return;

    // Apply values to local form signals
    if (result.xPieza !== undefined || result.yPieza !== undefined || result.zPieza !== undefined) {
      const currentPieza = this.piezaPosition();
      this.piezaPosition.set({
        x: result.xPieza ? parseFloat(result.xPieza.value) : null,
        y: result.yPieza ? parseFloat(result.yPieza.value) : null,
        z: result.zPieza ? parseFloat(result.zPieza.value) : null,
        unit: result.xPieza?.unit ?? result.yPieza?.unit ?? result.zPieza?.unit ?? currentPieza?.unit ?? 'm',
      });
    }
    if (result.xBlanco !== undefined || result.yBlanco !== undefined || result.zBlanco !== undefined) {
      const currentBlanco = this.blancoPosition();
      this.blancoPosition.set({
        x: result.xBlanco ? parseFloat(result.xBlanco.value) : null,
        y: result.yBlanco ? parseFloat(result.yBlanco.value) : null,
        z: result.zBlanco ? parseFloat(result.zBlanco.value) : null,
        unit: result.xBlanco?.unit ?? result.yBlanco?.unit ?? result.zBlanco?.unit ?? currentBlanco?.unit ?? 'm',
      });
    }
    if (result.olt !== undefined) this.oltField.set(result.olt);
    if (result.observador !== undefined) {
      this.formModel.update((m) => ({ ...m, observador: result.observador ?? null }));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  #toPosition(x: InputFieldValue, y: InputFieldValue, z: InputFieldValue): SoundLevelMeterValue | null {
    if (!x && !y && !z) return null;
    return {
      x: x?.value ? parseFloat(x.value.replace(',', '.')) : null,
      y: y?.value ? parseFloat(y.value.replace(',', '.')) : null,
      z: z?.value ? parseFloat(z.value.replace(',', '.')) : null,
      unit: x?.unit ?? y?.unit ?? z?.unit ?? 'm',
    };
  }

  #fromPosition(pos: SoundLevelMeterValue | null): { x: InputFieldValue; y: InputFieldValue; z: InputFieldValue } {
    if (!pos) {
      return { x: null, y: null, z: null };
    }
    const unit = pos.unit ?? 'm';
    return {
      x: pos.x !== null ? { value: pos.x.toFixed(1), unit } : null,
      y: pos.y !== null ? { value: pos.y.toFixed(1), unit } : null,
      z: pos.z !== null ? { value: pos.z.toFixed(1), unit } : null,
    };
  }

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
      olt: this.oltField(),
      piezaPosition: this.piezaPosition(),
      blancoPosition: this.blancoPosition(),
    });
  }

  #applyFieldsFromStore(): void {
    const stored = this.#store.maoTopography();
    this.oltField.set(this.#numToField(stored.olt, 'oo', 3));
    this.piezaPosition.set(
      this.#toPosition(
        this.#numToField(stored.xPieza, 'm', 1),
        this.#numToField(stored.yPieza, 'm', 1),
        this.#numToField(stored.zPieza, 'm', 1),
      ),
    );
    this.blancoPosition.set(
      this.#toPosition(
        this.#numToField(stored.xBlanco, 'm', 1),
        this.#numToField(stored.yBlanco, 'm', 1),
        this.#numToField(stored.zBlanco, 'm', 1),
      ),
    );
  }
}
