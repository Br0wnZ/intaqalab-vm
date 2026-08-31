/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { DistanceUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
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
  manometerPressuresData: {
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
});
