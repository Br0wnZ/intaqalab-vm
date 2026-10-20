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
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

interface CameraSelectionForm {
  camera: string | null;
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-video-camera-orientation',
  imports: [FormField, MatFormFieldModule, MatSelectModule, MatIconModule, TranslateModule, IntaIconComponent],
  template: `
    <div class="h-full overflow-auto rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">
      <!-- Header -->
      <div class="flex items-center gap-1.5 shrink-0 sticky -top-4 z-2 bg-white min-h-8">
        <ui-inta-icon name="trello" color="var(--inta-button)" size="xl" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.TITLE' | translate }}
        </h3>
      </div>

      <!-- Filtros: Cámara / Serie / Disparo -->
      <div class="shrink-0 flex flex-col gap-1.5">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
          <!-- Cámara -->
          <div class="flex flex-col gap-0.5">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label for="camera-select">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.CAMERA_LABEL' | translate }}
              </mat-label>
              <mat-select
                id="camera-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.CAMERA_PLACEHOLDER' | translate"
                [formField]="selectorForm.camera"
                (selectionChange)="onCameraChange($event.value)"
              >
                @for (opt of cameraOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Serie -->
          @if (!sameForAllSeries() && serieOptions().length > 0) {
            <div class="flex flex-col gap-0.5">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label for="serie-select">
                  {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_LABEL' | translate }}
                </mat-label>
                <mat-select
                  id="serie-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_PLACEHOLDER' | translate"
                  [formField]="selectorForm.serie"
                  (selectionChange)="onSerieChange($event.value)"
                >
                  @for (opt of serieOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          }

          <!-- Disparo -->
          @if (!sameForAllShots() && disparoOptions().length > 0) {
            <div class="flex flex-col gap-0.5">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-label for="disparo-select">
                  {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_LABEL' | translate }}
                </mat-label>
                <mat-select
                  id="disparo-select"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_PLACEHOLDER' | translate"
                  [formField]="selectorForm.disparo"
                  (selectionChange)="onDisparoChange($event.value)"
                >
                  @for (opt of disparoOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          }
        </div>
        <div class="h-px bg-slate-100 mb-2"></div>
      </div>

      <!-- Campos de salida (read-only, procedentes del widget MAO vía store) -->
      <div intaReadonlyContent class="flex-1 flex flex-col justify-between min-h-0">
        <!-- Distancia prevista pique -->
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-medium text-gray-700 leading-none">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.ESTIMATED_DISTANCE_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-[44px] px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700">{{ estimatedDistancePique() ?? '—' }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Altura de funcionamiento -->
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-medium text-gray-700 leading-none">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.OPERATING_HEIGHT_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-[44px] px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700">{{ operatingHeight() ?? '—' }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Alcance de funcionamiento -->
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-medium text-gray-700 leading-none">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.OPERATING_RANGE_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-[44px] px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700">{{ operatingRange() ?? '—' }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Diferencia angular cámara (calculada en el store) -->
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-medium text-gray-700 leading-none">
            {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.ANGULAR_DIFFERENCE_LABEL' | translate }}
          </span>
          <div
            class="flex items-center justify-between h-[44px] px-3 rounded-lg border border-violet-100 bg-violet-50/50"
          >
            <span class="text-sm font-medium text-violet-800">{{ angularDifferenceFormatted() ?? '—' }}</span>
            <span class="text-xs font-medium text-violet-400">°</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCameraOrientation extends BaseFormWidgetComponent {
  /** ID del widget — requerido desde execution-grid */
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #trialShots = injectTrialShots();

  // ── Datos desde el store ──────────────────────────────────────────────────

  /** Lista de cámaras Calibry disponibles */
  protected readonly cameraOptions = computed(() => this.#store.videoCameraOrientation().cameraOptions);

  protected readonly orientationResponse = computed(() => {
    const response = this.#store.videoCameraOrientationResponse();
    return response?.cameraId === Number(this.selectorModel().camera) ? response : null;
  });

  /** Datos de orientación para serie y disparo seleccionados */
  protected readonly selectedOrientationData = computed(() => {
    const response = this.orientationResponse();
    if (!response) return null;
    const selection = this.selectorModel();
    const selectedSeries = response.sameForAllSeries
      ? response.series[0]
      : response.series.find((serie) => serie.seriesId === selection.serie);
    const selectedShot = selectedSeries?.sameForAllShots
      ? selectedSeries.shots[0]
      : selectedSeries?.shots.find((shot) => shot.shotId === selection.disparo);
    return selectedShot?.orientationData ?? null;
  });

  protected readonly sameForAllSeries = computed(() => this.orientationResponse()?.sameForAllSeries ?? false);
  protected readonly sameForAllShots = computed(() => {
    const response = this.orientationResponse();
    if (!response) return false;
    if (response.sameForAllSeries) return true;
    const selectedSeries = response.series.find((serie) => serie.seriesId === this.selectorModel().serie);
    return selectedSeries?.sameForAllShots ?? false;
  });

  /** Datos de orientación devueltos por API */
  protected readonly estimatedDistancePique = computed(
    () => this.selectedOrientationData()?.plannedImpactDistance ?? null,
  );
  protected readonly operatingHeight = computed(() => this.selectedOrientationData()?.functioningHeight ?? null);
  protected readonly operatingRange = computed(() => this.selectedOrientationData()?.functioningDistance ?? null);

  /** Diferencia angular devuelta por API, formateada a 2 decimales */
  protected readonly angularDifferenceFormatted = computed(() => {
    const val = this.selectedOrientationData()?.cameraAngularDifference;
    return val !== null && val !== undefined ? val.toFixed(2) : null;
  });

  protected readonly serieOptions = computed(() => {
    const series = this.orientationResponse()?.series ?? [];
    const planningSeries = this.#trialShots.series() ?? this.#store.planningSeries() ?? [];
    return series.map((serie, index) => ({
      value: serie.seriesId,
      label: planningSeries.find((planned) => planned.id === serie.seriesId)?.name?.trim() || `Serie ${index + 1}`,
    }));
  });

  protected readonly disparoOptions = computed(() => {
    const response = this.orientationResponse();
    const selectedId = this.selectorModel().serie;
    const selectedSeries = response?.sameForAllSeries
      ? response.series[0]
      : response?.series.find((serie) => serie.seriesId === selectedId);
    const plannedShots =
      (this.#trialShots.series() ?? this.#store.planningSeries())?.find(
        (serie) => serie.id === selectedSeries?.seriesId,
      )?.shots ?? [];
    return (selectedSeries?.shots ?? []).map((shot, index) => ({
      value: shot.shotId,
      label: `Disparo #${String(plannedShots.find((planned) => planned.id === shot.shotId)?.globalNumber ?? index + 1).padStart(2, '0')}`,
    }));
  });

  // ── Signal Form (estado local del formulario) ─────────────────────────────

  protected readonly selectorModel = signal<CameraSelectionForm>({
    camera:
      this.#store.videoCameraOrientation().camera ??
      this.#store.videoCameraOrientation().cameraOptions[0]?.value ??
      null,
    serie: this.#store.videoCameraOrientation().serie,
    disparo: this.#store.videoCameraOrientation().disparo,
  });

  protected readonly selectorForm = form(this.selectorModel);

  constructor() {
    super();
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const defaultCamera = this.cameraOptions()[0]?.value;
      untracked(() => {
        const current = this.selectorModel();
        const camera = current.camera ?? defaultCamera;
        if (!fireTrialId || !camera) return;
        const cameraId = Number(camera);
        if (!Number.isInteger(cameraId)) return;

        if (current.camera !== camera) {
          this.selectorModel.set({ ...current, camera });
        }
        this.#store.loadVideoCameraOrientation(fireTrialId, cameraId);
      });
    });

    let hasSyncedExecutionSelection = false;
    effect(() => {
      const serie = this.#store.activeSerieId();
      const disparo = this.#store.activeShotId();
      const fireTrialId = this.#store.fireTrialId();
      untracked(() => {
        const selection = this.selectorModel();
        const { camera } = selection;
        const serieChanged = Boolean(serie) && serie !== selection.serie;
        const disparoChanged = Boolean(disparo) && disparo !== selection.disparo;
        if ((serie && selection.serie !== serie) || (disparo && selection.disparo !== disparo)) {
          this.selectorModel.set({
            ...selection,
            ...(serie ? { serie } : {}),
            ...(disparo ? { disparo } : {}),
          });
        }

        if (
          hasSyncedExecutionSelection &&
          ((serieChanged && this.#hasSeriesSelector()) || (disparoChanged && this.#hasShotSelector())) &&
          fireTrialId &&
          camera
        ) {
          const cameraId = Number(camera);
          if (Number.isInteger(cameraId)) {
            this.#store.loadVideoCameraOrientation(fireTrialId, cameraId);
          }
        }
        hasSyncedExecutionSelection = true;
      });
    });

    effect(() => {
      const response = this.orientationResponse();
      const selection = this.selectorModel();
      if (!response) return;

      const selectedSeries = response.sameForAllSeries
        ? response.series[0]
        : (response.series.find((serie) => serie.seriesId === selection.serie) ?? response.series[0]);
      const selectedShot = selectedSeries?.sameForAllShots
        ? selectedSeries.shots[0]
        : (selectedSeries?.shots.find((shot) => shot.shotId === selection.disparo) ?? selectedSeries?.shots[0]);

      untracked(() => {
        const current = this.selectorModel();
        const serie = selectedSeries?.seriesId ?? null;
        const disparo = selectedShot?.shotId ?? null;
        if (current.serie !== serie || current.disparo !== disparo) {
          this.selectorModel.set({ ...current, serie, disparo });
        }
      });
    });
  }

  protected onCameraChange(camera: string | null): void {
    this.selectorModel.update((current) => ({ ...current, camera }));
    this.#loadOrientationForSelectorChange();
  }

  protected onSerieChange(serie: string | null): void {
    this.selectorModel.update((current) => ({ ...current, serie }));
    this.#loadOrientationForSelectorChange();
  }

  protected onDisparoChange(disparo: string | null): void {
    this.selectorModel.update((current) => ({ ...current, disparo }));
    this.#loadOrientationForSelectorChange();
  }

  #loadOrientationForSelectorChange(): void {
    const fireTrialId = this.#store.fireTrialId();
    const camera = this.selectorModel().camera;
    if (!fireTrialId || !camera) return;

    const cameraId = Number(camera);
    if (Number.isInteger(cameraId)) {
      this.#store.loadVideoCameraOrientation(fireTrialId, cameraId);
    }
  }

  #hasSeriesSelector(): boolean {
    const response = this.#store.videoCameraOrientationResponse();
    return Boolean(response && !response.sameForAllSeries && response.series.length > 0);
  }

  #hasShotSelector(): boolean {
    const response = this.#store.videoCameraOrientationResponse();
    if (!response) return false;
    if (response.sameForAllSeries) return false;
    const selectedSeries = response.series.find((serie) => serie.seriesId === this.selectorModel().serie);
    return Boolean(selectedSeries && !selectedSeries.sameForAllShots && selectedSeries.shots.length > 0);
  }

  // ── FormWidget implementation ─────────────────────────────────────────────

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.selectorForm().dirty(),
    touched: this.selectorForm().touched(),
    valid: this.selectorForm().valid(),
    hasChanges: this.selectorForm().dirty(),
  }));

  resetForm(): void {
    const stored = this.#store.videoCameraOrientation();
    this.selectorModel.set({ camera: stored.camera, serie: stored.serie, disparo: stored.disparo });
  }

  async saveForm(): Promise<void> {
    const { camera, serie, disparo } = this.selectorModel();
    this.#store.updateVideoCameraSelection({ camera, serie, disparo });
  }
}
