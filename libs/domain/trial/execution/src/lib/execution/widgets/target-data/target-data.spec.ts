/* eslint-disable @typescript-eslint/no-empty-function */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import {
  type PlanningTargetConditionsResponse,
  PlanningTargetConditionsService,
  PlanningTrialContextService,
} from '@intaqalab/data-access-planning';
import { AngleUnitEnum, DistanceUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { TargetDataWidget } from './target-data';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TargetDataWidget', () => {
  const renderWidget = (widgetId = 'test-widget', targetConditions?: PlanningTargetConditionsResponse) =>
    render(TargetDataWidget, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        {
          provide: PlanningTargetConditionsService,
          useValue: {
            targetConditionsResource: {
              value: () => targetConditions,
              hasValue: () => targetConditions !== undefined,
            },
          },
        },
        PlanningTrialContextService,
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('disables all planning output fields', async () => {
    const { fixture } = await renderWidget();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    const unitSelectors = await loader.getAllHarnesses(
      MatSelectHarness.with({ selector: 'ui-input-select mat-select' }),
    );

    expect(inputs).toHaveLength(3);
    expect(unitSelectors).toHaveLength(3);
    for (const input of inputs) expect(await input.isDisabled()).toBe(true);
    for (const selector of unitSelectors) expect(await selector.isDisabled()).toBe(true);
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
    expect(store.targetData()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).targetData();
    expect(fixture.componentInstance['formModel']().blanco).toBe(stored.blanco);
    expect(fixture.componentInstance['formModel']().material).toBe(stored.material);
    expect(fixture.componentInstance['serieModel']()).toBe(stored.serie);
  });

  it('hides both selectors when target data is shared across series and shots', async () => {
    const targetConditions: PlanningTargetConditionsResponse = {
      sameForAllSeries: true,
      series: [{ seriesId: 'serie-1', sameForAllShots: false, shots: [] }],
    };
    const { fixture } = await renderWidget('test-widget', targetConditions);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(
      await loader.getAllHarnesses(MatSelectHarness.with({ selector: '#target-data-series-selector' })),
    ).toHaveLength(0);
    expect(
      await loader.getAllHarnesses(MatSelectHarness.with({ selector: '#target-data-shot-selector' })),
    ).toHaveLength(0);
  });

  it('hides only the shot selector when selected series shares target data across shots', async () => {
    const targetConditions: PlanningTargetConditionsResponse = {
      sameForAllSeries: false,
      series: [{ seriesId: 'serie-1', sameForAllShots: true, shots: [] }],
    };
    const { fixture } = await renderWidget('test-widget', targetConditions);
    fixture.componentInstance['serieModel'].set('serie-1');
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(
      await loader.getAllHarnesses(MatSelectHarness.with({ selector: '#target-data-series-selector' })),
    ).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(MatSelectHarness.with({ selector: '#target-data-shot-selector' })),
    ).toHaveLength(0);
  });

  it('maps target conditions for selected shots into the store', async () => {
    const targetConditions: PlanningTargetConditionsResponse = {
      sameForAllSeries: false,
      series: [
        {
          seriesId: 'serie-1',
          sameForAllShots: false,
          shots: [
            {
              shotId: 'shot-1',
              targetConditionsData: {
                targetTypeId: 'type-1',
                targetTypeLabel: 'Fixed target',
                targetMaterialId: 'material-1',
                targetMaterialLabel: 'Steel',
                targetDimensionsId: 'dimension-1',
                targetDimensionsLabel: '50 x 100 cm',
                targetThicknessId: 'thickness-1',
                targetThicknessName: '5 mm',
                distance: 125,
                distanceUnit: DistanceUnitEnum.M,
                targetInclination: 12,
                targetInclinationUnit: AngleUnitEnum.DEGREES,
              },
            },
            {
              shotId: 'shot-2',
              targetConditionsData: {
                targetTypeId: 'type-2',
                targetTypeLabel: 'Moving target',
                targetMaterialId: 'material-2',
                targetMaterialLabel: 'Concrete',
                targetDimensionsId: 'dimension-2',
                targetDimensionsLabel: '75 x 150 cm',
                targetThicknessId: 'thickness-2',
                targetThicknessName: '10 mm',
                distance: 150,
                distanceUnit: DistanceUnitEnum.M,
                targetInclination: 20,
                targetInclinationUnit: AngleUnitEnum.DEGREES,
              },
            },
          ],
        },
      ],
    };
    const { fixture } = await renderWidget('test-widget', targetConditions);
    const store = TestBed.inject(ExecutionStore);
    const widget = fixture.componentInstance;
    widget['serieModel'].set('serie-1');
    widget['disparoModel'].set('shot-1');
    TestBed.tick();
    fixture.detectChanges();

    expect(store.targetData().blanco).toBe('type-1');
    expect(store.targetData().material).toBe('material-1');
    expect(store.targetData().distancia).toBe(125);
    expect(store.targetData().sameDataAcrossDisparos).toBe(false);
    expect(widget['blancoLabel']()).toBe('Fixed target');
    expect(widget['materialLabel']()).toBe('Steel');

    widget.onDisparoSelected('shot-2');
    TestBed.tick();
    fixture.detectChanges();

    expect(store.targetData().blanco).toBe('type-2');
    expect(store.targetData().distancia).toBe(150);
    expect(widget['blancoLabel']()).toBe('Moving target');
  });
});
