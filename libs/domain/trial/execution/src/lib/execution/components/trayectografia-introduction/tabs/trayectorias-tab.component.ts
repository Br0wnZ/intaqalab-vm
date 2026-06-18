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
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../../+state/execution.store';
import type { TrayectografiaTrayectoriaState } from '../../../../+state/execution.store';

type InputFieldValue = { value: string; unit: string } | null;

@Component({
  selector: 'inta-trayectografia-trayectorias-tab',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-7 gap-x-2 gap-y-1 min-h-0 content-start">
      <!-- Equipo -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select [value]="equipo()" (selectionChange)="equipoChange.emit($event.value)">
          @for (opt of equipoOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Alcance -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.ALCANCE_LABEL' | translate"
        [opciones]="mOptions"
        [value]="alcanceField()"
        (valueChange)="alcanceField.set($event)"
      />

      <!-- Deriva -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.DERIVA_LABEL' | translate"
        [opciones]="mOptions"
        [value]="derivaField()"
        (valueChange)="derivaField.set($event)"
      />

      <!-- Tiempo vuelo -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TIEMPO_VUELO_LABEL' | translate"
        [opciones]="sOptions"
        [value]="tiempoVueloField()"
        (valueChange)="tiempoVueloField.set($event)"
      />

      <!-- Tiem. func. espoleta -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TIEM_FUNC_ESPOLETA_LABEL' | translate"
        [opciones]="sOptions"
        [value]="tiempoFuncEspoletaField()"
        (valueChange)="tiempoFuncEspoletaField.set($event)"
      />

      <!-- Alt. func. espoleta -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.ALT_FUNC_ESPOLETA_LABEL' | translate"
        [opciones]="mOptions"
        [value]="altFuncEspoletaField()"
        (valueChange)="altFuncEspoletaField.set($event)"
      />

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

      <!-- Alc. func. espoleta -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.ALC_FUNC_ESPOLETA_LABEL' | translate"
        [opciones]="mOptions"
        [value]="alcFuncEspoletaField()"
        (valueChange)="alcFuncEspoletaField.set($event)"
      />

      <!-- Flecha -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.FLECHA_LABEL' | translate"
        [opciones]="mOptions"
        [value]="flechaField()"
        (valueChange)="flechaField.set($event)"
      />

      <!-- Calificación vuelo -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.CALIFICACION_VUELO_LABEL' | translate }}
        </mat-label>
        <mat-select [value]="calificacionVueloField()" (selectionChange)="calificacionVueloField.set($event.value)">
          @for (opt of correctoIncorrectoOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Coef. aerodinámico -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.COEF_AERODINAMICO_LABEL' | translate }}
        </mat-label>
        <input
          matInput
          type="number"
          [placeholder]="
            'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.COEF_AERODINAMICO_PLACEHOLDER' | translate
          "
          [value]="coefAerodinamicoField() ?? ''"
          (input)="coefAerodinamicoField.set(+$any($event.target).value || null)"
        />
      </mat-form-field>

      <!-- Tiem. eyec. botes fum. -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TIEM_EYEC_BOTES_FUM_LABEL' | translate"
        [opciones]="sOptions"
        [value]="tiempoEyecBotesFumField()"
        (valueChange)="tiempoEyecBotesFumField.set($event)"
      />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrayectografiasTrayectoriasTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly equipo = input<string | null>(null);
  readonly equipoChange = output<string | null>();

  protected readonly mOptions = [{ value: 'm', label: 'm' }];
  protected readonly sOptions = [{ value: 's', label: 's' }];
  protected readonly correctoIncorrectoOptions: { value: string; label: string }[] = [
    { value: 'correcto', label: 'Correcto' },
    { value: 'incorrecto', label: 'Incorrecto' },
  ];

  protected readonly equipoOptions = computed(() => this.#store.trayectografiaIntroduction().equipoOptions);

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly alcanceField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.alcance,
      this.#store.trayectografiaIntroduction().trayectorias.alcanceUnit,
    ),
  );
  protected readonly derivaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.deriva,
      this.#store.trayectografiaIntroduction().trayectorias.derivaUnit,
    ),
  );
  protected readonly tiempoVueloField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.tiempoVuelo,
      this.#store.trayectografiaIntroduction().trayectorias.tiempoVueloUnit,
    ),
  );
  protected readonly tiempoFuncEspoletaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.tiempoFuncionamientoEspoleta,
      this.#store.trayectografiaIntroduction().trayectorias.tiempoFuncionamientoEspoletaUnit,
    ),
  );
  protected readonly altFuncEspoletaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.alturaFuncionamientoEspoleta,
      this.#store.trayectografiaIntroduction().trayectorias.alturaFuncionamientoEspoletaUnit,
    ),
  );
  protected readonly alcFuncEspoletaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.alcanceFuncionamientoEspoleta,
      this.#store.trayectografiaIntroduction().trayectorias.alcanceFuncionamientoEspoletaUnit,
    ),
  );
  protected readonly flechaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.flecha,
      this.#store.trayectografiaIntroduction().trayectorias.flechaUnit,
    ),
  );
  protected readonly calificacionVueloField = signal<string | null>(
    this.#store.trayectografiaIntroduction().trayectorias.calificacionVuelo,
  );
  protected readonly coefAerodinamicoField = signal<number | null>(
    this.#store.trayectografiaIntroduction().trayectorias.coeficienteAerodinamico,
  );
  protected readonly tiempoEyecBotesFumField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trayectorias.tiempoEyeccionBotesFumigenos,
      this.#store.trayectografiaIntroduction().trayectorias.tiempoEyeccionBotesFumigenosUnit,
    ),
  );
  protected readonly observacionesField = signal<string | null>(
    this.#store.trayectografiaIntroduction().trayectorias.observaciones,
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
    const t = this.#store.trayectografiaIntroduction().trayectorias;
    this.#store.updateTrayectografiaTrayectorias({
      alcance: this.#fieldToNum(this.alcanceField()),
      alcanceUnit: this.alcanceField()?.unit ?? t.alcanceUnit,
      deriva: this.#fieldToNum(this.derivaField()),
      derivaUnit: this.derivaField()?.unit ?? t.derivaUnit,
      tiempoVuelo: this.#fieldToNum(this.tiempoVueloField()),
      tiempoVueloUnit: this.tiempoVueloField()?.unit ?? t.tiempoVueloUnit,
      tiempoFuncionamientoEspoleta: this.#fieldToNum(this.tiempoFuncEspoletaField()),
      tiempoFuncionamientoEspoletaUnit: this.tiempoFuncEspoletaField()?.unit ?? t.tiempoFuncionamientoEspoletaUnit,
      alturaFuncionamientoEspoleta: this.#fieldToNum(this.altFuncEspoletaField()),
      alturaFuncionamientoEspoletaUnit: this.altFuncEspoletaField()?.unit ?? t.alturaFuncionamientoEspoletaUnit,
      alcanceFuncionamientoEspoleta: this.#fieldToNum(this.alcFuncEspoletaField()),
      alcanceFuncionamientoEspoletaUnit: this.alcFuncEspoletaField()?.unit ?? t.alcanceFuncionamientoEspoletaUnit,
      flecha: this.#fieldToNum(this.flechaField()),
      flechaUnit: this.flechaField()?.unit ?? t.flechaUnit,
      calificacionVuelo: this.calificacionVueloField(),
      coeficienteAerodinamico: this.coefAerodinamicoField(),
      tiempoEyeccionBotesFumigenos: this.#fieldToNum(this.tiempoEyecBotesFumField()),
      tiempoEyeccionBotesFumigenosUnit: this.tiempoEyecBotesFumField()?.unit ?? t.tiempoEyeccionBotesFumigenosUnit,
      observaciones: this.observacionesField(),
    });
    this.#syncSnapshot();
  }

  reset(): void {
    const tray = this.#store.trayectografiaIntroduction().trayectorias;
    this.alcanceField.set(this.#numToField(tray.alcance, tray.alcanceUnit));
    this.derivaField.set(this.#numToField(tray.deriva, tray.derivaUnit));
    this.tiempoVueloField.set(this.#numToField(tray.tiempoVuelo, tray.tiempoVueloUnit));
    this.tiempoFuncEspoletaField.set(
      this.#numToField(tray.tiempoFuncionamientoEspoleta, tray.tiempoFuncionamientoEspoletaUnit),
    );
    this.altFuncEspoletaField.set(
      this.#numToField(tray.alturaFuncionamientoEspoleta, tray.alturaFuncionamientoEspoletaUnit),
    );
    this.alcFuncEspoletaField.set(
      this.#numToField(tray.alcanceFuncionamientoEspoleta, tray.alcanceFuncionamientoEspoletaUnit),
    );
    this.flechaField.set(this.#numToField(tray.flecha, tray.flechaUnit));
    this.calificacionVueloField.set(tray.calificacionVuelo);
    this.coefAerodinamicoField.set(tray.coeficienteAerodinamico);
    this.tiempoEyecBotesFumField.set(
      this.#numToField(tray.tiempoEyeccionBotesFumigenos, tray.tiempoEyeccionBotesFumigenosUnit),
    );
    this.observacionesField.set(tray.observaciones);
    this.#syncSnapshot();
  }

  #currentValues(): Partial<TrayectografiaTrayectoriaState> {
    return {
      alcance: this.#fieldToNum(this.alcanceField()),
      deriva: this.#fieldToNum(this.derivaField()),
      tiempoVuelo: this.#fieldToNum(this.tiempoVueloField()),
      tiempoFuncionamientoEspoleta: this.#fieldToNum(this.tiempoFuncEspoletaField()),
      alturaFuncionamientoEspoleta: this.#fieldToNum(this.altFuncEspoletaField()),
      alcanceFuncionamientoEspoleta: this.#fieldToNum(this.alcFuncEspoletaField()),
      flecha: this.#fieldToNum(this.flechaField()),
      calificacionVuelo: this.calificacionVueloField(),
      coeficienteAerodinamico: this.coefAerodinamicoField(),
      tiempoEyeccionBotesFumigenos: this.#fieldToNum(this.tiempoEyecBotesFumField()),
      observaciones: this.observacionesField(),
    };
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set(this.#currentValues());
  }

  #numToField(num: number | null, unit: string): InputFieldValue {
    if (num === null) return null;
    return { value: num.toString(), unit };
  }

  #fieldToNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const parsed = Number(field.value);
    return isNaN(parsed) ? null : parsed;
  }
}
