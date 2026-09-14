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
import { IntaIconComponent } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import type { ShotVideoDataResponse } from '../../models';
import { EquipmentTypeEnum } from '../../models/equipment.models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { mapVideoFormToRequest, mapVideoResponseToForm, resolveVideoType } from './video-data-introduction.mapper';

interface VideoDataIntroductionForm {
  serie: string | null;
  disparo: string | null;
  tipoVideo: 'AV' | 'C' | null;
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
        <div class="flex items-center px-3 py-1.5 bg-[#d1fae5] rounded-xl shrink-0">
          <span class="text-xs font-semibold text-[#065f46]">
            {{ estadoDisparo() ?? ('TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.STATUS_IN_PROGRESS' | translate) }}
          </span>
        </div>
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div class="flex-1 flex gap-3 min-h-0">
        <!-- Columna izquierda: 2 filas -->
        <div class="flex-[2.4] min-w-0 flex flex-col justify-evenly gap-2.5">
          <!-- Fila 1: Cámara | Grabador | Canal -->
          <div class="grid grid-cols-3 gap-3">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CAMARA_LABEL' | translate }}</mat-label>
              <mat-select
                id="camera-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CAMARA_LABEL' | translate"
                [formField]="form.camera"
              >
                @for (opt of cameraOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.GRABADOR_LABEL' | translate }}</mat-label>
              <mat-select
                id="grabador-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.GRABADOR_LABEL' | translate"
                [formField]="form.grabador"
              >
                @for (opt of grabadorOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" floatLabel="always" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CANAL_LABEL' | translate }}</mat-label>
              <mat-select
                id="canal-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CANAL_LABEL' | translate"
                [formField]="form.canal"
              >
                @for (opt of canalOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

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
                <input
                  id="resultado-input"
                  matInput
                  [placeholder]="
                    'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate
                  "
                  [value]="selectorModel().resultadoObservado"
                  (input)="updateResultadoObservado(resultadoInput.value)"
                  #resultadoInput
                />
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
              class="h-full"
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

  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});
  readonly #remoteVideoData = signal<ShotVideoDataResponse | null>(null);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #selectionKey = computed(() => shotSelectionKey(this.selectorModel().serie, this.selectorModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());

  // ── Datos desde el store y API ────────────────────────────────────────────

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

    return this.#store.videoDataIntroduction().cameraOptions;
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

    return this.#store.videoDataIntroduction().grabadorOptions;
  });

  /** Lista de canales (01-32) */
  protected readonly canalOptions = computed(() => this.#store.videoDataIntroduction().canalOptions);

  /** Lista de magnitudes disponibles (procedentes de planificación) */
  protected readonly magnitudOptions = computed(() => this.#store.videoDataIntroduction().magnitudOptions);

  /** Estado del disparo seleccionado (read-only) */
  protected readonly estadoDisparo = computed(() => this.#store.videoDataIntroduction().estadoDisparo);

  /** Disparo actual (informativo) */
  protected readonly disparoActual = computed(() => this.#store.activeShotId());

  protected readonly serieOptions = computed(() =>
    (this.#store.planningSeries() ?? []).map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    })),
  );
  protected readonly disparoOptions = computed(() => {
    const shots = this.#store.planningSeries()?.find((serie) => serie.id === this.selectorModel().serie)?.shots ?? [];
    return shots.map((shot, index) => ({
      value: shot.id,
      label: `Disparo #${String(shot.globalNumber ?? index + 1).padStart(2, '0')}`,
    }));
  });

  // ── Signal Form (estado local del formulario) ─────────────────────────────

  protected readonly selectorModel = signal<VideoDataIntroductionForm>({
    serie: this.#store.videoDataIntroduction().serie,
    disparo: this.#store.videoDataIntroduction().disparo,
    tipoVideo: this.#store.videoDataIntroduction().tipoVideo,
    camera: this.#store.videoDataIntroduction().camera,
    grabador: this.#store.videoDataIntroduction().grabador,
    canal: this.#store.videoDataIntroduction().canal,
    magnitud: this.#store.videoDataIntroduction().magnitud,
    resultadoObservado: this.#store.videoDataIntroduction().resultadoObservado ?? '',
    observaciones: this.#store.videoDataIntroduction().observaciones ?? '',
  });

  protected readonly form = form(this.selectorModel);
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
      const serie = this.#store.activeSerieId() ?? this.serieOptions()[0]?.value ?? null;
      const disparo = this.#store.activeShotId() ?? this.disparoOptions()[0]?.value ?? null;
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

  onSerieSelected(serie: string | null): void {
    this.selectorModel.update((value) => ({ ...value, serie, disparo: null }));
    this.#store.updateVideoDataIntroduction({ serie, disparo: null });
  }

  onDisparoSelected(disparo: string | null): void {
    this.selectorModel.update((value) => ({ ...value, disparo }));
    this.#store.updateVideoDataIntroduction({ disparo });
    void this.#loadSelectedShotData();
  }

  updateResultadoObservado(resultadoObservado: string): void {
    this.selectorModel.update((value) => ({ ...value, resultadoObservado }));
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
    this.selectorModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      tipoVideo: stored.tipoVideo,
      camera: stored.camera,
      grabador: stored.grabador,
      canal: stored.canal,
      magnitud: stored.magnitud,
      resultadoObservado: stored.resultadoObservado ?? '',
      observaciones: stored.observaciones ?? '',
    });
    this.#dirtyTracker.syncSnapshot();
  }

  async saveForm(): Promise<void> {
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
    this.selectorModel.update((value) => ({
      ...value,
      ...mapVideoResponseToForm(response, tipoVideo),
    }));
    this.#store.updateVideoDataIntroduction(this.selectorModel());
    this.#dirtyTracker.syncSnapshot();
  }

  #editableValues(): Omit<VideoDataIntroductionForm, 'serie' | 'disparo' | 'tipoVideo'> {
    const { camera, grabador, canal, magnitud, resultadoObservado, observaciones } = this.selectorModel();
    return { camera, grabador, canal, magnitud, resultadoObservado, observaciones };
  }
}
