/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { DistanceUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, EquipmentTypeEnum } from '../../models';
import type { ShotManometerPressuresResponse } from '../../models/shot-manometer-pressures.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { ManometerIntroduction } from './manometer-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  registerWidgetInstance: () => {},
  unregisterWidgetInstance: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

const mockManometerResponse: ShotManometerPressuresResponse = {
  manometerPressuresData: [
    {
      pressureGaugeId: 'manometro-PN6-SN001',
      crusherId: 'crusher-cobre-SN101',
      probeId: 'micrometro-SN201',
      h1: 125.4,
      h1Unit: DistanceUnitEnum.UM,
      h2: 126.1,
      h2Unit: DistanceUnitEnum.UM,
      h3: 125.8,
      h3Unit: DistanceUnitEnum.UM,
      h4: 126.0,
      h4Unit: DistanceUnitEnum.UM,
      h5: 125.6,
      h5Unit: DistanceUnitEnum.UM,
      observations: 'Lecturas remotas OK',
    },
    {
      pressureGaugeId: 'manometro-PN10-SN002',
      crusherId: 'crusher-plomo-SN102',
      probeId: 'micrometro-SN202',
      h1: 200,
      h1Unit: DistanceUnitEnum.UM,
      observations: 'Segundo manómetro',
    },
  ],
};

describe('ManometerIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget', customProviders: Provider[] = []) =>
    render(ManometerIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ExecutionService,
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
    const { fixture } = await renderWidget('my-manometer-widget');
    expect(fixture.componentInstance.formState().widgetId).toBe('my-manometer-widget');
  });

  it('updates shot options for each selected series using planned global numbers', async () => {
    const { fixture } = await renderWidget();
    const executionService = TestBed.inject(ExecutionService);
    const http = TestBed.inject(HttpTestingController);

    executionService.getPlanningSeries('trial-123');
    executionService.getExecutionProgress('trial-123');
    TestBed.tick();
    http
      .expectOne((request) => request.url.endsWith('/fire-trials/trial-123/planning/series'))
      .flush([
        {
          id: '7ff24e04-691c-43c9-9b94-ae97e490c6f9',
          name: 'Serie Inicio',
          shots: [
            { id: '630aab68-5cce-4326-86d6-d05cf80dd20f', globalNumber: 1 },
            { id: 'e14c1530-75c8-4393-9127-41d5c5dd84d2', globalNumber: 2 },
            { id: '6d6a6937-2068-4055-a457-cf8ae97b500a', globalNumber: 3 },
          ],
        },
        {
          id: '8b0b70dd-a2a5-46ac-abfb-1d0fb266475c',
          name: 'Serie final',
          shots: [
            { id: '752ecd60-8759-4a18-910b-6cfac18954ce', globalNumber: 4 },
            { id: '5751e1a8-b721-4411-9458-76934c87f0f6', globalNumber: 5 },
            { id: '01dff358-d7a9-4ab1-877e-05dbf4dfeff3', globalNumber: 6 },
            { id: '88c7d672-31c7-4ab2-bfce-9bf947285ace', globalNumber: 7 },
          ],
        },
        {
          id: 'd1148642-146a-49db-af70-f499d162577d',
          name: 'serie 3',
          shots: [
            { id: '56897bb6-c91a-4ba9-b3b9-d0aacdc76db2', globalNumber: 8 },
            { id: 'bd193c60-2076-4c02-a3f8-99a19e8e9e3f', globalNumber: 9 },
          ],
        },
      ]);
    http
      .expectOne((request) => request.url.endsWith('/fire-trials/trial-123/execution/progress'))
      .flush({ series: [] });
    await fixture.whenStable();

    const [serieSelect, shotSelect] = screen.getAllByRole('combobox');
    if (!serieSelect || !shotSelect) throw new Error('Expected serie and shot selectors to be rendered');
    const serieLabels = ['Serie Inicio', 'Serie final', 'serie 3'];
    const expectedShotLabels = [
      ['Disparo 1', 'Disparo 2', 'Disparo 3'],
      ['Disparo 4', 'Disparo 5', 'Disparo 6', 'Disparo 7'],
      ['Disparo 8', 'Disparo 9'],
    ];

    for (let serieIndex = 0; serieIndex < expectedShotLabels.length; serieIndex++) {
      await userEvent.click(serieSelect);
      await userEvent.click(screen.getByRole('option', { name: serieLabels[serieIndex] }));
      await userEvent.click(shotSelect);
      expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(
        expectedShotLabels[serieIndex],
      );
      await userEvent.keyboard('{Escape}');
    }
  });

  it('saveForm persists data to the store and calls ExecutionService', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);
    const updateSpy = vi.spyOn(execService, 'updateShotManometerPressures').mockResolvedValue(mockManometerResponse);

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'funcionamiento-1', disparo: 'disparo-1' });
    fixture.componentInstance['h1Field'].set({ value: '125.4', unit: 'μm' });

    await fixture.componentInstance.saveForm();

    expect(store.manometerIntroduction().h1).toBe(125.4);
    expect(store.manometerIntroduction().serie).toBe('funcionamiento-1');
    expect(store.manometerIntroduction().disparo).toBe('disparo-1');
    expect(updateSpy).toHaveBeenCalledWith('trial-123', 'funcionamiento-1', 'disparo-1', expect.any(Object));
  });

  it('saveForm handles errors gracefully when executionService throws', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'updateShotManometerPressures').mockRejectedValue(new Error('Network error'));

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'funcionamiento-1', disparo: 'disparo-1' });

    await expect(fixture.componentInstance.saveForm()).rejects.toThrow('Network error');
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).manometerIntroduction();
    const expected = stored.h1 !== null ? { value: stored.h1.toString(), unit: stored.h1Unit } : null;
    expect(fixture.componentInstance['h1Field']()).toEqual(expected);
    expect(fixture.componentInstance['selectorFormModel']().serie).toBe(stored.serie);
  });

  it('alturaMedia calculates average accurately or is null when empty', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['h1Field'].set({ value: '100', unit: 'μm' });
    fixture.componentInstance['h2Field'].set({ value: '200', unit: 'μm' });
    fixture.componentInstance['h3Field'].set(null);
    fixture.componentInstance['h4Field'].set(null);
    fixture.componentInstance['h5Field'].set(null);

    expect(fixture.componentInstance['alturaMedia']()).toBe(150);
    expect(fixture.componentInstance['alturaMediaDisplay']()).toBe('150.00');

    fixture.componentInstance['h1Field'].set(null);
    fixture.componentInstance['h2Field'].set(null);
    expect(fixture.componentInstance['alturaMedia']()).toBeNull();
    expect(fixture.componentInstance['alturaMediaDisplay']()).toBe('—');
  });

  it('fetches shot manometer pressures data and applies to form and store', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    vi.spyOn(execService, 'fetchShotManometerPressures').mockResolvedValue(mockManometerResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-2');

    await vi.waitFor(() => {
      expect(execService.fetchShotManometerPressures).toHaveBeenCalledWith(
        'trial-123',
        'funcionamiento-1',
        'disparo-2',
      );
    });

    expect(store.manometerIntroduction().h1).toBe(125.4);
    expect(fixture.componentInstance['h1Field']()).toEqual({ value: '125.4', unit: 'μm' });
  });

  it('setCurrentShot selects active shot from store and triggers load', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);

    vi.spyOn(execService, 'fetchShotManometerPressures').mockResolvedValue(mockManometerResponse);
    store.setFireTrialId('trial-123');

    fixture.componentInstance.setCurrentShot();

    expect(fixture.componentInstance['selectorFormModel']().serie).toBe(store.activeSerieId());
    expect(fixture.componentInstance['selectorFormModel']().disparo).toBe(store.activeShotId());
  });

  it('loads unified equipment options from the equipment categories GET', async () => {
    const catalogSpy = vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.PRESSURE_GAUGE]: [
        { id: '1', label: 'Gauge 1' },
        { id: '4', label: 'Gauge 2' },
        { id: '7', label: 'Gauge 3' },
      ],
      [EquipmentTypeEnum.CRUSHER]: [
        { id: '2', label: 'Crusher 1' },
        { id: '5', label: 'Crusher 2' },
        { id: '8', label: 'Crusher 3' },
      ],
      [EquipmentTypeEnum.PROBE]: [
        { id: '3', label: 'Probe 1' },
        { id: '6', label: 'Probe 2' },
        { id: '9', label: 'Probe 3' },
      ],
      [EquipmentTypeEnum.DOPPLER_RADAR]: [{ id: 'radar-1', label: 'Radar 1' }],
      [EquipmentTypeEnum.ANTENNA]: [{ id: 'antenna-1', label: 'Antenna 1' }],
    });

    const { fixture } = await renderWidget();
    fixture.componentInstance['selectorFormModel'].set({ serie: 'series-1', disparo: 'shot-1' });
    const executionService = TestBed.inject(ExecutionService);
    const http = TestBed.inject(HttpTestingController);
    executionService.getEquipmentSelector('trial-123');
    TestBed.tick();
    http
      .expectOne((request) => request.url.endsWith('/fire-trials/trial-123/execution/equipment-selection'))
      .flush([
        {
          measurementGroup: EquipmentMeasurementGroupEnum.MANOMETER_PRESSURE,
          selections: [
            {
              equipmentItemId: 1,
              categoryId: EquipmentTypeEnum.PRESSURE_GAUGE,
              seriesIds: ['series-1'],
              shotIds: ['shot-1'],
            },
            {
              equipmentItemId: 2,
              categoryId: EquipmentTypeEnum.CRUSHER,
              seriesIds: ['series-1'],
              shotIds: ['shot-1'],
            },
            {
              equipmentItemId: 3,
              categoryId: EquipmentTypeEnum.PROBE,
              seriesIds: ['series-1'],
              shotIds: ['shot-1'],
            },
            {
              equipmentItemId: 4,
              categoryId: EquipmentTypeEnum.PRESSURE_GAUGE,
              seriesIds: ['series-1'],
              shotIds: ['shot-2'],
            },
            {
              equipmentItemId: 5,
              categoryId: EquipmentTypeEnum.CRUSHER,
              seriesIds: ['series-1'],
              shotIds: ['shot-2'],
            },
            {
              equipmentItemId: 6,
              categoryId: EquipmentTypeEnum.PROBE,
              seriesIds: ['series-1'],
              shotIds: ['shot-2'],
            },
            {
              equipmentItemId: 7,
              categoryId: EquipmentTypeEnum.PRESSURE_GAUGE,
              seriesIds: ['series-2'],
              shotIds: ['shot-3'],
            },
            {
              equipmentItemId: 8,
              categoryId: EquipmentTypeEnum.CRUSHER,
              seriesIds: ['series-2'],
              shotIds: ['shot-3'],
            },
            {
              equipmentItemId: 9,
              categoryId: EquipmentTypeEnum.PROBE,
              seriesIds: ['series-2'],
              shotIds: ['shot-3'],
            },
          ],
        },
        {
          measurementGroup: EquipmentMeasurementGroupEnum.INITIAL_VELOCITY,
          selections: [
            {
              equipmentItemId: 4,
              categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
              seriesIds: ['series-1'],
              shotIds: ['shot-1'],
            },
            {
              equipmentItemId: 5,
              categoryId: EquipmentTypeEnum.ANTENNA,
              seriesIds: ['series-1'],
              shotIds: ['shot-1'],
            },
          ],
        },
      ]);
    await fixture.whenStable();

    expect(fixture.componentInstance['equipmentOptions']()).toEqual([
      {
        value: JSON.stringify(['1', '2', '3']),
        manometroLabel: 'Gauge 1',
        crusherLabel: 'Crusher 1',
        micrometroPalpadorLabel: 'Probe 1',
      },
    ]);
    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onDisparoSelected('shot-2');
    expect(fixture.componentInstance['equipmentOptions']()).toEqual([
      {
        value: JSON.stringify(['4', '5', '6']),
        manometroLabel: 'Gauge 2',
        crusherLabel: 'Crusher 2',
        micrometroPalpadorLabel: 'Probe 2',
      },
    ]);
    fixture.componentInstance.onSerieSelected('series-2');
    fixture.componentInstance.onDisparoSelected('shot-3');
    expect(fixture.componentInstance['equipmentOptions']()).toEqual([
      {
        value: JSON.stringify(['7', '8', '9']),
        manometroLabel: 'Gauge 3',
        crusherLabel: 'Crusher 3',
        micrometroPalpadorLabel: 'Probe 3',
      },
    ]);
    expect(catalogSpy).toHaveBeenCalledWith([
      EquipmentTypeEnum.PRESSURE_GAUGE,
      EquipmentTypeEnum.CRUSHER,
      EquipmentTypeEnum.PROBE,
    ]);
  });

  it('does not show equipment options or stale selections when the GET is empty', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({});

    const { fixture } = await renderWidget();
    fixture.componentInstance['dataFormModel'].set({
      manometro: 'missing-gauge',
      crusher: 'missing-crusher',
      micrometroPalpador: 'missing-probe',
    });
    await fixture.whenStable();

    expect(fixture.componentInstance['equipmentOptions']()).toEqual([]);
    expect(fixture.componentInstance['selectedEquipmentValue']()).toBeNull();
  });

  it('stores unified equipment selection in its matching categories', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const manometerId = 'manometro-PN6-SN001';
    store.setManometerPressures([{ pressureGaugeId: manometerId }]);
    fixture.componentInstance['dataFormModel'].set({
      manometro: manometerId,
      crusher: null,
      micrometroPalpador: null,
    });

    fixture.componentInstance.onEquipmentSelectionChanged(
      JSON.stringify([manometerId, 'crusher-cobre-SN101', 'micrometro-SN201']),
    );

    expect(fixture.componentInstance['dataFormModel']()).toEqual({
      manometro: manometerId,
      crusher: 'crusher-cobre-SN101',
      micrometroPalpador: 'micrometro-SN201',
    });
  });

  it('switches form data when another manometer is selected', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.setManometerPressures(mockManometerResponse.manometerPressuresData ?? []);

    fixture.componentInstance.onEquipmentSelectionChanged(
      JSON.stringify(['manometro-PN10-SN002', 'crusher-plomo-SN102', 'micrometro-SN202']),
    );

    expect(fixture.componentInstance['h1Field']()).toEqual({ value: '200', unit: 'μm' });
    expect(fixture.componentInstance['dataFormModel']()).toMatchObject({
      manometro: 'manometro-PN10-SN002',
      crusher: 'crusher-plomo-SN102',
      micrometroPalpador: 'micrometro-SN202',
    });
  });

  it('keeps height input changes in the selected manometer draft', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const gaugeId = 'manometro-PN6-SN001';
    store.setManometerPressures([{ pressureGaugeId: gaugeId }]);
    fixture.componentInstance['dataFormModel'].set({
      manometro: gaugeId,
      crusher: null,
      micrometroPalpador: null,
    });

    const input = document.createElement('input');
    input.value = '321.5';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });
    fixture.componentInstance.onHeightInput('h1', event);

    expect(store.manometerIntroduction().manometerPressures).toContainEqual(
      expect.objectContaining({ pressureGaugeId: gaugeId, h1: 321.5 }),
    );
  });
});
