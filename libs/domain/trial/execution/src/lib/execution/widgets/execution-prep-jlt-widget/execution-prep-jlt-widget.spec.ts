import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PlanningSeriesItem } from '@intaqalab/data-access-planning';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JltStatus } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { ExecutionPrepJltWidgetComponent } from './execution-prep-jlt-widget';

const mockSeries: PlanningSeriesItem[] = [
  {
    id: 'serie-1',
    name: 'Serie 1',
    shots: [
      { id: 'shot-1-1', globalNumber: 1 },
      { id: 'shot-1-2', globalNumber: 2 },
    ],
  },
  {
    id: 'serie-2',
    name: 'Serie 2',
    shots: [
      { id: 'shot-2-1', globalNumber: 3 },
      { id: 'shot-2-2', globalNumber: 4 },
    ],
  },
];

const mockInitialJltStatus: JltStatus = {
  sanitary: true,
  security: true,
  boat: true,
  observations: '',
};

function createMockStore(overrides?: {
  activeSerieId?: string | null;
  activeShotId?: string | null;
  planningSeries?: PlanningSeriesItem[] | null;
}) {
  return {
    activeSerieId: signal(overrides?.activeSerieId ?? 'serie-1'),
    activeShotId: signal(overrides?.activeShotId ?? 'shot-1-1'),
    planningSeries: signal(overrides?.planningSeries ?? mockSeries),
    executionProgress: signal(null),
    jltStatus: signal(mockInitialJltStatus),
    techUnits: signal([]),
    isReadyForExecution: signal(true),
    fireTrialId: signal('trial-123'),
    isLoadingJltPreparation: signal(false),
    isTrialReadOnly: vi.fn().mockReturnValue(false),
    setOptimisticActiveShot: vi.fn(),
    selectJltShot: vi.fn(),
    fireJltShot: vi.fn(),
    updateJltStatus: vi.fn(),
    saveJltReadiness: vi.fn(),
    loadJltPreparation: vi.fn(),
  };
}

function createMockWidgetStateService() {
  return {
    updateWidgetFormState: vi.fn(),
    registerWidgetInstance: vi.fn(),
    unregisterWidgetInstance: vi.fn(),
    dirtyWidgets: signal([]),
    hasUnsavedChanges: signal(false),
    placedWidgets: signal([]),
  };
}

describe('ExecutionPrepJltWidgetComponent', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockWidgetStateService: ReturnType<typeof createMockWidgetStateService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    mockWidgetStateService = createMockWidgetStateService();
  });

  const renderWidget = (widgetId = 'test-prep-jlt') =>
    render(ExecutionPrepJltWidgetComponent, {
      componentInputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExecutionStore, useValue: mockStore },
        { provide: WidgetStateService, useValue: mockWidgetStateService },
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('mat-card')).toBeTruthy();
  });

  it('does not set optimistic active shot in store when changing series in the widget', async () => {
    const { fixture } = await renderWidget();
    fixture.detectChanges();

    // Cambiar de serie en el widget (como hace el selector del header del widget)
    fixture.componentInstance.setActiveSerie('serie-2');
    fixture.detectChanges();

    // Localmente en el widget cambia la serie y el primer disparo disponible de esa serie
    expect(fixture.componentInstance.selectedSerie()).toBe('serie-2');
    expect(fixture.componentInstance.selectedShot()).toBe('shot-2-1');
    expect(fixture.componentInstance.resolvedShotId()).toBe('shot-2-1');

    // En el store NO debe haberse llamado a setOptimisticActiveShot (no se pone en curso)
    expect(mockStore.setOptimisticActiveShot).not.toHaveBeenCalled();
    expect(mockStore.activeSerieId()).toBe('serie-1');
    expect(mockStore.activeShotId()).toBe('shot-1-1');
  });

  it('sets optimistic active shot and calls selectJltShot only when selectCurrentShot is invoked', async () => {
    const { fixture } = await renderWidget();
    fixture.detectChanges();

    // Cambiar de serie a serie-2
    fixture.componentInstance.setActiveSerie('serie-2');
    fixture.detectChanges();

    expect(mockStore.setOptimisticActiveShot).not.toHaveBeenCalled();
    expect(mockStore.selectJltShot).not.toHaveBeenCalled();

    // Pulsar "Seleccionar disparo"
    fixture.componentInstance.selectCurrentShot();
    fixture.detectChanges();

    // Ahora sí se llama con la serie y disparo seleccionados
    expect(mockStore.setOptimisticActiveShot).toHaveBeenCalledWith('serie-2', 'shot-2-1');
    expect(mockStore.selectJltShot).toHaveBeenCalledWith('trial-123', 'shot-2-1');
  });

  it('allows changing the local active shot before confirming selection', async () => {
    const { fixture } = await renderWidget();
    fixture.detectChanges();

    fixture.componentInstance.setActiveSerie('serie-2');
    fixture.componentInstance.setActiveShot('shot-2-2');
    fixture.detectChanges();

    expect(fixture.componentInstance.resolvedShotId()).toBe('shot-2-2');
    expect(mockStore.setOptimisticActiveShot).not.toHaveBeenCalled();

    fixture.componentInstance.selectCurrentShot();
    fixture.detectChanges();

    expect(mockStore.setOptimisticActiveShot).toHaveBeenCalledWith('serie-2', 'shot-2-2');
    expect(mockStore.selectJltShot).toHaveBeenCalledWith('trial-123', 'shot-2-2');
  });
});
