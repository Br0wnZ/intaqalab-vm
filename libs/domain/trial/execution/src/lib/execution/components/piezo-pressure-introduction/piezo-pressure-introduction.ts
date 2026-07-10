import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore, type PiezoPosicionState } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type PiezoTab = 'cierre' | 'intermedio' | 'culote';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

interface PiezoFormModel {
  captador: string | null;
  amplificador: string | null;
  registrador: string | null;
}

@Component({
  selector: 'inta-piezo-pressure-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div
      class="h-full rounded-2xl border border-blue-200 bg-white p-3 flex flex-col gap-1.5 justify-between overflow-auto"
    >
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectorForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Tab chips -->
        <div class="flex flex-wrap self-center gap-2 shrink-0">
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'cierre'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('cierre')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CIERRE' | translate }}
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'intermedio'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('intermedio')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_INTERMEDIO' | translate }}
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'culote'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('culote')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CULOTE' | translate }}
          </button>
        </div>

        <!-- Estado del disparo -->
        <span
          class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start sm:ml-4"
          [class]="estadoClass()"
        >
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="flex flex-col min-h-0">
        @switch (activeTab()) {
          @case ('cierre') {
            <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-0 justify-end items-end">
              <!-- Row 1: Selects -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_PLACEHOLDER' | translate"
                  [formField]="cierreForm.captador"
                >
                  @for (opt of captadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_PLACEHOLDER' | translate"
                  [formField]="cierreForm.amplificador"
                >
                  @for (opt of amplificadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_PLACEHOLDER' | translate"
                  [formField]="cierreForm.registrador"
                >
                  @for (opt of registradorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <!-- Row 2: Numerics -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_PLACEHOLDER' | translate"
                  [value]="cierrePresionMaxima() ?? ''"
                  (input)="cierrePresionMaxima.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">bar</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_PLACEHOLDER' | translate"
                  [value]="cierreAccion() ?? ''"
                  (input)="cierreAccion.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_PLACEHOLDER' | translate"
                  [value]="cierreRetardo() ?? ''"
                  (input)="cierreRetardo.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
            </div>
          }
          @case ('intermedio') {
            <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-0 justify-end items-end">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_PLACEHOLDER' | translate"
                  [formField]="intermedioForm.captador"
                >
                  @for (opt of captadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_PLACEHOLDER' | translate"
                  [formField]="intermedioForm.amplificador"
                >
                  @for (opt of amplificadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_PLACEHOLDER' | translate"
                  [formField]="intermedioForm.registrador"
                >
                  @for (opt of registradorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_PLACEHOLDER' | translate"
                  [value]="intermedioPresionMaxima() ?? ''"
                  (input)="intermedioPresionMaxima.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">bar</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_PLACEHOLDER' | translate"
                  [value]="intermedioAccion() ?? ''"
                  (input)="intermedioAccion.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_PLACEHOLDER' | translate"
                  [value]="intermedioRetardo() ?? ''"
                  (input)="intermedioRetardo.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
            </div>
          }
          @case ('culote') {
            <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-0 justify-end items-end">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_PLACEHOLDER' | translate"
                  [formField]="culoteForm.captador"
                >
                  @for (opt of captadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_PLACEHOLDER' | translate"
                  [formField]="culoteForm.amplificador"
                >
                  @for (opt of amplificadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_PLACEHOLDER' | translate"
                  [formField]="culoteForm.registrador"
                >
                  @for (opt of registradorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_PLACEHOLDER' | translate"
                  [value]="culotePresionMaxima() ?? ''"
                  (input)="culotePresionMaxima.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">bar</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_PLACEHOLDER' | translate"
                  [value]="culoteAccion() ?? ''"
                  (input)="culoteAccion.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_LABEL' | translate }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_PLACEHOLDER' | translate"
                  [value]="culoteRetardo() ?? ''"
                  (input)="culoteRetardo.set(parseNumber($any($event.target).value))"
                />
                <span matSuffix class="text-xs text-slate-500 pr-4">ms</span>
              </mat-form-field>
            </div>
          }
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiezoPressureIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── UI state ───────────────────────────────────────────────────────────────
  protected readonly activeTab = signal<PiezoTab>('cierre');

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.piezoPressureIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.piezoPressureIntroduction().disparoOptions);
  protected readonly captadorOptions = computed(() => this.#store.piezoPressureIntroduction().captadorOptions);
  protected readonly amplificadorOptions = computed(() => this.#store.piezoPressureIntroduction().amplificadorOptions);
  protected readonly registradorOptions = computed(() => this.#store.piezoPressureIntroduction().registradorOptions);

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.piezoPressureIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'En curso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EJECUTADA':
        return 'Ejecutada';
      default:
        return '—';
    }
  });

  protected readonly estadoClass = computed(() => {
    switch (this.#store.piezoPressureIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-700';
      case 'EJECUTADA':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

  // ── Selector form ──────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.piezoPressureIntroduction().serie,
    disparo: this.#store.piezoPressureIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Per-tab form models (select fields) ────────────────────────────────────
  protected readonly cierreFormModel = signal<PiezoFormModel>({
    captador: this.#store.piezoPressureIntroduction().cierre.captador,
    amplificador: this.#store.piezoPressureIntroduction().cierre.amplificador,
    registrador: this.#store.piezoPressureIntroduction().cierre.registrador,
  });
  protected readonly cierreForm = form(this.cierreFormModel);

  protected readonly intermedioFormModel = signal<PiezoFormModel>({
    captador: this.#store.piezoPressureIntroduction().intermedio.captador,
    amplificador: this.#store.piezoPressureIntroduction().intermedio.amplificador,
    registrador: this.#store.piezoPressureIntroduction().intermedio.registrador,
  });
  protected readonly intermedioForm = form(this.intermedioFormModel);

  protected readonly culoteFormModel = signal<PiezoFormModel>({
    captador: this.#store.piezoPressureIntroduction().culote.captador,
    amplificador: this.#store.piezoPressureIntroduction().culote.amplificador,
    registrador: this.#store.piezoPressureIntroduction().culote.registrador,
  });
  protected readonly culoteForm = form(this.culoteFormModel);

  // ── Numeric plain signals (fixed units) ───────────────────────────────────
  protected readonly cierrePresionMaxima = signal<number | null>(
    this.#store.piezoPressureIntroduction().cierre.presionMaxima,
  );
  protected readonly cierreAccion = signal<number | null>(this.#store.piezoPressureIntroduction().cierre.tiempoAccion);
  protected readonly cierreRetardo = signal<number | null>(
    this.#store.piezoPressureIntroduction().cierre.tiempoRetardo,
  );
  protected readonly intermedioPresionMaxima = signal<number | null>(
    this.#store.piezoPressureIntroduction().intermedio.presionMaxima,
  );
  protected readonly intermedioAccion = signal<number | null>(
    this.#store.piezoPressureIntroduction().intermedio.tiempoAccion,
  );
  protected readonly intermedioRetardo = signal<number | null>(
    this.#store.piezoPressureIntroduction().intermedio.tiempoRetardo,
  );
  protected readonly culotePresionMaxima = signal<number | null>(
    this.#store.piezoPressureIntroduction().culote.presionMaxima,
  );
  protected readonly culoteAccion = signal<number | null>(this.#store.piezoPressureIntroduction().culote.tiempoAccion);
  protected readonly culoteRetardo = signal<number | null>(
    this.#store.piezoPressureIntroduction().culote.tiempoRetardo,
  );

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    cierrePresionMaxima: this.cierrePresionMaxima(),
    cierreAccion: this.cierreAccion(),
    cierreRetardo: this.cierreRetardo(),
    intermedioPresionMaxima: this.intermedioPresionMaxima(),
    intermedioAccion: this.intermedioAccion(),
    intermedioRetardo: this.intermedioRetardo(),
    culotePresionMaxima: this.culotePresionMaxima(),
    culoteAccion: this.culoteAccion(),
    culoteRetardo: this.culoteRetardo(),
  });

  protected readonly isDirty = computed(() => {
    if (
      this.selectorForm().dirty() ||
      this.cierreForm().dirty() ||
      this.intermedioForm().dirty() ||
      this.culoteForm().dirty()
    )
      return true;
    const snap = this.#savedSnapshot();
    return (
      this.cierrePresionMaxima() !== snap.cierrePresionMaxima ||
      this.cierreAccion() !== snap.cierreAccion ||
      this.cierreRetardo() !== snap.cierreRetardo ||
      this.intermedioPresionMaxima() !== snap.intermedioPresionMaxima ||
      this.intermedioAccion() !== snap.intermedioAccion ||
      this.intermedioRetardo() !== snap.intermedioRetardo ||
      this.culotePresionMaxima() !== snap.culotePresionMaxima ||
      this.culoteAccion() !== snap.culoteAccion ||
      this.culoteRetardo() !== snap.culoteRetardo
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid:
      this.selectorForm().valid() &&
      this.cierreForm().valid() &&
      this.intermedioForm().valid() &&
      this.culoteForm().valid(),
    hasChanges: this.isDirty(),
  }));

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  resetForm(): void {
    const stored = this.#store.piezoPressureIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.#resetPosicion('cierre', stored.cierre);
    this.#resetPosicion('intermedio', stored.intermedio);
    this.#resetPosicion('culote', stored.culote);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const cierre: PiezoPosicionState = {
      ...this.cierreFormModel(),
      presionMaxima: this.cierrePresionMaxima(),
      tiempoAccion: this.cierreAccion(),
      tiempoRetardo: this.cierreRetardo(),
    };
    const intermedio: PiezoPosicionState = {
      ...this.intermedioFormModel(),
      presionMaxima: this.intermedioPresionMaxima(),
      tiempoAccion: this.intermedioAccion(),
      tiempoRetardo: this.intermedioRetardo(),
    };
    const culote: PiezoPosicionState = {
      ...this.culoteFormModel(),
      presionMaxima: this.culotePresionMaxima(),
      tiempoAccion: this.culoteAccion(),
      tiempoRetardo: this.culoteRetardo(),
    };
    this.#store.updatePiezoPressureIntroduction({ serie, disparo, cierre, intermedio, culote });
    this.#syncSnapshot();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  protected parseNumber(value: string): number | null {
    if (!value && value !== '0') return null;
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  #resetPosicion(tab: 'cierre' | 'intermedio' | 'culote', stored: PiezoPosicionState): void {
    const formModel = signal<PiezoFormModel>({
      captador: stored.captador,
      amplificador: stored.amplificador,
      registrador: stored.registrador,
    });
    if (tab === 'cierre') {
      this.cierreFormModel.set({
        captador: stored.captador,
        amplificador: stored.amplificador,
        registrador: stored.registrador,
      });
      this.cierrePresionMaxima.set(stored.presionMaxima);
      this.cierreAccion.set(stored.tiempoAccion);
      this.cierreRetardo.set(stored.tiempoRetardo);
    } else if (tab === 'intermedio') {
      this.intermedioFormModel.set({
        captador: stored.captador,
        amplificador: stored.amplificador,
        registrador: stored.registrador,
      });
      this.intermedioPresionMaxima.set(stored.presionMaxima);
      this.intermedioAccion.set(stored.tiempoAccion);
      this.intermedioRetardo.set(stored.tiempoRetardo);
    } else {
      this.culoteFormModel.set({
        captador: stored.captador,
        amplificador: stored.amplificador,
        registrador: stored.registrador,
      });
      this.culotePresionMaxima.set(stored.presionMaxima);
      this.culoteAccion.set(stored.tiempoAccion);
      this.culoteRetardo.set(stored.tiempoRetardo);
    }
    void formModel; // suppress unused warning
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      cierrePresionMaxima: this.cierrePresionMaxima(),
      cierreAccion: this.cierreAccion(),
      cierreRetardo: this.cierreRetardo(),
      intermedioPresionMaxima: this.intermedioPresionMaxima(),
      intermedioAccion: this.intermedioAccion(),
      intermedioRetardo: this.intermedioRetardo(),
      culotePresionMaxima: this.culotePresionMaxima(),
      culoteAccion: this.culoteAccion(),
      culoteRetardo: this.culoteRetardo(),
    });
  }
}
