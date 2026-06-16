import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { JltMaoState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { JltMaoMassConfigDialogResult } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';

type InputFieldValue = { value: string; unit: string } | null;

interface JltMaoSelectForm {
  serie: string | null;
  disparo: string | null;
  piqueta: string | null;
}

@Component({
  selector: 'inta-jlt-mao',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
  ],
  template: `
    <div class="h-full rounded-2xl border border-purple-200 bg-white p-2 flex flex-col gap-1.5">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 shrink-0">
            <mat-icon class="text-purple-600 !text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
          </div>
          <h3 class="text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" class="!text-xs !h-8 !px-3" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" class="!text-xs !h-8 !px-3" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_BTN' | translate }}
        </button>

        <!-- TTN (Tabla de tiro numérica) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-16">
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TTN_PLACEHOLDER' | translate"
            [value]="ttnField() ?? ''"
            (input)="ttnField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- OLT output (computed / read-only) -->
        <div class="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 shrink-0">
          <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">OLT</span>
          <span class="text-xs font-semibold text-slate-700 min-w-[36px] text-right tabular-nums">
            {{ oltDisplay() ?? '—' }}
          </span>
          <span class="text-[10px] text-slate-400">ºº</span>
        </div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 shrink-0"></div>

      <!-- Fields: 5 columns × 2 rows -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-5 gap-x-2 gap-y-1 min-h-0 content-start">
        <!-- ── Row 1 ─────────────────────────────────────────────────────── -->

        <!-- Piqueta (selector) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_PLACEHOLDER' | translate"
            [formField]="selectForm.piqueta"
          >
            @for (opt of piquetaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad inicial teórica -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_PLACEHOLDER' | translate"
          [value]="velocidadInicialField()"
          (valueChange)="velocidadInicialField.set($event)"
        />

        <!-- Distancia prevista pique -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_PLACEHOLDER' | translate"
          [value]="distanciaPiqueField()"
          (valueChange)="distanciaPiqueField.set($event)"
        />

        <!-- Deriva tabular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_PLACEHOLDER' | translate"
          [value]="derivaTabularField()"
          (valueChange)="derivaTabularField.set($event)"
        />

        <!-- Tiempo vuelo teórico -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_PLACEHOLDER' | translate"
          [value]="tiempoVueloField()"
          (valueChange)="tiempoVueloField.set($event)"
        />

        <!-- ── Row 2 ─────────────────────────────────────────────────────── -->

        <!-- Diferencia angular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_PLACEHOLDER' | translate"
          [value]="diferenciaAngularField()"
          (valueChange)="diferenciaAngularField.set($event)"
        />

        <!-- Ángulo de tiro -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_PLACEHOLDER' | translate"
          [value]="anguloTiroField()"
          (valueChange)="anguloTiroField.set($event)"
        />

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaField()"
          (valueChange)="graduacionEspoletaField.set($event)"
        />

        <!-- Altura de funcionamiento -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="alturaFuncionamientoField()"
          (valueChange)="alturaFuncionamientoField.set($event)"
        />

        <!-- Distancia de funcionamiento -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="distanciaFuncionamientoField()"
          (valueChange)="distanciaFuncionamientoField.set($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JltMao extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #dialog = inject(MatDialog);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];
  protected readonly secondsOptions = [{ value: 's', label: 's' }];
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly piquetaOptions = computed(() => this.#store.jltMao().piquetaOptions);
  protected readonly serieOptions = computed(() => this.#store.jltMao().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.jltMao().disparoOptions);

  // ── OLT output (computed from store) ─────────────────────────────────────
  protected readonly oltDisplay = computed(() => {
    const olt = this.#store.jltMaoComputedOlt();
    return olt !== null ? olt.toFixed(3) : null;
  });

  // ── Estado del disparo ────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.jltMao().estadoDisparo) {
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
    switch (this.#store.jltMao().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-700';
      case 'EJECUTADA':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

  // ── Numeric field signals (ui-input-select) ───────────────────────────────
  protected readonly velocidadInicialField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().velocidadInicialTeorica, 'm/s'),
  );
  protected readonly distanciaPiqueField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().distanciaPrevistaPique, 'm'),
  );
  protected readonly derivaTabularField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().derivaTabular, 'oo'),
  );
  protected readonly tiempoVueloField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().tiempoVueloTeorico, 's'),
  );
  protected readonly diferenciaAngularField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().diferenciaAngular, 'oo'),
  );
  protected readonly anguloTiroField = signal<InputFieldValue>(this.#numToField(this.#store.jltMao().anguloTiro, 'oo'));
  protected readonly graduacionEspoletaField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().graduacionEspoleta, 's'),
  );
  protected readonly alturaFuncionamientoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().alturaFuncionamiento, 'm'),
  );
  protected readonly distanciaFuncionamientoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().distanciaFuncionamiento, 'm'),
  );

  // ── TTN plain signal (not part of Signal Form — matInput does not accept null) ──
  protected readonly ttnField = signal<string | null>(this.#store.jltMao().ttn);

  // ── Select form ───────────────────────────────────────────────────────────
  protected readonly formModel = signal<JltMaoSelectForm>({
    serie: this.#store.jltMao().serie,
    disparo: this.#store.jltMao().disparo,
    piqueta: this.#store.jltMao().piqueta,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Dirty tracking includes TTN (separate signal) ─────────────────────────
  readonly #savedTtn = signal<string | null>(this.ttnField());

  // ── Snapshot for numeric dirty tracking ───────────────────────────────────
  readonly #savedSnapshot = signal({
    velocidadInicial: this.velocidadInicialField(),
    distanciaPique: this.distanciaPiqueField(),
    derivaTabular: this.derivaTabularField(),
    tiempoVuelo: this.tiempoVueloField(),
    diferenciaAngular: this.diferenciaAngularField(),
    anguloTiro: this.anguloTiroField(),
    graduacionEspoleta: this.graduacionEspoletaField(),
    alturaFuncionamiento: this.alturaFuncionamientoField(),
    distanciaFuncionamiento: this.distanciaFuncionamientoField(),
  });

  // ── Dirty tracking ────────────────────────────────────────────────────────
  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    if (this.ttnField() !== this.#savedTtn()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.velocidadInicialField()) !== JSON.stringify(snap.velocidadInicial) ||
      JSON.stringify(this.distanciaPiqueField()) !== JSON.stringify(snap.distanciaPique) ||
      JSON.stringify(this.derivaTabularField()) !== JSON.stringify(snap.derivaTabular) ||
      JSON.stringify(this.tiempoVueloField()) !== JSON.stringify(snap.tiempoVuelo) ||
      JSON.stringify(this.diferenciaAngularField()) !== JSON.stringify(snap.diferenciaAngular) ||
      JSON.stringify(this.anguloTiroField()) !== JSON.stringify(snap.anguloTiro) ||
      JSON.stringify(this.graduacionEspoletaField()) !== JSON.stringify(snap.graduacionEspoleta) ||
      JSON.stringify(this.alturaFuncionamientoField()) !== JSON.stringify(snap.alturaFuncionamiento) ||
      JSON.stringify(this.distanciaFuncionamientoField()) !== JSON.stringify(snap.distanciaFuncionamiento)
    );
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  resetForm(): void {
    const stored = this.#store.jltMao();
    this.ttnField.set(stored.ttn);
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      piqueta: stored.piqueta,
    });
    this.velocidadInicialField.set(this.#numToField(stored.velocidadInicialTeorica, 'm/s'));
    this.distanciaPiqueField.set(this.#numToField(stored.distanciaPrevistaPique, 'm'));
    this.derivaTabularField.set(this.#numToField(stored.derivaTabular, 'oo'));
    this.tiempoVueloField.set(this.#numToField(stored.tiempoVueloTeorico, 's'));
    this.diferenciaAngularField.set(this.#numToField(stored.diferenciaAngular, 'oo'));
    this.anguloTiroField.set(this.#numToField(stored.anguloTiro, 'oo'));
    this.graduacionEspoletaField.set(this.#numToField(stored.graduacionEspoleta, 's'));
    this.alturaFuncionamientoField.set(this.#numToField(stored.alturaFuncionamiento, 'm'));
    this.distanciaFuncionamientoField.set(this.#numToField(stored.distanciaFuncionamiento, 'm'));
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, piqueta } = this.formModel();
    const ttn = this.ttnField();
    const velocidadInicialTeorica = this.#parseNum(this.velocidadInicialField());
    const distanciaPrevistaPique = this.#parseNum(this.distanciaPiqueField());
    const derivaTabular = this.#parseNum(this.derivaTabularField());
    const tiempoVueloTeorico = this.#parseNum(this.tiempoVueloField());
    const diferenciaAngular = this.#parseNum(this.diferenciaAngularField());
    const anguloTiro = this.#parseNum(this.anguloTiroField());
    const graduacionEspoleta = this.#parseNum(this.graduacionEspoletaField());
    const alturaFuncionamiento = this.#parseNum(this.alturaFuncionamientoField());
    const distanciaFuncionamiento = this.#parseNum(this.distanciaFuncionamientoField());

    const updates: Partial<JltMaoState> = {
      serie,
      disparo,
      ttn,
      piqueta,
      velocidadInicialTeorica,
      distanciaPrevistaPique,
      derivaTabular,
      tiempoVueloTeorico,
      diferenciaAngular,
      anguloTiro,
      graduacionEspoleta,
      alturaFuncionamiento,
      distanciaFuncionamiento,
    };

    this.#store.updateJltMao(updates);

    // Propagate JLT MAO data to radar trayectography widget
    this.#store.updateRadarTrayectographyMaoData({
      alcancePrevistoPique: distanciaPrevistaPique,
      velocidadInicialTeorica,
      tiempoVueloTeorico,
      graduacionEspoleta,
      anguloTiro,
      derivaTabular,
    });

    this.#savedTtn.set(this.ttnField());
    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    this.formModel.update((m) => ({
      ...m,
      serie: activeSerieId() ?? m.serie,
      disparo: activeShotId() ?? m.disparo,
    }));
  }

  openMassConfig(): void {
    const ref = this.#dialog.open<JltMaoMassConfigDialog, unknown, JltMaoMassConfigDialogResult>(
      JltMaoMassConfigDialog,
      {
        width: '800px',
        maxWidth: '800px',
        data: {
          serieOptions: this.serieOptions(),
          piquetaOptions: this.piquetaOptions(),
          current: {
            piqueta: this.formModel().piqueta,
            velocidadInicial: this.velocidadInicialField(),
            distanciaPique: this.distanciaPiqueField(),
            derivaTabular: this.derivaTabularField(),
            tiempoVuelo: this.tiempoVueloField(),
            diferenciaAngular: this.diferenciaAngularField(),
            anguloTiro: this.anguloTiroField(),
            graduacionEspoleta: this.graduacionEspoletaField(),
            alturaFuncionamiento: this.alturaFuncionamientoField(),
            distanciaFuncionamiento: this.distanciaFuncionamientoField(),
          },
        },
      },
    );

    ref.afterClosed().subscribe((result) => {
      if (result?.action !== 'apply') return;
      if (result.piqueta !== undefined) this.formModel.update((m) => ({ ...m, piqueta: result.piqueta ?? null }));
      if (result.velocidadInicial !== undefined) this.velocidadInicialField.set(result.velocidadInicial);
      if (result.distanciaPique !== undefined) this.distanciaPiqueField.set(result.distanciaPique);
      if (result.derivaTabular !== undefined) this.derivaTabularField.set(result.derivaTabular);
      if (result.tiempoVuelo !== undefined) this.tiempoVueloField.set(result.tiempoVuelo);
      if (result.diferenciaAngular !== undefined) this.diferenciaAngularField.set(result.diferenciaAngular);
      if (result.anguloTiro !== undefined) this.anguloTiroField.set(result.anguloTiro);
      if (result.graduacionEspoleta !== undefined) this.graduacionEspoletaField.set(result.graduacionEspoleta);
      if (result.alturaFuncionamiento !== undefined) this.alturaFuncionamientoField.set(result.alturaFuncionamiento);
      if (result.distanciaFuncionamiento !== undefined)
        this.distanciaFuncionamientoField.set(result.distanciaFuncionamiento);
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #numToField(v: number | null, unit: string): InputFieldValue {
    return v !== null ? { value: String(v), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const n = parseFloat(field.value.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      velocidadInicial: this.velocidadInicialField(),
      distanciaPique: this.distanciaPiqueField(),
      derivaTabular: this.derivaTabularField(),
      tiempoVuelo: this.tiempoVueloField(),
      diferenciaAngular: this.diferenciaAngularField(),
      anguloTiro: this.anguloTiroField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
      alturaFuncionamiento: this.alturaFuncionamientoField(),
      distanciaFuncionamiento: this.distanciaFuncionamientoField(),
    });
  }
}
