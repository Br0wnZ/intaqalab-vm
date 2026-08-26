import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import type { PlacedWidget } from '../../../models/execution-grid.models';
import { WidgetId } from '../../../models/widget-id.enum';
import { WidgetStateService } from '../../../services/widget-state.service';
import { ExecutionGridComponent } from './execution-grid';

describe('ExecutionGridComponent', () => {
  let placedWidgetsSignal = signal<PlacedWidget[]>([]);
  let mockWidgetStateService: {
    updateWidgetFormState: ReturnType<typeof vi.fn>;
    addWidget: ReturnType<typeof vi.fn>;
    moveWidget: ReturnType<typeof vi.fn>;
    removeWidget: ReturnType<typeof vi.fn>;
    placedWidgets: () => PlacedWidget[];
  };

  const setup = async ({
    editMode = false,
    widgets = [],
    onWidgetRemoved = vi.fn(),
    onOpenWidgetsPanel = vi.fn(),
  }: {
    editMode?: boolean;
    widgets?: PlacedWidget[];
    onWidgetRemoved?: (id: string) => void;
    onOpenWidgetsPanel?: () => void;
  } = {}) => {
    placedWidgetsSignal = signal<PlacedWidget[]>(widgets);

    mockWidgetStateService = {
      updateWidgetFormState: vi.fn(),
      addWidget: vi.fn(),
      moveWidget: vi.fn().mockReturnValue(true),
      removeWidget: vi.fn(),
      placedWidgets: () => placedWidgetsSignal(),
    };

    const user = userEvent.setup();

    const view = await render(ExecutionGridComponent, {
      componentInputs: { editMode },
      on: {
        widgetRemoved: onWidgetRemoved,
        openWidgetsPanel: onOpenWidgetsPanel,
      },
      providers: [
        provideTestingEnvironment(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ExecutionStore,
        { provide: WidgetStateService, useValue: mockWidgetStateService },
      ],
      imports: [TranslateModule.forRoot()],
    });

    return { user, view, mockWidgetStateService };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Standard Mode', () => {
    it('should create the component', async () => {
      const { view } = await setup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('renders free placeholder blocks and widgets panel button when no widgets are placed', async () => {
      const onOpenWidgetsPanel = vi.fn();
      const { user } = await setup({ editMode: false, widgets: [], onOpenWidgetsPanel });

      expect(screen.getByText('TRIAL_EXECUTION.FREE_SPACE_TITLE')).toBeInTheDocument();
      const openBtn = screen.getByRole('button', { name: 'TRIAL_EXECUTION.FREE_SPACE_DESC_WIDGETS_BTN' });
      expect(openBtn).toBeInTheDocument();

      await user.click(openBtn);
      expect(onOpenWidgetsPanel).toHaveBeenCalledOnce();
    });

    it('does not display remove buttons or dimensions badges when editMode is false', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      await setup({ editMode: false, widgets: [sampleWidget] });

      expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();
      expect(screen.queryByText('W: 1 H: 1')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode and Widget Management', () => {
    it('hides free space placeholders and shows edit mode controls', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 2,
        height: 1,
      };

      await setup({ editMode: true, widgets: [sampleWidget] });

      expect(screen.queryByText('TRIAL_EXECUTION.FREE_SPACE_TITLE')).not.toBeInTheDocument();
      expect(screen.getByText('W: 2 H: 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });

    it('removes widget and emits widgetRemoved output when clicking remove button', async () => {
      const onWidgetRemoved = vi.fn();
      const sampleWidget: PlacedWidget = {
        id: 'widget-to-delete',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      const { user, mockWidgetStateService: serviceMock } = await setup({
        editMode: true,
        widgets: [sampleWidget],
        onWidgetRemoved,
      });

      const removeBtn = screen.getByRole('button', { name: '✕' });
      await user.click(removeBtn);

      expect(serviceMock.removeWidget).toHaveBeenCalledWith('widget-to-delete');
      expect(onWidgetRemoved).toHaveBeenCalledWith('widget-to-delete');
    });
  });

  describe('Widget Template Rendering', () => {
    it('renders known widget components correctly', async () => {
      const widgets: PlacedWidget[] = [
        {
          id: 'w-shot',
          type: WidgetId.SHOT,
          position: { row: 1, col: 1 },
          width: 1,
          height: 1,
        },
      ];

      await setup({ widgets });
      expect(screen.getByRole('heading', { name: 'TRIAL_EXECUTION.WIDGETS.SHOT.TITLE' })).toBeInTheDocument();
    });

    it('renders fallback template for unknown widget types', async () => {
      const unknownWidget: PlacedWidget = {
        id: 'w-unknown',
        type: 'non-existent-widget-type' as unknown as WidgetId,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      await setup({ widgets: [unknownWidget] });
      expect(screen.getByText(/Widget: non-existent-widget-type/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Handlers', () => {
    it('prevents dragstart when not in editMode', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      const { view } = await setup({ editMode: false, widgets: [sampleWidget] });
      const comp = view.fixture.componentInstance;

      const mockEvent = {
        preventDefault: vi.fn(),
        target: document.createElement('div'),
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as DragEvent;

      comp.onDragStart(mockEvent, sampleWidget);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(comp.draggingWidget()).toBeNull();
    });

    it('sets dragging widget state and dataTransfer on dragstart when in editMode', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      const { view } = await setup({ editMode: true, widgets: [sampleWidget] });
      const comp = view.fixture.componentInstance;
      const targetElement = document.createElement('div');

      const mockEvent = {
        preventDefault: vi.fn(),
        target: targetElement,
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as DragEvent;

      comp.onDragStart(mockEvent, sampleWidget);

      expect(comp.draggingWidget()).toEqual(sampleWidget);
      expect(mockEvent.dataTransfer?.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer?.setData).toHaveBeenCalledWith('widgetId', 'widget-1');
    });

    it('resets dragging state and clears classes on dragend', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      const { view } = await setup({ editMode: true, widgets: [sampleWidget] });
      const comp = view.fixture.componentInstance;
      const targetElement = document.createElement('div');
      targetElement.classList.add('dragging');

      comp.draggingWidget.set(sampleWidget);

      const mockEvent = {
        target: targetElement,
      } as unknown as DragEvent;

      comp.onDragEnd(mockEvent);

      expect(comp.draggingWidget()).toBeNull();
    });

    it('ignores cell dragover when not in editMode', async () => {
      const { view } = await setup({ editMode: false });
      const comp = view.fixture.componentInstance;

      const mockEvent = {
        preventDefault: vi.fn(),
        currentTarget: document.createElement('div'),
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent;

      comp.onCellDragOver(mockEvent, 2, 3);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('handles cell dragover when in editMode', async () => {
      const { view } = await setup({ editMode: true });
      const comp = view.fixture.componentInstance;
      const currentTarget = document.createElement('div');

      const mockEvent = {
        preventDefault: vi.fn(),
        currentTarget,
        dataTransfer: { dropEffect: '' },
      } as unknown as DragEvent;

      comp.onCellDragOver(mockEvent, 2, 3);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer?.dropEffect).toBe('move');
      expect(comp.hoveredCell()).toEqual({ row: 2, col: 3 });
    });

    it('moves widget to target position on cell drop when widget is dragging', async () => {
      const sampleWidget: PlacedWidget = {
        id: 'widget-drag-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 1,
        height: 1,
      };

      const { view, mockWidgetStateService: serviceMock } = await setup({
        editMode: true,
        widgets: [sampleWidget],
      });
      const comp = view.fixture.componentInstance;
      const currentTarget = document.createElement('div');
      currentTarget.classList.add('drag-over');

      comp.draggingWidget.set(sampleWidget);

      const mockEvent = {
        preventDefault: vi.fn(),
        currentTarget,
      } as unknown as DragEvent;

      comp.onCellDrop(mockEvent, 2, 3);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(comp.hoveredCell()).toBeNull();
      expect(serviceMock.moveWidget).toHaveBeenCalledWith('widget-drag-1', { row: 2, col: 3 });
    });

    it('does not call moveWidget on cell drop when no widget is dragging', async () => {
      const { view, mockWidgetStateService: serviceMock } = await setup({ editMode: true });
      const comp = view.fixture.componentInstance;
      const currentTarget = document.createElement('div');

      comp.draggingWidget.set(null);

      const mockEvent = {
        preventDefault: vi.fn(),
        currentTarget,
      } as unknown as DragEvent;

      comp.onCellDrop(mockEvent, 2, 3);

      expect(serviceMock.moveWidget).not.toHaveBeenCalled();
    });
  });

  describe('Grid Helper Methods and Free Blocks Computation', () => {


    it('computes free blocks when grid is partially occupied', async () => {
      const fullRowWidget: PlacedWidget = {
        id: 'w-row1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 3,
        height: 1,
      };

      const { view } = await setup({ widgets: [fullRowWidget] });
      const comp = view.fixture.componentInstance;
      const blocks = comp.freePlaceholderBlocks();

      // Row 1 is occupied; rows 2 & 3 free (span 3 cols, 2 rows)
      expect(blocks).toEqual([{ row: 2, col: 1, colSpan: 3, rowSpan: 2 }]);
    });

    it('computes zero free blocks when grid is fully occupied', async () => {
      const fullGridWidget: PlacedWidget = {
        id: 'w-full-1',
        type: WidgetId.SHOT,
        position: { row: 1, col: 1 },
        width: 3,
        height: 2,
      };
      const fullRow3Widget: PlacedWidget = {
        id: 'w-full-2',
        type: WidgetId.SHOT,
        position: { row: 3, col: 1 },
        width: 3,
        height: 1,
      };

      const { view } = await setup({ widgets: [fullGridWidget, fullRow3Widget] });
      const comp = view.fixture.componentInstance;
      const blocks = comp.freePlaceholderBlocks();

      expect(blocks).toHaveLength(0);
    });
  });
});
