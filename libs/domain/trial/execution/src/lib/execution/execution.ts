import { DatePipe, Location, NgClass } from '@angular/common';
import type { OnDestroy, OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { injectCurrentUser } from '@intaqalab/core';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore } from '../+state/execution.store';
import { ExecutionGridComponent } from './components/execution-grid/execution-grid';
import { CancelExecutionDialog } from './dialogs/cancel-execution-dialog';
import type { EquipmentSelectorDialogResult } from './dialogs/equipment-selector-dialog';
import { EquipmentSelectorDialog } from './dialogs/equipment-selector-dialog';
import { InterruptExecutionDialog } from './dialogs/interrupt-execution-dialog';
import { PauseExecutionDialog } from './dialogs/pause-execution-dialog';
import type { TrialSelectorDialogResult } from './dialogs/trial-selector-dialog';
import { TrialSelectorDialog } from './dialogs/trial-selector-dialog';
import type { Widget } from './models/execution-grid.models';
import { WidgetStateService } from './services/widget-state.service';
import { injectWidgets } from './utils/inject-widgets';

/** ⚡ Polling interval in ms for execution state refresh */
const EXECUTION_STATE_POLLING_MS = 5_000;

@Component({
  selector: 'inta-execution',
  imports: [
    NgClass,
    DatePipe,
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
    IntaIconComponent,
  ],
  providers: [WidgetStateService],
  template: `
    <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <!-- Header -->
      <div class="flex flex-col gap-4">
        <!-- Fila 1: Datos de ejecución principales -->
        <div class="flex gap-4 flex-wrap items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap">
            <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
              {{ executionData().code }}
            </span>
            <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
              {{ shotInfo().actual.serie }}
            </span>
            <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
              {{ shotInfo().actual.shot }}
            </span>

            <!-- Botón de Avance (Trigger de historial) -->
            <button mat-flat-button color="primary" [matMenuTriggerFor]="shotHistoryMenu">
              <ui-inta-icon name="info" class="mr-2" />
              <span class="font-normal">
                % avance prueba:
                <b>{{ shotInfo().actual.percentaje }}%</b>
              </span>
            </button>

            <span class="px-4 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 ml-1">
              {{ executionData().status }}
            </span>
          </div>

          <button mat-flat-button color="primary" [matMenuTriggerFor]="actionsMenu">
            {{ 'TRIAL_EXECUTION.ACTIONS' | translate }}
            <mat-icon iconPositionEnd>expand_more</mat-icon>
          </button>
        </div>

        <!-- Fila 2: Metadata y Controles de UI -->
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 text-gray-700">
              {{ executionData().client }}
            </span>
            <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 text-gray-700">
              {{ executionData().project }}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Botón Selector Equipos -->
            <button mat-flat-button color="primary" (click)="openEquipmentSelectorDialog()">
              {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BTN_LABEL' | translate }}
            </button>

            <!-- Botón Guardar -->
            <button mat-flat-button color="primary" class="!px-4 !min-w-auto" (click)="saveAllChanges()">
              <ui-inta-icon name="save" />
            </button>

            <!-- Botón Widgets -->
            <button
              mat-flat-button
              color="primary"
              style="color: var(--inta-button)"
              class="!bg-transparent !p-0"
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
      <div
        class="hidden mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
      >
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

      <div class="flex-1 my-6 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
        <inta-execution-grid
          [editMode]="isEditMode()"
          (widgetAdded)="onWidgetAdded($event)"
          (widgetRemoved)="onWidgetRemoved($event)"
          (openWidgetsPanel)="toggleWidgetsPanel()"
        />
      </div>

      <!-- Widgets Side Panel -->
      <div
        class="fixed top-0 right-0 w-full md:w-[400px] h-screen bg-white shadow-xl z-[1001] flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-full]="!isWidgetsPanelOpen()"
        [class.translate-x-0]="isWidgetsPanelOpen()"
      >
        <div class="flex flex-col gap-4 justify-between p-5 border-b border-gray-200 shrink-0">
          <div class="flex flex-column items-center justify-between gap-4">
            <h2 class="text-lg font-semibold text-gray-800">
              {{ 'TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE' | translate }}
            </h2>
            <button mat-icon-button (click)="closeWidgetsPanel()">
              <ui-inta-icon name="close" size="xxl" />
            </button>
          </div>
          <!-- Search -->
          <div class="flex items-center">
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <ui-inta-icon matPrefix name="search" size="md" color="var(--inta-button)" class="mx-3" />
              <input
                matInput
                type="text"
                class="flex-1 border-none outline-none bg-white text-sm text-gray-700 placeholder:text-gray-400"
                [placeholder]="'TRIAL_EXECUTION.SEARCH_WIDGET_PLACEHOLDER' | translate"
                [value]="searchTerm()"
                (input)="onSearchChange($event)"
              />
            </mat-form-field>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <!-- Widgets List -->
          <div class="flex flex-col gap-6">
            @for (category of getCategoryKeys(); track category) {
              <div class="flex flex-col gap-3">
                <h3 class="text-xs font-semibold text-gray-600 tracking-wide mb-1">{{ category | translate }}</h3>

                @for (widget of groupedWidgets()[category]; track widget.id) {
                  <div
                    class="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="text-sm text-gray-900 m-0 flex-1">{{ widget.title | translate }}</h4>
                      <div class="flex items-center gap-2">
                        @if (widget.badge) {
                          <span
                            class="inline-flex items-center justify-center w-6 h-6 rounded-md font-medium shrink-0"
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
                    <p class="text-xs text-gray-500 leading-relaxed mb-4">{{ widget.description | translate }}</p>
                    <button mat-flat-button color="primary" class="w-full" (click)="addWidget(widget.id)">
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
export class Execution implements OnInit, OnDestroy {
  readonly #dialog = inject(MatDialog);
  readonly #location = inject(Location);
  #pollingIntervalId: ReturnType<typeof setInterval> | null = null;
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  //readonly #transitionsService = inject(ExecutionTransitionsService);
  readonly #store = inject(ExecutionStore);
  readonly widgetStateService = inject(WidgetStateService);
  readonly #translate = inject(TranslateService);
  readonly #currentUser = injectCurrentUser();

  // eslint-disable-next-line no-unused-private-class-members
  readonly #loadPreferencesEffect = effect(
    () => {
      const preferences = this.#store.preferencesByUser();
      if (preferences) {
        const layout = preferences.widgetsLayout;
        if (layout) {
          untracked(() => {
            this.widgetStateService.clearWidgets();
            for (const layoutItem of layout) {
              const widget = this.widgets().find((w) => w.widgetId === layoutItem);
              if (widget) {
                try {
                  this.widgetStateService.addWidget(
                    widget.widgetId,
                    widget.defaultWidth,
                    undefined,
                    widget.techProfile,
                    widget.defaultHeight ?? 1,
                  );
                } catch (e) {
                  console.error('Error adding widget from preferences:', e);
                  break; // Grid is full - stop trying to paint more widgets
                }
              }
            }
          });
        }
      }
    },
    { allowSignalWrites: true },
  );

  readonly #fireTrialId = signal<string | null>(null);
  isWidgetsPanelOpen = signal(false);
  isEditMode = signal(false);
  searchTerm = signal('');

  // Store integration
  readonly store = this.#store;

  /** Datos del header derivados del FireTrial cargado en el store. */
  readonly executionData = computed(() => {
    const trial = this.#store.fireTrialData();
    if (!trial) {
      return { code: '—', client: '—', project: '—', status: '—' };
    }
    return {
      code: trial.trialNumber ?? '—',
      client: trial.client?.name ? `Cliente: ${trial.client.name}` : '—',
      project: trial.description ?? '—',
      status: this.#mapStatusLabel(trial.status),
    };
  });

  /** Información de series/disparos derivada del progress del store. */
  readonly shotInfo = computed(() => {
    const progress = this.#store.executionProgress();
    const execState = this.#store.executionState();

    if (!progress?.series?.length) {
      return { actual: { serie: '—', shot: '—', percentaje: '0' }, all: [] };
    }

    const allSeries = progress.series.map((s, si) => ({
      serie: `Serie ${si + 1}`,
      shots: s.shots.map((sh, hi) => ({
        shot: `Disparo #${String(hi + 1).padStart(2, '0')}`,
        timestamp: sh.updatedAt,
        status: this.#mapShotStatus(sh.status),
      })),
      timestamp: s.shots[0]?.updatedAt ?? '',
    }));

    // Disparo/serie activa según executionState
    const activeSerieIdx = execState?.activeSeriesId
      ? progress.series.findIndex((s) => s.seriesId === execState.activeSeriesId)
      : 0;
    const activeSerie = allSeries[Math.max(activeSerieIdx, 0)];
    const activeShotInSerie = execState?.activeShootId
      ? progress.series[Math.max(activeSerieIdx, 0)]?.shots.findIndex((sh) => sh.shotId === execState.activeShootId)
      : 0;

    const totalShots = progress.series.reduce((acc, s) => acc + s.shots.length, 0);
    const firedShots = progress.series.reduce(
      (acc, s) => acc + s.shots.filter((sh) => sh.status === 'FIRED').length,
      0,
    );
    const percentaje = totalShots > 0 ? Math.round((firedShots / totalShots) * 100) : 0;

    return {
      actual: {
        serie: activeSerie?.serie ?? '—',
        shot: `Disparo #${String(Math.max(activeShotInSerie ?? 0, 0) + 1).padStart(2, '0')}`,
        percentaje: String(percentaje),
      },
      all: allSeries,
    };
  });

  /** Mapea estado de disparo de la API al texto en español. */
  #mapShotStatus(status: string): string {
    switch (status) {
      case 'FIRED':
        return 'Ejecutada';
      case 'ACTIVE':
        return 'Analizando';
      default:
        return 'Planificada';
    }
  }

  /** Mapea TrialStatus de la API a etiqueta en español. */
  #mapStatusLabel(status: string | undefined): string {
    if (!status) return '—';
    const map: Record<string, string> = {
      PLANNED: 'Planificada',
      STARTED: 'Iniciada',
      IN_PROGRESS: 'En curso',
      INTERRUPTED: 'Interrumpida',
      EXECUTED: 'Ejecutada',
      FINALIZING: 'Finalizando',
      CLOSED: 'Cerrada',
      CANCELLED: 'Cancelada',
    };
    return map[status] ?? status;
  }

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

  widgets = signal<Widget[]>(injectWidgets());

  filteredWidgets = signal<Widget[]>([]);
  groupedWidgets = signal<{ [key: string]: Widget[] }>({});

  ngOnInit(): void {
    const fireTrialIdFromRoute = this.#route.snapshot.paramMap.get('fireTrialId');
    if (fireTrialIdFromRoute) {
      // Arrived via URL with :fireTrialId — skip dialog, load directly
      this.#fireTrialId.set(fireTrialIdFromRoute);
      this.#initExecution();
    } else {
      // No ID in URL — show trial selector dialog
      this.#openTrialSelectorDialog();
    }
  }

  ngOnDestroy(): void {
    if (this.#pollingIntervalId !== null) {
      clearInterval(this.#pollingIntervalId);
      this.#pollingIntervalId = null;
    }
    const preferences = this.#store.preferencesByUser();
    const trialId = this.#fireTrialId();
    if (preferences && trialId) {
      const widgetsLayout = this.widgetStateService.placedWidgets().map((w) => w.type);
      this.#store.updatePreferencesByUser(trialId, this.#currentUser.preferred_username, widgetsLayout);
    }
  }

  /** ⚡ Opens trial selector dialog before loading the execution view. */
  async #openTrialSelectorDialog(): Promise<void> {
    const dialogRef = this.#dialog.open<TrialSelectorDialog, void, TrialSelectorDialogResult>(TrialSelectorDialog, {
      width: '1100px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || result.action === 'cancel') {
      this.#location.back();
      return;
    }
    // Navigate to parameterized URL — triggers a fresh route load with the trial ID
    this.#router.navigate(['/execution', result.trial.id], { replaceUrl: true });
  }

  /** ⚙️ Initializes store and polling after trial is selected. */
  #initExecution(): void {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    this.#filterWidgets();
    this.#store.setFireTrialId(trialId);
    this.#startExecutionStatePolling();
    //this.#store.loadPreferencesByUser(trialId, this.#currentUser.preferred_username);
  }

  /** 🔄 Sets up periodic polling for execution state. */
  #startExecutionStatePolling(): void {
    if (this.#pollingIntervalId !== null) {
      clearInterval(this.#pollingIntervalId);
    }

    this.#pollingIntervalId = setInterval(() => {
      const trialId = this.#fireTrialId();
      if (trialId) {
        this.#store.loadExecutionState(trialId);
      }
    }, EXECUTION_STATE_POLLING_MS);
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
      const filtered = allWidgets.filter((widget) => {
        const title = this.#translate.instant(widget.title).toLowerCase();
        const description = this.#translate.instant(widget.description).toLowerCase();
        const category = this.#translate.instant(widget.category).toLowerCase();
        return title.includes(search) || description.includes(search) || category.includes(search);
      });
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
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    this.#store.startExecution(trialId);
  }

  async pauseExecution(): Promise<void> {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    const dialogRef = this.#dialog.open(PauseExecutionDialog, {
      width: '600px',
      data: { trialName: this.executionData().code, trialId: this.#fireTrialId },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || result.action === 'back') return;
    console.log('Pausing execution with reason:', result.action);
  }

  resumeExecution(): void {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    this.#store.resumeExecution(trialId);
  }

  finishExecution(): void {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    this.#store.finishExecution(trialId);
  }

  async openInterruptDialog(): Promise<void> {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    const dialogRef = this.#dialog.open(InterruptExecutionDialog, {
      width: '600px',
      data: { trialName: this.executionData().code },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || result.action === 'back') return;
    this.#store.interruptExecution(trialId, result.reason);
  }

  async openCancelDialog(): Promise<void> {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    const dialogRef = this.#dialog.open(CancelExecutionDialog, {
      width: '600px',
      data: { trialName: this.executionData().code },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || result.action === 'back') return;
    this.#store.cancelExecution(trialId, result.reason);
  }

  addWidget(widgetId: string): void {
    const widget = this.widgets().find((w) => w.id === widgetId);
    if (!widget) return;

    this.widgetStateService.addWidget(
      widget.widgetId,
      widget.defaultWidth,
      undefined,
      widget.techProfile,
      widget.defaultHeight ?? 1,
    );

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

  async openEquipmentSelectorDialog(): Promise<void> {
    const trialId = this.#fireTrialId();
    if (!trialId) return;
    this.#store.loadEquipmentSelector(trialId);
    const selector = this.#store.equipmentSelector();
    const dialogRef = this.#dialog.open<EquipmentSelectorDialog, unknown, EquipmentSelectorDialogResult>(
      EquipmentSelectorDialog,
      {
        width: '900px',
        minWidth: '900px',
        maxHeight: '90vh',
        data: {
          categories: selector.categories,
          items: selector.items,
          serieOptions: selector.serieOptions,
          disparoOptions: selector.disparoOptions,
          serieDisparoMap: selector.serieDisparoMap,
          initialEquipments: selector.equipments,
        },
      },
    );
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || result.action === 'back') return;
    this.#store.updateEquipmentSelections(result.equipments);
  }

  async saveAllChanges(): Promise<void> {
    await this.widgetStateService.saveAllDirtyForms();
    console.log('Todos los cambios guardados');
  }
}
