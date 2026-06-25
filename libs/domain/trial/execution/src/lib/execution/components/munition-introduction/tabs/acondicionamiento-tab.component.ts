import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore, type MunitionIntroAcondicionamientoState } from '../../../../+state/execution.store';
import type { AcondFormModel } from '../munition-introduction';

@Component({
  selector: 'inta-munition-acondicionamiento-tab',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div class="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-x-2 gap-y-1 min-h-0 content-start">
      <!-- Componente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
          [formField]="acondForm.componente"
        >
          @for (opt of componenteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Tiempo en cámara -->
      <div class="flex flex-col gap-1 self-end">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TIEMPO_CAMARA_LABEL' | translate }}
        </span>
        <div class="flex items-center h-[44px] px-3 rounded-lg border border-slate-100 bg-slate-50">
          <span class="text-sm text-slate-700 font-medium tabular-nums">{{ tiempoEnCamara() ?? '—' }}</span>
        </div>
      </div>

      <!-- Equipo (Cámara) -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.CAMARA_PLACEHOLDER' | translate"
          [formField]="acondForm.camara"
        >
          @for (opt of camaraOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
        <button
          mat-icon-button
          matSuffix
          type="button"
          class="flex items-center justify-center"
          (click)="$event.stopPropagation()"
        >
          <ui-inta-icon name="settings" color="var(--inta-button)" class="!h-full !w-full scale-80" />
        </button>
      </mat-form-field>

      <!-- Temperatura -->
      <div class="flex flex-col gap-1 self-end">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TEMPERATURA_LABEL' | translate }}
        </span>
        <div class="flex h-[44px] rounded-lg border border-slate-200 overflow-hidden">
          <div class="flex-1 flex items-center px-3 bg-white">
            <span class="text-sm font-semibold text-green-600 tabular-nums">
              {{ temperaturaFromCamara() ?? '—' }}
            </span>
          </div>
          <div
            class="flex items-center gap-0.5 px-2 border-l border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 min-w-[52px] justify-center"
          >
            °C
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
        <textarea
          matInput
          rows="4"
          class="resize-none"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
          [value]="observacionesField() ?? ''"
          (input)="observacionesField.set($any($event.target).value || null)"
        ></textarea>
      </mat-form-field>

      <!-- Row 2 -->

      <!-- Temperatura programada -->
      <div class="flex flex-col gap-1 self-end">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TEMPERATURA_PROGRAMADA_LABEL' | translate }}
        </span>
        <div class="flex h-[44px] rounded-lg border border-slate-200 overflow-hidden">
          <div class="flex-1 flex items-center px-3 bg-white">
            <span class="text-sm font-semibold text-slate-700 tabular-nums">
              {{ temperaturaCorregidaDisplay() ?? '—' }}
            </span>
          </div>
          <div
            class="flex items-center gap-0.5 px-2 border-l border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 min-w-[52px] justify-center"
          >
            °C
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <!-- Vacío -->
      <div></div>

      <!-- Fecha y hora entrada -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_ENTRADA_LABEL' | translate }}
        </mat-label>
        <input
          matInput
          readonly
          class="cursor-pointer"
          [value]="fechaHoraEntradaField() ?? ''"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_BTN' | translate"
        />
        <button
          mat-icon-button
          matSuffix
          type="button"
          class="!text-[var(--inta-button)]"
          (click)="captureFechaHoraEntrada()"
        >
          <mat-icon>play_circle_outline</mat-icon>
        </button>
      </mat-form-field>

      <!-- Fecha y hora salida -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_SALIDA_LABEL' | translate }}</mat-label>
        <input
          matInput
          readonly
          class="cursor-pointer"
          [value]="fechaHoraSalidaField() ?? ''"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_BTN' | translate"
        />
        <button
          mat-icon-button
          matSuffix
          type="button"
          class="!text-[var(--inta-button)]"
          (click)="captureFechaHoraSalida()"
        >
          <mat-icon>stop_circle</mat-icon>
        </button>
      </mat-form-field>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionAcondicionamientoTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly acondFormModel = signal<AcondFormModel>({
    camara: this.#store.munitionIntroduction().acondicionamiento.camara,
    componente: this.#store.munitionIntroduction().acondicionamiento.componente,
  });
  readonly acondForm = form(this.acondFormModel);

  readonly observacionesField = signal<string | null>(
    this.#store.munitionIntroduction().acondicionamiento.observaciones,
  );
  readonly fechaHoraEntradaField = signal<string | null>(
    this.#store.munitionIntroduction().acondicionamiento.fechaHoraEntrada,
  );
  readonly fechaHoraSalidaField = signal<string | null>(
    this.#store.munitionIntroduction().acondicionamiento.fechaHoraSalida,
  );

  readonly #savedSnapshot = signal({
    observaciones: this.observacionesField(),
    fechaHoraEntrada: this.fechaHoraEntradaField(),
    fechaHoraSalida: this.fechaHoraSalidaField(),
  });

  readonly isDirty = computed(() => {
    if (this.acondForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.observacionesField() !== snap.observaciones ||
      this.fechaHoraEntradaField() !== snap.fechaHoraEntrada ||
      this.fechaHoraSalidaField() !== snap.fechaHoraSalida
    );
  });

  readonly isValid = computed(() => this.acondForm().valid());

  readonly componenteOptions = computed(() => this.#store.munitionIntroduction().componenteOptions);
  readonly camaraOptions = computed(() => this.#store.munitionIntroduction().camaraOptions);

  readonly temperaturaCorregidaDisplay = computed(() => {
    const t = this.#store.munitionIntroduction().acondicionamiento.temperaturaCorregida;
    return t !== null ? t.toString() : null;
  });

  readonly temperaturaFromCamara = computed(() => {
    const camara = this.acondFormModel().camara;
    return this.camaraOptions().find((c) => c.value === camara)?.temperatura ?? null;
  });

  readonly tiempoEnCamara = computed(() => {
    const entrada = this.fechaHoraEntradaField();
    const salida = this.fechaHoraSalidaField();
    if (!entrada || !salida) return null;
    const diffMs = new Date(salida).getTime() - new Date(entrada).getTime();
    if (diffMs < 0) return null;
    const h = Math.floor(diffMs / 3600000)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((diffMs % 3600000) / 60000)
      .toString()
      .padStart(2, '0');
    const s = Math.floor((diffMs % 60000) / 1000)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  captureFechaHoraEntrada(): void {
    this.fechaHoraEntradaField.set(new Date().toISOString());
  }

  captureFechaHoraSalida(): void {
    this.fechaHoraSalidaField.set(new Date().toISOString());
  }

  save(): void {
    const { camara, componente } = this.acondFormModel();
    const acondUpdates: Partial<MunitionIntroAcondicionamientoState> = {
      camara,
      componente,
      fechaHoraEntrada: this.fechaHoraEntradaField(),
      fechaHoraSalida: this.fechaHoraSalidaField(),
      observaciones: this.observacionesField(),
    };
    this.#store.updateMunitionIntroductionAcondicionamiento(acondUpdates);

    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      fechaHoraEntrada: this.fechaHoraEntradaField(),
      fechaHoraSalida: this.fechaHoraSalidaField(),
    });
    this.acondForm().reset();
  }

  reset(): void {
    const stored = this.#store.munitionIntroduction().acondicionamiento;
    this.acondFormModel.set({
      camara: stored.camara,
      componente: stored.componente,
    });
    this.observacionesField.set(stored.observaciones);
    this.fechaHoraEntradaField.set(stored.fechaHoraEntrada);
    this.fechaHoraSalidaField.set(stored.fechaHoraSalida);
    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      fechaHoraEntrada: this.fechaHoraEntradaField(),
      fechaHoraSalida: this.fechaHoraSalidaField(),
    });
    this.acondForm().reset();
  }

  // Se expone el model de formulario por si el padre lo necesita para config masiva
  getFormModel(): AcondFormModel {
    return this.acondFormModel();
  }
}
