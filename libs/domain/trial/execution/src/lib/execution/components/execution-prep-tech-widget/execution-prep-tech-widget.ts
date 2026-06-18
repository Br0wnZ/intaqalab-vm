import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { TechProfile } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

/**
 * 🎯 Modelo de estado por serie
 */
interface SerieReadiness {
  serieId: string;
  serieName: string;
  ready: boolean;
  observations: string;
}

/**
 * 🗂️ Configuración de un perfil técnico
 */
interface TechProfileConfig {
  icon: string;
  /** Clave i18n del título */
  titleKey: string;
  color: string;
}

const TECH_PROFILE_CONFIG: Record<TechProfile, TechProfileConfig> = {
  velocidades: {
    icon: 'speed',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VELOCIDADES',
    color: 'text-blue-600',
  },
  presiones: {
    icon: 'compress',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.PRESIONES',
    color: 'text-orange-600',
  },
  video: {
    icon: 'videocam',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VIDEO',
    color: 'text-red-600',
  },
  trayectografia: {
    icon: 'radar',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.TRAYECTOGRAFIA',
    color: 'text-green-600',
  },
  municiones: {
    icon: 'military_tech',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.MUNICIONES',
    color: 'text-amber-600',
  },
  armamento: {
    icon: 'security',
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.ARMAMENTO',
    color: 'text-purple-600',
  },
};

/**
 * 🛡️ Widget "Preparación ejecución – Unidades técnicas" (W1)
 *
 * Disponible para 6 perfiles técnicos:
 * - Velocidades (técnico de balística – velocidades)
 * - Presiones   (técnico de balística – presiones)
 * - Vídeo       (técnico de balística – cámaras)
 * - Trayectografía (técnico de balística – radar)
 * - Municiones
 * - Armamento
 *
 * Campos: checkbox de preparado por serie + observaciones libre.
 */
@Component({
  selector: 'inta-execution-prep-tech-widget',
  imports: [
    TranslateModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReadonlyContentDirective,
    MatIconModule,
    MatTooltipModule,
    IntaIconComponent,
  ],
  template: `
    <mat-card class="h-full min-h-0 !shadow-none border border-gray-100 flex flex-col bg-white overflow-auto">
      <!-- 🔝 Header -->
      <mat-card-header class="!px-4.5 !py-2 shrink-0">
        <mat-card-title class="!text-sm !font-semibold flex items-center gap-2 text-slate-700 w-full">
          <div class="truncate flex-1 flex items-center items-baseline gap-1">
            <ui-inta-icon name="checkSquare" color="var(--inta-button)" class="mr-1" />
            <span class="truncate">{{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.TITLE' | translate }}</span>
            <span class="text-[.625rem] font-normal text-slate-400 uppercase shrink-0">
              | {{ profileConfig().titleKey | translate }}
            </span>
          </div>
          @if (formState().dirty) {
            <span class="size-1.5 rounded-full bg-orange-500 shrink-0"></span>
          }
        </mat-card-title>
      </mat-card-header>

      <!-- 📋 Content -->
      <mat-card-content intaReadonlyContent class="flex-1 !pt-3 overflow-auto flex flex-col">
        <!-- Seleccionar todas -->
        <div class="flex items-center h-7 mb-1 border-b border-slate-50 shrink-0">
          <mat-checkbox
            color="primary"
            class="ultra-compact-checkbox"
            [id]="'select-all-' + widgetId()"
            [checked]="allSeriesReady()"
            [indeterminate]="someSeriesReady() && !allSeriesReady()"
            (change)="toggleSelectAll($event.checked)"
          >
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.SELECT_ALL' | translate }}
            </span>
          </mat-checkbox>
        </div>

        <!-- Lista de series -->
        <div class="flex-1 flex flex-col gap-2 justify-between py-1 overflow-hidden">
          @for (serie of seriesReadiness(); track serie.serieId; let i = $index) {
            <div class="flex items-center gap-2">
              <!-- Checkbox y Nombre -->
              <div class="shrink-0 w-34 flex items-center">
                <mat-checkbox
                  color="primary"
                  class="ultra-compact-checkbox"
                  [id]="'serie-ready-' + widgetId() + '-' + i"
                  [checked]="serie.ready"
                  (change)="toggleSerie(i, $event.checked)"
                >
                  <span
                    class="text-xs font-semibold text-slate-600 truncate block w-full"
                    [class.text-purple-600]="serie.ready"
                  >
                    {{ serie.serieName }}
                  </span>
                </mat-checkbox>
              </div>

              <!-- Input Observaciones -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 small-input">
                <input
                  matInput
                  [id]="'obs-' + widgetId() + '-' + i"
                  [placeholder]="'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.OBSERVATIONS_PLACEHOLDER' | translate"
                  [value]="serie.observations"
                  (input)="onObservationsChange(i, $event)"
                />
              </mat-form-field>
            </div>
          }
        </div>

        <!-- Indicador -->
        <div class="flex justify-center gap-1.5 py-1 shrink-0 hidden">
          <span class="size-1 rounded-full bg-purple-500"></span>
          <span class="size-1 rounded-full bg-slate-200"></span>
          <span class="size-1 rounded-full bg-slate-200"></span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }

    /* 🛡️ Checkbox ultra-compacto sin transform (evita problemas de hit-test) */
    .ultra-compact-checkbox {
      --mdc-checkbox-state-layer-size: 20px;
      height: 20px !important;
      display: inline-flex !important;
      align-items: center !important;
    }

    ::ng-deep .ultra-compact-checkbox .mdc-checkbox {
      width: 20px !important;
      height: 20px !important;
      padding: 2px !important;
      flex: 0 0 20px !important;
    }

    ::ng-deep .ultra-compact-checkbox .mdc-checkbox__native-control {
      width: 16px !important;
      height: 16px !important;
      top: 2px !important;
      left: 2px !important;
    }

    ::ng-deep .ultra-compact-checkbox .mdc-checkbox__background {
      width: 16px !important;
      height: 16px !important;
      top: 2px !important;
      left: 2px !important;
    }

    ::ng-deep .ultra-compact-checkbox .mdc-label {
      padding-left: 4px !important;
      font-size: 10px !important;
      line-height: 20px !important;
    }

    /* ✏️ Input ultra-compacto */
    ::ng-deep .ultra-compact-field .mat-mdc-form-field-flex {
      height: 22px !important;
      min-height: 22px !important;
      padding: 0 8px !important;
      background: #f8fafc;
      border-radius: 4px !important;
    }

    ::ng-deep .ultra-compact-field .mat-mdc-form-field-infix {
      padding-top: 3px !important;
      padding-bottom: 3px !important;
      font-size: 10px !important;
      min-height: 22px !important;
    }

    ::ng-deep .ultra-compact-field .mdc-notched-outline {
      display: none !important;
    }

    ::ng-deep .ultra-compact-field input {
      height: 16px !important;
      line-height: 16px !important;
    }

    ::ng-deep .ultra-compact-field input::placeholder {
      font-size: 9px !important;
      color: #cbd5e1 !important;
    }
  `,
})
export class ExecutionPrepTechWidgetComponent extends BaseFormWidgetComponent {
  // 🆔 ID del widget (pasado desde el padre)
  readonly widgetId = input.required<string>();

  /**
   * 🎭 Perfil técnico que usa este widget.
   * Determina el título, icono y color del encabezado.
   */
  readonly profile = input.required<TechProfile>();

  // 💉
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #executionStore = inject(ExecutionStore);

  /**
   * ⚙️ Computed: Configuración visual del perfil activo
   */
  readonly profileConfig = computed(() => TECH_PROFILE_CONFIG[this.profile()]);

  // 📦 Estado mutable de series
  // En producción este signal se inicializaría con las series reales del ensayo
  readonly seriesReadiness = signal<SerieReadiness[]>([
    { serieId: 'serie-1', serieName: 'Calentamiento', ready: false, observations: '' },
    { serieId: 'serie-2', serieName: 'Funcionamiento I', ready: false, observations: '' },
    { serieId: 'serie-3', serieName: 'Funcionamiento II', ready: false, observations: '' },
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // Computed helpers
  // ──────────────────────────────────────────────────────────────────────────

  readonly allSeriesReady = computed(() => this.seriesReadiness().every((s) => s.ready));

  readonly someSeriesReady = computed(() => this.seriesReadiness().some((s) => s.ready));

  /**
   * 📊 Computed: Estado del formulario (requerido por BaseFormWidgetComponent)
   */
  readonly formState = computed((): WidgetFormState => {
    const series = this.seriesReadiness();
    const hasChanges = series.some((s) => s.ready || s.observations.trim().length > 0);

    return {
      widgetId: this.widgetId(),
      dirty: hasChanges,
      touched: hasChanges,
      valid: true, // No hay validaciones estrictas — observaciones son opcionales
      hasChanges,
    };
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Acciones
  // ──────────────────────────────────────────────────────────────────────────

  /** Marcar/desmarcar todas las series */
  toggleSelectAll(checked: boolean): void {
    this.seriesReadiness.update((series) => series.map((s) => ({ ...s, ready: checked })));
  }

  /** Marcar/desmarcar una serie individual */
  toggleSerie(index: number, checked: boolean): void {
    this.seriesReadiness.update((series) => series.map((s, i) => (i === index ? { ...s, ready: checked } : s)));
  }

  /** Actualizar observaciones de una serie */
  onObservationsChange(index: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.seriesReadiness.update((series) => series.map((s, i) => (i === index ? { ...s, observations: value } : s)));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BaseFormWidgetComponent contract
  // ──────────────────────────────────────────────────────────────────────────

  resetForm(): void {
    this.seriesReadiness.update((series) => series.map((s) => ({ ...s, ready: false, observations: '' })));
  }

  async saveForm(): Promise<void> {
    const data = {
      profile: this.profile(),
      widgetId: this.widgetId(),
      series: this.seriesReadiness(),
    };

    console.log('💾 Guardando Preparación ejecución – Unidades técnicas:', data);

    // Actualizar el estado global en el ExecutionStore
    this.#executionStore.updateTechUnit(this.profile(), {
      ready: this.allSeriesReady(),
      observations: this.someSeriesReady() ? 'Series preparadas' : '', // Demo: actualizar observaciones
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log('✅ Preparación guardada y estado global actualizado');
  }
}
