import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { IntaIconComponent } from '@intaqalab/ui';

interface Disparo {
  id: number;
  observaciones: string;
}

interface Serie {
  id: number;
  nombre: string;
  descripcion: string;
  disparos: Disparo[];
}

@Component({
  selector: 'lib-ordered-table',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    FormsModule,
    IntaIconComponent,
  ],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
        <h2 class="text-lg font-semibold text-gray-800">Series de la prueba</h2>
        <button
          mat-flat-button
          color="primary"
          class="!bg-purple-600 !text-white !px-4 !py-2 !rounded-md !flex !items-center !gap-2"
        >
          <mat-icon class="!text-lg !w-5 !h-5">add</mat-icon>
          Crear serie
        </button>
      </div>

      <div class="grid grid-cols-[200px_200px_1fr_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div class="text-sm font-medium text-gray-600">Nombre de la serie</div>
        <div class="text-sm font-medium text-gray-600">Orden de ejecución</div>
        <div class="text-sm font-medium text-gray-600">Observaciones</div>
        <div class="text-sm font-medium text-gray-600 text-right">Acciones</div>
      </div>

      <div class="">
        <mat-accordion cdkDropList class="w-full" (cdkDropListDropped)="dropSerie($event)">
          @for (serie of series(); track serie.id) {
            <mat-expansion-panel
              cdkDrag
              class="custom-expansion-panel"
              (opened)="openPanel(serie.id)"
              (closed)="closePanel(serie.id)"
            >
              <mat-expansion-panel-header
                class="!h-16 !pr-0 transition-colors !px-0"
                [class.!bg-purple-100]="openSerieId() === serie.id"
                [class.!bg-white]="openSerieId() !== serie.id"
                [class.hover:!bg-gray-50]="openSerieId() !== serie.id"
              >
                <div class="grid grid-cols-[200px_200px_1fr_100px] gap-4 items-center w-full">
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
                      class="text-sm font-medium overflow-hidden line-clamp-1 text-ellipsis transition-colors"
                      [class.text-purple-900]="openSerieId() === serie.id"
                      [class.text-gray-700]="openSerieId() !== serie.id"
                    >
                      {{ serie.nombre }}
                    </span>
                  </div>

                  <div>
                    <span
                      class="text-sm font-medium transition-colors"
                      [class.text-purple-900]="openSerieId() === serie.id"
                      [class.text-gray-700]="openSerieId() !== serie.id"
                    >
                      {{ serie.id }}
                    </span>
                  </div>

                  <div class="overflow-hidden">
                    <span
                      class="text-sm overflow-hidden line-clamp-1 text-ellipsis transition-colors"
                      [class.text-purple-700]="openSerieId() === serie.id"
                      [class.text-gray-600]="openSerieId() !== serie.id"
                    >
                      {{ serie.descripcion }}
                    </span>
                  </div>

                  <div class="flex justify-end gap-1">
                    <button
                      mat-icon-button
                      aria-label="Editar"
                      class="!w-8 !h-8"
                      [class.!text-purple-500]="openSerieId() === serie.id"
                      [class.!text-gray-500]="openSerieId() !== serie.id"
                      [class.hover:!text-purple-600]="openSerieId() === serie.id"
                      [class.hover:!text-gray-600]="openSerieId() !== serie.id"
                    >
                      <ui-inta-icon name="edit" />
                    </button>

                    <button
                      mat-icon-button
                      aria-label="Eliminar"
                      class="!w-8 !h-8"
                      [class.!text-purple-500]="openSerieId() === serie.id"
                      [class.!text-gray-500]="openSerieId() !== serie.id"
                      [class.hover:!text-red-600]="true"
                      (click)="deleteSerie(serie.id); $event.stopPropagation()"
                    >
                      <ui-inta-icon name="remove" />
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
                <div class="bg-white rounded-lg shadow-sm p-6" [class.!bg-purple-50]="openSerieId() === serie.id">
                  <div class="flex justify-between items-center mb-6">
                    <h2
                      class="text-lg font-semibold"
                      [class.text-purple-900]="openSerieId() === serie.id"
                      [class.text-gray-800]="openSerieId() !== serie.id"
                    >
                      Disparos de la serie
                    </h2>
                    <button
                      mat-flat-button
                      class="!bg-purple-600 !text-white !px-4 !py-2 !rounded-md !flex !items-center !gap-2"
                      (click)="addDisparo(serie.id)"
                    >
                      <mat-icon class="!text-lg !w-5 !h-5">add</mat-icon>
                      Añadir disparo
                    </button>
                  </div>

                  <!-- Table Header -->
                  <div
                    class="grid grid-cols-[120px_1fr_120px] gap-4 px-4 py-3 border-b"
                    [class.border-purple-200]="openSerieId() === serie.id"
                    [class.border-gray-200]="openSerieId() !== serie.id"
                  >
                    <div
                      class="text-sm font-medium"
                      [class.text-purple-700]="openSerieId() === serie.id"
                      [class.text-gray-600]="!isSerieOpen(serie.id)"
                    >
                      Nº del disparo
                    </div>
                    <div
                      class="text-sm font-medium"
                      [class.text-purple-700]="openSerieId() === serie.id"
                      [class.text-gray-600]="!isSerieOpen(serie.id)"
                    >
                      Observaciones
                    </div>
                    <div
                      class="text-sm font-medium text-right"
                      [class.text-purple-700]="openSerieId() === serie.id"
                      [class.text-gray-600]="!isSerieOpen(serie.id)"
                    >
                      Acciones
                    </div>
                  </div>

                  <!-- Table Body (sin drag & drop) -->
                  <div>
                    @for (disparo of serie.disparos; track disparo.id) {
                      <div
                        class="grid grid-cols-[120px_1fr_120px] gap-4 items-center px-4 py-3 border-b transition-colors group"
                        [class.bg-white]="openSerieId() !== serie.id"
                        [class.bg-purple-50]="openSerieId() === serie.id"
                        [class.hover:bg-purple-100]="openSerieId() === serie.id"
                        [class.hover:bg-gray-50]="openSerieId() !== serie.id"
                        [class.border-purple-100]="openSerieId() === serie.id"
                        [class.border-gray-100]="openSerieId() !== serie.id"
                      >
                        <div
                          class="text-sm font-medium"
                          [class.text-purple-900]="openSerieId() === serie.id"
                          [class.text-gray-700]="openSerieId() !== serie.id"
                        >
                          {{ disparo.id }}
                        </div>

                        <div class="flex-1">
                          <input
                            placeholder="Escribe aquí tus observaciones"
                            type="text"
                            class="w-2/3 px-3 py-1 text-sm bg-transparent border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            [class.border-purple-300]="openSerieId() === serie.id"
                            [class.text-purple-900]="openSerieId() === serie.id"
                            [class.placeholder-purple-300]="openSerieId() === serie.id"
                            [class.text-gray-700]="openSerieId() !== serie.id"
                            [class.placeholder-gray-300]="openSerieId() !== serie.id"
                            [(ngModel)]="disparo.observaciones"
                          />
                        </div>

                        <div class="flex items-center justify-end gap-2">
                          <button
                            mat-icon-button
                            title="Eliminar"
                            class="!w-8 !h-8 !flex !items-center !justify-center hover:!text-red-600"
                            [class.!text-purple-400]="openSerieId() === serie.id"
                            [class.!text-gray-400]="openSerieId() !== serie.id"
                            (click)="deleteDisparo(serie.id, disparo.id)"
                          >
                            <mat-icon class="!text-xl !flex !items-center !justify-center">delete_outline</mat-icon>
                          </button>
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center py-12 text-gray-400">
                        <mat-icon class="!text-5xl !w-12 !h-12 mx-auto mb-2">inbox</mat-icon>
                        <p>No hay disparos en la serie</p>
                        <p>Haz clic en "Añadir disparo" para comenzar</p>
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
  styles: [
    `
      .custom-expansion-panel .mat-expansion-panel-header {
        transition: background-color 200ms ease-in-out;
        position: relative !important;
        padding-left: 1rem !important;
        padding-right: 2.5rem !important; /* reserve space for the chevron */
        overflow: visible !important;
      }

      /* Give the built-in expand/collapse indicator extra right padding so icons don't overlap */
      .custom-expansion-panel .mat-expansion-indicator,
      .custom-expansion-panel .mat-mdc-expansion-indicator {
        padding-right: 1.25rem !important; /* 20px */
      }

      /* Fix: keep chevron in a fixed spot (don’t let it shift when panel opens) */
      .custom-expansion-panel .mat-expansion-panel-header,
      .custom-expansion-panel .mat-mdc-expansion-panel-header {
        position: relative !important;
      }

      .custom-expansion-panel .mat-expansion-panel-header .mat-expansion-indicator,
      .custom-expansion-panel .mat-mdc-expansion-panel-header .mat-mdc-expansion-indicator,
      .custom-expansion-panel .mat-expansion-indicator,
      .custom-expansion-panel .mat-mdc-expansion-indicator {
        position: absolute !important;
        right: 1rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        margin: 0 !important;
        transition: transform 180ms ease-in-out !important;
      }

      /* Only rotate the chevron on open; don't translate horizontally */
      .custom-expansion-panel .mat-expansion-panel-header.mat-expanded .mat-expansion-indicator,
      .custom-expansion-panel .mat-mdc-expansion-panel-header.mat-expanded .mat-mdc-expansion-indicator {
        transform: translateY(-50%) rotate(180deg) !important;
      }

      /* Give mat-content inline padding so header content isn't flush and the chevron sits correctly */
      .custom-expansion-panel .mat-expansion-panel-header .mat-content,
      .custom-expansion-panel .mat-mdc-expansion-panel-header .mat-content {
        padding-inline: 1rem !important;
        box-sizing: border-box !important;
      }

      /* Remove gap between expanded panel and the next panel */
      .mat-expansion-panel,
      .mat-mdc-expansion-panel {
        margin-bottom: 0 !important;
        border-bottom: 0 !important;
      }

      .mat-expansion-panel + .mat-expansion-panel,
      .mat-mdc-expansion-panel + .mat-mdc-expansion-panel {
        margin-top: 0 !important;
      }

      .mat-expansion-panel-body,
      .mat-mdc-expansion-panel-body {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }

      .mat-expansion-panel-body {
        padding: 0 !important;
      }
      .cdk-drag-preview {
        box-shadow:
          0 10px 25px -5px rgba(0, 0, 0, 0.1),
          0 8px 10px -6px rgba(0, 0, 0, 0.1);
        background: white;
        opacity: 0.9;
        overflow: hidden !important;
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .cdk-drag {
        cursor: default;
        overflow: hidden !important;
      }

      .drag-handle-btn {
        cursor: pointer;
      }

      .drag-handle-btn[cdkDragHandle] {
        cursor: grab !important;
      }

      .drag-handle-btn[cdkDragHandle]:active {
        cursor: grabbing !important;
      }

      .drag-handle-btn {
        opacity: 0.6;
        transition: opacity 200ms;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .drag-handle-btn mat-icon {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .group:hover .drag-handle-btn {
        opacity: 1;
      }

      .drag-handle-btn:hover {
        opacity: 1;
      }

      /* Ensure action icon buttons center their icon and show hover color correctly */
      .custom-expansion-panel .mat-icon-button,
      .custom-expansion-panel .mat-mdc-icon-button,
      .custom-expansion-panel button[mat-icon-button] {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        width: 2rem !important;
        height: 2rem !important;
      }

      .custom-expansion-panel button[mat-icon-button] .mat-icon,
      .custom-expansion-panel button[mat-icon-button] .mat-mdc-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
      }

      .custom-expansion-panel button[mat-icon-button]:hover .mat-icon,
      .custom-expansion-panel button[mat-icon-button]:focus .mat-icon,
      .custom-expansion-panel button[mat-icon-button]:hover .mat-mdc-icon,
      .custom-expansion-panel button[mat-icon-button]:focus .mat-mdc-icon {
        color: #7c3aed !important; /* purple-600 */
      }

      /* Ensure grid items with overflow can shrink instead of forcing column growth */
      .custom-expansion-panel .overflow-hidden,
      .custom-expansion-panel .flex-1 {
        min-width: 0 !important;
      }

      /* When an expansion panel is opened and it's not the first or last, remove rounded corners
         so it visually connects with surrounding panels (no outer radius). */
      .mat-expansion-panel.mat-expanded:not(:first-child):not(:last-child),
      .mat-mdc-expansion-panel.mat-expanded:not(:first-child):not(:last-child) {
        border-radius: 0 !important;
        overflow: visible !important;
      }

      .mat-expansion-panel.mat-expanded:not(:first-child):not(:last-child) .mat-expansion-panel-header,
      .mat-mdc-expansion-panel.mat-expanded:not(:first-child):not(:last-child) .mat-mdc-expansion-panel-header {
        border-radius: 0 !important;
      }

      .mat-expansion-panel.mat-expanded:not(:first-child):not(:last-child) .mat-expansion-panel-body,
      .mat-mdc-expansion-panel.mat-expanded:not(:first-child):not(:last-child) .mat-mdc-expansion-panel-body {
        border-radius: 0 !important;
        padding-top: 0 !important;
      }

      /* First expanded: keep only top corners rounded */
      .mat-expansion-panel.mat-expanded:first-child,
      .mat-mdc-expansion-panel.mat-expanded:first-child {
        border-top-left-radius: 0.5rem !important;
        border-top-right-radius: 0.5rem !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        overflow: visible !important;
      }

      .mat-expansion-panel.mat-expanded:first-child .mat-expansion-panel-header,
      .mat-mdc-expansion-panel.mat-expanded:first-child .mat-mdc-expansion-panel-header {
        border-top-left-radius: 0.5rem !important;
        border-top-right-radius: 0.5rem !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }

      .mat-expansion-panel.mat-expanded:first-child .mat-expansion-panel-body,
      .mat-mdc-expansion-panel.mat-expanded:first-child .mat-mdc-expansion-panel-body {
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        padding-top: 0 !important;
      }

      /* Last expanded: keep only bottom corners rounded */
      .mat-expansion-panel.mat-expanded:last-child,
      .mat-mdc-expansion-panel.mat-expanded:last-child {
        border-bottom-left-radius: 0.5rem !important;
        border-bottom-right-radius: 0.5rem !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
        overflow: visible !important;
      }

      .mat-expansion-panel.mat-expanded:last-child .mat-expansion-panel-header,
      .mat-mdc-expansion-panel.mat-expanded:last-child .mat-mdc-expansion-panel-header {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }

      .mat-expansion-panel.mat-expanded:last-child .mat-expansion-panel-body,
      .mat-mdc-expansion-panel.mat-expanded:last-child .mat-mdc-expansion-panel-body {
        border-bottom-left-radius: 0.5rem !important;
        border-bottom-right-radius: 0.5rem !important;
        padding-top: 0 !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderedTable {
  readonly openSerieId = signal<number | null>(null);

  series = signal<Serie[]>([
    {
      id: 1,
      nombre: 'Serie A',
      descripcion: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ut',
      disparos: [
        { id: 1, observaciones: '' },
        { id: 2, observaciones: '' },
      ],
    },
    {
      id: 2,
      nombre: 'Serie B',
      descripcion: 'Otra descripción de serie para probar el truncamiento del texto largo',
      disparos: [
        { id: 1, observaciones: '' },
        { id: 2, observaciones: '' },
        { id: 3, observaciones: '' },
      ],
    },
    {
      id: 3,
      nombre: 'Serie C',
      descripcion: 'Una tercera serie de ejemplo',
      disparos: [{ id: 1, observaciones: '' }],
    },
  ]);

  dropSerie(event: CdkDragDrop<Serie[]>) {
    const items = [...this.series()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);

    // Renumerar los IDs después de reordenar
    const reordered = items.map((item, index) => ({
      ...item,
      id: index + 1,
    }));

    this.series.set(reordered);
  }

  openPanel(serieId: number) {
    this.openSerieId.set(serieId);
  }

  closePanel(closedSerieId: number) {
    // Only clear the openSerieId if the panel being closed is the one currently marked as open.
    if (this.openSerieId() === closedSerieId) {
      this.openSerieId.set(null);
    }
  }

  // compatibility wrapper: some compiled templates may still call this method
  isSerieOpen(serieId: number): boolean {
    return this.openSerieId() === serieId;
  }

  addDisparo(serieId: number) {
    this.series.update((series) =>
      series.map((serie) => {
        if (serie.id === serieId) {
          const nextDisparoId = serie.disparos.length + 1;
          return {
            ...serie,
            disparos: [...serie.disparos, { id: nextDisparoId, observaciones: '' }],
          };
        }
        return serie;
      }),
    );
  }

  deleteDisparo(serieId: number, disparoId: number) {
    this.series.update((series) =>
      series.map((serie) => {
        if (serie.id === serieId) {
          const filtered = serie.disparos.filter((d) => d.id !== disparoId);
          // Renumerar los disparos
          const reordered = filtered.map((d, index) => ({ ...d, id: index + 1 }));
          return { ...serie, disparos: reordered };
        }
        return serie;
      }),
    );
  }

  deleteSerie(serieId: number) {
    this.series.update((series) => {
      const filtered = series.filter((s) => s.id !== serieId);
      // Renumerar las series
      return filtered.map((s, index) => ({ ...s, id: index + 1 }));
    });
  }
}
