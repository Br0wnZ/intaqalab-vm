import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../../+state/execution.store';

@Component({
  selector: 'inta-trayectografia-funcionamientos-tab',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule],
  template: `
    <div class="flex-1 grid grid-cols-4 gap-x-2 gap-y-1 min-h-0 items-end">
      <!-- Equipo -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select [value]="equipo()" (selectionChange)="equipoChange.emit($event.value)">
          @for (opt of equipoOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Funcionamiento espoletas trayectografía -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.FUNC_ESPOLETAS_TRAY_LABEL' | translate }}
        </mat-label>
        <mat-select [value]="funcEspoletasTrayField()" (selectionChange)="funcEspoletasTrayField.set($event.value)">
          @for (opt of funcEspoletasTrayOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Funcionamiento munición fumígena radar -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.FUNC_MUN_FUMIGENA_LABEL' | translate }}
        </mat-label>
        <mat-select [value]="funcMunFumigenaField()" (selectionChange)="funcMunFumigenaField.set($event.value)">
          @for (opt of correctoIncorrectoOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Observaciones (row-span-2) -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}
        </mat-label>
        <textarea
          matInput
          rows="3"
          class="resize-none"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
          [value]="observacionesField() ?? ''"
          (input)="observacionesField.set($any($event.target).value || null)"
        ></textarea>
      </mat-form-field>

      <!-- Row 2 -->

      <!-- Funcionamiento munición iluminante radar -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.FUNC_MUN_ILUMINANTE_LABEL' | translate }}
        </mat-label>
        <mat-select [value]="funcMunIluminanteField()" (selectionChange)="funcMunIluminanteField.set($event.value)">
          @for (opt of correctoIncorrectoOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Número de botes eyectados -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.NUM_BOTES_EYECTADOS_LABEL' | translate }}
        </mat-label>
        <input
          matInput
          type="number"
          [placeholder]="
            'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.NUM_BOTES_EYECTADOS_PLACEHOLDER' | translate
          "
          [value]="numeroBotesEyectadosField() ?? ''"
          (input)="numeroBotesEyectadosField.set(+$any($event.target).value || null)"
        />
      </mat-form-field>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrayectografiaFuncionamientosTabComponent {
  readonly #store = inject(ExecutionStore);

  protected readonly funcEspoletasTrayOptions: { value: string; label: string }[] = [
    { value: 'prematuro', label: 'Funcionamiento prematuro' },
    { value: 'temprano', label: 'Funcionamiento temprano' },
    { value: 'inversion', label: 'Inversión' },
    { value: 'correcto', label: 'Funcionamiento correcto' },
    { value: 'sin_explosion', label: 'Sin explosión' },
    { value: 'tardio', label: 'Funcionamiento tardío' },
    { value: 'disparo_nulo', label: 'Disparo nulo' },
  ];

  protected readonly correctoIncorrectoOptions: { value: string; label: string }[] = [
    { value: 'correcto', label: 'Correcto' },
    { value: 'incorrecto', label: 'Incorrecto' },
  ];

  readonly equipo = input<string | null>(null);
  readonly equipoChange = output<string | null>();

  protected readonly equipoOptions = computed(() => this.#store.trayectografiaIntroduction().equipoOptions);

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly funcEspoletasTrayField = signal<string | null>(
    this.#store.trayectografiaIntroduction().funcionamientos.funcionamientoEspoletasTrayectografia,
  );
  protected readonly funcMunFumigenaField = signal<string | null>(
    this.#store.trayectografiaIntroduction().funcionamientos.funcionamientoMunicionFumigenaRadar,
  );
  protected readonly funcMunIluminanteField = signal<string | null>(
    this.#store.trayectografiaIntroduction().funcionamientos.funcionamientoMunicionIluminanteRadar,
  );
  protected readonly numeroBotesEyectadosField = signal<number | null>(
    this.#store.trayectografiaIntroduction().funcionamientos.numeroBotesEyectados,
  );
  protected readonly observacionesField = signal<string | null>(
    this.#store.trayectografiaIntroduction().funcionamientos.observaciones,
  );

  // ── Snapshot ───────────────────────────────────────────────────────────────
  readonly #savedSnapshot = signal(this.#currentValues());

  readonly isDirty = computed(() => {
    const snap = this.#savedSnapshot();
    const cur = this.#currentValues();
    return JSON.stringify(cur) !== JSON.stringify(snap);
  });

  readonly isValid = computed(() => true);

  save(): void {
    this.#store.updateTrayectografiaFuncionamientos({
      funcionamientoEspoletasTrayectografia: this.funcEspoletasTrayField(),
      funcionamientoMunicionFumigenaRadar: this.funcMunFumigenaField(),
      funcionamientoMunicionIluminanteRadar: this.funcMunIluminanteField(),
      numeroBotesEyectados: this.numeroBotesEyectadosField(),
      observaciones: this.observacionesField(),
    });
    this.#syncSnapshot();
  }

  reset(): void {
    const func = this.#store.trayectografiaIntroduction().funcionamientos;
    this.funcEspoletasTrayField.set(func.funcionamientoEspoletasTrayectografia);
    this.funcMunFumigenaField.set(func.funcionamientoMunicionFumigenaRadar);
    this.funcMunIluminanteField.set(func.funcionamientoMunicionIluminanteRadar);
    this.numeroBotesEyectadosField.set(func.numeroBotesEyectados);
    this.observacionesField.set(func.observaciones);
    this.#syncSnapshot();
  }

  #currentValues() {
    return {
      funcEspoletas: this.funcEspoletasTrayField(),
      funcFumigena: this.funcMunFumigenaField(),
      funcIluminante: this.funcMunIluminanteField(),
      numBotes: this.numeroBotesEyectadosField(),
      observaciones: this.observacionesField(),
    };
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set(this.#currentValues());
  }
}
