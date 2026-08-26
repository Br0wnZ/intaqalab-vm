import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type Type,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { GridPosition, PlacedWidget } from '../../../models/execution-grid.models';
import { WidgetId } from '../../../models/widget-id.enum';
import { WidgetStateService } from '../../../services/widget-state.service';
import { injectWidgetCatalog } from '../../../utils/inject-widgets';

/** Celda del grid (1-indexed, coherente con CSS grid-row/grid-column). */
interface FreeBlock {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}
@Component({
  selector: 'inta-execution-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, TranslateModule],
  providers: [],
  host: { class: 'block h-full' },
  template: `
    <div class="grid-container overflow-auto" [class.edit-mode]="editMode()">
      <!-- Grid 3x3 -->
      <div class="execution-grid">
        <!-- Background: Celdas vacías para el drop -->
        @for (row of gridRows; track row) {
          @for (col of gridCols; track col) {
            <div
              class="grid-cell"
              [class.drag-over]="isCellHovered(row, col)"
              [style.grid-row]="row"
              [style.grid-column]="col"
              (drop)="onCellDrop($event, row, col)"
              (dragover)="onCellDragOver($event, row, col)"
              (dragleave)="onCellDragLeave()"
            ></div>
          }
        }
        <!-- Mid-layer: Placeholders para espacio libre (solo en modo normal) -->
        @if (!editMode()) {
          @for (block of freePlaceholderBlocks(); track block.row + '-' + block.col) {
            <div
              class="relative z-[1] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6"
              [style.grid-row]="block.row + ' / span ' + block.rowSpan"
              [style.grid-column]="block.col + ' / span ' + block.colSpan"
            >
              <p class="text-gray-700 text-lg font-semibold mb-1">
                {{ 'TRIAL_EXECUTION.FREE_SPACE_TITLE' | translate }}
              </p>
              <p class="text-gray-400 text-sm">
                {{ 'TRIAL_EXECUTION.FREE_SPACE_DESC_1' | translate }}
                <button
                  type="button"
                  style="color: var(--inta-button)"
                  class="font-medium cursor-pointer hover:underline focus:outline-none"
                  (click)="openWidgetsPanel.emit()"
                >
                  {{ 'TRIAL_EXECUTION.FREE_SPACE_DESC_WIDGETS_BTN' | translate }}
                </button>
                {{ 'TRIAL_EXECUTION.FREE_SPACE_DESC_2' | translate }}
              </p>
            </div>
          }
        }
        <!-- Foreground: Widgets reales con sus spans -->
        @for (widget of widgetStateService.placedWidgets(); track widget.id) {
          <div
            class="widget-wrapper"
            [class.draggable]="editMode()"
            [class.dragging]="draggingWidget()?.id === widget.id"
            [class.pointer-events-none]="draggingWidget() !== null"
            [style.grid-row]="widget.position.row + ' / span ' + widget.height"
            [style.grid-column]="widget.position.col + ' / span ' + widget.width"
            [style.border]="'2px solid ' + (widget.color || '#e5e7eb')"
            [attr.draggable]="editMode()"
            (dragstart)="onDragStart($event, widget)"
            (dragend)="onDragEnd()"
          >
            @if (resolveComponent(widget.type); as component) {
              <ng-container *ngComponentOutlet="component; inputs: resolveInputs(widget)" />
            } @else {
              <div class="p-4 bg-gray-100 rounded h-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-500 uppercase">Widget: {{ widget.type }}</span>
              </div>
            }
            @if (editMode()) {
              <div
                class="absolute top-0 left-0 bg-white/80 backdrop-blur-sm border-b border-r border-gray-200 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-br z-10 uppercase"
              >
                W: {{ widget.width }} H: {{ widget.height }}
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
      grid-template-rows: repeat(3, minmax(0, 1fr));
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
      min-height: 0;
      border-radius: 1rem;
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
  readonly openWidgetsPanel = output<void>();
  readonly gridRows = [1, 2, 3] as const;
  readonly gridCols = [1, 2, 3] as const;

  /**
   * Widget que se está arrastrando actualmente.
   * Se resetea automáticamente si `editMode` pasa a `false` mientras se arrastra.
   */
  readonly draggingWidget = linkedSignal<boolean, PlacedWidget | null>({
    source: this.editMode,
    computation: (editMode, previous) => (editMode ? (previous?.value ?? null) : null),
  });

  /** Celda del grid sobre la que está pasando el drag actualmente (reemplaza classList manual). */
  readonly hoveredCell = signal<GridPosition | null>(null);

  /** Registro de componentes de widget: sustituye al `@switch` de N casos. */
  readonly #widgetRegistry = injectWidgetCatalog();

  /** Calcula los bloques rectangulares libres (sin widget) del grid 3×3. */
  readonly freePlaceholderBlocks = computed<FreeBlock[]>(() => {
    const widgets = this.widgetStateService.placedWidgets();
    const occupied = new Set<string>();
    for (const w of widgets) {
      for (let r = w.position.row; r < w.position.row + w.height; r++) {
        for (let c = w.position.col; c < w.position.col + w.width; c++) {
          occupied.add(`${r},${c}`);
        }
      }
    }
    const blocks: FreeBlock[] = [];
    const visited = new Set<string>();
    for (const row of this.gridRows) {
      for (const col of this.gridCols) {
        const key = `${row},${col}`;
        if (occupied.has(key) || visited.has(key)) continue;
        // Máximo colSpan en esta fila
        let colSpan = 0;
        for (let c = col; c <= 3; c++) {
          if (!occupied.has(`${row},${c}`) && !visited.has(`${row},${c}`)) colSpan++;
          else break;
        }
        // Máximo rowSpan: filas siguientes con las mismas columnas libres
        let rowSpan = 1;
        for (let r = row + 1; r <= 3; r++) {
          let rowOk = true;
          for (let c = col; c < col + colSpan; c++) {
            if (occupied.has(`${r},${c}`) || visited.has(`${r},${c}`)) {
              rowOk = false;
              break;
            }
          }
          if (rowOk) rowSpan++;
          else break;
        }
        // Marcar celdas visitadas
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + colSpan; c++) {
            visited.add(`${r},${c}`);
          }
        }
        blocks.push({ row, col, colSpan, rowSpan });
      }
    }
    return blocks;
  });

  /** Devuelve el componente asociado a un tipo de widget, o `null` si no está registrado. */
  resolveComponent(type: WidgetId): Type<unknown> | null {
    return this.#widgetRegistry.get(type) ?? null;
  }

  /** Calcula los inputs dinámicos a pasar al componente resuelto vía `NgComponentOutlet`. */
  resolveInputs(widget: PlacedWidget): Record<string, unknown> {
    const base: Record<string, unknown> = { widgetId: widget.id };
    if (widget.type === WidgetId.EXECUTION_PREP_TECH) {
      return { ...base, profile: widget.techProfile ?? 'velocidades' };
    }
    return base;
  }

  isCellHovered(row: number, col: number): boolean {
    const cell = this.hoveredCell();
    return cell?.row === row && cell?.col === col;
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
  }

  onDragEnd(): void {
    this.draggingWidget.set(null);
    this.hoveredCell.set(null);
  }

  onCellDragOver(event: DragEvent, row: number, col: number): void {
    if (!this.editMode()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.hoveredCell.set({ row, col });
  }

  onCellDragLeave(): void {
    this.hoveredCell.set(null);
  }

  onCellDrop(event: DragEvent, row: number, col: number): void {
    event.preventDefault();
    this.hoveredCell.set(null);
    const widget = this.draggingWidget();
    if (!widget) {
      return;
    }
    const newPosition: GridPosition = { row, col };
    const moved = this.widgetStateService.moveWidget(widget.id, newPosition);
    if (!moved) {
      console.warn('Could not move widget to that position');
    }
    this.draggingWidget.set(null);
  }

  removeWidget(widgetId: string): void {
    this.widgetStateService.removeWidget(widgetId);
    this.widgetRemoved.emit(widgetId);
  }
}
