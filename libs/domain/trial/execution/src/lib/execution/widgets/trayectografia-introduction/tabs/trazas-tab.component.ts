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

type InputFieldValue = { value: string; unit: string } | null;

@Component({
  selector: 'inta-trayectografia-trazas-tab',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule, InputSelect],
  template: `
    <div class="grid grid-cols-4 gap-x-2 gap-y-1 min-h-0 items-end">
      <!-- Equipo -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
        <mat-select [value]="equipo()" (selectionChange)="equipoChange.emit($event.value)">
          @for (opt of equipoOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Tiempo traza -->
      <ui-input-select
        [label]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TIEMPO_TRAZA_LABEL' | translate"
        [opciones]="sOptions"
        [value]="tiempoTrazaField()"
        (valueChange)="tiempoTrazaField.set($event)"
      />

      <!-- Existencia traza radar -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.EXISTENCIA_TRAZA_LABEL' | translate }}
        </mat-label>
        <mat-select [value]="existenciaTrazaField()" (selectionChange)="existenciaTrazaField.set($event.value)">
          @for (opt of existenciaTrazaOptions; track opt.value) {
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
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrayectografiaTrazasTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly equipo = input<string | null>(null);
  readonly equipoChange = output<string | null>();

  protected readonly sOptions = [{ value: 's', label: 's' }];
  protected readonly existenciaTrazaOptions: { value: string; label: string }[] = [
    { value: 'con_traza', label: 'Con traza' },
    { value: 'sin_traza', label: 'Sin traza' },
  ];
  protected readonly equipoOptions = computed(() => this.#store.trayectografiaIntroduction().equipoOptions);

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly tiempoTrazaField = signal<InputFieldValue>(
    this.#numToField(
      this.#store.trayectografiaIntroduction().trazas.tiempoTraza,
      this.#store.trayectografiaIntroduction().trazas.tiempoTrazaUnit,
    ),
  );
  protected readonly existenciaTrazaField = signal<string | null>(
    this.#store.trayectografiaIntroduction().trazas.existenciaTrazaRadar,
  );
  protected readonly observacionesField = signal<string | null>(
    this.#store.trayectografiaIntroduction().trazas.observaciones,
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
    const t = this.#store.trayectografiaIntroduction().trazas;
    this.#store.updateTrayectografiaTrazas({
      tiempoTraza: this.#fieldToNum(this.tiempoTrazaField()),
      tiempoTrazaUnit: this.tiempoTrazaField()?.unit ?? t.tiempoTrazaUnit,
      existenciaTrazaRadar: this.existenciaTrazaField(),
      observaciones: this.observacionesField(),
    });
    this.#syncSnapshot();
  }

  reset(): void {
    const trazas = this.#store.trayectografiaIntroduction().trazas;
    this.tiempoTrazaField.set(this.#numToField(trazas.tiempoTraza, trazas.tiempoTrazaUnit));
    this.existenciaTrazaField.set(trazas.existenciaTrazaRadar);
    this.observacionesField.set(trazas.observaciones);
    this.#syncSnapshot();
  }

  #currentValues() {
    return {
      tiempoTraza: this.#fieldToNum(this.tiempoTrazaField()),
      tiempoTrazaUnit: this.tiempoTrazaField()?.unit,
      existenciaTraza: this.existenciaTrazaField(),
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
