/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AngleUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { JltMao } from './jlt-mao';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('JltMao', () => {
  const renderWidget = (widgetId = 'test-jlt-mao') =>
    render(JltMao, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-jlt-mao');
  });

  it('saveForm persists data to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.jltMao()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).jltMao();
    // After reset, serie should match the store
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
  });

  it('calls fetchShotJltMao on load when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotJltMao').mockResolvedValue({
      jltMaoData: {
        numericFiringTable: 'TTN-123',
        theoreticalInitialVelocity: 850,
      },
    });

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1');
    });
  });

  it('makes OLT read-only and clears OLT when a stake is selected', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance;

    component.onOltChanged({ value: '120', unit: 'oo' });
    expect(component['piquetaDisabled']()).toBe(true);
    expect(component['angularDifferenceReadOnly']()).toBe(true);

    component.onOltChanged(null);
    component.onPiquetaSelected('piq-01');

    expect(component['oltField']()).toBeNull();
    expect(component['oltReadOnly']()).toBe(true);
    expect(component['angularDifferenceReadOnly']()).toBe(false);
  });

  it('uses planned OLT and calculates read-only angular difference', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance;
    const service = TestBed.inject(ExecutionService);
    const httpMock = TestBed.inject(HttpTestingController);

    component.onSerieSelected('series-1');
    component.onDisparoSelected('shot-1');
    service.getPlanningConditions('trial-123');
    TestBed.tick();

    const request = httpMock.expectOne((req) => req.url.endsWith('/fire-trials/trial-123/planning/conditions'));
    request.flush({
      units: { orientation: AngleUnitEnum.DEGREES },
      series: [
        {
          seriesId: 'series-1',
          shots: [{ shotId: 'shot-1', orientation: 15 }],
        },
      ],
    });

    await vi.waitFor(() => expect(component['plannedOlt']()).toBeCloseTo(266.667, 3));
    expect(component['piquetaDisabled']()).toBe(true);
    expect(component['angularDifferenceReadOnly']()).toBe(true);
    expect(component['calculatedAngularDifference']()).toBe(0);
  });
});
