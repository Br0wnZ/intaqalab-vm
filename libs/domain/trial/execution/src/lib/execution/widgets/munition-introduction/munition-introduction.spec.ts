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
      componentId: 'granada-01',
      identificationData: {
        denominationId: 'den-01',
        batch: 'lote-01',
        clientNumber: 'CL-001',
        fuseWorkingModeId: 'percusion',
        fuseGraduation: 5.5,
        observations: 'Ident granada',
      },
      weightData: [
        {
          balanceId: 21031,
          weight: 43.5,
          weightAdded: 0,
          weightRemoved: 0,
          weighingDateTime: '2026-08-21T10:34:12Z',
          weighingRange: '0 - 500',
          observations: 'Weight granada bal 1',
        },
        {
          balanceId: 21032,
          weight: 43.6,
          weightAdded: 0,
          weightRemoved: 0,
          weighingDateTime: '2026-08-21T10:40:00Z',
          weighingRange: '0 - 2000',
          observations: 'Weight granada bal 2',
        },
      ],
      conditioningData: {
        climaticChamberId: 21045,
        chamberEntryDateTime: '2026-08-21T08:00:00Z',
        chamberExitDateTime: '2026-08-21T10:30:00Z',
        temperature: 20,
        programmedTemperature: 21,
        observations: 'Acond granada',
      },
    },
    {
      componentId: 'espoleta-01',
      identificationData: {
        denominationId: 'den-02',
        batch: 'lote-03',
        clientNumber: 'CL-002',
        fuseWorkingModeId: 'tiempo',
        fuseGraduation: 12.0,
        observations: 'Ident espoleta',
      },
      weightData: [
        {
          balanceId: 21031,
          weight: 520.0,
          weightAdded: 0,
          weightRemoved: 0,
          weighingDateTime: '2026-08-21T09:15:00Z',
          weighingRange: '0 - 500',
          observations: 'Weight espoleta',
        },
      ],
      conditioningData: {
        climaticChamberId: 21045,
        chamberEntryDateTime: '2026-08-21T08:00:00Z',
        chamberExitDateTime: '2026-08-21T10:30:00Z',
        temperature: 20,
        programmedTemperature: 21,
        observations: 'Acond espoleta',
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

    expect(store.munitionIntroduction().identificacion.denominacion).toBe('den-01');
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

  it('switches component and resets balance and unsaved edits', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(execService.fetchShotMunition).toHaveBeenCalled();
    });

    // 1. Initial component is granada-01
    expect(store.munitionIntroduction().selectedComponentId).toBe('granada-01');
    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('granada-01');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('den-01');
    expect(fixture.componentInstance.pesosTab()?.weightFormModel().balance).toBe('bal-01');
    expect(fixture.componentInstance.pesosTab()?.weightField()?.value).toBe('43.5');

    // 2. User edits without saving
    fixture.componentInstance.pesosTab()?.weightField.set({ value: '999', unit: 'g' });
    expect(fixture.componentInstance.pesosTab()?.isDirty()).toBe(true);

    // 3. User changes component to espoleta-01
    fixture.componentInstance.onComponentChange('espoleta-01');

    // 4. Shows fields for espoleta-01 and balance reset
    expect(store.munitionIntroduction().selectedComponentId).toBe('espoleta-01');
    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('espoleta-01');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('den-02');
    expect(fixture.componentInstance.pesosTab()?.weightFormModel().balance).toBe('bal-01');
    expect(fixture.componentInstance.pesosTab()?.weightField()?.value).toBe('520');
    expect(fixture.componentInstance.pesosTab()?.isDirty()).toBe(false);

    // 5. User switches back to granada-01 without saving -> unsaved edits (999) are discarded
    fixture.componentInstance.onComponentChange('granada-01');
    expect(fixture.componentInstance.pesosTab()?.weightField()?.value).toBe('43.5');
    expect(fixture.componentInstance.pesosTab()?.isDirty()).toBe(false);
  });

  it('updates balance options to only show balances belonging to the active component', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(execService.fetchShotMunition).toHaveBeenCalled();
    });

    // granada-01 has 2 balances (21031 -> bal-01, 21032 -> bal-02)
    const granadaOptions = fixture.componentInstance.pesosTab()?.balanceOptions();
    expect(granadaOptions).toHaveLength(2);
    expect(granadaOptions?.map((b) => b.value)).toEqual(['bal-01', 'bal-02']);

    // Switch component to espoleta-01 (only has 1 balance: 21031 -> bal-01)
    fixture.componentInstance.onComponentChange('espoleta-01');

    const espoletaOptions = fixture.componentInstance.pesosTab()?.balanceOptions();
    expect(espoletaOptions).toHaveLength(1);
    expect(espoletaOptions?.[0].value).toBe('bal-01');
    expect(fixture.componentInstance.pesosTab()?.weightFormModel().balance).toBe('bal-01');
  });

  it('does not mark form as dirty or touched when merely selecting a different balance', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(execService.fetchShotMunition).toHaveBeenCalled();
    });

    const pesosTab = fixture.componentInstance.pesosTab()!;
    expect(pesosTab.weightFormModel().balance).toBe('bal-01');
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().touched).toBe(false);

    // Switch balance to bal-02
    pesosTab.onBalanceChange('bal-02');

    expect(pesosTab.weightFormModel().balance).toBe('bal-02');
    expect(pesosTab.weightField()?.value).toBe('43.6');
    expect(pesosTab.isDirty()).toBe(false);
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().touched).toBe(false);
  });

  it('keeps edits in memory across balance switches but resets and clears dirty and touched on component change', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(execService.fetchShotMunition).toHaveBeenCalled();
    });

    const pesosTab = fixture.componentInstance.pesosTab()!;

    // 1. Edit bal-01
    pesosTab.weightField.set({ value: '99', unit: 'g' });
    expect(pesosTab.isDirty()).toBe(true);
    expect(fixture.componentInstance.formState().dirty).toBe(true);

    // 2. Switch to bal-02: bal-01 edits saved in memory, form remains dirty
    pesosTab.onBalanceChange('bal-02');
    expect(pesosTab.isDirty()).toBe(true);
    expect(pesosTab.weightField()?.value).toBe('43.6');

    // 3. Edit bal-02 as well
    pesosTab.weightField.set({ value: '100', unit: 'g' });
    expect(pesosTab.isDirty()).toBe(true);

    // 4. Switch back to bal-01: retrieves 99 from memory
    pesosTab.onBalanceChange('bal-01');
    expect(pesosTab.weightField()?.value).toBe('99');

    // 5. Change component to espoleta-01: resets all in-memory edits, marks form clean
    fixture.componentInstance.onComponentChange('espoleta-01');

    expect(store.munitionIntroduction().selectedComponentId).toBe('espoleta-01');
    expect(pesosTab.weightFormModel().balance).toBe('bal-01');
    expect(pesosTab.weightField()?.value).toBe('520');
    expect(pesosTab.isDirty()).toBe(false);
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().touched).toBe(false);
  });
});
