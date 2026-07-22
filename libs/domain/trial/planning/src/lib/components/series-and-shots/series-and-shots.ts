import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Badge, IntaIconComponent } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type { Serie, Shot } from '../../utils-models/series-and-shots.model';
import { ConfirmDeleteSerieDialog } from '../confirm-delete-serie-dialog/confirm-delete-serie-dialog';
import { ConfirmDeleteShotDialog } from '../confirm-delete-shot-dialog/confirm-delete-shot-dialog';
import { UpsertSerieDialog } from './new-serie-dialog/upsert-serie-dialog';

@Component({
  selector: 'inta-series-and-shots',
  imports: [
    TranslateModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    IntaIconComponent,
    Badge,
    TrialStatusLabelPipe,
  ],
  providers: [SeriesAndShotsStore],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto mt-4">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
        <div class="flex gap-2">
          <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
            {{ trialCode() }}
          </h2>
          <ui-badge [status]="store.fireTrial()?.status">
            {{ store.fireTrial()?.status | trialStatusLabel }}
          </ui-badge>
        </div>
        <button mat-flat-button class="flex gap-4" (click)="openNewSerieDialog()">
          <ui-inta-icon name="plus" size="xs" class="mr-1" />
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.CREATE_SERIE_BUTTON' | translate }}
        </button>
      </div>

      <div class="grid grid-cols-[200px_120px_120px_1fr_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div class="text-xs font-medium text-gray-600 whitespace-nowrap">
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.SERIE_NAME' | translate }}
        </div>
        <div class="text-xs font-medium text-gray-600 whitespace-nowrap">
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.SHOTS_QUANTITY' | translate }}
        </div>
        <div class="text-xs font-medium text-gray-600 whitespace-nowrap">
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.EXECUTION_ORDER' | translate }}
        </div>
        <div class="text-xs font-medium text-gray-600 whitespace-nowrap">
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.OBSERVATIONS' | translate }}
        </div>
        <div class="text-xs font-medium text-gray-600 whitespace-nowrap">
          {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.ACTIONS' | translate }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <mat-accordion cdkDropList class="min-w-[600px] w-full" (cdkDropListDropped)="dropSerie($event)">
          @for (serie of shotsSets(); track serie.id) {
            <mat-expansion-panel
              cdkDrag
              class="custom-expansion-panel [&]:!rounded-none"
              (opened)="openPanel(serie.id)"
              (closed)="closePanel(serie.id)"
            >
              <mat-expansion-panel-header
                class="!h-16 !pr-0 transition-colors !px-0"
                [class.!bg-purple-100]="openSerieId() === serie.id"
                [class.!bg-white]="openSerieId() !== serie.id"
                [class.hover:!bg-gray-50]="openSerieId() !== serie.id"
              >
                <div class="grid grid-cols-[200px_120px_120px_1fr_100px] gap-4 items-center w-full min-w-[600px]">
                  <div class="flex items-center gap-2">
                    <button
                      mat-icon-button
                      cdkDragHandle
                      title="Arrastrar para reordenar"
                      class="!w-8 !h-8 !flex !items-center !justify-center drag-handle-btn !-ml-2"
                      [class.!text-purple-400]="openSerieId() === serie.id"
                      [class.hover:!text-purple-600]="openSerieId() === serie.id"
                      [class.!text-gray-400]="openSerieId() !== serie.id"
                      [class.hover:!text-gray-600]="openSerieId() !== serie.id"
                    >
                      <ui-inta-icon name="moreVertical" color="var(--inta-button)" size="xxl" />
                    </button>
                    <span
                      class="text-sm font-normal overflow-hidden line-clamp-1 text-ellipsis transition-colors"
                      [class.text-gray-700]="openSerieId() !== serie.id"
                    >
                      {{ serie.name }}
                    </span>
                  </div>

                  <div class="truncate max-w-[100px]">
                    <span class="text-sm font-normal transition-colors block w-full text-ellipsis overflow-hidden">
                      {{ serie.shotQuantity }}
                    </span>
                  </div>

                  <div>
                    <span class="text-sm font-normal transition-colors">
                      {{ serie.executionOrder }}
                    </span>
                  </div>

                  <div class="overflow-hidden">
                    <span class="text-sm font-normal overflow-hidden line-clamp-1 text-ellipsis transition-colors">
                      {{ serie.observations }}
                    </span>
                  </div>

                  <div class="flex items-center gap-4">
                    <button
                      aria-label="Editar"
                      class="cursor-pointer"
                      (click)="updateSerie(serie.id); $event.stopPropagation()"
                    >
                      <ui-inta-icon name="edit" size="xl" />
                    </button>

                    <button
                      aria-label="Eliminar"
                      class="cursor-pointer"
                      (click)="deleteSerie(serie.id); $event.stopPropagation()"
                    >
                      <ui-inta-icon name="remove" size="xl" />
                    </button>

                    <div class="border-l border-gray-300 h-10 mx-1"></div>
                  </div>
                </div>
              </mat-expansion-panel-header>

              <div
                *cdkDragPlaceholder
                class="border-2 border-dashed rounded-lg h-16 opacity-50 bg-purple-100 border-purple-300 mx-6"
              ></div>

              <div
                [class.bg-gradient-to-br]="openSerieId() === serie.id"
                [class.from-purple-50]="openSerieId() === serie.id"
                [class.to-blue-50]="openSerieId() === serie.id"
              >
                <div class="bg-white shadow-sm" [class.!bg-purple-50]="openSerieId() === serie.id">
                  <div class="flex justify-between items-center bg-purple-100 px-6 py-4 border-t border-gray-300">
                    <h2 class="text-sm font-semibold">
                      {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_SHOTS' | translate }}
                    </h2>
                    <button mat-flat-button class="flex gap-4" (click)="addShot(serie.id)">
                      <ui-inta-icon name="plus" size="xs" class="mr-1" />
                      {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.ADD_SHOT_BUTTON' | translate }}
                    </button>
                  </div>

                  <!-- Table Header -->
                  <div class="grid grid-cols-[120px_1fr_120px] gap-4 px-6 py-3 border-b border-gray-300">
                    <div class="text-xs font-medium">
                      {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.SHOT_NUMBER' | translate }}
                    </div>
                    <div class="text-xs font-medium">
                      {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.OBSERVATIONS' | translate }}
                    </div>
                    <div class="text-xs font-medium text-right">
                      {{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.ACTIONS' | translate }}
                    </div>
                  </div>

                  <div class="">
                    @for (shot of serie.shots; track shot.id) {
                      <div
                        class="grid grid-cols-[120px_1fr_120px] gap-4 px-6 items-center py-5 border-b border-gray-300 transition-colors group"
                      >
                        <div class="text-sm">
                          {{ shot.globalNumber }}
                        </div>
                        <div class="flex-1">
                          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                            <input
                              placeholder="{{
                                'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.OBSERVATIONS_PLACEHOLDER'
                                  | translate
                              }}"
                              matInput
                              [disabled]="editingShotId() !== shot.id"
                              [(ngModel)]="shot.observation"
                            />
                          </mat-form-field>
                        </div>

                        <div class="flex items-center justify-end gap-4">
                          @if (editingShotId() === shot.id) {
                            <button title="Guardar" class="cursor-pointer flex items-center" (click)="saveShot(shot)">
                              <mat-icon class="!text-xl">save</mat-icon>
                            </button>
                          } @else {
                            <button title="Editar" class="cursor-pointer" (click)="toggleEdit(shot)">
                              <ui-inta-icon name="edit" size="xl" />
                            </button>
                          }
                          <button title="Eliminar" class="cursor-pointer" (click)="deleteShot(serie.id, shot.id)">
                            <ui-inta-icon name="remove" size="xl" />
                          </button>
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center py-12 text-gray-400">
                        <mat-icon class="!text-5xl !w-12 !h-12 mx-auto mb-2">inbox</mat-icon>
                        <p>{{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.NOT_SHOTS_IN_SERIE' | translate }}</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      </div>
    </div>
  `,
  styleUrls: ['./series-and-shots.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesAndShots {
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #translate = inject(TranslateService);
  readonly dialog = inject(MatDialog);
  protected readonly store = inject(PlanningGeneralDataStore);
  protected readonly seriesStore = inject(SeriesAndShotsStore);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly openSerieId = signal<string | null>(null);
  readonly editingShotId = signal<string | null>(null);

  readonly shotsSets = signal<Serie[] | null>(null);

  readonly trialCode = computed(() => this.store.fireTrialCode());

  constructor() {
    effect(() => {
      const seriesResponse = this.seriesStore.series();
      if (seriesResponse) {
        this.shotsSets.set(seriesResponse);
      }
    });

    effect(() => {
      if (this.store.fireTrialId()) {
        this.seriesStore.loadSeries();
      }
    });

    effect(() => {
      if (this.seriesStore.addShotStatus() === 'resolved') {
        this.seriesStore.reloadSeries();
      }
    });

    effect(() => {
      if (this.seriesStore.deleteSerieStatus() === 'resolved') {
        this.seriesStore.reloadSeries();
      }
    });

    effect(() => {
      if (this.seriesStore.deleteShotStatus() === 'resolved') {
        this.seriesStore.reloadSeries();
      }
    });

    effect(() => {
      if (this.seriesStore.updateShotStatus() === 'resolved') {
        this.seriesStore.reloadSeries();
      }
    });

    effect(() => {
      if (this.seriesStore.reorderSeriesStatus() === 'resolved') {
        this.seriesStore.reloadSeries();
      }
    });
  }

  dropSerie(event: CdkDragDrop<Serie[]>) {
    const items = [...(this.shotsSets() ?? [])];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const reordered: Serie[] = items.map((item, index) => ({
      ...item,
      executionOrder: index + 1,
    }));
    const ids = reordered.map((item) => item.id);
    const fireTrialId = this.store.fireTrialId();
    if (fireTrialId) {
      this.seriesStore.reorderSeries({
        trialId: fireTrialId,
        seriesIds: ids,
      });
    }
    this.shotsSets.set(reordered);
  }

  openPanel(serieId: string) {
    this.openSerieId.set(serieId);
  }

  closePanel(closedSerieId: string) {
    if (this.openSerieId() === closedSerieId) {
      this.openSerieId.set(null);
    }
  }

  isSerieOpen(serieId: string): boolean {
    return this.openSerieId() === serieId;
  }

  openNewSerieDialog() {
    this.dialog
      .open(UpsertSerieDialog, {
        width: '500px',
        viewContainerRef: this.#viewContainerRef,
        data: {
          isEditing: false,
          trialId: this.store.fireTrialId() || '',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.seriesStore.reloadSeries();
        }
      });
  }

  updateSerie(serieId: string) {
    const serie = this.shotsSets()
      ?.filter((s) => s.id === serieId)
      .shift();
    if (!serie) return;
    this.dialog
      .open(UpsertSerieDialog, {
        width: '500px',
        viewContainerRef: this.#viewContainerRef,
        data: {
          isEditing: true,
          serieId: serie.id,
          name: serie.name,
          numberOfShots: serie.shots.length,
          observations: serie.observations,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.seriesStore.reloadSeries();
        }
      });
  }

  addShot(serieId: string) {
    this.seriesStore.addShotToSerie({ serieId });
  }

  deleteShot(serieId: string, shotId: string) {
    const dialog = this.dialog.open(ConfirmDeleteShotDialog, {
      viewContainerRef: this.#viewContainerRef,
      data: {
        serieId,
        shotId,
        title: this.#translate.instant('TRIAL_PLANNING.DELETE_SHOT_DIALOG.TITLE'),
        message: this.#translate.instant('TRIAL_PLANNING.DELETE_SHOT_DIALOG.MESSAGE'),
        description: this.#translate.instant('TRIAL_PLANNING.DELETE_SHOT_DIALOG.DESCRIPTION'),
        confirmText: this.#translate.instant('TRIAL_PLANNING.DELETE_SHOT_DIALOG.CONFIRM'),
        cancelText: this.#translate.instant('TRIAL_PLANNING.DELETE_SHOT_DIALOG.CANCEL'),
        icon: 'warning',
        iconColor: 'warn',
      },
    });
    dialog.afterClosed().subscribe((result) => {
      if (!result) return;
      this.shotsSets.update((series) =>
        (series ?? []).map((serie) => {
          if (serie.id === serieId) {
            const filtered = serie.shots.filter((d) => d.id !== shotId);
            return { ...serie, shots: filtered };
          }
          return serie;
        }),
      );
    });
  }

  deleteSerie(serieId: string) {
    const dialog = this.dialog.open(ConfirmDeleteSerieDialog, {
      viewContainerRef: this.#viewContainerRef,
      data: {
        serieId,
        title: this.#translate.instant('TRIAL_PLANNING.DELETE_SERIE_DIALOG.TITLE'),
        message: this.#translate.instant('TRIAL_PLANNING.DELETE_SERIE_DIALOG.MESSAGE'),
        description: this.#translate.instant('TRIAL_PLANNING.DELETE_SERIE_DIALOG.DESCRIPTION'),
        confirmText: this.#translate.instant('TRIAL_PLANNING.DELETE_SERIE_DIALOG.CONFIRM'),
        cancelText: this.#translate.instant('TRIAL_PLANNING.DELETE_SERIE_DIALOG.CANCEL'),
        icon: 'warning',
        iconColor: 'warn',
      },
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.shotsSets.update((series) => {
          const filtered = (series ?? []).filter((s) => s.id !== serieId);
          return filtered.map((s, index) => ({ ...s, executionOrder: index + 1 }));
        });
      }
    });
  }

  toggleEdit(shot: Shot) {
    if (this.editingShotId() === shot.id) {
      this.editingShotId.set(null);
      this.seriesStore.reloadSeries();
    } else {
      this.editingShotId.set(shot.id);
    }
  }

  saveShot(shot: Shot) {
    this.seriesStore.updateShot({
      shotId: shot.id,
      observation: shot.observation || '',
    });
    this.editingShotId.set(null);
  }
}
