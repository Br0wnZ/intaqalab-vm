/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { IpgPressureMeasurements } from './ipg-pressure-measurements';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ui-inta-icon',
  template: '',
})
class MockIntaIconComponent {
  readonly name = input<string>('');
  readonly color = input<string>();
}

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  registerWidgetInstance: () => {},
  unregisterWidgetInstance: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('IpgPressureMeasurements', () => {
  beforeEach(() => {
    TestBed.overrideComponent(IpgPressureMeasurements, {
      remove: { imports: [IntaIconComponent] },
      add: { imports: [MockIntaIconComponent] },
    });
  });

  const renderWidget = (widgetId = 'medidas-presion-ipg') =>
    render(IpgPressureMeasurements, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ExecutionService,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('medidas-presion-ipg');
  });

  it('saveForm persists data to the store and calls updateShotIpgPressures', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const execService = TestBed.inject(ExecutionService);

    store.setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'shot-1' });

    const updateSpy = vi.spyOn(execService, 'updateShotIpgPressures').mockResolvedValue({
      ipgPressuresData: [
        {
          ipgSensorId: 21081,
          micromoduleId: 21082,
          maxPressure: 3200.5,
          observations: 'Test observation',
        },
      ],
    });

    fixture.componentInstance['dataFormModel'].set({
      sensorIpg: '21081',
      micromodulo: '21082',
      pmax: 3200.5,
      observaciones: 'Test observation',
    });

    await fixture.componentInstance.saveForm();

    expect(updateSpy).toHaveBeenCalledWith(
      'trial-123',
      'serie-1',
      'shot-1',
      expect.objectContaining({
        ipgPressuresData: [
          expect.objectContaining({
            ipgSensorId: 21081,
            micromoduleId: 21082,
            maxPressure: 3200.5,
            observations: 'Test observation',
          }),
        ],
      }),
    );
    expect(store.medidasPresionIpg().pmax).toBe(3200.5);
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    store.updateIpgPressureMeasurements({
      sensorIpg: '21083',
      micromodulo: '21084',
      pmax: 2950,
      observaciones: 'Restored obs',
    });

    fixture.componentInstance.resetForm();

    const currentModel = fixture.componentInstance['dataFormModel']();
    expect(currentModel.sensorIpg).toBe('21083');
    expect(currentModel.micromodulo).toBe('21084');
    expect(currentModel.pmax).toBe(2950);
    expect(currentModel.observaciones).toBe('Restored obs');
  });

  it('calls fetchShotIpgPressures on selection when fireTrialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    const fetchSpy = vi.spyOn(execService, 'fetchShotIpgPressures').mockResolvedValue({
      ipgPressuresData: [
        {
          ipgSensorId: 21081,
          micromoduleId: 21082,
          maxPressure: 3100,
          observations: 'Remote notes',
        },
      ],
    });

    store.setFireTrialId('trial-abc');
    fixture.componentInstance.onSerieSelected('serie-1');
    fixture.componentInstance.onDisparoSelected('shot-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-abc', 'serie-1', 'shot-1');
    });

    const currentModel = fixture.componentInstance['dataFormModel']();
    expect(currentModel.sensorIpg).toBe('21081');
    expect(currentModel.micromodulo).toBe('21082');
    expect(currentModel.pmax).toBe(3100);
    expect(currentModel.observaciones).toBe('Remote notes');
  });

  it('setCurrentShot selects activeSerieId and activeShotId', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    store.setOptimisticActiveShot('serie-active', 'shot-active');

    fixture.componentInstance.setCurrentShot();

    expect(fixture.componentInstance['selectorFormModel']().serie).toBe('serie-active');
    expect(fixture.componentInstance['selectorFormModel']().disparo).toBe('shot-active');
  });

  it('marks dirty when form fields are modified', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);

    fixture.componentInstance['dataFormModel'].update((m) => ({ ...m, pmax: 3500 }));
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('computes estadoClass and estadoLabel properly', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    store.setOptimisticActiveShot('serie-1', 'shot-1');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'shot-1' });

    expect(fixture.componentInstance['estadoLabel']()).toBe('En curso');
    expect(fixture.componentInstance['estadoClass']()).toBe('bg-green-100 text-green-700');
  });
});
