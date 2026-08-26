import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { DatosBlancoBolasState, InputFieldValue } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

export interface AplicarConfigMasivaDialogData {
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  currentData: Pick<
    DatosBlancoBolasState,
    | 'blancoBolax'
    | 'blancoBolay'
    | 'blancoBolaz'
    | 'bocaPiezaX'
    | 'bocaPiezaY'
    | 'bocaPiezaZ'
    | 'diametroBola'
    | 'alturaBola'
    | 'altTripodeCamTransversal'
    | 'camaraFrontalX'
    | 'camaraFrontalY'
    | 'camaraFrontalZ'
    | 'altTripodeCamFrontal'
    | 'camTransversalX'
    | 'camTransversalY'
    | 'camTransversalZ'
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
    IntaIconComponent,
    SoundLevelMeterInput,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_DIALOG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content
      intaReadonlyContent
      style="min-width: 700px; max-width: 95vw;"
      class="flex flex-col gap-4 !pt-4"
    >
      <!-- Selección de series y disparos -->
      <div class="flex gap-3 mb-3">
        <div class="flex-1">
          <mat-label class="block text-sm font-medium text-gray-700 mb-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_SERIES_LABEL' | translate }}
          </mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select [multiple]="true" [(value)]="selectedSeries">
              @for (opt of data.serieOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex-1">
          <mat-label class="block text-sm font-medium text-gray-700 mb-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_DISPAROS_LABEL' | translate }}
          </mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select [multiple]="true" [(value)]="selectedDisparos">
              @for (opt of data.disparoOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Campos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2 pt-2.5 pb-2">
        <!-- Blanco bola Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [value]="blancoBolaPosition()"
          (valueChange)="blancoBolaPosition.set($event)"
        />
        <!-- Diámetro de la bola -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DIAMETRO_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [value]="diametroBola()"
          (valueChange)="diametroBola.set($event)"
        />

        <!-- Boca pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [value]="bocaPiezaPosition()"
          (valueChange)="bocaPiezaPosition.set($event)"
        />
        <!-- Altura de la bola -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALTURA_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [value]="alturaBola()"
          (valueChange)="alturaBola.set($event)"
        />

        <!-- Cámara frontal Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [value]="camaraFrontalPosition()"
          (valueChange)="camaraFrontalPosition.set($event)"
        />
        <!-- Alt. trípode cám. frontal -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_FRONTAL_LABEL' | translate"
          [opciones]="mOptions"
          [value]="altTripodeCamFrontal()"
          (valueChange)="altTripodeCamFrontal.set($event)"
        />

        <!-- Cámara transversal Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [value]="camTransversalPosition()"
          (valueChange)="camTransversalPosition.set($event)"
        />
        <!-- Alt. trípode cám. trans. -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_TRANS_LABEL' | translate"
          [opciones]="mOptions"
          [value]="altTripodeCamTransversal()"
          (valueChange)="altTripodeCamTransversal.set($event)"
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
  styles: [
    `
      inta-aplicar-config-masiva-dialog ui-sound-level-meter-input {
        max-width: 280px;
        width: 100%;
      }
      inta-aplicar-config-masiva-dialog ui-sound-level-meter-input .flex {
        gap: 0.25rem !important;
        padding-left: 0.375rem !important;
        padding-right: 0.375rem !important;
      }
      inta-aplicar-config-masiva-dialog ui-sound-level-meter-input input {
        max-width: 2rem;
      }
    `,
  ],
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

  // Position signals
  protected readonly blancoBolaPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(
      this.data.currentData.blancoBolax,
      this.data.currentData.blancoBolay,
      this.data.currentData.blancoBolaz,
    ),
  );
  protected readonly bocaPiezaPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(
      this.data.currentData.bocaPiezaX,
      this.data.currentData.bocaPiezaY,
      this.data.currentData.bocaPiezaZ,
    ),
  );
  protected readonly camaraFrontalPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(
      this.data.currentData.camaraFrontalX,
      this.data.currentData.camaraFrontalY,
      this.data.currentData.camaraFrontalZ,
    ),
  );
  protected readonly camTransversalPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(
      this.data.currentData.camTransversalX,
      this.data.currentData.camTransversalY,
      this.data.currentData.camTransversalZ,
    ),
  );

  // Single fields
  protected readonly diametroBola = signal<InputFieldValue>(this.data.currentData.diametroBola);
  protected readonly alturaBola = signal<InputFieldValue>(this.data.currentData.alturaBola);
  protected readonly altTripodeCamTransversal = signal<InputFieldValue>(this.data.currentData.altTripodeCamTransversal);
  protected readonly altTripodeCamFrontal = signal<InputFieldValue>(this.data.currentData.altTripodeCamFrontal);

  #toPosition(x: InputFieldValue, y: InputFieldValue, z: InputFieldValue): SoundLevelMeterValue | null {
    const unit = x?.unit ?? y?.unit ?? z?.unit ?? 'm';
    return {
      x: x?.value ? parseFloat(x.value) : null,
      y: y?.value ? parseFloat(y.value) : null,
      z: z?.value ? parseFloat(z.value) : null,
      unit,
    };
  }

  #fromPosition(pos: SoundLevelMeterValue | null): { x: InputFieldValue; y: InputFieldValue; z: InputFieldValue } {
    if (!pos) {
      return { x: null, y: null, z: null };
    }
    const unit = pos.unit ?? 'm';
    return {
      x: pos.x !== null ? { value: pos.x.toString(), unit } : null,
      y: pos.y !== null ? { value: pos.y.toString(), unit } : null,
      z: pos.z !== null ? { value: pos.z.toString(), unit } : null,
    };
  }

  apply(): void {
    const blancoBola = this.#fromPosition(this.blancoBolaPosition());
    const bocaPieza = this.#fromPosition(this.bocaPiezaPosition());
    const camaraFrontal = this.#fromPosition(this.camaraFrontalPosition());
    const camTransversal = this.#fromPosition(this.camTransversalPosition());

    const result: AplicarConfigMasivaDialogResult = {
      action: 'apply',
      series: this.selectedSeries,
      disparos: this.selectedDisparos,
      data: {
        blancoBolax: blancoBola.x,
        blancoBolay: blancoBola.y,
        blancoBolaz: blancoBola.z,
        bocaPiezaX: bocaPieza.x,
        bocaPiezaY: bocaPieza.y,
        bocaPiezaZ: bocaPieza.z,
        diametroBola: this.diametroBola(),
        alturaBola: this.alturaBola(),
        altTripodeCamTransversal: this.altTripodeCamTransversal(),
        camaraFrontalX: camaraFrontal.x,
        camaraFrontalY: camaraFrontal.y,
        camaraFrontalZ: camaraFrontal.z,
        altTripodeCamFrontal: this.altTripodeCamFrontal(),
        camTransversalX: camTransversal.x,
        camTransversalY: camTransversal.y,
        camTransversalZ: camTransversal.z,
      },
    };
    this.#dialogRef.close(result);
  }
}
