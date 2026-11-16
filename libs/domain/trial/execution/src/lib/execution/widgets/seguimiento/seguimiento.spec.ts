import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { PlanningMeasuresService } from '@intaqalab/data-access-planning';
import { MeasureUnitEnum } from '@intaqalab/models';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionStateService } from '../../../data-access';
import { WidgetId } from '../../models/widget-id.enum';
import { WidgetStateService } from '../../services/widget-state.service';
import { SeguimientoWidget } from './seguimiento';

describe('SeguimientoWidget', () => {
  const renderWidget = (widgetId = 'test-seguimiento') =>
    render(SeguimientoWidget, {
      inputs: { widgetId },
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        WidgetStateService,
        ExecutionStore,
        provideTranslateService(),
      ],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(
      screen.getByRole('heading', { level: 3, name: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TITLE' }),
    ).toBeInTheDocument();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-seguimiento');
  });

  it('does not track or save preference changes during general save', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance;
    const widgetState = TestBed.inject(WidgetStateService);
    const store = TestBed.inject(ExecutionStore);
    const saveFormSpy = vi.spyOn(component, 'saveForm');

    component['formModel'].set({ presionVelocidadUnit: 'BAR', pesosUnit: 'kg' });
    component['setActiveTab']('p-pz-cie');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(store.seguimiento()).toMatchObject({
      presionVelocidadUnit: 'MPa',
      pesosUnit: 'g',
      activeTab: 'p-manom',
    });
    expect(component.formState()).toMatchObject({ dirty: false, hasChanges: false });
    expect(widgetState.dirtyWidgets()).toEqual([]);
    expect(widgetState.hasUnsavedChanges()).toBe(false);

    widgetState.updateWidgetFormState('other-widget', {
      widgetId: 'other-widget',
      dirty: true,
      touched: true,
      valid: true,
      hasChanges: true,
    });
    expect(widgetState.hasUnsavedChanges()).toBe(true);

    await widgetState.saveAllDirtyForms();
    expect(saveFormSpy).not.toHaveBeenCalled();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].set({ presionVelocidadUnit: 'bar', pesosUnit: 'kg' });
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).seguimiento();
    expect(fixture.componentInstance['formModel']().presionVelocidadUnit).toBe(stored.presionVelocidadUnit);
    expect(fixture.componentInstance['formModel']().pesosUnit).toBe(stored.pesosUnit);
  });

  it('setActiveTab updates the active tab signal', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-manom');
    expect(fixture.componentInstance['activeTab']()).toBe('p-manom');
  });

  it('columns computed returns correct columns for velocidades tab', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('velocidades');
    const cols = fixture.componentInstance['columns']();
    expect(cols.some((c) => c.label === 'V01')).toBe(true);
    expect(cols.some((c) => c.label === 'V0c')).toBe(true);
    expect(cols.some((c) => c.label === 'Wc/g')).toBe(true);
  });

  it('columns computed returns pressure columns for p-manom tab', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-manom');
    const cols = fixture.componentInstance['columns']();
    expect(cols.some((c) => c.label === 'P1')).toBe(true);
    expect(cols.some((c) => c.label === 'P̄')).toBe(true);
  });

  it('tableData computed returns series with precomputed rows', async () => {
    const { fixture } = await renderWidget();
    const tableData = fixture.componentInstance['tableData']();
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0].computedRows.length).toBeGreaterThan(0);
    expect(tableData[0].computedRows[0].cells.length).toBeGreaterThan(0);
  });

  it('shows OTHER piezo pressure as the IPG column', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-ipg');
    const cols = fixture.componentInstance['columns']();

    expect(cols.some((column) => column.key === 'pmax_other_0')).toBe(true);
  });

  it('shows OTHER piezo pressure as the P Otro column', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-otro');
    const cols = fixture.componentInstance['columns']();

    expect(cols.some((column) => column.key === 'pmax_other_0')).toBe(true);
  });

  it('has no tab or unit options before measurements are available', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.tabOptions()).toEqual([]);
    expect(fixture.componentInstance.presionUnits()).toEqual([]);
  });

  it('disables the pressure unit selector unless multiple units are available', async () => {
    const { fixture } = await renderWidget();
    const resource = TestBed.inject(PlanningMeasuresService).measuresResource;
    const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);

    expect(await selects[1].isDisabled()).toBe(true);
    for (const units of [[MeasureUnitEnum.BAR], [MeasureUnitEnum.BAR, MeasureUnitEnum.MPA], []]) {
      resource.set({
        series: [
          {
            seriesId: 'series-1',
            measures: {
              topographyMeasures: [],
              armamentMeasures: [],
              ballisticsMeasures: [],
              munitionsMeasures: units.map((measureUnit, index) => ({
                id: `pressure-${index}`,
                name: '',
                magnitudeCode: 'MUNITION_MANOMETER_AP_MAX',
                measureUnit,
              })),
            },
          },
        ],
      });
      fixture.detectChanges();

      expect(await selects[1].isDisabled()).toBe(units.length <= 1);
      expect(await selects[2].isDisabled()).toBe(false);
    }
  });

  it('updates tabs and selected unit from planned magnitudes and keeps selections valid after reload', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance;
    const resource = TestBed.inject(PlanningMeasuresService).measuresResource;
    resource.set({
      series: [
        {
          seriesId: 'series-1',
          measures: {
            topographyMeasures: [],
            armamentMeasures: [],
            ballisticsMeasures: [],
            munitionsMeasures: [
              {
                id: 'closing',
                name: '',
                magnitudeCode: 'MUNITION_PIEZO_CLOSING_MAX',
                measureUnit: MeasureUnitEnum.BAR,
              },
              { id: 'half', name: '', magnitudeCode: 'MUNITION_PIEZO_HALF_MAX', measureUnit: MeasureUnitEnum.MPA },
            ],
          },
        },
      ],
    });
    fixture.detectChanges();

    expect(component.tabOptions()).toEqual(['p-pz-cie', 'p-pz-int']);
    expect(component['activeTab']()).toBe('p-pz-cie');
    expect(component.presionUnits()).toEqual(['BAR']);
    expect(component['formModel']().presionVelocidadUnit).toBe('BAR');

    const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
    expect(await selects[1].getValueText()).toBe('bar');

    component['setActiveTab']('p-pz-int');
    fixture.detectChanges();
    expect(component.presionUnits()).toEqual(['MPA']);
    expect(component['formModel']().presionVelocidadUnit).toBe('MPA');
    expect(await selects[1].getValueText()).toBe('MPa');

    resource.set({
      series: [
        {
          seriesId: 'series-2',
          measures: {
            topographyMeasures: [],
            armamentMeasures: [],
            ballisticsMeasures: [],
            munitionsMeasures: [
              { id: 'shell', name: '', magnitudeCode: 'MUNITION_PIEZO_SHELL_MAX', measureUnit: MeasureUnitEnum.BAR },
            ],
          },
        },
      ],
    });
    fixture.detectChanges();
    expect(component.tabOptions()).toEqual(['p-pz-cul']);
    expect(component['activeTab']()).toBe('p-pz-cul');
    expect(component['formModel']().presionVelocidadUnit).toBe('BAR');
  });

  it('tabLabelKey returns correct i18n key for each tab', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['tabLabelKey']('p-pz-cie')).toBe(
      'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_PZ_CIE',
    );
    expect(fixture.componentInstance['tabLabelKey']('p-otro')).toBe('TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_OTRO');
  });

  it('registers as autonomous widget and ignores subsequent activeSerieId updates', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    expect(store.isWidgetAutonomous(WidgetId.SEGUIMIENTO)).toBe(true);

    store.setOptimisticActiveShot('funcionamiento-1', 'shot-1');
    fixture.detectChanges();
    expect(fixture.componentInstance['activeSerieId']()).toBe('funcionamiento-1');

    store.setOptimisticActiveShot('funcionamiento-2', 'shot-2');
    fixture.detectChanges();
    expect(fixture.componentInstance['activeSerieId']()).toBe('funcionamiento-1');
  });

  it('calls getShotMeasurements and reloads shotMeasurementsResource when reload is invoked or reload button clicked', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionStateService);
    const store = TestBed.inject(ExecutionStore);
    const httpTesting = TestBed.inject(HttpTestingController);

    store.setFireTrialId('trial-abc');
    fixture.detectChanges();

    const initialReq = httpTesting.expectOne((req) => req.url.includes('/shot-measurements'));
    initialReq.flush({ series: [] });
    await Promise.resolve();
    fixture.detectChanges();

    const getSpy = vi.spyOn(service, 'getShotMeasurements');
    const reloadSpy = vi.spyOn(service.shotMeasurementsResource, 'reload');

    const reloadButton = screen.getByRole('button', {
      name: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RELOAD',
    });
    expect(reloadButton).toBeInTheDocument();
    await waitFor(() => {
      fixture.detectChanges();
      expect(reloadButton).toBeEnabled();
    });

    reloadButton.click();
    fixture.detectChanges();

    expect(getSpy).toHaveBeenCalledWith('trial-abc');
    expect(reloadSpy).toHaveBeenCalled();

    const reloadReq = httpTesting.expectOne((req) => req.url.includes('/shot-measurements'));
    reloadReq.flush({ series: [] });
  });
});
