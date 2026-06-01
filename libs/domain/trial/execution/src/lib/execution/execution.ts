import { DatePipe, NgClass } from '@angular/common';
import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionGeneralDataStore } from '../stores/execution-general-data.store';
import { ExecutionGridComponent } from './components/execution-grid/execution-grid';
import { CancelExecutionDialog } from './dialogs/cancel-execution-dialog';
import { InterruptExecutionDialog } from './dialogs/interrupt-execution-dialog';
import type { WidgetType } from './models/execution-grid.models';
import { WidgetStateService } from './services/widget-state.service';

// ID de demo mientras la ruta no expose :fireTrialId como parámetro
const DEMO_FIRE_TRIAL_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

/** ⚡ Polling interval in ms for execution state refresh */
const EXECUTION_STATE_POLLING_MS = 5_000;

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  category: string;
  badge?: string;
  badgeColor?: 'purple' | 'blue';
  defaultWidth: 1 | 2 | 3;
}

@Component({
  selector: 'inta-execution',
  imports: [
    NgClass,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
    ExecutionGridComponent,
  ],
  providers: [WidgetStateService],
  template: `
    <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <!-- Header -->
      <div
        class="mx-6 mt-6 px-6 py-4 shrink-0 flex flex-col gap-4 bg-white rounded-lg border border-gray-100 shadow-sm"
      >
        <!-- Fila 1: Datos de ejecución principales -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
              {{ executionData().code }}
            </span>
            <span class="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
              {{ shotInfo().actual.serie }}
            </span>
            <span class="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
              {{ shotInfo().actual.shot }}
            </span>

            <!-- Botón de Avance (Trigger de historial) -->
            <button
              mat-flat-button
              class="!bg-purple-600 !text-white !rounded-xl !h-10 !px-4 flex items-center gap-2"
              [matMenuTriggerFor]="shotHistoryMenu"
            >
              <mat-icon class="scale-90">info_outline</mat-icon>
              <span class="text-sm font-medium">% avance prueba: {{ shotInfo().actual.percentaje }}%</span>
            </button>

            <span class="px-4 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 ml-1">
              {{ executionData().status }}
            </span>
          </div>

          <button
            mat-flat-button
            class="!bg-purple-600 !text-white !rounded-xl !h-10"
            [matMenuTriggerFor]="actionsMenu"
          >
            {{ 'TRIAL_EXECUTION.ACTIONS' | translate }}
            <mat-icon iconPositionEnd>expand_more</mat-icon>
          </button>
        </div>

        <!-- Fila 2: Metadata y Controles de UI -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
              {{ executionData().client }}
            </span>
            <span class="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
              {{ executionData().project }}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Botón Guardar -->
            <button mat-mini-fab class="!bg-purple-600 !text-white !shadow-none !rounded-xl" (click)="saveAllChanges()">
              <mat-icon>save</mat-icon>
            </button>

            <!-- Botón Widgets -->
            <button
              mat-flat-button
              class="!bg-purple-50 !text-purple-700 !rounded-xl !h-10 !px-6"
              (click)="toggleWidgetsPanel()"
            >
              {{ 'TRIAL_EXECUTION.WIDGETS_BTN' | translate }}
            </button>

            <!-- Toggle Editar -->
            <div class="flex items-center gap-2 ml-2">
              <mat-slide-toggle color="primary" [checked]="isEditMode()" (change)="toggleEditMode()">
                <span class="text-sm font-medium text-gray-600">{{ 'TRIAL_EXECUTION.EDIT_PANEL' | translate }}</span>
              </mat-slide-toggle>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Info Card -->
      <div class="mx-6 mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <mat-icon class="text-purple-600 scale-75">dashboard</mat-icon>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grid State</span>
            <span class="text-sm font-semibold text-gray-700">
              {{ widgetStateService.placedWidgets().length }} widgets
            </span>
          </div>
          <div class="flex items-center gap-2 border-l border-gray-100 pl-6">
            <mat-icon class="text-orange-500 scale-75">edit_note</mat-icon>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dirty Forms</span>
            <span class="text-sm font-semibold text-gray-700">{{ widgetStateService.dirtyWidgets().length }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sync Status</span>
          <span
            class="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-tight"
            [class]="
              widgetStateService.hasUnsavedChanges() ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
            "
          >
            {{ widgetStateService.hasUnsavedChanges() ? 'CHANGES PENDING' : 'SYNCED' }}
          </span>
        </div>
      </div>

      <div class="flex-1 mx-6 my-6 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
        @if (widgetStateService.placedWidgets().length === 0 && !isEditMode()) {
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="text-center">
              <p class="text-gray-600 text-lg mb-2">{{ 'TRIAL_EXECUTION.EMPTY_PANEL_TITLE' | translate }}</p>
              <p class="text-gray-500 text-sm">
                {{ 'TRIAL_EXECUTION.EMPTY_PANEL_DESC_1' | translate }}
                <button
                  mat-button
                  class="!text-purple-600 !font-medium !inline-flex !px-1"
                  (click)="toggleWidgetsPanel()"
                >
                  {{ 'TRIAL_EXECUTION.EMPTY_PANEL_DESC_WIDGETS_BTN' | translate }}
                </button>
                {{ 'TRIAL_EXECUTION.EMPTY_PANEL_DESC_2' | translate }}
              </p>
            </div>
          </div>
        } @else {
          <inta-execution-grid
            [editMode]="isEditMode()"
            (widgetAdded)="onWidgetAdded($event)"
            (widgetRemoved)="onWidgetRemoved($event)"
          />
        }
      </div>

      <!-- Widgets Side Panel -->
      <div
        class="fixed top-0 right-0 w-full md:w-[400px] h-screen bg-white shadow-xl z-[1001] flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-full]="!isWidgetsPanelOpen()"
        [class.translate-x-0]="isWidgetsPanelOpen()"
      >
        <div class="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 class="text-lg font-semibold text-gray-800">{{ 'TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE' | translate }}</h2>
          <button mat-icon-button (click)="closeWidgetsPanel()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <!-- Search -->
          <div class="flex items-center bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 mb-6">
            <mat-icon class="text-gray-400 mr-2 text-[20px] w-5 h-5">search</mat-icon>
            <input
              type="text"
              class="flex-1 border-none outline-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400"
              [placeholder]="'TRIAL_EXECUTION.SEARCH_WIDGET_PLACEHOLDER' | translate"
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
            />
          </div>

          <!-- Widgets List -->
          <div class="flex flex-col gap-6">
            @for (category of getCategoryKeys(); track category) {
              <div class="flex flex-col gap-3">
                <h3 class="text-[13px] font-semibold text-gray-500 tracking-wide mb-1">{{ category | translate }}</h3>

                @for (widget of groupedWidgets()[category]; track widget.id) {
                  <div
                    class="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="text-[15px] font-semibold text-gray-900 m-0">{{ widget.title | translate }}</h4>
                      <div class="flex items-center gap-2">
                        @if (widget.badge) {
                          <span
                            class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0"
                            [ngClass]="getBadgeColorClass(widget.badgeColor)"
                          >
                            {{ widget.badge }}
                          </span>
                        }
                        <span class="text-[10px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase">
                          W: {{ widget.defaultWidth }}
                        </span>
                      </div>
                    </div>
                    <p class="text-[13px] text-gray-500 leading-relaxed m-0">{{ widget.description | translate }}</p>
                    <button
                      mat-flat-button
                      color="primary"
                      class="!bg-purple-600 hover:!bg-purple-700 w-full !mt-3"
                      (click)="addWidget(widget.id)"
                    >
                      {{ 'TRIAL_EXECUTION.ADD' | translate }}
                    </button>
                  </div>
                }
              </div>
            }

            <!-- No results -->
            @if (!filteredWidgets().length) {
              <div class="py-10 px-5">
                <p class="text-gray-500 text-center">{{ 'TRIAL_EXECUTION.NO_WIDGETS_FOUND' | translate }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <div
        tabindex="0"
        role="button"
        class="fixed inset-0 bg-black/50 z-[1000] transition-all duration-300 ease-in-out cursor-pointer"
        [attr.aria-label]="'TRIAL_EXECUTION.CLOSE_WIDGET_PANEL' | translate"
        [class.opacity-0]="!isWidgetsPanelOpen()"
        [class.invisible]="!isWidgetsPanelOpen()"
        [class.opacity-100]="isWidgetsPanelOpen()"
        [class.visible]="isWidgetsPanelOpen()"
        (click)="closeWidgetsPanel()"
        (keydown.enter)="closeWidgetsPanel()"
        (keydown.space)="closeWidgetsPanel()"
      ></div>
    </div>

    <!-- Actions Menu -->
    <mat-menu class="!min-w-[200px]" #actionsMenu="matMenu">
      <button mat-menu-item (click)="startExecution()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_START' | translate }}</span>
      </button>
      <button mat-menu-item (click)="pauseExecution()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_PAUSE' | translate }}</span>
      </button>
      <button mat-menu-item (click)="resumeExecution()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_RESUME' | translate }}</span>
      </button>
      <button mat-menu-item (click)="openInterruptDialog()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_STOP' | translate }}</span>
      </button>
      <button mat-menu-item (click)="openCancelDialog()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_CANCEL' | translate }}</span>
      </button>
      <button mat-menu-item (click)="finishExecution()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_FINISH' | translate }}</span>
      </button>
    </mat-menu>

    <!-- Shot History Menu -->
    <mat-menu yPosition="below" class="!rounded-2xl !min-w-[600px] overflow-hidden" #shotHistoryMenu="matMenu">
      <div
        tabindex="0"
        role="region"
        class="p-0 outline-none"
        (click)="$event.stopPropagation()"
        (keydown.enter)="$event.stopPropagation()"
        (keydown.space)="$event.stopPropagation()"
      >
        <!-- Table Header -->
        <div class="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Series</span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disparo</span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha ejecución</span>
        </div>

        <!-- Table Body -->
        <div class="max-h-[350px] overflow-y-auto">
          @for (history of shotInfo().all; track history.serie) {
            @for (historicShot of history.shots; track historicShot.timestamp) {
              <div
                class="grid grid-cols-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span
                  matTooltipPosition="above"
                  class="text-sm font-medium text-gray-700 truncate pr-4"
                  [matTooltip]="history.serie"
                >
                  {{ history.serie }}
                </span>
                <span class="text-sm text-gray-600">{{ historicShot.shot }}</span>
                <div>
                  <span
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-block"
                    [ngClass]="getStatusClass(historicShot.status)"
                  >
                    {{ historicShot.status }}
                  </span>
                </div>
                <span class="text-sm text-gray-500 font-medium">
                  {{ historicShot.timestamp | date: 'dd/MM/yyyy' }}
                </span>
              </div>
            }
          }
        </div>
      </div>
    </mat-menu>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Execution implements OnInit {
  readonly #dialog = inject(MatDialog);
  readonly #destroyRef = inject(DestroyRef);
  //readonly #transitionsService = inject(ExecutionTransitionsService);
  readonly #store = inject(ExecutionGeneralDataStore);
  readonly widgetStateService = inject(WidgetStateService);

  readonly #fireTrialId = DEMO_FIRE_TRIAL_ID;
  isWidgetsPanelOpen = signal(false);
  isEditMode = signal(false);
  searchTerm = signal('');

  // Store integration - these will be connected to store in future updates
  readonly store = this.#store;

  executionData = signal({
    code: '034A/25',
    client: 'Cliente: RHEINMETALL EXPAL MUNITIONS',
    project: 'Proyectil de 155 mm SMK RP ERG2A1',
    status: 'En curso',
  });

  shotInfo = signal({
    actual: {
      serie: 'Serie Alpha (A-155mm)',
      shot: 'Disparo #03',
      percentaje: '75',
    },
    all: [
      {
        serie: 'Serie Alpha (A-155mm)',
        shots: [
          { shot: 'Disparo #01', timestamp: '2026-03-10T08:15:00Z', status: 'Ejecutada' },
          { shot: 'Disparo #02', timestamp: '2026-03-10T08:45:00Z', status: 'Planificada' },
          { shot: 'Disparo #03', timestamp: '2026-03-10T09:30:00Z', status: 'Analizando' },
        ],
        timestamp: '2026-03-10T08:15:00Z',
      },
      {
        serie: 'Serie Bravo (B-155mm)',
        shots: [
          { shot: 'Disparo #01', timestamp: '2026-03-09T10:00:00Z', status: 'Ejecutada' },
          { shot: 'Disparo #02', timestamp: '2026-03-09T11:20:00Z', status: 'Planificada' },
          { shot: 'Disparo #03', timestamp: '2026-03-09T14:15:00Z', status: 'Analizando' },
          { shot: 'Disparo #04', timestamp: '2026-03-09T16:00:00Z', status: 'Planificada' },
        ],
        timestamp: '2026-03-09T10:00:00Z',
      },
    ],
  });

  getStatusClass(status?: string): string {
    switch (status) {
      case 'Ejecutada':
        return 'bg-green-100 text-green-700';
      case 'Planificada':
        return 'bg-blue-100 text-blue-700';
      case 'Analizando':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  widgets = signal<Widget[]>([
    {
      id: 'disparo',
      type: 'shot',
      title: 'Disparo',
      description: 'Introducción de datos del disparo seleccionado',
      category: 'Genéricos',
      badge: 'L',
      defaultWidth: 3,
    },
    {
      id: 'seguimiento-general',
      type: 'general-tracking',
      title: 'Seguimiento general',
      description: 'Activos, pendientes y críticas',
      category: 'Genéricos',
      badge: 'S',
      badgeColor: 'purple',
      defaultWidth: 2,
    },
    {
      id: 'preparacion-ejecucion',
      type: 'execution-prep',
      title: 'Preparación ejecución',
      description: 'Estado previo de sensores, contución y recursos',
      category: 'Genéricos',
      badge: 'S',
      badgeColor: 'purple',
      defaultWidth: 1,
    },
    {
      id: 'parametros-radar',
      type: 'radar-config',
      title: 'Parámetros de configuración radar',
      description: 'Configuración del radar',
      category: 'Balística',
      badge: 'S',
      badgeColor: 'purple',
      defaultWidth: 1,
    },
    {
      id: 'historico-velocidades',
      type: 'velocity-history',
      title: 'Histórico velocidades',
      description: 'Evolución de velocidades registradas',
      category: 'Balística',
      badge: 'L',
      defaultWidth: 3,
    },
    {
      id: 'magnitudes',
      type: 'magnitudes',
      title: 'Magnitudes',
      description: 'Magnitudes de la prueba',
      category: 'Jefe línea de tiro',
      badge: 'L',
      defaultWidth: 3,
    },
  ]);

  filteredWidgets = signal<Widget[]>([]);
  groupedWidgets = signal<{ [key: string]: Widget[] }>({});

  ngOnInit(): void {
    this.#filterWidgets();
    // Initialize store with demo fire trial ID
    this.#store.setFireTrialId(this.#fireTrialId);
    this.#startExecutionStatePolling();
  }

  /**
   * 🔄 Sets up periodic polling for execution state.
   * Uses `setInterval` + `DestroyRef.onDestroy` — the idiomatic Angular 21
   * zoneless lifecycle pattern. The interval is automatically cleared when
   * the component is destroyed, preventing memory leaks.
   */
  #startExecutionStatePolling(): void {
    const intervalId = setInterval(() => {
      this.#store.loadExecutionState(this.#fireTrialId);
    }, EXECUTION_STATE_POLLING_MS);

    this.#destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  toggleWidgetsPanel(): void {
    this.isWidgetsPanelOpen.set(!this.isWidgetsPanelOpen());
  }

  closeWidgetsPanel(): void {
    this.isWidgetsPanelOpen.set(false);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.#filterWidgets();
  }

  #filterWidgets(): void {
    const search = this.searchTerm().toLowerCase();
    const allWidgets = this.widgets();

    if (!search) {
      this.filteredWidgets.set(allWidgets);
    } else {
      const filtered = allWidgets.filter(
        (widget) =>
          widget.title.toLowerCase().includes(search) ||
          widget.description.toLowerCase().includes(search) ||
          widget.category.toLowerCase().includes(search),
      );
      this.filteredWidgets.set(filtered);
    }

    this.#groupWidgetsByCategory();
  }

  #groupWidgetsByCategory(): void {
    const grouped: { [key: string]: Widget[] } = {};

    this.filteredWidgets().forEach((widget) => {
      if (!grouped[widget.category]) {
        grouped[widget.category] = [];
      }
      grouped[widget.category].push(widget);
    });

    this.groupedWidgets.set(grouped);
  }

  getCategoryKeys(): string[] {
    return Object.keys(this.groupedWidgets());
  }

  toggleEditMode(): void {
    this.isEditMode.set(!this.isEditMode());
    console.log('Modo edición:', this.isEditMode());
  }

  getBadgeColorClass(color?: string): string {
    if (color === 'purple') return 'bg-purple-100 text-purple-600';
    if (color === 'blue') return 'bg-blue-100 text-blue-600';
    return 'bg-blue-100 text-blue-600';
  }

  startExecution(): void {
    // Use new store method
    this.#store.startExecution(this.#fireTrialId);
  }

  pauseExecution(): void {
    this.#store.pauseExecution(this.#fireTrialId);
  }

  resumeExecution(): void {
    this.#store.resumeExecution(this.#fireTrialId);
  }

  finishExecution(): void {
    this.#store.finishExecution(this.#fireTrialId);
  }

  openInterruptDialog(): void {
    this.#dialog
      .open(InterruptExecutionDialog, {
        width: '600px',
        data: { trialName: this.executionData().code },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result || result.action === 'back') return;
        this.#store.interruptExecution(this.#fireTrialId, result.reason);
      });
  }

  openCancelDialog(): void {
    this.#dialog
      .open(CancelExecutionDialog, {
        width: '600px',
        data: { trialName: this.executionData().code },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result || result.action === 'back') return;
        this.#store.cancelExecution(this.#fireTrialId, result.reason);
      });
  }

  addWidget(widgetId: string): void {
    const widget = this.widgets().find((w) => w.id === widgetId);
    if (!widget) return;

    this.widgetStateService.addWidget(widget.type, widget.defaultWidth);

    this.onWidgetAdded(widgetId);
    this.closeWidgetsPanel();
  }

  getDefaultWidgetWidth(widgetType: string): 1 | 2 | 3 {
    const config: Record<string, 1 | 2 | 3> = {
      disparo: 3,
      'seguimiento-general': 2,
      'preparacion-ejecucion': 2,
      'parametros-radar': 2,
      'historico-velocidades': 3,
      magnitudes: 3,
    };

    return config[widgetType] || 1;
  }

  onWidgetAdded(widgetId: string): void {
    console.log('Widget añadido:', widgetId);
  }

  onWidgetRemoved(widgetId: string): void {
    console.log('Widget removido:', widgetId);
  }

  async saveAllChanges(): Promise<void> {
    await this.widgetStateService.saveAllDirtyForms();
    console.log('Todos los cambios guardados');
  }
}
