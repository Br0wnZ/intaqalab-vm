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

  it('shows massive configuration button only on acondicionamiento tab', async () => {
    const { fixture } = await renderWidget();
    const hasMassiveConfigButton = () =>
      Array.from(fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button')).some((button) =>
        button.textContent?.includes('MASSIVE_CONFIG_BTN'),
      );

    expect(hasMassiveConfigButton()).toBe(false);

    fixture.componentInstance['activeTab'].set('acondicionamiento');
    fixture.detectChanges();
    expect(hasMassiveConfigButton()).toBe(true);

    fixture.componentInstance['activeTab'].set('pesos');
    fixture.detectChanges();
    expect(hasMassiveConfigButton()).toBe(false);
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

  it('selects the first shot regardless of status when changing series', async () => {
    const { fixture } = await renderWidget();
    const executionService = TestBed.inject(ExecutionService);

    executionService.executionProgressResource.set({
      series: [
        {
          seriesId: 'serie-2',
          shots: [
            { shotId: 'shot-fired', status: 'FIRED', updatedAt: '2026-10-05T10:00:00Z' },
            { shotId: 'shot-pending', status: 'PENDING', updatedAt: '2026-10-05T10:01:00Z' },
            { shotId: 'shot-active', status: 'ACTIVE', updatedAt: '2026-10-05T10:02:00Z' },
          ],
        },
      ],
    });

    fixture.componentInstance.onSerieSelected('serie-2');

    expect(fixture.componentInstance['selectorFormModel']()).toEqual({
      serie: 'serie-2',
      disparo: 'shot-fired',
    });
  });

  it('selects the active shot when active selection becomes available on initialization', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    store.setOptimisticActiveShot('serie-active', 'shot-active');
    store.setFireTrialId('trial-123');
    TestBed.tick();

    expect(fixture.componentInstance['selectorFormModel']()).toEqual({
      serie: 'serie-active',
      disparo: 'shot-active',
    });
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

  it('fetches shot munition data for every newly selected shot', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(mockMunitionResponse);

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'shot-initial' });

    fixture.componentInstance.onDisparoSelected('shot-2');
    fixture.componentInstance.onDisparoSelected('shot-3');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(1, 'trial-123', 'serie-1', 'shot-2');
    expect(fetchSpy).toHaveBeenNthCalledWith(2, 'trial-123', 'serie-1', 'shot-3');
  });

  it('fills missing batch from available warehouse stock matching denomination', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const responseWithoutBatch: ShotMunitionResponse = {
      munitionData: [
        {
          componentId: 'granada-01',
          identificationData: { denominationId: 'den-01', batch: null },
        },
      ],
    };

    const httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue(responseWithoutBatch);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('den-01');
    });

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock
        .match((r) => r.url.includes('/stock'))
        .forEach((req) =>
          req.flush({
            items: [
              { denomination: { id: 'den-other' }, batch: 'LOT-OTHER' },
              { denomination: { id: 'den-01' }, batch: 'LOT-MATCHED' },
              { denomination: { id: 'den-01' }, batch: 'LOT-MATCHED-2' },
            ],
          }),
        );
    }

    const optionValues = fixture.componentInstance
      .identTab()
      ?.filteredLoteOptions()
      .map((option) => option.value);
    expect(optionValues).toEqual(expect.arrayContaining(['LOT-MATCHED', 'LOT-MATCHED-2']));
    expect(store.munitionIntroduction().identificacion.lote).toBeNull();
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

  it('keeps balance options empty across components when no balance equipment is selected', async () => {
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
      expect(fixture.componentInstance.pesosTab()?.balanceOptions()).toEqual([]);
    });

    const granadaOptions = fixture.componentInstance.pesosTab()?.balanceOptions();
    expect(granadaOptions).toEqual([]);

    fixture.componentInstance.onComponentChange('espoleta-01');

    const espoletaOptions = fixture.componentInstance.pesosTab()?.balanceOptions();
    expect(espoletaOptions).toEqual([]);
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
    const httpMock = TestBed.inject(HttpTestingController);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue({ munitionData: [] });

    const flushData = {
      types: [
        { id: 'type-do', name: 'Disparo Organizado', category: 'MUNITION' },
        { id: 'type-esp', name: 'Espoleta', category: 'MUNITION_COMPONENT' },
        { id: 'type-gm', name: 'Granada mortero', category: 'MUNITION' },
      ],
      planning: {
        series: [
          {
            seriesId: 'serie-inicial',
            configurations: [
              {
                id: 'config-do',
                seriesId: 'serie-inicial',
                munitionTypeId: 'type-do',
                denomination: {
                  id: 'denom-do',
                  name: 'Disparo Organizado 155mm',
                  batch: 'LOT-DO-001',
                  clientNumber: 'DO-001',
                },
                components: [
                  {
                    id: 'comp-esp',
                    componentTypeId: 'type-esp',
                    denomination: { id: 'denom-esp', name: 'Espoleta 4AP', batch: 'LOT-ESP-002', clientNumber: '34' },
                  },
                ],
              },
            ],
          },
          {
            seriesId: 'serie-aseguramiento',
            configurations: [
              {
                id: 'config-gm',
                seriesId: 'serie-aseguramiento',
                munitionTypeId: 'type-gm',
                denomination: {
                  id: 'denom-gm',
                  name: 'Granada mortero 81 mm HC',
                  batch: 'LOT-GM-003',
                  clientNumber: 'GM-001',
                },
              },
            ],
          },
        ],
      },
      denominations: [
        { id: 'denom-do', name: 'Disparo Organizado 155mm', componentTypeId: 'type-do' },
        { id: 'denom-esp', name: 'Espoleta 4AP', componentTypeId: 'type-esp' },
        { id: 'denom-gm', name: 'Granada mortero 81 mm HC', componentTypeId: 'type-gm' },
      ],
    };

    store.setFireTrialId('trial-123');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock.match((r) => r.url.includes('/munition-types')).forEach((r) => r.flush({ items: flushData.types }));
      httpMock.match((r) => r.url.includes('planning/munitions')).forEach((r) => r.flush(flushData.planning));
      httpMock
        .match((r) => r.url.includes('/denominations'))
        .forEach((r) => r.flush({ items: flushData.denominations }));
    }

    // 1. Select Serie Inicial: displays 2 components and patches initial component (Disparo Organizado)
    fixture.componentInstance.onSerieSelected('serie-inicial');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
    }

    expect(fixture.componentInstance['componenteOptions']()).toHaveLength(2);
    expect(fixture.componentInstance['componenteOptions']().map((c) => c.label)).toEqual([
      'Disparo Organizado',
      'Espoleta',
    ]);

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

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
    }

    expect(fixture.componentInstance['componenteOptions']()).toHaveLength(1);
    expect(fixture.componentInstance['componenteOptions']()[0].label).toBe('Granada mortero');

    expect(fixture.componentInstance.identTab()?.identFormModel().componente).toBe('type-gm');
    expect(fixture.componentInstance.identTab()?.identFormModel().denominacion).toBe('denom-gm');
    expect(fixture.componentInstance.identTab()?.identFormModel().lote).toBe('LOT-GM-003');
    expect(fixture.componentInstance.identTab()?.numeroClienteField()).toBe('GM-001');
  });

  it('loads and displays all denominations for component when planning specifies component without denomination', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const httpMock = TestBed.inject(HttpTestingController);

    vi.spyOn(execService, 'fetchShotMunition').mockResolvedValue({ munitionData: [] });

    const flushDataUnassigned = {
      types: [{ id: 'type-esp', name: 'Espoleta', category: 'MUNITION_COMPONENT' }],
      planning: {
        series: [
          {
            seriesId: 'serie-unassigned',
            configurations: [
              {
                id: 'config-unassigned',
                seriesId: 'serie-unassigned',
                munitionTypeId: 'type-esp',
              },
            ],
          },
        ],
      },
      denominations: [
        { id: 'denom-wh-1', name: 'Espoleta M578', componentTypeId: 'type-esp' },
        { id: 'denom-wh-2', name: 'Espoleta 4AP', componentTypeId: 'type-esp' },
      ],
    };

    store.setFireTrialId('trial-unassigned-denom');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock
        .match((r) => r.url.includes('/munition-types'))
        .forEach((r) => r.flush({ items: flushDataUnassigned.types }));
      httpMock.match((r) => r.url.includes('planning/munitions')).forEach((r) => r.flush(flushDataUnassigned.planning));
      httpMock
        .match((r) => r.url.includes('/denominations'))
        .forEach((r) => r.flush({ items: flushDataUnassigned.denominations }));
    }

    fixture.componentInstance.onSerieSelected('serie-unassigned');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock
        .match((r) => r.url.includes('/denominations'))
        .forEach((r) => r.flush({ items: flushDataUnassigned.denominations }));
    }

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
    identTab?.identFormModel.update((m) => ({ ...m, denominacion: 'denom-wh-1' }));
    identTab?.onDenominacionChange('denom-wh-1');
    expect(identTab?.identFormModel().denominacion).toBe('denom-wh-1');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock
        .match((r) => r.url.includes('/stock'))
        .forEach((r) =>
          r.flush({
            items: [
              { denomination: { id: 'denom-wh-1' }, batch: 'LOT-WH-1' },
              { denomination: { id: 'denom-wh-1' }, batch: 'LOT-WH-1-2' },
            ],
          }),
        );
    }

    expect(identTab?.filteredLoteOptions().map((o) => o.value)).toEqual(
      expect.arrayContaining(['LOT-WH-1', 'LOT-WH-1-2']),
    );
  });

  it('loads and filters the global warehouse denomination catalog when component has no planning mapping', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.componentInstance.onComponentChange('type-esp');

    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      TestBed.tick();
      httpMock
        .match((r) => r.url.includes('/denominations'))
        .forEach((r) =>
          r.flush({
            items: [
              { id: 'denom-esp-1', name: 'Espoleta M578', componentTypeId: 'type-esp' },
              { id: 'denom-gr-1', name: 'Granada M107', componentTypeId: 'type-gr' },
            ],
          }),
        );
    }

    expect(fixture.componentInstance.identTab()?.filteredDenominacionOptions()).toHaveLength(1);
    expect(store.munitionIntroduction().identificacion.componente).toBe('type-esp');
    expect(
      fixture.componentInstance
        .identTab()
        ?.filteredDenominacionOptions()
        .map((option) => option.value),
    ).toEqual(['denom-esp-1']);
  });
});
