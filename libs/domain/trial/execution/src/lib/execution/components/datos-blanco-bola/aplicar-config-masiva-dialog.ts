import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { InputSelect } from '@intaqalab/ui';

import type { DatosBlancoBolasState, InputFieldValue } from '../../../+state/execution.store';

export interface AplicarConfigMasivaDialogData {
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  currentData: Pick<
    DatosBlancoBolasState,
    | 'blancoBolax' | 'blancoBolay' | 'blancoBolaz'
    | 'bocaPiezaX' | 'bocaPiezaY' | 'bocaPiezaZ'
    | 'diametroBola' | 'alturaBola'
    | 'altTripodeCamTransversal'
    | 'camaraFrontalX' | 'camaraFrontalY' | 'camaraFrontalZ'
    | 'altTripodeCamFrontal'
    | 'camTransversalX' | 'camTransversalY' | 'camTransversalZ'
  >;
}

export type AplicarConfigMasivaDialogResult =
  | {
      action: 'apply';
      series: string[];
      disparos: string[];
      data: AplicarConfigMasivaDialogData['currentData'];
    }
  | { action: 'cancel' };

@Component({
  selector: 'inta-aplicar-config-masiva-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    ReadonlyContentDirective,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
    InputSelect,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center gap-2 text-base font-semibold m-0">
      <mat-icon class="text-violet-600">tune</mat-icon>
      {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_DIALOG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent class="flex flex-col gap-4 !pt-4" style="min-width: 700px; max-width: 95vw;">

      <!-- Selección de series y disparos -->
      <div class="flex gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_SERIES_LABEL' | translate }}</mat-label>
          <mat-select [multiple]="true" [(value)]="selectedSeries">
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_DISPAROS_LABEL' | translate }}</mat-label>
          <mat-select [multiple]="true" [(value)]="selectedDisparos">
            @for (opt of data.disparoOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="h-px bg-slate-100"></div>

      <!-- Campos — Fila 1 -->
      <div class="grid grid-cols-4 gap-3">
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_X_LABEL' | translate"
          [opciones]="mOptions"
          [value]="blancoBolax()"
          (valueChange)="blancoBolax.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_Y_LABEL' | translate"
          [opciones]="mOptions"
          [value]="blancoBolay()"
          (valueChange)="blancoBolay.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_Z_LABEL' | translate"
          [opciones]="mOptions"
          [value]="blancoBolaz()"
          (valueChange)="blancoBolaz.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_X_LABEL' | translate"
          [opciones]="mOptions"
          [value]="bocaPiezaX()"
          (valueChange)="bocaPiezaX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_Y_LABEL' | translate"
          [opciones]="mOptions"
          [value]="bocaPiezaY()"
          (valueChange)="bocaPiezaY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_Z_LABEL' | translate"
          [opciones]="mOptions"
          [value]="bocaPiezaZ()"
          (valueChange)="bocaPiezaZ.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DIAMETRO_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [value]="diametroBola()"
          (valueChange)="diametroBola.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALTURA_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [value]="alturaBola()"
          (valueChange)="alturaBola.set($event)"
        />
      </div>

      <!-- Campos — Fila 2 -->
      <div class="grid grid-cols-4 gap-3">
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_TRANS_LABEL' | translate"
          [opciones]="mOptions"
          [value]="altTripodeCamTransversal()"
          (valueChange)="altTripodeCamTransversal.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_X_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camaraFrontalX()"
          (valueChange)="camaraFrontalX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_Y_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camaraFrontalY()"
          (valueChange)="camaraFrontalY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_Z_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camaraFrontalZ()"
          (valueChange)="camaraFrontalZ.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_FRONTAL_LABEL' | translate"
          [opciones]="mOptions"
          [value]="altTripodeCamFrontal()"
          (valueChange)="altTripodeCamFrontal.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_X_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camTransversalX()"
          (valueChange)="camTransversalX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_Y_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camTransversalY()"
          (valueChange)="camTransversalY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_Z_LABEL' | translate"
          [opciones]="mOptions"
          [value]="camTransversalZ()"
          (valueChange)="camTransversalZ.set($event)"
        />
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex gap-2 !px-0 justify-end">
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <button
        mat-flat-button
        class="!bg-violet-600 !text-white"
        [disabled]="selectedSeries.length === 0 || selectedDisparos.length === 0"
        (click)="apply()"
      >
        {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_APPLY_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AplicarConfigMasivaDialog {
  readonly #dialogRef = inject(MatDialogRef<AplicarConfigMasivaDialog>);
  protected readonly data = inject<AplicarConfigMasivaDialogData>(MAT_DIALOG_DATA);

  protected readonly mOptions = [{ value: 'm', label: 'm' }];

  // Multi-select state
  protected selectedSeries: string[] = [];
  protected selectedDisparos: string[] = [];

  // Field signals initialized from current data
  protected readonly blancoBolax = signal<InputFieldValue>(this.data.currentData.blancoBolax);
  protected readonly blancoBolay = signal<InputFieldValue>(this.data.currentData.blancoBolay);
  protected readonly blancoBolaz = signal<InputFieldValue>(this.data.currentData.blancoBolaz);
  protected readonly bocaPiezaX = signal<InputFieldValue>(this.data.currentData.bocaPiezaX);
  protected readonly bocaPiezaY = signal<InputFieldValue>(this.data.currentData.bocaPiezaY);
  protected readonly bocaPiezaZ = signal<InputFieldValue>(this.data.currentData.bocaPiezaZ);
  protected readonly diametroBola = signal<InputFieldValue>(this.data.currentData.diametroBola);
  protected readonly alturaBola = signal<InputFieldValue>(this.data.currentData.alturaBola);
  protected readonly altTripodeCamTransversal = signal<InputFieldValue>(this.data.currentData.altTripodeCamTransversal);
  protected readonly camaraFrontalX = signal<InputFieldValue>(this.data.currentData.camaraFrontalX);
  protected readonly camaraFrontalY = signal<InputFieldValue>(this.data.currentData.camaraFrontalY);
  protected readonly camaraFrontalZ = signal<InputFieldValue>(this.data.currentData.camaraFrontalZ);
  protected readonly altTripodeCamFrontal = signal<InputFieldValue>(this.data.currentData.altTripodeCamFrontal);
  protected readonly camTransversalX = signal<InputFieldValue>(this.data.currentData.camTransversalX);
  protected readonly camTransversalY = signal<InputFieldValue>(this.data.currentData.camTransversalY);
  protected readonly camTransversalZ = signal<InputFieldValue>(this.data.currentData.camTransversalZ);

  apply(): void {
    const result: AplicarConfigMasivaDialogResult = {
      action: 'apply',
      series: this.selectedSeries,
      disparos: this.selectedDisparos,
      data: {
        blancoBolax: this.blancoBolax(),
        blancoBolay: this.blancoBolay(),
        blancoBolaz: this.blancoBolaz(),
        bocaPiezaX: this.bocaPiezaX(),
        bocaPiezaY: this.bocaPiezaY(),
        bocaPiezaZ: this.bocaPiezaZ(),
        diametroBola: this.diametroBola(),
        alturaBola: this.alturaBola(),
        altTripodeCamTransversal: this.altTripodeCamTransversal(),
        camaraFrontalX: this.camaraFrontalX(),
        camaraFrontalY: this.camaraFrontalY(),
        camaraFrontalZ: this.camaraFrontalZ(),
        altTripodeCamFrontal: this.altTripodeCamFrontal(),
        camTransversalX: this.camTransversalX(),
        camTransversalY: this.camTransversalY(),
        camTransversalZ: this.camTransversalZ(),
      },
    };
    this.#dialogRef.close(result);
  }
}
