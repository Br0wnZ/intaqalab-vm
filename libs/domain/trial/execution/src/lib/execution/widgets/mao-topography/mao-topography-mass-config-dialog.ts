import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, SaveButton, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { CalibryObserverOption } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { MaoTopographyMassConfigValues } from './mao-topography.mapper';
import { mapMaoTopographyMassConfigToRequest } from './mao-topography.mapper';

export interface MaoTopographyMassConfigDialogData {
  fireTrialId: string | null;
  serieOptions: { value: string; label: string }[];
  shotIdsBySeries: Record<string, string[]>;
  observadorOptions: CalibryObserverOption[];
  current: {
    xPieza: { value: string; unit: string } | null;
    yPieza: { value: string; unit: string } | null;
    zPieza: { value: string; unit: string } | null;
    xBlanco: { value: string; unit: string } | null;
    yBlanco: { value: string; unit: string } | null;
    zBlanco: { value: string; unit: string } | null;
    observador: string | null;
  };
}

export type MaoTopographyMassConfigDialogResult =
  | { action: 'apply'; updatedShotIds: string[]; observador: string | null }
  | { action: 'cancel' };

interface MassConfigForm {
  series: string[];
  observador: string | null;
}

type InputFieldValue = { value: string; unit: string } | null;

@Component({
  selector: 'inta-mao-topography-mass-config-dialog',
  imports: [
    FormField,
    SaveButton,
    ReadonlyContentDirective,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    SoundLevelMeterInput,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent>
      <!-- Series multi-select -->
      <div class="flex flex-col gap-1">
        <span class="text-sm text-gray-700">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_SERIES_LABEL' | translate }}
        </span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full mb-2">
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_SERIES_PLACEHOLDER' | translate"
            [formField]="massForm.series"
          >
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Fields 3-column layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2 pt-2.5 pb-2">
        <!-- Pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="isSaving()"
          [value]="piezaPosition()"
          (valueChange)="piezaPosition.set($event)"
        />

        <!-- Blanco Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.BLANCO_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="isSaving()"
          [value]="blancoPosition()"
          (valueChange)="blancoPosition.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="col-span-1 md:col-span-1 w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_PLACEHOLDER' | translate"
            [formField]="massForm.observador"
          >
            @for (opt of data.observadorOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
      @if (errorKey(); as key) {
        <p role="alert" class="mt-2 text-sm text-red-700">{{ key | translate }}</p>
      }
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!flex gap-2 !justify-center !pb-4">
      <ui-save-button
        label="TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_APPLY_BTN"
        [isSaving]="isSaving()"
        [isDisabled]="!canApply()"
        (save)="apply()"
      />
      <button mat-stroked-button type="button" [disabled]="isSaving()" (click)="cancel()">
        {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_CANCEL_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaoTopographyMassConfigDialog {
  readonly #dialogRef =
    inject<MatDialogRef<MaoTopographyMassConfigDialog, MaoTopographyMassConfigDialogResult>>(MatDialogRef);
  readonly data = inject<MaoTopographyMassConfigDialogData>(MAT_DIALOG_DATA);
  readonly #executionService = inject(ExecutionService);
  readonly isSaving = signal(false);
  readonly errorKey = signal<string | null>(null);

  // ── Unit options ─────────────────────────────────────────────────────────
  readonly metersOptions = [{ value: 'm', label: 'm' }];

  // ── Select form ──────────────────────────────────────────────────────────
  readonly formModel = signal<MassConfigForm>({
    series: [],
    observador: this.data.current.observador,
  });
  readonly massForm = form(this.formModel, (path) => disabled(path, () => this.isSaving()));

  readonly canApply = computed(() => this.#buildRequest() !== null);

  // ── Position signals ──────────────────────────────────────────────────────
  readonly piezaPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(this.data.current.xPieza, this.data.current.yPieza, this.data.current.zPieza),
  );
  readonly blancoPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(this.data.current.xBlanco, this.data.current.yBlanco, this.data.current.zBlanco),
  );

  // Helper mappings
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

  async apply(): Promise<void> {
    if (this.isSaving()) return;
    const request = this.#buildRequest();
    if (!request || !this.data.fireTrialId) return;

    this.errorKey.set(null);
    this.isSaving.set(true);
    try {
      const response = await this.#executionService.bulkConfigureMaoTopography(this.data.fireTrialId, request);
      this.#dialogRef.close({
        action: 'apply',
        updatedShotIds: response.updatedShotIds,
        observador: this.formModel().observador,
      });
    } catch {
      this.errorKey.set('TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_ERROR');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    if (this.isSaving()) return;
    this.#dialogRef.close({ action: 'cancel' });
  }

  #buildRequest() {
    if (!this.data.fireTrialId) return null;
    const selectedSeries = this.formModel().series;
    if (selectedSeries.length === 0) return null;

    const shotGroups = selectedSeries.map((seriesId) => this.data.shotIdsBySeries[seriesId] ?? []);
    if (shotGroups.some((shotIds) => shotIds.length === 0)) return null;

    const pieza = this.#fromPosition(this.piezaPosition());
    const blanco = this.#fromPosition(this.blancoPosition());
    const values: MaoTopographyMassConfigValues = {
      xPieza: pieza.x,
      yPieza: pieza.y,
      zPieza: pieza.z,
      xBlanco: blanco.x,
      yBlanco: blanco.y,
      zBlanco: blanco.z,
    };
    return mapMaoTopographyMassConfigToRequest(values, this.data.current, shotGroups.flat());
  }
}
