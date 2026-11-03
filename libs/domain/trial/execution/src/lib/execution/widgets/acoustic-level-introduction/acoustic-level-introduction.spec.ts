/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, EquipmentTypeEnum } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { AcousticLevelIntroduction } from './acoustic-level-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('AcousticLevelIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(AcousticLevelIntroduction, {
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

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm persists data to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.acousticLevelIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).acousticLevelIntroduction();
    expect(fixture.componentInstance['observacionesField']()).toBe(stored.observaciones);
  });

  it('calls fetchShotAcousticLevel on selection when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotAcousticLevel').mockResolvedValue({
      acousticLevelData: {
        soundLevelMeterId: 'sonometro-1',
        acousticLevel: 110.5,
      },
    });

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1');
    });
  });

  it('equipoOptions is empty by default when equipment-selection has no items', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['equipoOptions']()).toEqual([]);
  });

  it('equipoOptions reflects SOUND_LEVEL_METER from equipmentSelectorResource', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.SOUND_LEVEL_METER]: [{ id: '5001', label: 'Norsonic 140 / SOM-001' }],
    });

    const { fixture } = await renderWidget();
    TestBed.inject(ExecutionService).equipmentSelectorResource.set([
      {
        measurementGroup: EquipmentMeasurementGroupEnum.SOUND,
        selections: [
          {
            equipmentItemId: 5001,
            categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
          },
        ],
      },
    ]);
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(fixture.componentInstance['equipoOptions']()).toEqual([
        { value: '5001', label: 'Norsonic 140 / SOM-001' },
      ]);
    });
  });

  it('updates observaciones when onObservacionesInput is triggered', async () => {
    const { fixture } = await renderWidget();
    const event = {
      target: { value: 'New observation' } as unknown as HTMLTextAreaElement,
    } as unknown as Event;

    fixture.componentInstance.onObservacionesInput(event);
    expect(fixture.componentInstance['observacionesField']()).toBe('New observation');
  });
});
