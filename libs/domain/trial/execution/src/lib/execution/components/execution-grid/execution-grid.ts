import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, inject, input, output, signal } from '@angular/core';

import type { GridPosition, PlacedWidget } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { ShotWidgetComponent } from '../shot-widget/shot-widget';

@Component({
  selector: 'inta-execution-grid',
  standalone: true,
  imports: [DragDropModule, ShotWidgetComponent],
  providers: [],
  template: `
    <div class="grid-container" [class.edit-mode]="editMode()">
      <!-- Grid 3x3 -->
      <div class="execution-grid">
        <!-- Background: Celdas vacías para el drop -->
        @for (row of gridRows; track row) {
          @for (col of gridCols; track col) {
            <div
              class="grid-cell"
              [style.grid-row]="row"
              [style.grid-column]="col"
              (drop)="onCellDrop($event, row, col)"
              (dragover)="onCellDragOver($event)"
            ></div>
          }
        }

        <!-- Foreground: Widgets reales con sus spans -->
        @for (widget of widgetStateService.placedWidgets(); track widget.id) {
          <div
            class="widget-wrapper"
            [class.draggable]="editMode()"
            [class.pointer-events-none]="draggingWidget() !== null"
            [style.grid-row]="widget.position.row"
            [style.grid-column]="widget.position.col + ' / span ' + widget.width"
            [style.border]="'2px solid ' + (widget.color || '#e5e7eb')"
            [attr.draggable]="editMode()"
            (dragstart)="onDragStart($event, widget)"
            (dragend)="onDragEnd($event)"
          >
            @switch (widget.type) {
              @case ('shot') {
                <inta-shot-widget [widgetId]="widget.id" />
              }
              @default {
                <div class="p-4 bg-gray-100 rounded h-full flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-500 uppercase">Widget: {{ widget.type }}</span>
                </div>
              }
            }

            @if (editMode()) {
              <div
                class="absolute top-0 left-0 bg-white/80 backdrop-blur-sm border-b border-r border-gray-200 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-br z-10 uppercase"
              >
                Width: {{ widget.width }}
              </div>
              <button type="button" class="remove-btn" (click)="removeWidget(widget.id)">✕</button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .grid-container {
      width: 100%;
      height: 100%;
      padding: 1rem;
    }

    .execution-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 1rem;
      height: 100%;
      min-height: 600px;
    }

    .grid-cell {
      position: relative;
      border: 2px dashed transparent;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .edit-mode .grid-cell {
      border-color: #e5e7eb;
    }

    .grid-cell.drag-over {
      border-color: #8b5cf6;
      background-color: #f3e8ff;
    }

    .widget-wrapper {
      position: relative;
      height: 100%;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .widget-wrapper.draggable {
      cursor: move;
    }

    .widget-wrapper.dragging {
      opacity: 0.5;
    }

    .remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #ef4444;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      z-index: 10;
      transition: all 0.2s;
    }

    .remove-btn:hover {
      background-color: #dc2626;
      transform: scale(1.1);
    }
  `,
})
export class ExecutionGridComponent {
  readonly widgetStateService = inject(WidgetStateService);

  readonly editMode = input<boolean>(false);

  readonly widgetAdded = output<string>();
  readonly widgetRemoved = output<string>();

  readonly gridRows = [1, 2, 3];
  readonly gridCols = [1, 2, 3];
  readonly draggingWidget = signal<PlacedWidget | null>(null);

  getWidgetsAt(row: number, col: number): PlacedWidget[] {
    return this.widgetStateService.placedWidgets().filter((widget) => {
      const widgetRow = widget.position.row;
      const widgetColStart = widget.position.col;
      const widgetColEnd = widgetColStart + widget.width - 1;

      return widgetRow === row && col >= widgetColStart && col <= widgetColEnd;
    });
  }

  isWidgetStart(widget: PlacedWidget, row: number, col: number): boolean {
    return widget.position.row === row && widget.position.col === col;
  }

  onDragStart(event: DragEvent, widget: PlacedWidget): void {
    if (!this.editMode()) {
      event.preventDefault();
      return;
    }

    this.draggingWidget.set(widget);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('widgetId', widget.id);
    }

    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    this.draggingWidget.set(null);
    (event.target as HTMLElement).classList.remove('dragging');

    document.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  onCellDragOver(event: DragEvent): void {
    if (!this.editMode()) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onCellDrop(event: DragEvent, row: number, col: number): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');

    const widget = this.draggingWidget();
    if (!widget) {
      return;
    }

    const newPosition: GridPosition = { row, col };
    const moved = this.widgetStateService.moveWidget(widget.id, newPosition);

    if (!moved) {
      console.log('Could not move widget to that position');
    }
  }

  removeWidget(widgetId: string): void {
    this.widgetStateService.removeWidget(widgetId);
    this.widgetRemoved.emit(widgetId);
  }
}
