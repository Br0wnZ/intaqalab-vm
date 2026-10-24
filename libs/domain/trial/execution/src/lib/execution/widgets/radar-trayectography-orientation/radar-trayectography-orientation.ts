import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { MeasureUnitEnum, toUnitOptions } from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import {
  mapRadarSeriesToOptions,
  mapRadarShotsToOptions,
  resolveInitialShotSelection,
} from '../utils/selection-options';

interface RadarTrayectographyFilters {
  serie: string | null;
  disparo: string | null;
  radar: string | null;
}

@Component({
  selector: 'inta-radar-trayectography-orientation',
  imports: [
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-auto">
      <!-- Header: título + filtros -->
      <div data-testid="radar-filters" class="flex items-center gap-2 shrink-0 flex-wrap">
        <div class="flex items-center gap-2 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        @if (showSerieSelector()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
            <mat-select
              [formField]="radarForm.serie"
              [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.SERIE_LABEL' | translate"
              (selectionChange)="onSerieChange($event.value)"
            >
              @for (opt of serieOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <!-- Disparo -->
        @if (showDisparoSelector()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
            <mat-select [formField]="radarForm.disparo" (selectionChange)="onDisparoChange($event.value)">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.DISPARO_PLACEHOLDER' | translate }}
              </mat-label>
              @for (opt of disparoOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <div class="flex-1"></div>

        <!-- Radar -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select [formField]="radarForm.radar">
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.RADAR_PLACEHOLDER' | translate }}
            </mat-label>
            @for (opt of radarOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Campos de datos en dos filas de 8 -->
      <div intaReadonlyContent class="flex-1 gap-6 flex flex-col justify-evenly min-h-0">
        <!-- Fila 1: Pieza X/Y/Z, Alcance previsto, X/Y P. Caída, OLT geográfico, Dif. angular radar -->
        <div class="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <!-- Pieza X -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.X_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="xPiezaModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Pieza Y -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Y_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="yPiezaModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Pieza Z -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Z_PIEZA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="zPiezaModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Alcance previsto pique -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ALCANCE_PREVISTO_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="alcancePrevModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- X P. Caída (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.X_CAIDA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="xPCaidaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Y P. Caída (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.Y_CAIDA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="yCaidaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- OLT geográfico (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.OLT_GEOGRAFICO_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="oltGeoModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Dif. angular radar (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.DIF_ANGULAR_RADAR_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="difAngularModel()"
            [readOnly]="true"
            [placeholder]="'—'"
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
          />

          <!-- I. Longitudinal (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.I_LONGITUDINAL_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="iLongModel()"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Velocidad inicial teórica -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.VELOCIDAD_INICIAL_LABEL' | translate"
            [opciones]="velocityUnits"
            [value]="velocidadModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Tiempo de vuelo teórico -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.TIEMPO_VUELO_LABEL' | translate"
            [opciones]="timeUnits"
            [value]="tiempoVueloModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Graduación de espoleta -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.GRAD_ESPOLETA_LABEL' | translate"
            [opciones]="timeUnits"
            [value]="gradEspoletaModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Ángulo de tiro -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ANGULO_TIRO_LABEL' | translate"
            [opciones]="angleUnits"
            [value]="anguloTiroModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Peso nominal del proyectil -->
          <ui-input-select
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.PESO_PROYECTIL_LABEL' | translate"
            [opciones]="massUnits"
            [value]="pesoProyectilModel()"
            [decimals]="3"
            [readOnly]="true"
            [placeholder]="'—'"
          />

          <!-- Altura de boca (calculado) -->
          <ui-input-select
            variant="computed"
            [label]="'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.ALTURA_BOCA_LABEL' | translate"
            [opciones]="distanceUnits"
            [value]="alturaBocaModel()"
            [readOnly]="true"
            [placeholder]="'—'"
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
  readonly #trialShots = injectTrialShots();
  readonly #planningSeries = computed(() => {
    const trialSeries = this.#trialShots.series();
    return trialSeries?.length ? trialSeries : (this.#store.planningSeries() ?? []);
  });
  #hasManualSelection = false;

  // ── Datos desde el store — opciones y valores de otros widgets ────────────

  protected readonly radarOptions = computed(() => this.#store.radarTrayectographyOrientation().radarOptions);
  protected readonly serieOptions = computed(() =>
    mapRadarSeriesToOptions(this.#store.radarTrayectographyOrientationResponse()?.series ?? [], this.#planningSeries()),
  );
  protected readonly disparoOptions = computed(() => {
    const response = this.#store.radarTrayectographyOrientationResponse();
    const serie = response?.series.find((item) => item.seriesId === this.formModel().serie) ?? response?.series[0];
    const plannedSerie = this.#planningSeries().find((item) => item.id === serie?.seriesId);
    return mapRadarShotsToOptions(serie?.shots ?? [], plannedSerie?.shots ?? []);
  });
  protected readonly showSerieSelector = computed(() => {
    const response = this.#store.radarTrayectographyOrientationResponse();
    return response !== undefined && response.series.length > 1 && !response.sameForAllSeries;
  });
  protected readonly showDisparoSelector = computed(() => {
    const response = this.#store.radarTrayectographyOrientationResponse();
    const serie = response?.series.find((item) => item.seriesId === this.formModel().serie) ?? response?.series[0];
    return serie !== undefined && serie.shots.length > 1 && !serie.sameForAllShots;
  });
  protected readonly selectedOrientationData = computed(() => {
    const response = this.#store.radarTrayectographyOrientationResponse();
    const serie = response?.series.find((item) => item.seriesId === this.formModel().serie) ?? response?.series[0];
    return (
      serie?.shots.find((item) => item.shotId === this.formModel().disparo)?.orientationData ??
      serie?.shots[0]?.orientationData ??
      null
    );
  });

  /** Valores de entrada de otros widgets MAO (formateados para display) */
  protected readonly xPieza = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().xPieza : data.pieceX;
  });
  protected readonly yPieza = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().yPieza : data.pieceY;
  });
  protected readonly zPieza = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().zPieza : data.pieceZ;
  });
  protected readonly alcancePrevisto = computed(() => {
    const data = this.selectedOrientationData();
    return data === null
      ? this.#store.radarTrayectographyOrientation().alcancePrevistoPique
      : data.plannedImpactDistance;
  });
  protected readonly velocidadInicial = computed(() => {
    const data = this.selectedOrientationData();
    return data === null
      ? this.#store.radarTrayectographyOrientation().velocidadInicialTeorica
      : data.theoreticalInitialVelocity;
  });
  protected readonly tiempoVuelo = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().tiempoVueloTeorico : data.theoreticalFlightTime;
  });
  protected readonly gradEspoleta = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().graduacionEspoleta : data.fuseGraduation;
  });
  protected readonly anguloTiroFmt = computed(() => {
    const data = this.selectedOrientationData();
    return data === null ? this.#store.radarTrayectographyOrientation().anguloTiro : data.shootingAngle;
  });
  protected readonly pesoProyectil = computed(() => {
    const data = this.selectedOrientationData();
    return data === null
      ? this.#store.radarTrayectographyOrientation().pesoNominalProyectil
      : data.nominalProjectileWeight;
  });

  /** Valores calculados en el store */
  protected readonly xPCaida = computed(() => this.#store.radarTrayectographyXPCaida()?.toString() ?? null);
  protected readonly yCaida = computed(() => this.#store.radarTrayectographyYPCaida()?.toString() ?? null);
  protected readonly oltGeografico = computed(() => this.#store.radarTrayectographyOltGeografico()?.toString() ?? null);
  protected readonly difAngularRadar = computed(
    () => this.#store.radarTrayectographyDifAngularRadar()?.toString() ?? null,
  );
  protected readonly iTransversal = computed(() => this.#store.radarTrayectographyITransversal()?.toString() ?? null);
  protected readonly iLongitudinal = computed(() => this.#store.radarTrayectographyILongitudinal()?.toString() ?? null);
  protected readonly alturaBoca = computed(() => this.#store.radarTrayectographyAlturaBoca()?.toString() ?? null);

  // ── Modelos combinados (value + unit) para InputSelect ────────────────────

  protected readonly xPiezaModel = computed(() => ({
    value: this.xPieza(),
    unit: this.selectedOrientationData()?.pieceXUnit ?? MeasureUnitEnum.M,
  }));
  protected readonly yPiezaModel = computed(() => ({
    value: this.yPieza(),
    unit: this.selectedOrientationData()?.pieceYUnit ?? MeasureUnitEnum.M,
  }));
  protected readonly zPiezaModel = computed(() => ({
    value: this.zPieza(),
    unit: this.selectedOrientationData()?.pieceZUnit ?? MeasureUnitEnum.M,
  }));
  protected readonly alcancePrevModel = computed(() => ({
    value: this.alcancePrevisto(),
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
    value: this.velocidadInicial(),
    unit: this.velocidadUnit(),
  }));
  protected readonly tiempoVueloModel = computed(() => ({
    value: this.tiempoVuelo(),
    unit: this.tiempoVueloUnit(),
  }));
  protected readonly gradEspoletaModel = computed(() => ({
    value: this.gradEspoleta(),
    unit: this.gradEspoletaUnit(),
  }));
  protected readonly anguloTiroModel = computed(() => ({
    value: this.anguloTiroFmt(),
    unit: this.anguloTiroUnit(),
  }));
  protected readonly pesoProyectilModel = computed(() => ({
    value: this.pesoProyectil(),
    unit: this.pesoProyectilUnit(),
  }));
  protected readonly alturaBocaModel = computed(() => ({
    value: this.alturaBoca() ?? '',
    unit: this.alturaBocaUnit(),
  }));

  // ── Señales de unidad (preferencias de visualización, no afectan al store) ─

  protected readonly alcancePrevUnit = computed(
    () => this.selectedOrientationData()?.plannedImpactDistanceUnit ?? MeasureUnitEnum.M,
  );
  protected readonly xyCaidaUnit = signal(MeasureUnitEnum.M);
  protected readonly oltUnit = signal(MeasureUnitEnum.DEGREES);
  protected readonly difAngularUnit = signal(MeasureUnitEnum.DEGREES);
  protected readonly iTransLongUnit = signal(MeasureUnitEnum.M);
  protected readonly velocidadUnit = computed(
    () => this.selectedOrientationData()?.theoreticalInitialVelocityUnit ?? MeasureUnitEnum.M_S,
  );
  protected readonly tiempoVueloUnit = computed(
    () => this.selectedOrientationData()?.theoreticalFlightTimeUnit ?? MeasureUnitEnum.S,
  );
  protected readonly gradEspoletaUnit = computed(
    () => this.selectedOrientationData()?.fuseGraduationUnit ?? MeasureUnitEnum.S,
  );
  protected readonly anguloTiroUnit = computed(
    () => this.selectedOrientationData()?.shootingAngleUnit ?? MeasureUnitEnum.DEGREES,
  );
  protected readonly pesoProyectilUnit = computed(
    () => this.selectedOrientationData()?.nominalProjectileWeightUnit ?? MeasureUnitEnum.G,
  );
  protected readonly alturaBocaUnit = signal(MeasureUnitEnum.M);

  // ── Opciones de unidades ──────────────────────────────────────────────────

  protected readonly distanceUnits = toUnitOptions([
    MeasureUnitEnum.UM,
    MeasureUnitEnum.MM,
    MeasureUnitEnum.M,
    MeasureUnitEnum.KM,
  ]);
  protected readonly angleUnits = toUnitOptions([MeasureUnitEnum.DEGREES, MeasureUnitEnum.RAD, MeasureUnitEnum.MILS]);
  protected readonly velocityUnits = toUnitOptions([MeasureUnitEnum.M_S, MeasureUnitEnum.KM_H]);
  protected readonly timeUnits = toUnitOptions([MeasureUnitEnum.S, MeasureUnitEnum.MS]);
  protected readonly massUnits = toUnitOptions([MeasureUnitEnum.G, MeasureUnitEnum.KG]);

  // ── Signal Form (filtros: serie, disparo, radar) ──────────────────────────

  protected readonly formModel = signal<RadarTrayectographyFilters>({
    serie: this.#store.radarTrayectographyOrientation().serie,
    disparo: this.#store.radarTrayectographyOrientation().disparo,
    radar: this.#store.radarTrayectographyOrientation().radar,
  });

  protected readonly radarForm = form(this.formModel);

  constructor() {
    super();
    let previousFireTrialId: string | null = null;
    let previousRadarId: string | null = null;
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const radarId = this.formModel().radar;
      if (!fireTrialId) return;

      const fireTrialChanged = fireTrialId !== previousFireTrialId;
      const radarChanged = radarId !== previousRadarId;
      if (!fireTrialChanged && !radarChanged) return;

      previousFireTrialId = fireTrialId;
      previousRadarId = radarId;
      if (!fireTrialChanged && !this.#hasRequiredSelection()) return;

      untracked(() => this.#store.loadRadarTrayectographyOrientation(fireTrialId, radarId));
    });

    let previousActiveSerieId = this.#store.activeSerieId();
    let previousActiveShotId = this.#store.activeShotId();
    effect(() => {
      const serie = this.#store.activeSerieId();
      const disparo = this.#store.activeShotId();
      const fireTrialId = this.#store.fireTrialId();
      const current = this.formModel();
      const serieChanged = serie !== previousActiveSerieId;
      const disparoChanged = disparo !== previousActiveShotId;
      previousActiveSerieId = serie;
      previousActiveShotId = disparo;

      untracked(() => {
        if (serie && serie !== current.serie) this.formModel.update((value) => ({ ...value, serie }));
        if (disparo && disparo !== current.disparo) this.formModel.update((value) => ({ ...value, disparo }));
      });

      if (!fireTrialId || (!serieChanged && !disparoChanged)) return;
      const shouldReload =
        (serieChanged && this.showSerieSelector() && Boolean(serie)) ||
        (disparoChanged && this.showDisparoSelector() && Boolean(disparo));
      if (shouldReload) {
        untracked(() => this.#store.loadRadarTrayectographyOrientation(fireTrialId, current.radar));
      }
    });

    effect(() => {
      const response = this.#store.radarTrayectographyOrientationResponse();
      const current = this.formModel();
      if (!response) return;

      const selection = this.#hasManualSelection
        ? { serie: current.serie, disparo: current.disparo }
        : resolveInitialShotSelection({
            seriesOptions: this.serieOptions(),
            activeSerieId: this.#store.activeSerieId(),
            activeShotId: this.#store.activeShotId(),
            getShotOptions: (serieId) =>
              response.series
                .find((serie) => serie.seriesId === serieId)
                ?.shots.map((shot) => ({ value: shot.shotId, label: shot.shotId })) ?? [],
          });
      const serie = response.series.find((item) => item.seriesId === selection.serie) ?? response.series[0] ?? null;
      const disparo = serie?.shots.find((item) => item.shotId === selection.disparo) ?? serie?.shots[0] ?? null;
      const serieId = serie?.seriesId ?? null;
      const disparoId = disparo?.shotId ?? null;
      if (current.serie === serieId && current.disparo === disparoId) return;

      untracked(() => this.formModel.update((value) => ({ ...value, serie: serieId, disparo: disparoId })));
    });
  }

  protected onSerieChange(serie: string | null): void {
    this.#hasManualSelection = true;
    this.formModel.update((value) => ({ ...value, serie }));
    this.formModel.update((value) => ({ ...value, disparo: this.disparoOptions()[0]?.value ?? null }));
    if (this.showSerieSelector()) this.#loadOrientation();
  }

  protected onDisparoChange(disparo: string | null): void {
    this.#hasManualSelection = true;
    this.formModel.update((value) => ({ ...value, disparo }));
    if (this.showDisparoSelector()) this.#loadOrientation();
  }

  #loadOrientation(): void {
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId) return;
    this.#store.loadRadarTrayectographyOrientation(fireTrialId, this.formModel().radar);
  }

  #hasRequiredSelection(): boolean {
    const serieRequired = this.showSerieSelector();
    const disparoRequired = this.showDisparoSelector();
    const selection = this.formModel();

    if (!serieRequired && !disparoRequired) return true;
    return (!serieRequired || Boolean(selection.serie)) && (!disparoRequired || Boolean(selection.disparo));
  }

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
