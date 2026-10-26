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
  viewChild,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { IntaIconComponent } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { resolveObservedResultControlConfig, resolvePlannedVideoMagnitudes } from '../../../data-access';
import { EquipmentPlanningService } from '../../../services/equipment-planning.service';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { ShotVideoDataResponse } from '../../models';
import { EquipmentTypeEnum } from '../../models/equipment.models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
  resolveInitialShotSelection,
} from '../utils/selection-options';
import { ShotEditButton } from '../utils/shot-edit-button';
import { injectShotFormLock } from '../utils/shot-form-lock';
import { injectInitialVideoEquipments } from './inject-initial-video-equipments';
import {
  buildVideoEquipmentCombinedValue,
  mapVideoFormToRequest,
  mapVideoResponseToForm,
  matchesEquipmentId,
  resolveVideoType,
  splitVideoEquipmentCombinedValue,
} from './video-data-introduction.mapper';

interface VideoDataIntroductionForm {
  serie: string | null;
  disparo: string | null;
  tipoVideo: 'AV' | 'C' | null;
  equipment: string | null;
  camera: string | null;
  grabador: string | null;
  canal: string | null;
  magnitud: string | null;
  resultadoObservado: string;
  observaciones: string;
}

@Component({
  selector: 'inta-video-data-introduction',
  standalone: true,
  imports: [
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    TranslateModule,
    IntaIconComponent,
    FormTouchDirective,
    ReadonlyContentDirective,
    ShotEditButton,
  ],
  template: `
    <div
      intaFormTouch
      class="h-full overflow-auto rounded-2xl border border-slate-200 bg-white p-3.5 flex flex-col gap-3 justify-between"
      #touch="intaFormTouch"
    >
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" size="lg" />
          <h3 class="text-sm font-semibold text-gray-800 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            id="serie-select"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="form.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            id="disparo-select"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="form.disparo"
            (selectionChange)="onDisparoSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button
          type="button"
          class="flex items-center justify-center h-[38px] px-3.5 bg-[var(--inta-button)] text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-opacity hover:opacity-90 whitespace-nowrap cursor-pointer"
          (click)="resetToCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.DISPARO_ACTUAL_LABEL' | translate }}
        </button>

        <inta-shot-edit-button [lock]="shotLock" />

        <!-- Toggles: Video AV / Video C -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border"
            [class]="
              selectorModel().tipoVideo === 'AV'
                ? 'bg-blue-100/70 text-blue-600 border-blue-400 font-semibold'
                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50/50'
            "
            (click)="updateTipoVideo('AV')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TIPO_VIDEO_AV_SHORT' | translate }}
          </button>
          <button
            type="button"
            class="h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border"
            [class]="
              selectorModel().tipoVideo === 'C'
                ? 'bg-blue-100/70 text-blue-600 border-blue-400 font-semibold'
                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50/50'
            "
            (click)="updateTipoVideo('C')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TIPO_VIDEO_C_SHORT' | translate }}
          </button>
        </div>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        @if (shotLock.statusLabel(); as status) {
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start"
            [class]="shotLock.statusClass()"
          >
            {{ status | translate }}
          </span>
        }
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div class="flex-1 flex gap-3 min-h-0" [intaReadonlyContent]="shotLock.readOnly()">
        <!-- Columna izquierda: 2 filas -->
        <div class="flex-[2.4] min-w-0 flex flex-col justify-evenly gap-2.5">
          <!-- Fila 1: Equipo (Cámara / Grabador / Canal) -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.EQUIPOS_LABEL' | translate }}</mat-label>
            <mat-select
              id="equipment-select"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.EQUIPOS_PLACEHOLDER' | translate"
              [formField]="form.equipment"
              (selectionChange)="onEquipmentSelected($event.value)"
            >
              @for (opt of equipmentOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Fila 2: Magnitud (col 1) | Resultado observado (cols 2-3) -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-1">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
                <mat-label>
                  {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.MAGNITUD_LABEL' | translate }}
                </mat-label>
                <mat-select
                  id="magnitud-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.MAGNITUD_LABEL' | translate"
                  [formField]="form.magnitud"
                  (selectionChange)="onMagnitudSelected($event.value)"
                >
                  @for (opt of magnitudOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="col-span-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
                <mat-label>
                  {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate }}
                </mat-label>
                @if (observedResultControlConfig().type === 'numeric') {
                  <input
                    id="resultado-input"
                    data-testid="resultado-numeric-input"
                    matInput
                    type="number"
                    [min]="observedResultControlConfig().min ?? null"
                    [max]="observedResultControlConfig().max ?? null"
                    [placeholder]="
                      'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate
                    "
                    [value]="selectorModel().resultadoObservado"
                    (keydown)="onNumericKeydown($event)"
                    (input)="updateResultadoObservado(resultadoInput.value)"
                    (blur)="onResultadoBlur()"
                    #resultadoInput
                  />
                } @else if (observedResultControlConfig().type === 'select') {
                  <mat-select
                    id="resultado-select"
                    data-testid="resultado-select"
                    [placeholder]="
                      'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate
                    "
                    [value]="selectorModel().resultadoObservado"
                    (selectionChange)="updateResultadoObservado($event.value)"
                  >
                    @for (opt of observedResultControlConfig().options; track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                } @else {
                  <input
                    id="resultado-input"
                    data-testid="resultado-text-input"
                    matInput
                    [placeholder]="
                      'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate
                    "
                    [value]="selectorModel().resultadoObservado"
                    (input)="updateResultadoObservado(resultadoInput.value)"
                    #resultadoInput
                  />
                }
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Observaciones (altura completa) -->
        <div class="flex-1 min-w-[220px] max-w-[340px] flex flex-col h-full">
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            floatLabel="always"
            class="w-full flex-1 flex flex-col [&>.mat-mdc-text-field-wrapper]:flex-1 [&>.mat-mdc-text-field-wrapper]:h-full [&_.mat-mdc-form-field-flex]:h-full [&_.mat-mdc-form-field-infix]:h-full"
          >
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}
            </mat-label>
            <textarea
              id="observaciones-input"
              matInput
              class="h-full !resize-none"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
              [value]="selectorModel().observaciones"
              (input)="updateObservaciones(observacionesInput.value)"
              #observacionesInput
            ></textarea>
          </mat-form-field>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDataIntroduction extends BaseFormWidgetComponent {
  /** ID del widget — requerido desde execution-grid */
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #executionService = inject(ExecutionService);
  readonly #trialShots = injectTrialShots();
  readonly #equipmentPlanningService = inject(EquipmentPlanningService);

  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});
  readonly #remoteVideoData = signal<ShotVideoDataResponse | null>(null);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #selectionKey = computed(() => shotSelectionKey(this.selectorModel().serie, this.selectorModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #initialVideoEquipments = injectInitialVideoEquipments(() => this.selectorModel().tipoVideo);

  // ── Datos desde el store y API ────────────────────────────────────────────

  /**
   * Opciones combinadas Cámara / Grabador / Canal procedentes de la asignación de equipos
   * filtradas por serie y disparo activo y categoría según tag (AV / C).
   */
  protected readonly equipmentOptions = computed(() => {
    const { serie, disparo, tipoVideo } = this.selectorModel();
    if (!serie || !disparo || !tipoVideo) return [];

    const selections = this.#initialVideoEquipments().filter(
      (selection) =>
        (!selection.seriesIds?.length || selection.seriesIds.includes(serie)) &&
        (!selection.shotIds?.length || selection.shotIds.includes(disparo)),
    );

    if (selections.length === 0) {
      return [];
    }

    const cameraCategory =
      tipoVideo === 'AV' ? EquipmentTypeEnum.HIGH_SPEED_CAMERA : EquipmentTypeEnum.CONVENTIONAL_CAMERA;

    const cameraSelections = selections.filter((s) => s.categoryId === cameraCategory);
    const recorderSelections = selections.filter(
      (s) => s.categoryId === EquipmentTypeEnum.RECORDER || s.categoryId === EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
    );

    const calibryCameras = this.#itemsByCategory()[cameraCategory] ?? [];
    const calibryRecorders = [
      ...(this.#itemsByCategory()[EquipmentTypeEnum.RECORDER] ?? []),
      ...(this.#itemsByCategory()[EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM] ?? []),
    ];

    const result: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    const addOption = (
      camId: string | null,
      camLabel: string | null,
      recId: string | null,
      recLabel: string | null,
      channel: number | string | null,
    ) => {
      const value = buildVideoEquipmentCombinedValue(camId, recId, channel);
      if (!value || seen.has(value)) return;
      seen.add(value);

      const chStr =
        channel !== null && channel !== undefined && channel !== '' ? String(channel).padStart(2, '0') : null;
      const parts: string[] = [];
      if (camLabel) parts.push(camLabel);
      if (recLabel) parts.push(recLabel);
      if (chStr) parts.push(`Canal ${chStr}`);

      result.push({
        value,
        label: parts.join(' / ') || value,
      });
    };

    if (cameraSelections.length > 0) {
      for (const cam of cameraSelections) {
        const camStrId = String(cam.equipmentItemId);
        const camItem = calibryCameras.find((item) => matchesEquipmentId(new Set([camStrId]), item.id));
        const camId = camItem?.id ?? camStrId;
        const camLabel = camItem?.label ?? `Cámara ${camId}`;

        const matchingRecorders =
          cam.channel !== null && cam.channel !== undefined
            ? recorderSelections.filter((r) => r.channel === cam.channel)
            : recorderSelections;

        const effectiveRecorders = matchingRecorders.length > 0 ? matchingRecorders : recorderSelections;

        if (effectiveRecorders.length > 0) {
          for (const rec of effectiveRecorders) {
            const recStrId = String(rec.equipmentItemId);
            const recItem = calibryRecorders.find((item) => matchesEquipmentId(new Set([recStrId]), item.id));
            const recId = recItem?.id ?? recStrId;
            const recLabel = recItem?.label ?? `Grabador ${recId}`;
            const channel = cam.channel ?? rec.channel ?? null;

            addOption(camId, camLabel, recId, recLabel, channel);
          }
        } else {
          addOption(camId, camLabel, null, null, cam.channel ?? null);
        }
      }
    } else if (recorderSelections.length > 0) {
      for (const rec of recorderSelections) {
        const recStrId = String(rec.equipmentItemId);
        const recItem = calibryRecorders.find((item) => matchesEquipmentId(new Set([recStrId]), item.id));
        const recId = recItem?.id ?? recStrId;
        const recLabel = recItem?.label ?? `Grabador ${recId}`;

        addOption(null, null, recId, recLabel, rec.channel ?? null);
      }
    }

    return result;
  });

  /** Lista de cámaras Calibry disponibles (filtradas por tipo de vídeo / items API) */
  protected readonly cameraOptions = computed(() => {
    const tipo = this.selectorModel().tipoVideo;
    const items = this.#itemsByCategory();
    let apiCameras: Array<{ id: string; label: string }> = [];

    if (tipo === 'AV') {
      apiCameras = items[EquipmentTypeEnum.HIGH_SPEED_CAMERA] ?? [];
    } else if (tipo === 'C') {
      apiCameras = items[EquipmentTypeEnum.CONVENTIONAL_CAMERA] ?? [];
    } else {
      apiCameras = [
        ...(items[EquipmentTypeEnum.HIGH_SPEED_CAMERA] ?? []),
        ...(items[EquipmentTypeEnum.CONVENTIONAL_CAMERA] ?? []),
      ];
    }

    if (apiCameras.length > 0) {
      return apiCameras.map((c) => ({ value: c.id, label: c.label }));
    }

    return [];
  });

  /** Lista de grabadores Calibry disponibles (procedentes de items API) */
  protected readonly grabadorOptions = computed(() => {
    const items = this.#itemsByCategory();
    const apiRecorders = [
      ...(items[EquipmentTypeEnum.RECORDER] ?? []),
      ...(items[EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM] ?? []),
    ];

    if (apiRecorders.length > 0) {
      return apiRecorders.map((r) => ({ value: r.id, label: r.label }));
    }

    return [];
  });

  /** Lista de canales (01-32) - vacía si el GET de equipos no devuelve nada */
  protected readonly canalOptions = computed(() => []);

  /** Lista de magnitudes disponibles (procedentes de planificación) */
  protected readonly magnitudOptions = computed(() => {
    const tipo = this.selectorModel().tipoVideo;
    if (!tipo) return [];
    const serie = this.selectorModel().serie;
    const response = this.#equipmentPlanningService.trialMeasuresResource.value();
    const catalog = this.#equipmentPlanningService.catalog();
    return resolvePlannedVideoMagnitudes(response, tipo, serie ? [serie] : undefined, catalog);
  });

  /** Configuración reactiva del control de resultado observado según tipo cualitativo / cuantitativo */
  protected readonly observedResultControlConfig = computed(() => {
    const magnitudId = this.selectorModel().magnitud;
    const response = this.#equipmentPlanningService.trialMeasuresResource.value();
    const catalog = this.#equipmentPlanningService.catalog();
    const serie = this.selectorModel().serie;
    return resolveObservedResultControlConfig(magnitudId, response, catalog, serie);
  });

  /** Estado del disparo seleccionado (read-only) */
  protected readonly selectedShotStatus = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.selectorModel().serie,
      this.selectorModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.videoDataIntroduction().estadoDisparo,
    ),
  );
  protected readonly estadoDisparo = computed(() => mapSelectedShotStatusLabel(this.selectedShotStatus()));
  protected readonly estadoClass = computed(() => mapSelectedShotStatusClass(this.selectedShotStatus()));

  /** Disparo actual (informativo) */
  protected readonly disparoActual = computed(() => this.#store.activeShotId());

  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#trialShots.series() ?? this.#store.planningSeries()),
  );
  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.selectorModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
    }),
  );

  // ── Signal Form (estado local del formulario) ─────────────────────────────

  protected readonly selectorModel = signal<VideoDataIntroductionForm>({
    serie: this.#store.videoDataIntroduction().serie,
    disparo: this.#store.videoDataIntroduction().disparo,
    tipoVideo: this.#store.videoDataIntroduction().tipoVideo,
    equipment: buildVideoEquipmentCombinedValue(
      this.#store.videoDataIntroduction().camera,
      this.#store.videoDataIntroduction().grabador,
      this.#store.videoDataIntroduction().canal,
    ),
    camera: this.#store.videoDataIntroduction().camera,
    grabador: this.#store.videoDataIntroduction().grabador,
    canal: this.#store.videoDataIntroduction().canal,
    magnitud: this.#store.videoDataIntroduction().magnitud,
    resultadoObservado: this.#store.videoDataIntroduction().resultadoObservado ?? '',
    observaciones: this.#store.videoDataIntroduction().observaciones ?? '',
  });

  protected readonly form = form(this.selectorModel);
  protected readonly shotLock = injectShotFormLock({
    selectedSerieId: () => this.selectorModel().serie,
    selectedShotId: () => this.selectorModel().disparo,
  });
  readonly #dirtyTracker = createDirtyTracker(() => this.#editableValues());
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  constructor() {
    super();

    this.#executionService
      .loadEquipmentItemsByCategories([
        EquipmentTypeEnum.HIGH_SPEED_CAMERA,
        EquipmentTypeEnum.CONVENTIONAL_CAMERA,
        EquipmentTypeEnum.RECORDER,
        EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
      ])
      .then((result) => this.#itemsByCategory.set(result));

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      if (fireTrialId) {
        this.#equipmentPlanningService.load(fireTrialId);
      }
    });

    effect(() => {
      const options = this.magnitudOptions();
      untracked(() => {
        this.#store.updateVideoDataIntroduction({ magnitudOptions: options });
      });
    });

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions(),
        activeSerieId: this.#store.activeSerieId(),
        activeShotId: this.#store.activeShotId(),
        getShotOptions: (serieId) =>
          buildDisparoOptions({
            selectedSerie: serieId,
            executionProgress: this.#store.executionProgress(),
            planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
          }),
      });
      const { serie, disparo } = selection;
      if (!fireTrialId || !serie || !disparo) return;

      const selectionKey = shotSelectionKey(serie, disparo);
      if (this.#lastLoadedActiveSelection() === selectionKey) return;

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(serie, disparo);
      });
    });
  }

  // ── FormWidget implementation ─────────────────────────────────────────────

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.#dirtyTracker.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.form().valid(),
    hasChanges: this.#dirtyTracker.isDirty(),
  }));

  updateTipoVideo(tipo: 'AV' | 'C'): void {
    this.selectorModel.update((value) => ({ ...value, tipoVideo: tipo }));
    this.#applyRemoteBlock(tipo, this.#remoteVideoData());
  }

  onEquipmentSelected(value: string | null): void {
    const { camera, grabador, canal } = splitVideoEquipmentCombinedValue(value);
    this.selectorModel.update((current) => ({
      ...current,
      equipment: value,
      camera,
      grabador,
      canal,
    }));
    this.#store.updateVideoDataIntroduction({ camera, grabador, canal });
  }

  onSerieSelected(serie: string | null): void {
    this.selectorModel.update((value) => ({ ...value, serie }));
    const disparo = this.disparoOptions()[0]?.value ?? null;
    if (serie && disparo) {
      this.#setSelection(serie, disparo);
      return;
    }
    this.selectorModel.update((value) => ({ ...value, disparo }));
    this.#store.updateVideoDataIntroduction({ serie, disparo });
  }

  onDisparoSelected(disparo: string | null): void {
    this.selectorModel.update((value) => ({ ...value, disparo }));
    this.#store.updateVideoDataIntroduction({ disparo });
    void this.#loadSelectedShotData();
  }

  onMagnitudSelected(magnitud: string | null): void {
    this.selectorModel.update((value) => ({ ...value, magnitud }));
    this.#store.updateVideoDataIntroduction({ magnitud });
    const nextConfig = resolveObservedResultControlConfig(
      magnitud,
      this.#equipmentPlanningService.trialMeasuresResource.value(),
      this.#equipmentPlanningService.catalog(),
      this.selectorModel().serie,
    );
    if (nextConfig.type === 'select') {
      const current = this.selectorModel().resultadoObservado;
      const isValid = nextConfig.options.some((opt) => opt.value === current);
      if (!isValid) {
        this.updateResultadoObservado('');
      }
    } else if (nextConfig.type === 'numeric') {
      const current = this.selectorModel().resultadoObservado;
      if (current && Number.isNaN(Number(current))) {
        this.updateResultadoObservado('');
      }
    }
  }

  onNumericKeydown(event: KeyboardEvent): void {
    const config = this.observedResultControlConfig();
    if (
      config.type === 'numeric' &&
      config.min !== null &&
      config.min >= 0 &&
      (event.key === '-' || event.key === '+')
    ) {
      event.preventDefault();
    }
  }

  updateResultadoObservado(resultadoObservado: string): void {
    const config = this.observedResultControlConfig();
    let sanitized = resultadoObservado;
    if (config.type === 'numeric' && sanitized.trim() !== '') {
      const num = Number(sanitized);
      if (!Number.isNaN(num) && config.max !== null && config.max !== undefined && num > config.max) {
        sanitized = String(config.max);
      }
    }
    this.selectorModel.update((value) => ({ ...value, resultadoObservado: sanitized }));
  }

  onResultadoBlur(): void {
    const config = this.observedResultControlConfig();
    if (config.type === 'numeric' && this.selectorModel().resultadoObservado.trim() !== '') {
      const num = Number(this.selectorModel().resultadoObservado);
      if (!Number.isNaN(num)) {
        if (config.min !== null && config.min !== undefined && num < config.min) {
          this.selectorModel.update((value) => ({ ...value, resultadoObservado: String(config.min) }));
        } else if (config.max !== null && config.max !== undefined && num > config.max) {
          this.selectorModel.update((value) => ({ ...value, resultadoObservado: String(config.max) }));
        }
      }
    }
  }

  updateObservaciones(observaciones: string): void {
    this.selectorModel.update((value) => ({ ...value, observaciones }));
  }

  resetToCurrentShot(): void {
    const activeSerie = this.#store.activeSerieId();
    const activeShot = this.#store.activeShotId();
    if (activeSerie && activeShot) {
      this.#setSelection(activeSerie, activeShot);
    }
  }

  resetForm(): void {
    const stored = this.#store.videoDataIntroduction();
    const equipment = buildVideoEquipmentCombinedValue(stored.camera, stored.grabador, stored.canal);
    this.selectorModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      tipoVideo: stored.tipoVideo,
      equipment,
      camera: stored.camera,
      grabador: stored.grabador,
      canal: stored.canal,
      magnitud: stored.magnitud,
      resultadoObservado: stored.resultadoObservado ?? '',
      observaciones: stored.observaciones ?? '',
    });
    this.shotLock.lock();
    this.#dirtyTracker.syncSnapshot();
  }

  async saveForm(): Promise<void> {
    if (this.shotLock.readOnly()) return;
    const { serie, disparo, tipoVideo, camera, grabador, canal, magnitud, resultadoObservado, observaciones } =
      this.selectorModel();
    this.#store.updateVideoDataIntroduction({
      serie,
      disparo,
      tipoVideo,
      camera,
      grabador,
      canal,
      magnitud,
      resultadoObservado,
      observaciones,
    });

    const fireTrialId = this.#store.fireTrialId();
    const payload = mapVideoFormToRequest(this.selectorModel(), this.#remoteVideoData());
    if (!fireTrialId || !serie || !disparo || !payload) return;

    try {
      const response = await this.#executionService.updateShotVideoData(fireTrialId, serie, disparo, payload);
      this.#remoteVideoData.set(response);
      this.shotLock.lock();
      this.#dirtyTracker.syncSnapshot();
    } catch (error) {
      console.error('Failed to save shot video data', error);
      throw error;
    }
  }

  #setSelection(serie: string, disparo: string): void {
    this.selectorModel.update((value) => ({ ...value, serie, disparo }));
    this.#store.updateVideoDataIntroduction({ serie, disparo });
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorModel();
    if (!fireTrialId || !serie || !disparo) return;

    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    try {
      const response = await this.#executionService.fetchShotVideoData(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) return;
      this.#remoteVideoData.set(response);
      const tipoVideo = resolveVideoType(response, this.selectorModel().tipoVideo);
      this.selectorModel.update((value) => ({ ...value, tipoVideo }));
      this.#applyRemoteBlock(tipoVideo, response);
    } catch {
      if (!ticket.isFresh(selectionKey)) return;
      this.#remoteVideoData.set(null);
      this.#applyRemoteBlock(this.selectorModel().tipoVideo, null);
    }
  }

  #applyRemoteBlock(tipoVideo: 'AV' | 'C' | null, response: ShotVideoDataResponse | null): void {
    const formValues = mapVideoResponseToForm(response, tipoVideo);
    const combined = buildVideoEquipmentCombinedValue(formValues.camera, formValues.grabador, formValues.canal);
    const matchingOpt = this.equipmentOptions().find(
      (opt) =>
        opt.value === combined ||
        this.#matchesOption(opt.value, formValues.camera, formValues.grabador, formValues.canal),
    );
    const equipment = matchingOpt ? matchingOpt.value : combined;

    this.selectorModel.update((value) => ({
      ...value,
      ...formValues,
      equipment,
    }));
    this.#store.updateVideoDataIntroduction(this.selectorModel());
    this.shotLock.lock();
    this.#dirtyTracker.syncSnapshot();
  }

  #matchesOption(optValue: string, camera: string | null, grabador: string | null, canal: string | null): boolean {
    const parts = splitVideoEquipmentCombinedValue(optValue);
    const cameraMatches =
      !camera || parts.camera === camera || matchesEquipmentId(new Set([parts.camera ?? '']), camera);
    const grabadorMatches =
      !grabador || parts.grabador === grabador || matchesEquipmentId(new Set([parts.grabador ?? '']), grabador);
    const canalMatches = !canal || Number(parts.canal) === Number(canal);
    return cameraMatches && grabadorMatches && canalMatches;
  }

  #editableValues(): Omit<VideoDataIntroductionForm, 'serie' | 'disparo' | 'tipoVideo'> {
    const { equipment, camera, grabador, canal, magnitud, resultadoObservado, observaciones } = this.selectorModel();
    return { equipment, camera, grabador, canal, magnitud, resultadoObservado, observaciones };
  }
}
