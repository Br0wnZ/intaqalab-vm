/* eslint-disable testing-library/no-node-access */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
import { EquipmentTypeEnum, type ShotMunitionResponse } from '../../models';
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

  it('enables global save when weight changes before a balance is selected', async () => {
    const { fixture } = await renderWidget('test-widget', [
      { provide: WidgetStateService, useClass: WidgetStateService },
    ]);
    const widgetState = TestBed.inject(WidgetStateService);
    const pesosTab = fixture.componentInstance.pesosTab();
    if (!pesosTab) throw new Error('Pesos tab not rendered');

    pesosTab.weightField.set({ value: '99', unit: 'g' });

    await vi.waitFor(() => {
      expect(fixture.componentInstance.formState().dirty).toBe(true);
      expect(widgetState.hasUnsavedChanges()).toBe(true);
    });
  });

  it('formState has widgetId equal to provided input', async () => {
    const { fixture } = await renderWidget('munition-widget-1');
    expect(fixture.componentInstance.formState().widgetId).toBe('munition-widget-1');
  });

  it('activeTab starts on identificacion', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['activeTab']()).toBe('identificacion');
  });

  it('updates displayed status when selected shot changes', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);

    store.setOptimisticActiveShot('active-serie', 'active-shot');
    executionService.executionProgressResource.set({
      series: [
        {
          seriesId: 'serie-1',
          shots: [
            { shotId: 'shot-fired', status: 'FIRED', updatedAt: '2026-10-05T10:00:00Z' },
            { shotId: 'shot-pending', status: 'PENDING', updatedAt: '2026-10-05T10:01:00Z' },
          ],
        },
      ],
    });

    fixture.componentInstance.onSerieSelected('serie-1');
    fixture.componentInstance.onDisparoSelected('shot-fired');
    expect(fixture.componentInstance['estadoDisparo']()).toBe('EJECUTADA');
    expect(fixture.componentInstance['estadoLabel']()).toBe('Ejecutado');

    fixture.componentInstance.onDisparoSelected('shot-pending');
    expect(fixture.componentInstance['estadoDisparo']()).toBe('PENDIENTE');
    expect(fixture.componentInstance['estadoLabel']()).toBe('Pendiente');
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
    const identTab = fixture.componentInstance.identTab();
    const pesosTab = fixture.componentInstance.pesosTab();
    const acondTab = fixture.componentInstance.acondTab();
    expect(identTab).toBeDefined();
    expect(pesosTab).toBeDefined();
    expect(acondTab).toBeDefined();
    if (!identTab || !pesosTab || !acondTab) throw new Error('Tabs not rendered');
    const identSpy = vi.spyOn(identTab, 'save');
    const pesosSpy = vi.spyOn(pesosTab, 'save');
    const acondSpy = vi.spyOn(acondTab, 'save');

    await fixture.componentInstance.saveForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('resetForm delegates to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identTab = fixture.componentInstance.identTab();
    const pesosTab = fixture.componentInstance.pesosTab();
    const acondTab = fixture.componentInstance.acondTab();
    expect(identTab).toBeDefined();
    expect(pesosTab).toBeDefined();
    expect(acondTab).toBeDefined();
    if (!identTab || !pesosTab || !acondTab) throw new Error('Tabs not rendered');
    const identSpy = vi.spyOn(identTab, 'reset');
    const pesosSpy = vi.spyOn(pesosTab, 'reset');
    const acondSpy = vi.spyOn(acondTab, 'reset');

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
    TestBed.tick();
    const balanceItemsRequest = TestBed.inject(HttpTestingController).expectOne(
      (request) =>
        request.url.includes('/equipment/items') && request.params.get('categoryId') === EquipmentTypeEnum.BALANCE,
    );
    balanceItemsRequest.flush({
      totalElements: 2,
      items: [
        { id: 21031, denominationName: 'Balance 500g', tag: 'BAL-01' },
        { id: 21032, denominationName: 'Balance 2kg', tag: 'BAL-02' },
      ],
    });
    await vi.waitFor(() => {
      TestBed.tick();
      expect(fixture.componentInstance.pesosTab()?.balanceOptions()).toHaveLength(2);
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

    const pesosTab = fixture.componentInstance.pesosTab();
    expect(pesosTab).toBeDefined();
    if (!pesosTab) throw new Error('pesosTab not rendered');
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

    const pesosTab = fixture.componentInstance.pesosTab();
    expect(pesosTab).toBeDefined();
    if (!pesosTab) throw new Error('pesosTab not rendered');

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

  it('updates component and denomination options based on selected series planning configurations', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    const mockPlanningOptions = {
      configurationIds: ['config-1', 'config-2'],
      componentTypes: [
        { id: 'type-do', label: 'Disparo Organizado', category: 'MUNITION' },
        { id: 'type-esp', label: 'Espoleta', category: 'MUNITION_COMPONENT' },
        { id: 'type-gm', label: 'Granada mortero', category: 'MUNITION' },
      ],
      denominations: [
        {
          id: 'denom-do',
          name: 'D. O. 105 mm M1 TP inerte',
          componentTypeId: 'type-do',
          batch: 'LOT-DO-001',
          clientNumber: 'DO-001',
        },
        {
          id: 'denom-esp',
          name: 'Espoleta 4AP',
          componentTypeId: 'type-esp',
          batch: 'LOT-ESP-002',
          clientNumber: '34',
        },
        {
          id: 'denom-gm',
          name: 'Granada mortero 81 mm HC',
          componentTypeId: 'type-gm',
          batch: 'LOT-GM-003',
          clientNumber: 'GM-001',
        },
      ],
      optionsBySelection: {},
      optionsByShot: {},
      optionsBySeries: {
        'serie-inicial': {
          componentTypes: [
            { id: 'type-do', label: 'Disparo Organizado', category: 'MUNITION' },
            { id: 'type-esp', label: 'Espoleta', category: 'MUNITION_COMPONENT' },
          ],
          denominations: [
            {
              id: 'denom-do',
              name: 'D. O. 105 mm M1 TP inerte',
              componentTypeId: 'type-do',
              batch: 'LOT-DO-001',
              clientNumber: 'DO-001',
            },
            {
              id: 'denom-esp',
              name: 'Espoleta 4AP',
              componentTypeId: 'type-esp',
              batch: 'LOT-ESP-002',
              clientNumber: '34',
            },
          ],
          componentData: {
            'type-do': {
              componentTypeId: 'type-do',
              denominationId: 'denom-do',
              batch: 'LOT-DO-001',
              clientNumber: 'DO-001',
            },
            'type-esp': {
              componentTypeId: 'type-esp',
              denominationId: 'denom-esp',
              batch: 'LOT-ESP-002',
              clientNumber: '34',
            },
          },
          denominationData: {
            'denom-do': {
              componentTypeId: 'type-do',
              denominationId: 'denom-do',
              batch: 'LOT-DO-001',
              clientNumber: 'DO-001',
            },
            'denom-esp': {
              componentTypeId: 'type-esp',
              denominationId: 'denom-esp',
              batch: 'LOT-ESP-002',
              clientNumber: '34',
            },
          },
        },
        'serie-aseguramiento': {
          componentTypes: [{ id: 'type-gm', label: 'Granada mortero', category: 'MUNITION' }],
          denominations: [
            {
              id: 'denom-gm',
              name: 'Granada mortero 81 mm HC',
              componentTypeId: 'type-gm',
              batch: 'LOT-GM-003',
              clientNumber: 'GM-001',
            },
          ],
          componentData: {
            'type-gm': {
              componentTypeId: 'type-gm',
              denominationId: 'denom-gm',
              batch: 'LOT-GM-003',
              clientNumber: 'GM-001',
            },
          },
          denominationData: {
            'denom-gm': {
              componentTypeId: 'type-gm',
              denominationId: 'denom-gm',
              batch: 'LOT-GM-003',
              clientNumber: 'GM-001',
            },
          },
        },
      },
    };

    vi.spyOn(execService, 'fetchPlanningMunitionOptions').mockResolvedValue(mockPlanningOptions);
    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue({ munitionData: [] });

    store.setFireTrialId('trial-123');

    await vi.waitFor(() => {
      expect(execService.fetchPlanningMunitionOptions).toHaveBeenCalledWith('trial-123');
    });

    // 1. Select Serie Inicial: displays 2 components and patches initial component (Disparo Organizado)
    fixture.componentInstance.onSerieSelected('serie-inicial');

    expect(store.munitionIntroduction().componenteOptions).toHaveLength(2);
    expect(store.munitionIntroduction().componenteOptions.map((c) => c.label)).toEqual([
      'Disparo Organizado',
      'Espoleta',
    ]);
    expect(store.munitionIntroduction().denominacionOptions).toHaveLength(2);

    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('type-do');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('denom-do');
    expect(fixture.componentInstance.identTab()?.identFormModel().lote).toBe('LOT-DO-001');
    expect(fixture.componentInstance.identTab()?.numeroClienteField()).toBe('DO-001');

    // 2. Change component to Espoleta: patches denomination, lote and clientNumber for Espoleta
    fixture.componentInstance.onComponentChange('type-esp');

    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('type-esp');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('denom-esp');
    expect(fixture.componentInstance.identTab()?.identFormModel().lote).toBe('LOT-ESP-002');
    expect(fixture.componentInstance.identTab()?.numeroClienteField()).toBe('34');

    store.loadMunitionIntroductionRemoteResponse(
      {
        munitionData: [
          {
            componentId: 'type-esp',
            identificationData: { clientNumber: '2345' },
            weightData: [],
            conditioningData: null,
          },
        ],
      },
      'type-esp',
    );
    fixture.componentInstance.onComponentChange('type-esp');
    expect(fixture.componentInstance.identTab()?.numeroClienteField()).toBe('2345');

    // 3. Select Serie Aseguramiento: displays only Granada mortero and patches its data
    fixture.componentInstance.onSerieSelected('serie-aseguramiento');

    expect(store.munitionIntroduction().componenteOptions).toHaveLength(1);
    expect(store.munitionIntroduction().componenteOptions[0].label).toBe('Granada mortero');
    expect(store.munitionIntroduction().denominacionOptions).toHaveLength(1);
    expect(store.munitionIntroduction().denominacionOptions[0].label).toBe('Granada mortero 81 mm HC');

    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('type-gm');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('denom-gm');
    expect(fixture.componentInstance.identTab()?.identFormModel().lote).toBe('LOT-GM-003');
    expect(fixture.componentInstance.identTab()?.numeroClienteField()).toBe('GM-001');
  });

  it('loads and displays all denominations for component when planning specifies component without denomination', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    const mockPlanningOptions = {
      configurationIds: ['config-unassigned'],
      componentTypes: [{ id: 'type-esp', label: 'Espoleta', category: 'MUNITION_COMPONENT' }],
      denominations: [
        { id: 'denom-wh-1', name: 'Espoleta M578', componentTypeId: 'type-esp', batch: null, clientNumber: null },
        { id: 'denom-wh-2', name: 'Espoleta 4AP', componentTypeId: 'type-esp', batch: null, clientNumber: null },
      ],
      optionsBySelection: {},
      optionsByShot: {},
      optionsBySeries: {
        'serie-unassigned': {
          componentTypes: [{ id: 'type-esp', label: 'Espoleta', category: 'MUNITION_COMPONENT' }],
          denominations: [
            { id: 'denom-wh-1', name: 'Espoleta M578', componentTypeId: 'type-esp', batch: null, clientNumber: null },
            { id: 'denom-wh-2', name: 'Espoleta 4AP', componentTypeId: 'type-esp', batch: null, clientNumber: null },
          ],
          componentData: {
            'type-esp': { componentTypeId: 'type-esp', denominationId: null, batch: null, clientNumber: null },
          },
          denominationData: {},
        },
      },
    };

    vi.spyOn(execService, 'fetchPlanningMunitionOptions').mockResolvedValue(mockPlanningOptions);
    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue({ munitionData: [] });

    store.setFireTrialId('trial-unassigned-denom');

    await vi.waitFor(() => {
      expect(execService.fetchPlanningMunitionOptions).toHaveBeenCalledWith('trial-unassigned-denom');
    });

    fixture.componentInstance.onSerieSelected('serie-unassigned');

    const identTab = fixture.componentInstance.identTab();
    expect(identTab).toBeDefined();

    // Component is set to Espoleta
    expect(identTab?.identFormModel().componente).toBe('type-esp');

    // Denomination is not preselected because planning did not inform it
    expect(identTab?.identFormModel().denominacion).toBeNull();

    // All warehouse denominations for this component type are loaded in options
    const filteredDenoms = identTab?.filteredDenominacionOptions() ?? [];
    expect(filteredDenoms).toHaveLength(2);
    expect(filteredDenoms.map((d) => d.value)).toEqual(['denom-wh-1', 'denom-wh-2']);
    expect(filteredDenoms.map((d) => d.label)).toEqual(['Espoleta M578', 'Espoleta 4AP']);

    store.loadMunitionIntroductionRemoteResponse(
      {
        munitionData: [
          {
            componentId: 'type-esp',
            identificationData: { denominationId: 'denom-wh-2' },
            weightData: [],
            conditioningData: null,
          },
        ],
      },
      'type-esp',
    );
    fixture.componentInstance.onComponentChange('type-esp');

    // A denomination already received for this component takes precedence over empty planning data.
    expect(identTab?.identFormModel().denominacion).toBe('denom-wh-2');

    // User selects one denomination
    identTab?.onDenominacionChange('denom-wh-1');
    identTab?.identFormModel.update((m) => ({ ...m, denominacion: 'denom-wh-1' }));
    expect(identTab?.identFormModel().denominacion).toBe('denom-wh-1');
  });

  it('loads and filters the global warehouse denomination catalog when component has no planning mapping', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchDenominationsSpy = vi.spyOn(execService, 'fetchWarehouseDenominations').mockResolvedValue([
      {
        id: 'denom-esp-1',
        name: 'Espoleta M578',
        componentTypeId: 'type-esp',
        batch: null,
        clientNumber: null,
      },
      {
        id: 'denom-gr-1',
        name: 'Granada M107',
        componentTypeId: 'type-gr',
        batch: null,
        clientNumber: null,
      },
    ]);

    fixture.componentInstance.onComponentChange('type-esp');

    await vi.waitFor(() => {
      expect(fetchDenominationsSpy).toHaveBeenCalledWith();
      expect(fixture.componentInstance.identTab()?.filteredDenominacionOptions()).toHaveLength(1);
    });

    expect(store.munitionIntroduction().identificacion.componente).toBe('type-esp');
    expect(
      fixture.componentInstance
        .identTab()
        ?.filteredDenominacionOptions()
        .map((option) => option.value),
    ).toEqual(['denom-esp-1']);
  });
});
