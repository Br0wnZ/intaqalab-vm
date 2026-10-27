/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { EquipmentTypeEnum } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { TopographyIntroductionWidget } from './topography-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TopographyIntroductionWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  const renderWidget = (widgetId = 'test-widget') =>
    render(TopographyIntroductionWidget, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('only offers chronometers returned by equipment selection and removes duplicates', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.CHRONOMETER]: [
        { id: '101', label: 'Assigned chronometer' },
        { id: '102', label: 'Unassigned chronometer' },
      ],
    });
    const { fixture } = await renderWidget();
    TestBed.inject(ExecutionService).equipmentSelectorResource.set([
      {
        measurementGroup: 'TIME',
        selections: [
          { categoryId: EquipmentTypeEnum.CHRONOMETER, equipmentItemId: 101 },
          { categoryId: EquipmentTypeEnum.CHRONOMETER, equipmentItemId: 101 },
          { categoryId: EquipmentTypeEnum.BALANCE, equipmentItemId: 103 },
        ],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance['equipoOptions']()).toEqual([{ value: '101', label: 'Assigned chronometer' }]);
  });

  it('does not offer catalog or stored equipment when equipment selection is empty', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.CHRONOMETER]: [{ id: '101', label: 'Catalog chronometer' }],
    });
    const { fixture } = await renderWidget();
    TestBed.inject(ExecutionStore).updateTopographyIntroduction({
      equipoOptions: [{ value: 'legacy', label: 'Stored chronometer' }],
    });
    TestBed.inject(ExecutionService).equipmentSelectorResource.set([]);
    fixture.detectChanges();

    expect(fixture.componentInstance['equipoOptions']()).toEqual([]);
  });

  it('offers no equipment when selection contains no chronometers', async () => {
    const { fixture } = await renderWidget();
    TestBed.inject(ExecutionService).equipmentSelectorResource.set([
      {
        measurementGroup: 'WEIGHT',
        selections: [{ categoryId: EquipmentTypeEnum.BALANCE, equipmentItemId: 103 }],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance['equipoOptions']()).toEqual([]);
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('allows typing a flight time and keeps its value after blur', async () => {
    const user = userEvent.setup();
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onDisparoSelected('shot-1');
    fixture.detectChanges();

    const flightTime = screen.getByRole('textbox', {
      name: 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.TIEMPO_VUELO_LABEL',
    });

    await user.clear(flightTime);
    await user.type(flightTime, '12');
    await user.tab();

    expect(flightTime).toHaveValue('12');
    expect(fixture.componentInstance['tiempoVueloField']()).toEqual({ value: 12, unit: 's' });
  });

  it('saveForm persists data to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onDisparoSelected('shot-1');
    fixture.detectChanges();

    fixture.componentInstance['tiempoVueloField'].set({ value: 12.5, unit: 's' });
    await fixture.componentInstance.saveForm();
    expect(store.topographyIntroduction().tiempoVuelo).toBe(12.5);
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).topographyIntroduction();
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
    expect(fixture.componentInstance['formModel']().equipo).toBe(stored.equipo);
  });

  it('setCurrentShot copies activeSerieId/activeShotId from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.setCurrentShot();
    expect(fixture.componentInstance['formModel']().serie).toBeNull();
    expect(fixture.componentInstance['formModel']().disparo).toBeNull();
  });

  it('calls fetchShotTopography on selection when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotTopography').mockResolvedValue({
      topographyData: {
        chronometerId: 'chrono-1',
        flightTime: 12.5,
      },
    });

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1');
    });
  });
});
