import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore, type MunitionIntroPesosState } from '../../../../+state/execution.store';
import type { InputFieldValue, PesosFormModel } from '../munition-introduction';

@Component({
  selector: 'inta-munition-pesos-tab',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-x-2 gap-y-1 min-h-0 content-start">
      <!-- Componente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
          [formField]="pesosForm.componente"
        >
          @for (opt of componenteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Equipo -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
          [formField]="pesosForm.balanza"
        >
          @for (opt of balanzaOptions(); track opt.value) {
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

      <!-- Peso -->
      @if (!isPolvo()) {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_PLACEHOLDER' | translate"
          [value]="pesoField()"
          (valueChange)="pesoField.set($event)"
        />
      } @else {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_ANADIDO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_ANADIDO_PLACEHOLDER' | translate"
          [value]="pesoAnadidoField()"
          (valueChange)="pesoAnadidoField.set($event)"
        />
      }

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

      <!-- Fecha y hora -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full self-end">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_LABEL' | translate }}</mat-label>
        <input
          matInput
          readonly
          class="cursor-pointer"
          [value]="fechaHoraPesosField() ?? ''"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_BTN' | translate"
          (click)="captureFechaHoraPesos()"
        />
        <mat-icon matSuffix class="!text-[16px] text-slate-400">schedule</mat-icon>
      </mat-form-field>

      <!-- Rango pesada -->
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.RANGO_PESADA_LABEL' | translate }}
        </span>
        <div class="flex h-[44px] rounded-lg border border-slate-200 overflow-hidden">
          <div class="flex-1 flex items-center px-3 bg-white">
            <span class="text-sm font-semibold text-green-600 tabular-nums">
              {{ rangoPesadaValue() ?? '—' }}
            </span>
          </div>
          <div
            class="flex items-center gap-0.5 px-2 border-l border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 min-h-[44px] justify-center"
          >
            {{ rangoPesadaUnit() ?? '—' }}
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <!-- Peso retirado -->
      @if (isPolvo()) {
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_RETIRADO_LABEL' | translate"
          [opciones]="gramosOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_RETIRADO_PLACEHOLDER' | translate"
          [value]="pesoRetiradoField()"
          (valueChange)="pesoRetiradoField.set($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionPesosTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly pesosFormModel = signal<PesosFormModel>({
    componente: this.#store.munitionIntroduction().pesos.componente,
    balanza: this.#store.munitionIntroduction().pesos.balanza,
  });
  readonly pesosForm = form(this.pesosFormModel);

  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  readonly pesoField = signal<InputFieldValue>(this.#numToField(this.#store.munitionIntroduction().pesos.peso, 'g'));
  readonly pesoAnadidoField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().pesos.pesoAnadido, 'g'),
  );
  readonly pesoRetiradoField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().pesos.pesoRetirado, 'g'),
  );

  readonly observacionesField = signal<string | null>(this.#store.munitionIntroduction().pesos.observaciones);
  readonly fechaHoraPesosField = signal<string | null>(this.#store.munitionIntroduction().pesos.fechaHora);

  readonly #savedSnapshot = signal({
    observaciones: this.observacionesField(),
    fechaHoraPesos: this.fechaHoraPesosField(),
    peso: this.pesoField(),
    pesoAnadido: this.pesoAnadidoField(),
    pesoRetirado: this.pesoRetiradoField(),
  });

  readonly isDirty = computed(() => {
    if (this.pesosForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.observacionesField() !== snap.observaciones ||
      this.fechaHoraPesosField() !== snap.fechaHoraPesos ||
      JSON.stringify(this.pesoField()) !== JSON.stringify(snap.peso) ||
      JSON.stringify(this.pesoAnadidoField()) !== JSON.stringify(snap.pesoAnadido) ||
      JSON.stringify(this.pesoRetiradoField()) !== JSON.stringify(snap.pesoRetirado)
    );
  });

  readonly isValid = computed(() => this.pesosForm().valid());

  readonly gramosOptions = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
  ];

  readonly componenteOptions = computed(() => this.#store.munitionIntroduction().componenteOptions);
  readonly balanzaOptions = computed(() => this.#store.munitionIntroduction().balanzaOptions);

  readonly isPolvo = computed(() => {
    const componente = this.pesosFormModel().componente;
    return this.componenteOptions().find((c) => c.value === componente)?.category === 'polvo';
  });

  readonly rangoPesadaValue = computed(() => {
    const balanza = this.pesosFormModel().balanza;
    const opt = this.balanzaOptions().find((b) => b.value === balanza);
    if (!opt || opt.rangoMin === undefined || opt.rangoMax === undefined) return null;
    return `${opt.rangoMin} - ${opt.rangoMax}`;
  });

  readonly rangoPesadaUnit = computed(() => {
    const balanza = this.pesosFormModel().balanza;
    return this.balanzaOptions().find((b) => b.value === balanza)?.unit ?? null;
  });

  captureFechaHoraPesos(): void {
    this.fechaHoraPesosField.set(new Date().toLocaleString('es-ES'));
  }

  save(): void {
    const { componente, balanza } = this.pesosFormModel();
    const pesosUpdates: Partial<MunitionIntroPesosState> = {
      componente,
      balanza,
      peso: this.#parseNum(this.pesoField()),
      pesoAnadido: this.#parseNum(this.pesoAnadidoField()),
      pesoRetirado: this.#parseNum(this.pesoRetiradoField()),
      fechaHora: this.fechaHoraPesosField(),
      observaciones: this.observacionesField(),
    };
    this.#store.updateMunitionIntroductionPesos(pesosUpdates);

    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      fechaHoraPesos: this.fechaHoraPesosField(),
      peso: this.pesoField(),
      pesoAnadido: this.pesoAnadidoField(),
      pesoRetirado: this.pesoRetiradoField(),
    });
    this.pesosForm().reset();
  }

  reset(): void {
    const stored = this.#store.munitionIntroduction().pesos;
    this.pesosFormModel.set({
      componente: stored.componente,
      balanza: stored.balanza,
    });
    this.observacionesField.set(stored.observaciones);
    this.fechaHoraPesosField.set(stored.fechaHora);
    this.pesoField.set(this.#numToField(stored.peso, 'g'));
    this.pesoAnadidoField.set(this.#numToField(stored.pesoAnadido, 'g'));
    this.pesoRetiradoField.set(this.#numToField(stored.pesoRetirado, 'g'));
    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      fechaHoraPesos: this.fechaHoraPesosField(),
      peso: this.pesoField(),
      pesoAnadido: this.pesoAnadidoField(),
      pesoRetirado: this.pesoRetiradoField(),
    });
    this.pesosForm().reset();
  }
}
