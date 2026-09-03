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
      class="h-full overflow-auto rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4"
      #touch="intaFormTouch"
    >
      <!-- Header -->
      <div class="flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <ui-inta-icon name="edit" color="var(--inta-button)" size="xl" />
          <h3 class="text-sm font-semibold text-gray-800 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>
        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-xs font-semibold text-green-700">
            {{ estadoDisparo() ?? ('TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.STATUS_IN_PROGRESS' | translate) }}
          </span>
        </div>
      </div>

      <!-- Filtros: Serie / Disparo / Boton -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="flex-1 min-w-0">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.SERIE_LABEL' | translate }}</mat-label>
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
        </div>

        <div class="flex-1 min-w-0">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.DISPARO_LABEL' | translate }}</mat-label>
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
        </div>

        <button
          type="button"
          class="flex items-center justify-center gap-1.5 h-[42px] px-4 bg-[var(--inta-button)] text-white rounded-lg text-[13px] font-semibold shrink-0 shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap"
          (click)="resetToCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.DISPARO_ACTUAL_LABEL' | translate }}
        </button>
      </div>

      <!-- Tipo de vídeo -->
      <div class="flex flex-col gap-2 shrink-0">
        <span class="text-[13px] font-medium text-gray-600">
          {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TIPO_VIDEO_LABEL' | translate }}
        </span>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer border-2"
            [class]="
              selectorModel().tipoVideo === 'AV'
                ? 'bg-[var(--inta-button)] text-white border-[var(--inta-button)] shadow-md'
                : 'bg-white text-[var(--inta-button)] border-gray-200 hover:border-[var(--inta-button)]'
            "
            (click)="updateTipoVideo('AV')"
          >
            <ui-inta-icon
              name="play_circle"
              size="md"
              [color]="selectorModel().tipoVideo === 'AV' ? 'white' : 'var(--inta-button)'"
            />
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TIPO_VIDEO_AV' | translate }}
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer border-2"
            [class]="
              selectorModel().tipoVideo === 'C'
                ? 'bg-[var(--inta-button)] text-white border-[var(--inta-button)] shadow-md'
                : 'bg-white text-[var(--inta-button)] border-gray-200 hover:border-[var(--inta-button)]'
            "
            (click)="updateTipoVideo('C')"
          >
            <ui-inta-icon
              name="play_circle"
              size="md"
              [color]="selectorModel().tipoVideo === 'C' ? 'white' : 'var(--inta-button)'"
            />
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.TIPO_VIDEO_C' | translate }}
          </button>
        </div>
      </div>

      <!-- Accordion DATOS DE ENTRADA -->
      <div class="rounded-xl border border-gray-100 bg-white flex flex-col shrink-0 shadow-sm">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 rounded-t-xl bg-gray-50/50">
          <div class="flex items-center gap-2 text-[var(--inta-button)]">
            <ui-inta-icon name="login" size="md" color="var(--inta-button)" />
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--inta-button)]">
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.INPUT_DATA_SECTION' | translate }}
            </span>
          </div>
          <ui-inta-icon name="expand_less" size="md" color="var(--color-gray-400, #9ca3af)" />
        </div>

        <div class="p-4 flex flex-col gap-4">
          <!-- 3 selects en fila: Cámara, Grabador, Canal -->
          <div class="flex gap-3">
            <div class="flex-1 min-w-0">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select
                  id="camera-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CAMARA_PLACEHOLDER' | translate"
                  [formField]="form.camera"
                >
                  @for (opt of cameraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="flex-1 min-w-0">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>
                  {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.GRABADOR_LABEL' | translate }}
                </mat-label>
                <mat-select
                  id="grabador-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.GRABADOR_PLACEHOLDER' | translate"
                  [formField]="form.grabador"
                >
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="flex-1 min-w-0">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CANAL_LABEL' | translate }}</mat-label>
                <mat-select
                  id="canal-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.CANAL_PLACEHOLDER' | translate"
                  [formField]="form.canal"
                >
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Magnitud -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.MAGNITUD_LABEL' | translate }}
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.MAGNITUD_HINT' | translate }}
            </mat-label>
            <mat-select
              id="magnitud-select"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.MAGNITUD_PLACEHOLDER' | translate"
              [formField]="form.magnitud"
            >
              @for (opt of magnitudOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Resultado observado -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_LABEL' | translate }}
            </mat-label>
            <input
              id="resultado-input"
              matInput
              [placeholder]="
                'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.RESULTADO_OBSERVADO_PLACEHOLDER' | translate
              "
              [value]="selectorModel().resultadoObservado"
              (input)="updateResultadoObservado(resultadoInput.value)"
              #resultadoInput
            />
          </mat-form-field>

          <!-- Observaciones -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_DATA_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}
            </mat-label>
            <textarea
              id="observaciones-input"
              matInput
              rows="3"
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
