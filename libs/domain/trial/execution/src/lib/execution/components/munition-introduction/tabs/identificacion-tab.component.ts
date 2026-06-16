import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { ExecutionStore, type MunitionIntroIdentificationState } from '../../../../+state/execution.store';
import type { IdentFormModel, InputFieldValue } from '../munition-introduction';

@Component({
  selector: 'inta-munition-identificacion-tab',
  imports: [
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    TranslateModule,
    InputSelect,
  ],
  template: `
    <div class="flex-1 grid grid-cols-4 gap-x-2 gap-y-1 min-h-0 content-start">
      <!-- Componente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
          [formField]="identForm.componente"
        >
          @for (opt of componenteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Denominación -->
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        class="w-full"
        [class.border-red-300]="denominacionError()"
      >
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DENOMINACION_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DENOMINACION_PLACEHOLDER' | translate"
          [formField]="identForm.denominacion"
        >
          @for (opt of filteredDenominacionOptions(); track opt.value) {
            <mat-option [value]="opt.value" [class.text-red-500]="!opt.inStock">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Lote -->
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        class="w-full"
        [class.border-red-300]="loteError()"
      >
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.LOTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.LOTE_PLACEHOLDER' | translate"
          [formField]="identForm.lote"
        >
          @for (opt of filteredLoteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

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

      <!-- Nº Cliente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.NUMERO_CLIENTE_LABEL' | translate }}</mat-label>
        <input
          matInput
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.NUMERO_CLIENTE_PLACEHOLDER' | translate"
          [value]="numeroClienteField() ?? ''"
          (input)="numeroClienteField.set($any($event.target).value || null)"
        />
      </mat-form-field>

      <!-- Modo funcionamiento espoleta -->
      @if (isEspoleta()) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_PLACEHOLDER' | translate"
            [formField]="identForm.modoFuncionamiento"
          >
            @for (opt of modoFuncionamientoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaField()"
          (valueChange)="graduacionEspoletaField.set($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionIdentificacionTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly identFormModel = signal<IdentFormModel>({
    componente: this.#store.munitionIntroduction().identificacion.componente,
    denominacion: this.#store.munitionIntroduction().identificacion.denominacion,
    lote: this.#store.munitionIntroduction().identificacion.lote,
    modoFuncionamiento: this.#store.munitionIntroduction().identificacion.modoFuncionamiento,
  });
  readonly identForm = form(this.identFormModel);

  readonly observacionesField = signal<string | null>(this.#store.munitionIntroduction().identificacion.observaciones);
  readonly numeroClienteField = signal<string | null>(this.#store.munitionIntroduction().identificacion.numeroCliente);
  
  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }
  
  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  readonly graduacionEspoletaField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().identificacion.graduacionEspoleta, 's')
  );

  readonly #savedSnapshot = signal({
    observaciones: this.observacionesField(),
    numeroCliente: this.numeroClienteField(),
    graduacionEspoleta: this.graduacionEspoletaField(),
  });

  readonly isDirty = computed(() => {
    if (this.identForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.observacionesField() !== snap.observaciones ||
      this.numeroClienteField() !== snap.numeroCliente ||
      JSON.stringify(this.graduacionEspoletaField()) !== JSON.stringify(snap.graduacionEspoleta)
    );
  });

  readonly isValid = computed(() => this.identForm().valid());

  readonly secondsOptions = [{ value: 's', label: 's' }];

  readonly componenteOptions = computed(() => this.#store.munitionIntroduction().componenteOptions);
  readonly modoFuncionamientoOptions = computed(() => this.#store.munitionIntroduction().modoFuncionamientoOptions);
  
  readonly denominacionError = computed(() => this.#store.munitionIntroduction().identificacion.denominacionNotInStock);
  readonly loteError = computed(() => this.#store.munitionIntroduction().identificacion.loteNotInStock);

  readonly filteredDenominacionOptions = computed(() => {
    const componente = this.identFormModel().componente;
    const opts = this.#store.munitionIntroduction().denominacionOptions;
    return componente ? opts.filter(d => d.componenteId === componente) : opts;
  });

  readonly filteredLoteOptions = computed(() => {
    const denominacion = this.identFormModel().denominacion;
    const opts = this.#store.munitionIntroduction().loteOptions;
    return denominacion ? opts.filter(l => l.denominacionId === denominacion) : opts;
  });

  readonly isEspoleta = computed(() => {
    const componente = this.identFormModel().componente;
    return this.componenteOptions().find(c => c.value === componente)?.category === 'espoleta';
  });

  constructor() {
    effect(() => {
      const opts = this.filteredLoteOptions();
      if (opts.length === 1) {
        const onlyLote = opts[0].value;
        if (this.identFormModel().lote !== onlyLote) {
          this.identFormModel.update(m => ({ ...m, lote: onlyLote }));
        }
      }
    });
  }

  save(): void {
    const { componente, denominacion, lote, modoFuncionamiento } = this.identFormModel();
    const identUpdates: Partial<MunitionIntroIdentificationState> = {
      componente,
      denominacion,
      lote,
      modoFuncionamiento,
      numeroCliente: this.numeroClienteField(),
      observaciones: this.observacionesField(),
      graduacionEspoleta: this.#parseNum(this.graduacionEspoletaField()),
    };
    this.#store.updateMunitionIntroductionIdentification(identUpdates);
    
    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      numeroCliente: this.numeroClienteField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
    });
    // Limpia el form
    this.identForm().reset();
  }

  reset(): void {
    const stored = this.#store.munitionIntroduction().identificacion;
    this.identFormModel.set({
      componente: stored.componente,
      denominacion: stored.denominacion,
      lote: stored.lote,
      modoFuncionamiento: stored.modoFuncionamiento,
    });
    this.numeroClienteField.set(stored.numeroCliente);
    this.observacionesField.set(stored.observaciones);
    this.graduacionEspoletaField.set(this.#numToField(stored.graduacionEspoleta, 's'));
    this.#savedSnapshot.set({
      observaciones: this.observacionesField(),
      numeroCliente: this.numeroClienteField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
    });
    this.identForm().reset();
  }
}
