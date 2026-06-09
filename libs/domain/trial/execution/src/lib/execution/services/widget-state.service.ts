import { Injectable, computed, signal } from '@angular/core';

import type {
  GridPosition,
  PlacedWidget,
  TechProfile,
  WidgetFormState,
  WidgetHeight,
  WidgetType,
  WidgetWidth,
} from '../models/execution-grid.models';

/**
 * 🎯 Servicio para gestionar el estado de los widgets en el grid
 */
@Injectable()
export class WidgetStateService {
  // 📦 Widgets colocados en el grid
  readonly #placedWidgets = signal<PlacedWidget[]>([]);

  // 📝 Estado de formularios de cada widget
  readonly #widgetFormsState = signal<Map<string, WidgetFormState>>(new Map());

  // 🎨 Paleta de colores para widgets
  readonly #colors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
  ];

  // 🔄 Public readonly signals
  readonly placedWidgets = this.#placedWidgets.asReadonly();
  readonly widgetFormsState = this.#widgetFormsState.asReadonly();

  /**
   * 🧮 Computed: Widgets con cambios sin guardar
   */
  readonly dirtyWidgets = computed(() => {
    const formsState = this.widgetFormsState();
    return Array.from(formsState.values()).filter((state) => state.dirty);
  });

  /**
   * 🧮 Computed: Hay cambios sin guardar
   */
  readonly hasUnsavedChanges = computed(() => {
    return this.dirtyWidgets().length > 0;
  });

  /**
   * 🧮 Computed: Todos los formularios son válidos
   */
  readonly allFormsValid = computed(() => {
    const formsState = this.widgetFormsState();
    return Array.from(formsState.values()).every((state) => state.valid);
  });

  /**
   * ➕ Añadir widget al grid
   */
  addWidget(type: WidgetType, width: WidgetWidth, position?: GridPosition, techProfile?: TechProfile, height: WidgetHeight = 1): string {
    const id = this.#generateWidgetId();
    const finalPosition = position || this.#findNextAvailablePosition(width, height);

    if (!finalPosition) {
      throw new Error('No hay espacio disponible en el grid');
    }

    const newWidget: PlacedWidget = {
      id,
      type,
      position: finalPosition,
      width,
      height,
      color: this.#colors[Math.floor(Math.random() * this.#colors.length)],
      ...(techProfile ? { techProfile } : {}),
    };

    this.#placedWidgets.update((widgets) => [...widgets, newWidget]);

    return id;
  }

  /**
   * 🗑️ Remover widget del grid
   */
  removeWidget(widgetId: string): void {
    this.#placedWidgets.update((widgets) => widgets.filter((w) => w.id !== widgetId));

    // Limpiar estado del formulario
    this.#widgetFormsState.update((states) => {
      const newStates = new Map(states);
      newStates.delete(widgetId);
      return newStates;
    });
  }

  /**
   * 🔄 Mover widget a nueva posición
   */
  moveWidget(widgetId: string, newPosition: GridPosition): boolean {
    const widgets = this.#placedWidgets();
    const sourceWidget = widgets.find((w) => w.id === widgetId);

    if (!sourceWidget) {
      return false;
    }

    // 💡 Normalización para W3: siempre fuerza col: 1 ya que ocupa toda la fila
    const finalPosition = { ...newPosition };
    if (sourceWidget.width === 3) {
      finalPosition.col = 1;
    }

    // 1. Buscar si hay un widget que ocupa la celda de destino para intentar un SWAP
    const targetWidget = widgets.find((w) => {
      if (w.id === widgetId) return false;
      const isSameRow = w.position.row === finalPosition.row;

      // Si el widget que arrastramos es W3, cualquier widget en la fila destino cuenta como target para SWAP
      if (sourceWidget.width === 3) {
        return isSameRow;
      }

      const isInsideWidth = finalPosition.col >= w.position.col && finalPosition.col < w.position.col + w.width;
      return isSameRow && isInsideWidth;
    });

    if (targetWidget) {
      const oldSourcePosition = sourceWidget.position;
      let newSourcePos = { ...finalPosition };
      let newTargetPos = { ...oldSourcePosition };

      // 🔄 Lógica especial: SWAP de FILA COMPLETA (Widget W3)
      if (sourceWidget.width === 3 && sourceWidget.position.row !== targetWidget.position.row) {
        const targetRow = targetWidget.position.row;
        const sourceRow = sourceWidget.position.row;

        this.#placedWidgets.update((list) =>
          list.map((w) => {
            if (w.id === sourceWidget.id) return { ...w, position: { row: targetRow, col: 1 } };
            if (w.position.row === targetRow) {
              return { ...w, position: { row: sourceRow, col: w.position.col } };
            }
            return w;
          }),
        );
        return true;
      }

      // 🔄 Lógica especial para SWAP en la misma fila (Reordenación)
      if (sourceWidget.position.row === targetWidget.position.row && finalPosition.row === sourceWidget.position.row) {
        if (sourceWidget.position.col < targetWidget.position.col) {
          // Caso: [Source] ... [Target] -> [Target][Source]
          newTargetPos = { ...sourceWidget.position };
          newSourcePos = { row: sourceWidget.position.row, col: sourceWidget.position.col + targetWidget.width };
        } else {
          // Caso: [Target] ... [Source] -> [Source][Target]
          newSourcePos = { ...targetWidget.position };
          newTargetPos = { row: targetWidget.position.row, col: targetWidget.position.col + sourceWidget.width };
        }
      } else {
        // Swap simple para diferentes filas (intercambio de celdas de origen)
        newSourcePos = { ...targetWidget.position };
        newTargetPos = { ...oldSourcePosition };
      }

      // Validar si ambos caben en sus nuevas posiciones (para swaps no-W3)
      const canSourceFit = this.#isPositionValid(newSourcePos, sourceWidget.width, [widgetId, targetWidget.id], sourceWidget.height);
      const canTargetFit = this.#isPositionValid(newTargetPos, targetWidget.width, [widgetId, targetWidget.id], targetWidget.height);

      if (canSourceFit && canTargetFit) {
        this.#placedWidgets.update((list) =>
          list.map((w) => {
            if (w.id === widgetId) return { ...w, position: newSourcePos };
            if (w.id === targetWidget.id) return { ...w, position: newTargetPos };
            return w;
          }),
        );
        return true;
      }
    }

    // 2. Si no hay swap posible, intentar movimiento normal
    if (!this.#isPositionValid(finalPosition, sourceWidget.width, widgetId, sourceWidget.height)) {
      return false;
    }

    this.#placedWidgets.update((list) => list.map((w) => (w.id === widgetId ? { ...w, position: finalPosition } : w)));

    return true;
  }

  /**
   * 📝 Actualizar estado del formulario de un widget
   */
  updateWidgetFormState(widgetId: string, state: WidgetFormState): void {
    this.#widgetFormsState.update((states) => {
      const newStates = new Map(states);
      newStates.set(widgetId, state);
      return newStates;
    });
  }

  /**
   * 🔍 Obtener estado del formulario de un widget
   */
  getWidgetFormState(widgetId: string): WidgetFormState | undefined {
    return this.widgetFormsState().get(widgetId);
  }

  /**
   * 🔍 Verificar si una posición es válida
   */
  #isPositionValid(position: GridPosition, width: WidgetWidth, excludeWidgetIds: string | string[] = [], height: WidgetHeight = 1): boolean {
    const { row, col } = position;
    const excludes = Array.isArray(excludeWidgetIds) ? excludeWidgetIds : [excludeWidgetIds];

    // Verificar límites del grid
    if (row < 1 || row > 3 || col < 1 || col > 3) {
      return false;
    }

    // Verificar que no se salga del grid verticalmente
    if (row + height - 1 > 3) {
      return false;
    }

    // Verificar que no se salga del grid horizontalmente
    if (col + width - 1 > 3) {
      return false;
    }

    // Verificar colisiones con otros widgets
    const otherWidgets = this.placedWidgets().filter((w) => !excludes.includes(w.id));

    for (const widget of otherWidgets) {
      // Verificar si hay overlap
      if (this.#hasOverlap(position, width, height, widget)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 🔍 Verificar si dos widgets se solapan
   */
  #hasOverlap(position: GridPosition, width: WidgetWidth, height: WidgetHeight, widget: PlacedWidget): boolean {
    // Calcular rangos de filas
    const newRowStart = position.row;
    const newRowEnd = position.row + height - 1;
    const existingRowStart = widget.position.row;
    const existingRowEnd = widget.position.row + widget.height - 1;

    // Si no hay overlap de filas, no hay colisión
    if (newRowEnd < existingRowStart || newRowStart > existingRowEnd) {
      return false;
    }

    // Calcular rangos de columnas
    const newColStart = position.col;
    const newColEnd = position.col + width - 1;
    const existingColStart = widget.position.col;
    const existingColEnd = widget.position.col + widget.width - 1;

    // Verificar overlap de columnas
    return !(newColEnd < existingColStart || newColStart > existingColEnd);
  }

  /**
   * 🔍 Encontrar siguiente posición disponible
   */
  #findNextAvailablePosition(width: WidgetWidth, height: WidgetHeight = 1): GridPosition | null {
    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= 3; col++) {
        const position: GridPosition = { row, col };
        if (this.#isPositionValid(position, width, [], height)) {
          return position;
        }
      }
    }
    return null;
  }

  /**
   * 🎲 Generar ID único para widget
   */
  #generateWidgetId(): string {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 💾 Guardar todos los formularios dirty
   */
  async saveAllDirtyForms(): Promise<void> {
    const dirtyWidgets = this.dirtyWidgets();
    console.log(`Guardando ${dirtyWidgets.length} formularios...`);

    // Aquí llamarías a los métodos save de cada widget
    // Por ahora solo logueamos
    for (const widget of dirtyWidgets) {
      console.log(`Guardando widget: ${widget.widgetId}`);
    }
  }

  /**
   * 🔄 Resetear todos los formularios
   */
  resetAllForms(): void {
    this.#widgetFormsState.update((states) => {
      const newStates = new Map(states);
      newStates.forEach((state, key) => {
        newStates.set(key, {
          ...state,
          dirty: false,
          touched: false,
          hasChanges: false,
        });
      });
      return newStates;
    });
  }
}
