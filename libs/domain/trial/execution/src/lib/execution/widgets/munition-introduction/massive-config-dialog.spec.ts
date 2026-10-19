import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import type { MunitionConditioningBulkConfigurationResponse } from '../../models';
import { MassiveConfigDialog, type MassiveConfigDialogData } from './massive-config-dialog';

describe('MassiveConfigDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts editable conditioning dates and closes after the resource resolves', async () => {
    const data: MassiveConfigDialogData = {
      fireTrialId: 'trial-1',
      assignedShotIdsBySeries: { 'series-1': ['shot-1', 'shot-2'] },
      camaraLabel: 'Cámara 1',
      climaticChamberId: 21045,
      componente: 'component-1',
      temperaturaCorregida: 20,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      serieOptions: [{ value: 'series-1', label: 'Serie 1' }],
      componenteOptions: [{ value: 'component-1', label: 'Granada', category: 'granada' }],
    };
    const updated: MunitionConditioningBulkConfigurationResponse = { updatedShotIds: ['shot-1', 'shot-2'] };
    const status = signal<'idle' | 'loading' | 'resolved'>('idle');
    const isLoading = signal(false);
    let resolveRequest = (_response: MunitionConditioningBulkConfigurationResponse): void => {
      throw new Error('Request resolver was not initialized');
    };
    const request = new Promise<MunitionConditioningBulkConfigurationResponse>((resolve) => {
      resolveRequest = resolve;
    });
    const serviceMock = {
      applyMunitionConditioningBulkConfigurationResource: { status, isLoading },
      applyMunitionConditioningBulkConfiguration: vi.fn(() => {
        status.set('loading');
        isLoading.set(true);
        return request;
      }),
    };
    closeMock = vi.fn();

    const user = userEvent.setup();
    const view = await render(MassiveConfigDialog, {
      providers: [
        provideTestingEnvironment(),
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: ExecutionService, useValue: serviceMock },
      ],
      imports: [TranslateModule.forRoot()],
    });
    loader = TestbedHarnessEnvironment.loader(view.fixture);

    const entryInput = screen.getByLabelText(/FECHA_HORA_ENTRADA_LABEL/);
    expect(entryInput).not.toHaveAttribute('readonly');
    expect(screen.queryByLabelText(/FECHA_HORA_SALIDA_LABEL/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/EQUIPO_LABEL/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/TEMPERATURA_PROGRAMADA_LABEL/)).not.toBeInTheDocument();
    expect(screen.queryByText('play_circle_outline')).not.toBeInTheDocument();
    expect(screen.queryByText('stop_circle')).not.toBeInTheDocument();
    fireEvent.input(entryInput, { target: { value: '2026-10-15T08:30' } });

    const seriesSelect = (await loader.getAllHarnesses(MatSelectHarness))[0];
    if (!seriesSelect) throw new Error('Series select not found');
    await seriesSelect.open();
    await user.click(screen.getByText('Serie 1'));

    const applyButton = await loader.getHarness(MatButtonHarness.with({ text: /APPLY_BTN/ }));
    await applyButton.click();

    expect(serviceMock.applyMunitionConditioningBulkConfiguration).toHaveBeenCalledWith('trial-1', {
      assignedShotIds: ['shot-1', 'shot-2'],
      components: [
        {
          componentId: 'component-1',
          conditioningData: {
            climaticChamberId: 21045,
            chamberEntryDateTime: new Date('2026-10-15T08:30').toISOString(),
            chamberExitDateTime: null,
          },
        },
      ],
    });
    expect(closeMock).not.toHaveBeenCalled();

    status.set('resolved');
    isLoading.set(false);
    resolveRequest(updated);
    await waitFor(() => expect(closeMock).toHaveBeenCalledWith(updated));
  });

  it('filters climatic chamber options by selected series', async () => {
    const selections = [
      {
        equipmentItemId: 21045,
        categoryId: 'CLIMATIC_CHAMBER',
        seriesIds: ['series-1'],
      },
      {
        equipmentItemId: 21046,
        categoryId: 'CLIMATIC_CHAMBER',
        seriesIds: ['series-2'],
      },
    ];
    const data: MassiveConfigDialogData = {
      fireTrialId: 'trial-1',
      assignedShotIdsBySeries: { 'series-1': ['shot-1'], 'series-2': ['shot-2'] },
      componente: null,
      fechaHoraEntrada: null,
      serieOptions: [
        { value: 'series-1', label: 'Serie 1' },
        { value: 'series-2', label: 'Serie 2' },
      ],
      initialSeries: ['series-1'],
    };
    const serviceMock = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'CONDITIONING', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        CLIMATIC_CHAMBER: [
          { id: '21045', label: 'Cámara Weiss WT3-180' },
          { id: '21046', label: 'Cámara Binder MK 56' },
        ],
      }),
      applyMunitionConditioningBulkConfigurationResource: {
        status: signal('idle'),
        isLoading: signal(false),
      },
      applyMunitionConditioningBulkConfiguration: vi.fn(),
    };

    const view = await render(MassiveConfigDialog, {
      providers: [
        provideTestingEnvironment(),
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: ExecutionService, useValue: serviceMock },
      ],
      imports: [TranslateModule.forRoot()],
    });

    await Promise.resolve();
    view.fixture.detectChanges();

    const dialog = view.fixture.componentInstance;
    expect(dialog['componenteOptions']()).toEqual([{ value: '21045', label: 'Cámara Weiss WT3-180' }]);
    expect(dialog['selectedComponente']()).toBe('21045');

    dialog['selectedSeries'].set(['series-2']);
    view.fixture.detectChanges();
    expect(dialog['componenteOptions']()).toEqual([{ value: '21046', label: 'Cámara Binder MK 56' }]);
    expect(dialog['selectedComponente']()).toBe('21046');

    dialog['selectedSeries'].set(['series-1', 'series-2']);
    view.fixture.detectChanges();
    expect(dialog['componenteOptions']()).toEqual([
      { value: '21045', label: 'Cámara Weiss WT3-180' },
      { value: '21046', label: 'Cámara Binder MK 56' },
    ]);
  });
});
