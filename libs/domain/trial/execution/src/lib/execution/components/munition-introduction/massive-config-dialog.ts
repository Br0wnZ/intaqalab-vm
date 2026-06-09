import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

export interface MassiveConfigDialogData {
  camaraLabel: string;
  componente: string | null;
  temperaturaCorregida: number | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  serieOptions: { value: string; label: string }[];
  componenteOptions: { value: string; label: string; category: string }[];
}

export interface MassiveConfigDialogResult {
  series: string[];
  componente: string | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
}

@Component({
  selector: 'inta-massive-config-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    ReadonlyContentDirective,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center gap-2 text-xl font-bold text-slate-900 !mb-4">
      <mat-icon class="text-slate-600">edit</mat-icon>
      {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent class="!px-0 !overflow-visible">
      <div class="flex flex-col gap-3 w-full">

        <!-- Series (full width, multi-select) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.SERIES_LABEL' | translate }}</mat-label>
          <mat-select
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

        <!-- Componente + Equipo -->
        <div class="grid grid-cols-2 gap-3">

          <!-- Componente (editable) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
              [value]="selectedComponente()"
              (valueChange)="selectedComponente.set($event)"
            >
              @for (opt of data.componenteOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Equipo (read-only display) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
            <input matInput readonly [value]="data.camaraLabel" />
            <mat-icon matSuffix class="!text-violet-500 !text-[20px]">settings</mat-icon>
          </mat-form-field>
        </div>

        <!-- Temperatura programada + Fecha y hora entrada -->
        <div class="grid grid-cols-2 gap-3">

          <!-- Temperatura programada (read-only con mat-form-field) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TEMPERATURA_PROGRAMADA_LABEL' | translate }}</mat-label>
            <input matInput readonly [value]="data.temperaturaCorregida ?? ''" />
            <span matSuffix class="text-sm font-medium text-slate-600 pr-1">°C</span>
          </mat-form-field>

          <!-- Fecha y hora entrada (input readonly + ▶) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_ENTRADA_LABEL' | translate }}</mat-label>
            <input
              matInput
              readonly
              class="cursor-pointer"
              [value]="fechaHoraEntrada() ?? ''"
            />
            <button mat-icon-button matSuffix type="button" class="!text-violet-500 !w-9 !h-9" (click)="captureEntrada()">
              <mat-icon class="!text-[20px]">play_circle_outline</mat-icon>
            </button>
          </mat-form-field>
        </div>

        <!-- Fecha y hora salida -->
        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_SALIDA_LABEL' | translate }}</mat-label>
            <input
              matInput
              readonly
              class="cursor-pointer"
              [value]="fechaHoraSalida() ?? ''"
            />
            <button mat-icon-button matSuffix type="button" class="!text-violet-500 !w-9 !h-9" (click)="captureSalida()">
              <mat-icon class="!text-[20px]">stop_circle</mat-icon>
            </button>
          </mat-form-field>
        </div>

      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!px-0 flex justify-center gap-3 !pt-4">
      <button
        mat-flat-button
        color="primary"
        class="!rounded-xl !px-8"
        [disabled]="selectedSeries().length === 0"
        (click)="apply()"
      >
        {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DIALOG.APPLY_BTN' | translate }}
      </button>
      <button mat-stroked-button class="!rounded-xl !px-8" [mat-dialog-close]="null">
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

  protected readonly selectedSeries = signal<string[]>([]);
  protected readonly selectedComponente = signal<string | null>(this.data.componente);
  protected readonly fechaHoraEntrada = signal<string | null>(this.data.fechaHoraEntrada);
  protected readonly fechaHoraSalida = signal<string | null>(this.data.fechaHoraSalida);

  captureEntrada(): void {
    this.fechaHoraEntrada.set(new Date().toLocaleString('es-ES'));
  }

  captureSalida(): void {
    this.fechaHoraSalida.set(new Date().toLocaleString('es-ES'));
  }

  apply(): void {
    this.#dialogRef.close({
      series: this.selectedSeries(),
      componente: this.selectedComponente(),
      fechaHoraEntrada: this.fechaHoraEntrada(),
      fechaHoraSalida: this.fechaHoraSalida(),
    });
  }
}
