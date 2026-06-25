import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { IntaIconComponent } from "@intaqalab/ui";

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
              >
                @for (opt of cameraOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Serie -->
          <div class="flex flex-col gap-0.5">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label for="serie-select">
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_LABEL' | translate }}
              </mat-label>
              <mat-select
                id="serie-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_PLACEHOLDER' | translate"
                [formField]="selectorForm.serie"
              >
                @for (opt of serieOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Disparo -->
          <div class="flex flex-col gap-0.5">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label for="disparo-select">
              {{ 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_LABEL' | translate }}
              </mat-label>
              <mat-select
                id="disparo-select"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_PLACEHOLDER' | translate"
                [formField]="selectorForm.disparo"
              >
                @for (opt of disparoOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

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
          <div class="flex items-center justify-between h-[44px] px-3 rounded-lg border border-violet-100 bg-violet-50/50">
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

  // ── Datos desde el store ──────────────────────────────────────────────────

  /** Lista de cámaras Calibry disponibles */
  protected readonly cameraOptions = computed(() => this.#store.videoCameraOrientation().cameraOptions);

  /** Outputs del widget MAO (read-only) */
  protected readonly estimatedDistancePique = computed(() => this.#store.videoCameraOrientation().estimatedDistancePique);
  protected readonly operatingHeight        = computed(() => this.#store.videoCameraOrientation().operatingHeight);
  protected readonly operatingRange         = computed(() => this.#store.videoCameraOrientation().operatingRange);

  /** Diferencia angular calculada en el store, formateada a 2 decimales */
  protected readonly angularDifferenceFormatted = computed(() => {
    const val = this.#store.videoCameraAngularDifference();
    return val !== null ? val.toFixed(2) : null;
  });

  /** Opciones de serie y disparo — se poblarán desde el planning cuando esté disponible */
  protected readonly serieOptions   = computed<{ value: string; label: string }[]>(() => []);
  protected readonly disparoOptions = computed<{ value: string; label: string }[]>(() => []);

  // ── Signal Form (estado local del formulario) ─────────────────────────────

  protected readonly selectorModel = signal<CameraSelectionForm>({
    camera:  this.#store.videoCameraOrientation().camera,
    serie:   this.#store.videoCameraOrientation().serie,
    disparo: this.#store.videoCameraOrientation().disparo,
  });

  protected readonly selectorForm = form(this.selectorModel);

  // ── FormWidget implementation ─────────────────────────────────────────────

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId:   this.widgetId(),
    dirty:      this.selectorForm().dirty(),
    touched:    this.selectorForm().touched(),
    valid:      this.selectorForm().valid(),
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
