import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent } from '@intaqalab/ui';
import { deepEqual } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { JltStatus } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
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
              <mat-select [value]="selectedSerie()" (valueChange)="setActiveSerie($event)">
                @for (serie of serieOptions(); track serie.value) {
                  <mat-option [value]="serie.value">{{ serie.label }}</mat-option>
                }
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
                class="small-checkbox green-checkbox"
                [checked]="jltDraft().sanitary"
                (change)="updateJlt('sanitary', $event.checked)"
              >
                <span>
                  {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SANITARY' | translate }}
                </span>
              </mat-checkbox>
              <mat-checkbox
                class="small-checkbox green-checkbox"
                [checked]="jltDraft().security"
                (change)="updateJlt('security', $event.checked)"
              >
                <span>
                  {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SECURITY' | translate }}
                </span>
              </mat-checkbox>
              <mat-checkbox
                class="small-checkbox green-checkbox"
                [checked]="jltDraft().boat"
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
                [value]="jltDraft().observations"
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
                  <mat-icon class="!w-4 !h-4 !text-[16px]" [class]="unit.ready ? '!text-[#51a351]' : '!text-gray-700'">
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
                <mat-select [value]="selectedSerie()" (valueChange)="setActiveSerie($event)">
                  @for (serie of serieOptions(); track serie.value) {
                    <mat-option [value]="serie.value">{{ serie.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select flex-1">
                <mat-select [value]="selectedShot()" (valueChange)="setActiveShot($event)">
                  @for (shot of shotOptions(); track shot.value) {
                    <mat-option [value]="shot.value">{{ shot.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="border-t border-slate-100 mb-3 shrink-0"></div>

            <div class="grid grid-cols-2 gap-2 mt-auto shrink-0">
              <button mat-flat-button color="primary" [disabled]="!canExecuteActions()" (click)="selectCurrentShot()">
                {{ 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.SELECT_SHOT' | translate }}
              </button>
              <button mat-flat-button [disabled]="!canExecuteActions() || !isAllReady()" (click)="fireSelectedShot()">
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

  // 🔄 Selectores (estado LOCAL desacoplado, inicializado desde store)
  readonly selectedSerie = linkedSignal(() => this.#executionStore.activeSerieId());
  readonly selectedShot = linkedSignal(() => this.#executionStore.activeShotId());

  readonly serieOptions = computed(() =>
    (this.#executionStore.planningSeries() ?? []).map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    })),
  );

  readonly shotOptions = computed(() => {
    const serieId = this.selectedSerie() ?? this.serieOptions()[0]?.value;
    const serie = this.#executionStore.planningSeries()?.find((item) => item.id === serieId);

    return (serie?.shots ?? []).map((shot, index) => ({
      value: shot.id,
      label: `Disparo ${shot.globalNumber ?? index + 1}`,
    }));
  });

  readonly resolvedSerieId = computed(() => {
    const activeSerieId = this.selectedSerie();
    if (activeSerieId) {
      return activeSerieId;
    }

    const planningSerieId = this.#executionStore.planningSeries()?.[0]?.id;
    if (planningSerieId) {
      return planningSerieId;
    }

    return null;
  });

  readonly resolvedShotId = computed(() => {
    const activeShotId = this.selectedShot();
    if (activeShotId) {
      return activeShotId;
    }

    const serieId = this.resolvedSerieId();
    if (!serieId) {
      return null;
    }

    return this.#executionStore.planningSeries()?.find((serie) => serie.id === serieId)?.shots?.[0]?.id ?? null;
  });

  // 📥 Inputs JLT
  readonly jltStatus = this.#executionStore.jltStatus;

  // ⚙️ Outputs Unidades Técnicas (Simulados - vendrían del store global)
  readonly techUnits = this.#executionStore.techUnits;

  // 🏁 Computed: ¿Está todo preparado?
  readonly isAllReady = this.#executionStore.isReadyForExecution;

  readonly fireTrialId = this.#executionStore.fireTrialId;

  readonly selectedSerieLabel = computed(() => this.#mapSerieLabel(this.resolvedSerieId()));

  readonly selectedShotLabel = computed(() => this.#mapShotLabel(this.resolvedShotId()));

  readonly canExecuteActions = computed(() => !!this.fireTrialId() && !!this.resolvedSerieId());

  #lastLoadedJltPreparationKey: string | null = null;

  // � Borrador local editable — se resincroniza cuando el store cambia (GET de preparación)
  readonly jltDraft = linkedSignal<JltStatus>(() => this.#executionStore.jltStatus());

  // 📊 Form State: dirty solo si el borrador local difiere del estado guardado en el store
  readonly formState = computed((): WidgetFormState => {
    const dirty = !deepEqual(this.jltDraft(), this.jltStatus());

    return {
      widgetId: this.widgetId(),
      dirty,
      touched: dirty,
      valid: true,
      hasChanges: dirty,
    };
  });

  constructor() {
    super();

    effect(() => {
      this.#loadJltPreparationIfReady();
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.#loadJltPreparationIfReady();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Acciones
  // ──────────────────────────────────────────────────────────────────────────

  updateJlt(field: keyof JltStatus, value: boolean): void {
    this.jltDraft.update((draft) => ({ ...draft, [field]: value }));
  }

  setActiveSerie(serieId: string): void {
    this.selectedSerie.set(serieId);

    const firstShotId = this.#executionStore.planningSeries()?.find((serie) => serie.id === serieId)?.shots?.[0]?.id;
    if (firstShotId) {
      this.selectedShot.set(firstShotId);
    }
  }

  setActiveShot(shotId: string): void {
    this.selectedShot.set(shotId);
  }

  selectCurrentShot(): void {
    const trialId = this.fireTrialId();
    const serieId = this.resolvedSerieId();
    const shotId = this.resolvedShotId();
    if (!trialId || !shotId) {
      return;
    }
    // Actualización optimista: header reacciona inmediatamente sin esperar POST→GET
    this.#executionStore.setOptimisticActiveShot(serieId, shotId);
    this.#executionStore.selectJltShot(trialId, shotId);
  }

  fireSelectedShot(): void {
    const trialId = this.fireTrialId();
    if (!trialId) {
      return;
    }
    this.#executionStore.fireJltShot(trialId);
  }

  updateJltObservations(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.jltDraft.update((draft) => ({ ...draft, observations: value }));
  }

  resetForm(): void {
    this.jltDraft.set(this.#executionStore.jltStatus());
  }

  async saveForm(): Promise<void> {
    const trialId = this.fireTrialId();
    const serieId = this.resolvedSerieId();
    if (!trialId || !serieId) {
      return;
    }
    // Volcar el borrador al store antes del PUT para que dirty se recalcule contra lo guardado
    this.#executionStore.updateJltStatus(this.jltDraft());
    this.#executionStore.saveJltReadiness(trialId, serieId);
  }

  #mapSerieLabel(serieId: string | null): string {
    if (!serieId) {
      return 'Serie';
    }
    const shortId = serieId.slice(0, 8).toUpperCase();
    return `Serie ${shortId}`;
  }

  #mapShotLabel(shotId: string | null): string {
    if (!shotId) {
      return 'Disparo';
    }
    const shortId = shotId.slice(0, 8).toUpperCase();
    return `Disparo ${shortId}`;
  }

  #loadJltPreparationIfReady(): void {
    const trialId = this.fireTrialId();
    const serieId = this.resolvedSerieId();
    if (!trialId || !serieId) {
      return;
    }

    const requestKey = `${trialId}:${serieId}`;
    if (this.#lastLoadedJltPreparationKey === requestKey) {
      return;
    }

    this.#lastLoadedJltPreparationKey = requestKey;
    this.#executionStore.loadJltPreparation(trialId, serieId);
  }
}
