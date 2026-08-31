/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable testing-library/no-node-access */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Provider } from '@angular/core';
import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TrialsDataService } from '@intaqalab/data-access';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import type { ShotMunitionResponse } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { MunitionIntroduction } from './munition-introduction';

@Injectable()
class MockTrialsDataService {
  readonly byIdResource = {
    value: signal({
      id: 'b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c',
      trialNumber: '034A/25',
      client: { id: 'client-1', name: 'RHEINMETALL EXPAL MUNITIONS' },
      description: 'Proyectil de 155 mm SMK RP ERG2A1',
      status: 'IN_PROGRESS',
    }),
    isLoading: signal(false),
    error: signal(null),
  };
  loadById(id: string) {
    /* empty */
  }
}

const mockWidgetStateService = {
  updateWidgetFormState: () => {
    /* noop */
  },
  registerWidgetInstance: () => {
    /* noop */
  },
  unregisterWidgetInstance: () => {
    /* noop */
  },
  addWidget: () => {
    /* noop */
  },
  placedWidgets: () => [],
};

const mockMunitionResponse: ShotMunitionResponse = {
  munitionData: [
    {
      componentId: 'espoleta-01',
      identificationData: {
        denominationId: 'den-02',
        batch: 'lote-03',
        clientNumber: 'CL-001',
        fuseWorkingModeId: 'percusion',
        fuseGraduation: 3.5,
        observations: 'Ident remote',
      },
      weightData: {
        balanceId: 101,
        weight: 45.5,
        weightAdded: 0,
        weightRemoved: 0,
        weighingDateTime: '2026-08-27T10:00:00Z',
        weighingRange: '0-500g',
        observations: 'Peso remote',
      },
      conditioningData: {
        climaticChamberId: 202,
        chamberEntryDateTime: '2026-08-27T08:00:00Z',
        chamberExitDateTime: '2026-08-27T10:00:00Z',
        temperature: 20,
        programmedTemperature: 21,
        observations: 'Acond remote',
      },
    },
  ],
};

describe('MunitionIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget', customProviders: Provider[] = []) =>
    render(MunitionIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ExecutionService,
        { provide: TrialsDataService, useClass: MockTrialsDataService },
        ...customProviders,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('formState has widgetId equal to provided input', async () => {
    const { fixture } = await renderWidget('munition-widget-1');
    expect(fixture.componentInstance.formState().widgetId).toBe('munition-widget-1');
  });

  it('activeTab starts on identificacion', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['activeTab']()).toBe('identificacion');
  });

  it('saveForm persists selection to the store and calls ExecutionService', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);
    const updateSpy = vi.spyOn(execService, 'updateShotMunition').mockResolvedValue(mockMunitionResponse);

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'calentamiento', disparo: 'disparo-1' });

    await fixture.componentInstance.saveForm();

    expect(store.munitionIntroduction().serie).toBe('calentamiento');
    expect(store.munitionIntroduction().disparo).toBe('disparo-1');
    expect(updateSpy).toHaveBeenCalledWith('trial-123', 'calentamiento', 'disparo-1', expect.any(Object));
  });

  it('saveForm handles errors gracefully when executionService throws', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'updateShotMunition').mockRejectedValue(new Error('Network error'));

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'calentamiento', disparo: 'disparo-1' });

    await expect(fixture.componentInstance.saveForm()).rejects.toThrow('Network error');
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).munitionIntroduction();
    expect(fixture.componentInstance['selectorFormModel']().serie).toBe(stored.serie);
  });

  it('saveForm delegates to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'save');
    const pesosSpy = vi.spyOn(fixture.componentInstance.pesosTab()!, 'save');
    const acondSpy = vi.spyOn(fixture.componentInstance.acondTab()!, 'save');

    await fixture.componentInstance.saveForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('resetForm delegates to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'reset');
    const pesosSpy = vi.spyOn(fixture.componentInstance.pesosTab()!, 'reset');
    const acondSpy = vi.spyOn(fixture.componentInstance.acondTab()!, 'reset');

    fixture.componentInstance.resetForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('fetches shot munition data and applies to tabs and store', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    // Wait for async load to finish
    await vi.waitFor(() => {
      expect(execService.fetchShotMunition).toHaveBeenCalledWith('trial-123', 'funcionamiento-1', 'disparo-2');
    });

    expect(store.munitionIntroduction().identificacion.denominacion).toBe('den-02');
  });

  it('setCurrentShot selects active shot from store and triggers load', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.setCurrentShot();

    expect(fixture.componentInstance['selectorFormModel']().serie).toBe(store.activeSerieId());
    expect(fixture.componentInstance['selectorFormModel']().disparo).toBe(store.activeShotId());
  });
});
