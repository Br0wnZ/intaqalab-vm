import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

interface RadarTrayectographyFilters {
  serie: string | null;
  disparo: string | null;
  radar: string | null;
}

@Component({
  selector: 'inta-radar-trayectography-orientation',
  imports: [FormField, MatFormFieldModule, MatSelectModule, MatIconModule, TranslateModule, InputSelect, IntaIconComponent],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-auto">
      <!-- Header: título + filtros -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <div class="flex items-center gap-2 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.SERIE_PLACEHOLDER' | translate"
            [formField]="radarForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.DISPARO_PLACEHOLDER' | translate"
            [formField]="radarForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="flex-1"></div>

        <!-- Radar -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.RADAR_PLACEHOLDER' | translate"
            [formField]="radarForm.radar"
          >
            @for (opt of radarOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Campos de datos en dos filas de 8 -->
      <div intaReadonlyContent class="flex-1 gap-6 flex flex-col justify-end min-h-0">
        <!-- Fila 1: Pieza X/Y/Z, Alcance previsto, X/Y P. Caída, OLT geográfico, Dif. angular radar -->
        <div class="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <!-- Pieza X -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.X_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="xPiezaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="xyzPiezaUnit.set($event?.unit ?? 'm')"
          />

          <!-- Pieza Y -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Y_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="yPiezaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="xyzPiezaUnit.set($event?.unit ?? 'm')"
          />

          <!-- Pieza Z -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Z_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="zPiezaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="xyzPiezaUnit.set($event?.unit ?? 'm')"
          />

          <!-- Alcance previsto pique -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ALCANCE_PREVISTO_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="alcancePrevModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="alcancePrevUnit.set($event?.unit ?? 'm')"
          />

          <!-- X P. Caída (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.X_CAIDA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="xPCaidaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="xyCaidaUnit.set($event?.unit ?? 'm')"
          />

          <!-- Y P. Caída (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Y_CAIDA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="yCaidaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="xyCaidaUnit.set($event?.unit ?? 'm')"
          />

          <!-- OLT geográfico (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.OLT_GEOGRAFICO_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="oltGeoModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="oltUnit.set($event?.unit ?? '°')"
          />

          <!-- Dif. angular radar (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.DIF_ANGULAR_RADAR_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="difAngularModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="difAngularUnit.set($event?.unit ?? '°')"
          />
        </div>

        <!-- Fila 2: I. Trans, I. Long, V. inicial, T. vuelo, Grad. espoleta, Ángulo tiro, Peso proyectil, Altura boca -->
        <div class="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <!-- I. Transversal (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.I_TRANSVERSAL_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="iTransModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="iTransLongUnit.set($event?.unit ?? 'm')"
          />

          <!-- I. Longitudinal (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.I_LONGITUDINAL_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="iLongModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="iTransLongUnit.set($event?.unit ?? 'm')"
          />

          <!-- Velocidad inicial teórica -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.VELOCIDAD_INICIAL_LABEL' | translate"
            [opciones]="velocityUnits"
            [value]="velocidadModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="velocidadUnit.set($event?.unit ?? 'm/s')"
          />

          <!-- Tiempo de vuelo teórico -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.TIEMPO_VUELO_LABEL' | translate"
            [opciones]="timeUnits"
            [value]="tiempoVueloModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="tiempoVueloUnit.set($event?.unit ?? 's')"
          />

          <!-- Graduación de espoleta -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.GRAD_ESPOLETA_LABEL' | translate"
            [opciones]="timeUnits"
            [value]="gradEspoletaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="gradEspoletaUnit.set($event?.unit ?? 's')"
          />

          <!-- Ángulo de tiro -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ANGULO_TIRO_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="anguloTiroModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="anguloTiroUnit.set($event?.unit ?? '°')"
          />

          <!-- Peso nominal del proyectil -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.PESO_PROYECTIL_LABEL' | translate"
            [opciones]="massUnits"
            [value]="pesoProyectilModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="pesoProyectilUnit.set($event?.unit ?? 'g')"
          />

          <!-- Altura de boca (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ALTURA_BOCA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="alturaBocaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
            (valueChange)="alturaBocaUnit.set($event?.unit ?? 'm')"
          />
        </div>
      </div>
    </div>
  `,
  styles: `
    inta-radar-trayectography-orientation ui-input-select {
      min-width: 0;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarTrayectographyOrientation extends BaseFormWidgetComponent {
  /** ID del widget — requerido desde execution-grid */
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  // ── Datos desde el store — opciones y valores de otros widgets ────────────

  protected readonly radarOptions = computed(() => this.#store.radarTrayectographyOrientation().radarOptions);
  protected readonly serieOptions = computed<{ value: string; label: string }[]>(() => []);
  protected readonly disparoOptions = computed<{ value: string; label: string }[]>(() => []);

  /** Valores de entrada de otros widgets MAO (formateados para display) */
  protected readonly xPieza = computed(() => this.#store.radarTrayectographyOrientation().xPieza?.toFixed(1) ?? null);
  protected readonly yPieza = computed(() => this.#store.radarTrayectographyOrientation().yPieza?.toFixed(1) ?? null);
  protected readonly zPieza = computed(() => this.#store.radarTrayectographyOrientation().zPieza?.toFixed(1) ?? null);
  protected readonly alcancePrevisto = computed(
    () => this.#store.radarTrayectographyOrientation().alcancePrevistoPique?.toFixed(1) ?? null,
  );
  protected readonly velocidadInicial = computed(
    () => this.#store.radarTrayectographyOrientation().velocidadInicialTeorica?.toFixed(2) ?? null,
  );
  protected readonly tiempoVuelo = computed(
    () => this.#store.radarTrayectographyOrientation().tiempoVueloTeorico?.toFixed(2) ?? null,
  );
  protected readonly gradEspoleta = computed(
    () => this.#store.radarTrayectographyOrientation().graduacionEspoleta?.toFixed(2) ?? null,
  );
  protected readonly anguloTiroFmt = computed(
    () => this.#store.radarTrayectographyOrientation().anguloTiro?.toFixed(2) ?? null,
  );
  protected readonly pesoProyectil = computed(
    () => this.#store.radarTrayectographyOrientation().pesoNominalProyectil?.toFixed(2) ?? null,
  );

  /** Valores calculados en el store */
  protected readonly xPCaida = computed(() => this.#store.radarTrayectographyXPCaida()?.toFixed(2) ?? null);
  protected readonly yCaida = computed(() => this.#store.radarTrayectographyYPCaida()?.toFixed(2) ?? null);
  protected readonly oltGeografico = computed(() => this.#store.radarTrayectographyOltGeografico()?.toFixed(3) ?? null);
  protected readonly difAngularRadar = computed(
    () => this.#store.radarTrayectographyDifAngularRadar()?.toFixed(2) ?? null,
  );
  protected readonly iTransversal = computed(() => this.#store.radarTrayectographyITransversal()?.toFixed(2) ?? null);
  protected readonly iLongitudinal = computed(() => this.#store.radarTrayectographyILongitudinal()?.toFixed(2) ?? null);
  protected readonly alturaBoca = computed(() => this.#store.radarTrayectographyAlturaBoca()?.toFixed(2) ?? null);

  // ── Modelos combinados (value + unit) para InputSelect ────────────────────

  protected readonly xPiezaModel = computed(() => ({ value: this.xPieza() ?? '', unit: this.xyzPiezaUnit() }));
  protected readonly yPiezaModel = computed(() => ({ value: this.yPieza() ?? '', unit: this.xyzPiezaUnit() }));
  protected readonly zPiezaModel = computed(() => ({ value: this.zPieza() ?? '', unit: this.xyzPiezaUnit() }));
  protected readonly alcancePrevModel = computed(() => ({
    value: this.alcancePrevisto() ?? '',
    unit: this.alcancePrevUnit(),
  }));
  protected readonly xPCaidaModel = computed(() => ({ value: this.xPCaida() ?? '', unit: this.xyCaidaUnit() }));
  protected readonly yCaidaModel = computed(() => ({ value: this.yCaida() ?? '', unit: this.xyCaidaUnit() }));
  protected readonly oltGeoModel = computed(() => ({ value: this.oltGeografico() ?? '', unit: this.oltUnit() }));
  protected readonly difAngularModel = computed(() => ({
    value: this.difAngularRadar() ?? '',
    unit: this.difAngularUnit(),
  }));
  protected readonly iTransModel = computed(() => ({ value: this.iTransversal() ?? '', unit: this.iTransLongUnit() }));
  protected readonly iLongModel = computed(() => ({ value: this.iLongitudinal() ?? '', unit: this.iTransLongUnit() }));
  protected readonly velocidadModel = computed(() => ({
    value: this.velocidadInicial() ?? '',
    unit: this.velocidadUnit(),
  }));
  protected readonly tiempoVueloModel = computed(() => ({
    value: this.tiempoVuelo() ?? '',
    unit: this.tiempoVueloUnit(),
  }));
  protected readonly gradEspoletaModel = computed(() => ({
    value: this.gradEspoleta() ?? '',
    unit: this.gradEspoletaUnit(),
  }));
  protected readonly anguloTiroModel = computed(() => ({
    value: this.anguloTiroFmt() ?? '',
    unit: this.anguloTiroUnit(),
  }));
  protected readonly pesoProyectilModel = computed(() => ({
    value: this.pesoProyectil() ?? '',
    unit: this.pesoProyectilUnit(),
  }));
  protected readonly alturaBocaModel = computed(() => ({
    value: this.alturaBoca() ?? '',
    unit: this.alturaBocaUnit(),
  }));

  // ── Señales de unidad (preferencias de visualización, no afectan al store) ─

  protected readonly xyzPiezaUnit = signal('m');
  protected readonly alcancePrevUnit = signal('m');
  protected readonly xyCaidaUnit = signal('m');
  protected readonly oltUnit = signal('°');
  protected readonly difAngularUnit = signal('°');
  protected readonly iTransLongUnit = signal('m');
  protected readonly velocidadUnit = signal('m/s');
  protected readonly tiempoVueloUnit = signal('s');
  protected readonly gradEspoletaUnit = signal('s');
  protected readonly anguloTiroUnit = signal('°');
  protected readonly pesoProyectilUnit = signal('g');
  protected readonly alturaBocaUnit = signal('m');

  // ── Opciones de unidades ──────────────────────────────────────────────────

  protected readonly distanceUnits = [
    { value: 'm', label: 'm' },
    { value: 'cm', label: 'cm' },
    { value: 'ft', label: 'ft' },
  ];
  protected readonly angleUnits = [
    { value: '°', label: '°' },
    { value: 'rad', label: 'rad' },
    { value: 'mrad', label: 'mrad' },
  ];
  protected readonly velocityUnits = [
    { value: 'm/s', label: 'm/s' },
    { value: 'ft/s', label: 'ft/s' },
  ];
  protected readonly timeUnits = [
    { value: 's', label: 's' },
    { value: 'ms', label: 'ms' },
  ];
  protected readonly massUnits = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
  ];

  // ── Signal Form (filtros: serie, disparo, radar) ──────────────────────────

  protected readonly formModel = signal<RadarTrayectographyFilters>({
    serie: this.#store.radarTrayectographyOrientation().serie,
    disparo: this.#store.radarTrayectographyOrientation().disparo,
    radar: this.#store.radarTrayectographyOrientation().radar,
  });

  protected readonly radarForm = form(this.formModel);

  // ── FormWidget implementation ─────────────────────────────────────────────

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.radarForm().dirty(),
    touched: this.radarForm().touched(),
    valid: this.radarForm().valid(),
    hasChanges: this.radarForm().dirty(),
  }));

  resetForm(): void {
    const s = this.#store.radarTrayectographyOrientation();
    this.formModel.set({ serie: s.serie, disparo: s.disparo, radar: s.radar });
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, radar } = this.formModel();
    this.#store.updateRadarTrayectographySelection({ serie, disparo, radar });
  }
}
