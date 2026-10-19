import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, SaveButton } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type {
  MunitionConditioningBulkConfigurationRequest,
  MunitionConditioningBulkConfigurationResponse,
} from '../../models';
import { injectClimaticChamberEquipments } from './inject-climatic-chamber-equipments';
import { resolveCamaraId } from './munition-introduction.mapper';

export interface MassiveConfigDialogData {
  fireTrialId: string;
  assignedShotIdsBySeries: Record<string, string[]>;
  camaraLabel?: string;
  climaticChamberId?: number | null;
  componente: string | null;
  temperaturaCorregida?: number | null;
  fechaHoraEntrada: string | Date | null;
  fechaHoraSalida?: string | Date | null;
  serieOptions: { value: string; label: string }[];
  componenteOptions?: { value: string; label: string; category?: string }[];
  initialSeries?: string[];
}

export type MassiveConfigDialogResult = MunitionConditioningBulkConfigurationResponse;

@Component({
  selector: 'inta-massive-config-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    ReadonlyContentDirective,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    SaveButton,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent class="!px-0 !overflow-visible">
      <div class="flex flex-col gap-3 w-full">
        <!-- Series (full width, multi-select) -->
        <div>
          <mat-label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.SERIES_LABEL' | translate }}
          </mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select
              id="munition-mass-series"
              multiple
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.SERIES_PLACEHOLDER' | translate"
              [value]="selectedSeries()"
              (valueChange)="selectedSeries.set($event)"
            >
              @for (opt of data.serieOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Componente + Fecha y hora entrada -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Componente (editable) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
            <mat-select
              id="munition-mass-component"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
              [value]="selectedComponente()"
              (valueChange)="selectedComponente.set($event)"
            >
              @for (opt of componenteOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Fecha y hora entrada -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_ENTRADA_LABEL' | translate }}
            </mat-label>
            <input
              id="munition-mass-entry-date"
              matInput
              [matDatepicker]="entryPicker"
              [value]="fechaHoraEntrada()"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.DATE_PLACEHOLDER' | translate"
              (dateChange)="updateFechaHoraEntrada($event.value)"
              (input)="updateFechaHoraEntrada($event)"
              (click)="entryPicker.open()"
              #entryDateInput
            />
            <mat-datepicker-toggle matIconSuffix [for]="entryPicker" />
            <mat-datepicker (closed)="entryDateInput.blur()" #entryPicker />
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!px-0 flex justify-center gap-3 !pt-4">
      <ui-save-button
        label="TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.APPLY_BTN"
        [isSaving]="isSaving()"
        [isDisabled]="selectedSeries().length === 0 || !selectedComponente()"
        (save)="apply()"
      />
      <button mat-stroked-button class="!rounded-xl !px-8" [disabled]="isSaving()" (click)="cancel()">
        {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.CANCEL_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MassiveConfigDialog {
  readonly #dialogRef = inject<MatDialogRef<MassiveConfigDialog, MassiveConfigDialogResult>>(MatDialogRef);
  readonly data = inject<MassiveConfigDialogData>(MAT_DIALOG_DATA);
  readonly #executionService = inject(ExecutionService);
  readonly #store = inject(ExecutionStore, { optional: true });
  readonly #isSavingInternal = signal(false);
  readonly #climaticChambers = injectClimaticChamberEquipments(() => this.selectedSeries());

  protected readonly isSaving = computed(
    () =>
      this.#isSavingInternal() || this.#executionService.applyMunitionConditioningBulkConfigurationResource.isLoading(),
  );
  protected readonly selectedSeries = signal<string[]>(this.data.initialSeries ?? []);
  protected readonly componenteOptions = computed(() => {
    const chamberOptions = this.#climaticChambers.options();
    return chamberOptions.length > 0 ? chamberOptions : (this.data.componenteOptions ?? []);
  });
  protected readonly selectedComponente = linkedSignal<string | null>(() => {
    const options = this.componenteOptions();
    const initialId =
      (this.data.climaticChamberId ? String(this.data.climaticChamberId) : null) ?? this.data.componente;
    if (initialId && options.some((opt) => opt.value === initialId)) {
      return initialId;
    }
    return options[0]?.value ?? null;
  });
  protected readonly fechaHoraEntrada = signal<Date | null>(this.#parseDate(this.data.fechaHoraEntrada));

  updateFechaHoraEntrada(value: Date | string | Event | null): void {
    if (value instanceof Event) {
      const target = value.target as HTMLInputElement | null;
      this.fechaHoraEntrada.set(this.#parseDate(target?.value));
      return;
    }
    this.fechaHoraEntrada.set(this.#parseDate(value));
  }

  async apply(): Promise<void> {
    const componentId = this.selectedComponente();
    const assignedShotIds = [
      ...new Set(this.selectedSeries().flatMap((seriesId) => this.data.assignedShotIdsBySeries[seriesId] ?? [])),
    ];
    if (!componentId || assignedShotIds.length === 0) return;

    const request: MunitionConditioningBulkConfigurationRequest = {
      assignedShotIds,
      components: [
        {
          componentId,
          conditioningData: {
            climaticChamberId: resolveCamaraId(componentId) ?? this.data.climaticChamberId ?? null,
            chamberEntryDateTime: this.#toApiDateTime(this.fechaHoraEntrada()),
            chamberExitDateTime: null,
          },
        },
      ],
    };

    this.#isSavingInternal.set(true);
    try {
      const response = this.#store
        ? await this.#store.applyMunitionConditioningBulkConfiguration(this.data.fireTrialId, request)
        : await this.#executionService.applyMunitionConditioningBulkConfiguration(this.data.fireTrialId, request);

      if (this.#executionService.applyMunitionConditioningBulkConfigurationResource.status() === 'resolved') {
        this.#dialogRef.close(response);
      }
    } catch (error) {
      console.error('Error applying bulk munition conditioning:', error);
    } finally {
      this.#isSavingInternal.set(false);
    }
  }

  cancel(): void {
    if (!this.isSaving()) this.#dialogRef.close(undefined);
  }

  #parseDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const trimmed = value.trim();
    const ddmmyyyyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  #toApiDateTime(value: Date | string | null): string | null {
    const parsed = this.#parseDate(value);
    return parsed ? parsed.toISOString() : null;
  }
}
