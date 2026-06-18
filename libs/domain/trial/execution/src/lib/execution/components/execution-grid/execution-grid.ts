import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { GridPosition, PlacedWidget } from '../../models/execution-grid.models';
import { WidgetId } from '../../models/widget-id.enum';
import { WidgetStateService } from '../../services/widget-state.service';
import { AcousticLevelIntroduction } from '../acoustic-level-introduction/acoustic-level-introduction';
import { ArmamentIntroductionComponent } from '../armament-introduction/armament-introduction';
import { DatosBlancoBola } from '../datos-blanco-bola/datos-blanco-bola';
import { ExecutionPrepJltWidgetComponent } from '../execution-prep-jlt-widget/execution-prep-jlt-widget';
import { ExecutionPrepTechWidgetComponent } from '../execution-prep-tech-widget/execution-prep-tech-widget';
import { GrubbsCriterionWidget } from '../grubbs-criterion/grubbs-criterion';
import { InformacionTaradoWidget } from '../informacion-tarado/informacion-tarado';
import { JltMao } from '../jlt-mao/jlt-mao';
import { JltShotData } from '../jlt-shot-data/jlt-shot-data';
import { ManometerIntroduction } from '../manometer-introduction/manometer-introduction';
import { MaoTopography } from '../mao-topography/mao-topography';
import { MunitionIntroduction } from '../munition-introduction/munition-introduction';
import { OverpressureChartWidget } from '../overpressure-chart/overpressure-chart';
import { OverpressureInfoWidget } from '../overpressure-info/overpressure-info';
import { PassCoordsWidget } from '../pass-coords/pass-coords';
import { PiezoPressureIntroduction } from '../piezo-pressure-introduction/piezo-pressure-introduction';
import { RadarMetcmq } from '../radar-metcmq/radar-metcmq';
import { RadarTrayectographyOrientation } from '../radar-trayectography-orientation/radar-trayectography-orientation';
import { SeguimientoWidget } from '../seguimiento/seguimiento';
import { SeguridadWidget } from '../seguridad/seguridad';
import { ShotWidgetComponent } from '../shot-widget/shot-widget';
import { StanagCriteriosWidget } from '../stanag-criterios/stanag-criterios';
import { TaradoPresionChartWidget } from '../tarado-presion-chart/tarado-presion-chart';
import { TaradoVelocidadChartWidget } from '../tarado-velocidad-chart/tarado-velocidad-chart';
import { TargetDataWidget } from '../target-data/target-data';
import { TopographyIntroductionWidget } from '../topography-introduction/topography-introduction';
import { TrayectografiaIntroductionWidget } from '../trayectografia-introduction/trayectografia-introduction';
import { UniformidadChartWidget } from '../uniformidad-chart/uniformidad-chart';
import { VelocityIntroduction } from '../velocity-introduction/velocity-introduction';
import { VideoCameraOrientation } from '../video-camera-orientation/video-camera-orientation';
import { VigilanciaWidget } from '../vigilancia/vigilancia';

@Component({
  selector: 'inta-execution-grid',
  imports: [
    DragDropModule,
    TranslateModule,
    ShotWidgetComponent,
    ExecutionPrepTechWidgetComponent,
    ExecutionPrepJltWidgetComponent,
    VideoCameraOrientation,
    RadarTrayectographyOrientation,
    MaoTopography,
    JltMao,
    ArmamentIntroductionComponent,
    JltShotData,
    MunitionIntroduction,
    RadarMetcmq,
    TaradoVelocidadChartWidget,
    VelocityIntroduction,
    PiezoPressureIntroduction,
    ManometerIntroduction,
    SeguimientoWidget,
    InformacionTaradoWidget,
    TaradoPresionChartWidget,
    UniformidadChartWidget,
    StanagCriteriosWidget,
    TrayectografiaIntroductionWidget,
    OverpressureInfoWidget,
    OverpressureChartWidget,
    PassCoordsWidget,
    GrubbsCriterionWidget,
    TopographyIntroductionWidget,
    TargetDataWidget,
    AcousticLevelIntroduction,
    VigilanciaWidget,
    DatosBlancoBola,
    SeguridadWidget,
  ],
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
              [style.grid-row]="row"
              [style.grid-column]="col"
              (drop)="onCellDrop($event, row, col)"
              (dragover)="onCellDragOver($event)"
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
                  class="text-[var(--inta-button)] font-medium cursor-pointer hover:underline focus:outline-none"
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
            [class.pointer-events-none]="draggingWidget() !== null"
            [style.grid-row]="widget.position.row + ' / span ' + widget.height"
            [style.grid-column]="widget.position.col + ' / span ' + widget.width"
            [style.border]="'2px solid ' + (widget.color || '#e5e7eb')"
            [attr.draggable]="editMode()"
            (dragstart)="onDragStart($event, widget)"
            (dragend)="onDragEnd($event)"
          >
            @switch (widget.type) {
              @case (WidgetId.SHOT) {
                <inta-shot-widget [widgetId]="widget.id" />
              }
              @case (WidgetId.EXECUTION_PREP_TECH) {
                <inta-execution-prep-tech-widget
                  [widgetId]="widget.id"
                  [profile]="widget.techProfile ?? 'velocidades'"
                />
              }
              @case (WidgetId.EXECUTION_PREP_JLT) {
                <inta-execution-prep-jlt-widget [widgetId]="widget.id" />
              }
              @case (WidgetId.VIDEO_CAMERA_ORIENTATION) {
                <inta-video-camera-orientation [widgetId]="widget.id" />
              }
              @case (WidgetId.RADAR_TRAYECTOGRAPHY_ORIENTATION) {
                <inta-radar-trayectography-orientation [widgetId]="widget.id" />
              }
              @case (WidgetId.MAO_TOPOGRAPHY) {
                <inta-mao-topography [widgetId]="widget.id" />
              }
              @case (WidgetId.JLT_MAO) {
                <inta-jlt-mao [widgetId]="widget.id" />
              }
              @case (WidgetId.ARMAMENT_INTRODUCTION) {
                <inta-armament-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.JLT_SHOT_DATA) {
                <inta-jlt-shot-data [widgetId]="widget.id" />
              }
              @case (WidgetId.MUNITION_INTRODUCTION) {
                <inta-munition-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.RADAR_METCMQ) {
                <inta-radar-metcmq [widgetId]="widget.id" />
              }
              @case (WidgetId.TARADO_VELOCIDAD_CHART) {
                <inta-tarado-velocidad-chart [widgetId]="widget.id" />
              }
              @case (WidgetId.VELOCITY_INTRODUCTION) {
                <inta-velocity-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.PIEZO_PRESSURE_INTRODUCTION) {
                <inta-piezo-pressure-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.MANOMETER_INTRODUCTION) {
                <inta-manometer-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.SEGUIMIENTO) {
                <inta-seguimiento [widgetId]="widget.id" />
              }
              @case (WidgetId.INFORMACION_TARADO) {
                <inta-informacion-tarado [widgetId]="widget.id" />
              }
              @case (WidgetId.TARADO_PRESION_CHART) {
                <inta-tarado-presion-chart [widgetId]="widget.id" />
              }
              @case (WidgetId.UNIFORMIDAD_CHART) {
                <inta-uniformidad-chart [widgetId]="widget.id" />
              }
              @case (WidgetId.STANAG_CRITERIOS) {
                <inta-stanag-criterios [widgetId]="widget.id" />
              }
              @case (WidgetId.TRAYECTOGRAFIA_INTRODUCTION) {
                <inta-trayectografia-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.OVERPRESSURE_INFO) {
                <inta-overpressure-info [widgetId]="widget.id" />
              }
              @case (WidgetId.OVERPRESSURE_CHART) {
                <inta-overpressure-chart [widgetId]="widget.id" />
              }
              @case (WidgetId.PASS_COORDS) {
                <inta-pass-coords [widgetId]="widget.id" />
              }
              @case (WidgetId.GRUBBS_CRITERION) {
                <inta-grubbs-criterion [widgetId]="widget.id" />
              }
              @case (WidgetId.TOPOGRAPHY_INTRODUCTION) {
                <inta-topography-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.TARGET_DATA) {
                <inta-target-data [widgetId]="widget.id" />
              }
              @case (WidgetId.ACOUSTIC_LEVEL_INTRODUCTION) {
                <inta-acoustic-level-introduction [widgetId]="widget.id" />
              }
              @case (WidgetId.VIGILANCIA) {
                <inta-vigilancia [widgetId]="widget.id" />
              }
              @case (WidgetId.DATOS_BLANCO_BOLA) {
                <inta-datos-blanco-bola [widgetId]="widget.id" />
              }
              @case (WidgetId.SEGURIDAD) {
                <inta-seguridad [widgetId]="widget.id" />
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

  readonly WidgetId = WidgetId; // Para usar el enum en el template

  /** Calcula los bloques rectangulares libres (sin widget) del grid 3×3. */
  readonly freePlaceholderBlocks = computed(() => {
    const widgets = this.widgetStateService.placedWidgets();
    const occupied = new Set<string>();

    for (const w of widgets) {
      for (let r = w.position.row; r < w.position.row + w.height; r++) {
        for (let c = w.position.col; c < w.position.col + w.width; c++) {
          occupied.add(`${r},${c}`);
        }
      }
    }

    const blocks: { row: number; col: number; colSpan: number; rowSpan: number }[] = [];
    const visited = new Set<string>();

    for (const row of [1, 2, 3]) {
      for (const col of [1, 2, 3]) {
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

  readonly widgetAdded = output<string>();
  readonly widgetRemoved = output<string>();
  readonly openWidgetsPanel = output<void>();

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
