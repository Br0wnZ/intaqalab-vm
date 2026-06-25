import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { JltStatus } from '../../../+state/execution.store';
import { ExecutionStore, TechUnitStatus } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

/**
 * 🛡️ Widget "Preparación ejecución – JLT" (W3)
 *
 * El panel central de control para el Jefe de Línea de Tiro.
 * Combina entradas de seguridad con la monitorización de unidades técnicas
 * y el disparo final.
 */
@Component({
  selector: 'inta-execution-prep-jlt-widget',
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
    MatSelectModule,
    IntaIconComponent,
  ],
  template: `
    <mat-card class="h-full min-h-0 !shadow-none border border-gray-100 flex flex-col bg-white overflow-auto">
      <!-- 🔝 Header -->
      <mat-card-header class="!px-3 !pt-2 !pb-1 shrink-0 border-b border-slate-50">
        <div class="flex flex-wrap gap-2 items-center justify-between w-full">
          <div class="flex flex-wrap items-center gap-2">
            <ui-inta-icon name="settings" color="var(--inta-button)" />
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
              {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.TITLE' | translate }}
            </h3>

            <!-- Selector de serie -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select ml-2">
              <mat-select [value]="selectedSerie()">
                <mat-option value="funcionamiento-1">Funcionamiento I</mat-option>
                <mat-option value="funcionamiento-2">Funcionamiento II</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Estado Global -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-300"
            [class]="isAllReady() ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">{{ isAllReady() ? 'check_circle' : 'pending' }}</mat-icon>
            <span class="text-xs font-semibold">
              {{
                (isAllReady()
                  ? 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SERIE_READY'
                  : 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SERIE_PENDING'
                ) | translate
              }}
            </span>
          </div>
        </div>
      </mat-card-header>

      <!-- 📋 Content (3 Columnas) -->
      <mat-card-content intaReadonlyContent class="flex-1 !p-3">
        <div class="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- 🛡️ Columna 1: JLT Inputs (Equipos fijos) -->
          <div class="flex flex-col min-w-0 h-full border-r border-slate-100 pr-4">
            <div class="flex items-center gap-2 justify-between mb-1 shrink-0">
              <mat-checkbox
                color="primary"
                class="small-checkbox"
                [checked]="jltStatus().sanitary"
                (change)="updateJlt('sanitary', $event.checked)"
              >
                <span>
                  {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SANITARY' | translate }}
                </span>
              </mat-checkbox>
              <mat-checkbox
                color="primary"
                class="small-checkbox"
                [checked]="jltStatus().security"
                (change)="updateJlt('security', $event.checked)"
              >
                <span>
                  {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SECURITY' | translate }}
                </span>
              </mat-checkbox>
              <mat-checkbox
                color="primary"
                class="small-checkbox"
                [checked]="jltStatus().boat"
                (change)="updateJlt('boat', $event.checked)"
              >
                <span>
                  {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.BOAT' | translate }}
                </span>
              </mat-checkbox>
            </div>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full flex-1 small-textarea min-h-0">
              <textarea
                matInput
                class="custom-scrollbar"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.OBSERVATIONS_PLACEHOLDER' | translate"
                [value]="jltStatus().observations"
                (input)="updateJltObservations($event)"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- ⚙️ Columna 2: Unidades Técnicas (Lectura) -->
          <div
            class="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 content-start min-w-0 h-full overflow-hidden"
          >
            @for (unit of techUnits(); track unit.id) {
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <mat-icon
                    class="!w-4 !h-4 !text-[16px]"
                    [class]="unit.ready ? '!text-[var(--inta-button)]' : '!text-gray-700'"
                  >
                    {{ unit.ready ? 'check_box' : 'check_box_outline_blank' }}
                  </mat-icon>
                  <span class="text-[11px] font-bold text-slate-700">{{ unit.labelKey | translate }}</span>
                </div>
                <span class="text-[9px] text-slate-400 pl-5.5 leading-tight truncate">
                  {{ unit.observations || ('TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.NO_OBSERVATIONS' | translate) }}
                </span>
              </div>
            }
          </div>

          <!-- 🎯 Columna 3: Ejecución (Controles) -->
          <div class="flex flex-col min-w-0 h-full border-l border-slate-100 pl-4">
            <div class="flex items-center gap-1.5 mb-2 shrink-0">
              <ui-inta-icon name="target" color="var(--inta-button)" />
              <span class="text-sm font-semibold text-gray-700 leading-tight truncat">
                {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.EXECUTION' | translate }}
              </span>
            </div>

            <div class="flex items-center gap-2 mb-3 shrink-0">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select flex-1">
                <mat-select [value]="selectedSerie()">
                  <mat-option value="funcionamiento-1">Funcionamiento I</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select flex-1">
                <mat-select [value]="selectedShot()">
                  <mat-option value="shot-3">Disparo 3</mat-option>
                  <mat-option value="shot-4">Disparo 4</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="border-t border-slate-100 mb-3 shrink-0"></div>

            <div class="grid grid-cols-2 gap-2 mt-auto shrink-0">
              <button mat-flat-button color="primary">
                {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SELECT_SHOT' | translate }}
              </button>
              <button mat-flat-button>
                {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.FIRE' | translate }}
              </button>
            </div>
          </div>
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

    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
  `,
})
export class ExecutionPrepJltWidgetComponent extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #executionStore = inject(ExecutionStore);

  // 🔄 Selectores
  readonly selectedSerie = this.#executionStore.activeSerieId;
  readonly selectedShot = this.#executionStore.activeShotId;

  // 📥 Inputs JLT
  readonly jltStatus = this.#executionStore.jltStatus;

  // ⚙️ Outputs Unidades Técnicas (Simulados - vendrían del store global)
  readonly techUnits = this.#executionStore.techUnits;

  // 🏁 Computed: ¿Está todo preparado?
  readonly isAllReady = this.#executionStore.isReadyForExecution;

  // 📊 Form State
  readonly formState = computed((): WidgetFormState => {
    const jlt = this.jltStatus();
    const hasChanges = jlt.observations.length > 0; // Simplificado para el demo

    return {
      widgetId: this.widgetId(),
      dirty: hasChanges,
      touched: hasChanges,
      valid: true,
      hasChanges,
    };
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Acciones
  // ──────────────────────────────────────────────────────────────────────────

  updateJlt(field: keyof JltStatus, value: boolean): void {
    this.#executionStore.updateJltStatus({ [field]: value });
  }

  updateJltObservations(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.#executionStore.updateJltStatus({ observations: value });
  }

  resetForm(): void {
    this.#executionStore.updateJltStatus({
      sanitary: false,
      security: false,
      boat: false,
      observations: '',
    });
  }

  async saveForm(): Promise<void> {
    console.log('💾 Guardando Preparación JLT:', this.jltStatus());
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
