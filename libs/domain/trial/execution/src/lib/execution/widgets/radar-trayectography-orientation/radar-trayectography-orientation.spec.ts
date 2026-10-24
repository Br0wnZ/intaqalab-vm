import { manualChangeDetection } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { LOCALE_SIGNAL } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import type { TrajectographyRadarOrientationResponse } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { RadarTrayectographyOrientation } from './radar-trayectography-orientation';

const mockWidgetStateService = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateWidgetFormState: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addWidget: () => {},

  placedWidgets: () => [],
};

describe('RadarTrayectographyOrientation', () => {
  const renderWidget = (widgetId = 'test-radar-widget') =>
    render(RadarTrayectographyOrientation, {
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
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('hides series and shot selectors when response flags indicate shared values', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionService);
    const http = TestBed.inject(HttpTestingController);
    service.getRadarTrayectographyOrientation('trial-1', null);
    TestBed.tick();

    const request = http.expectOne((req) => req.url.endsWith('/execution/trajectography-radar/orientation'));
    const response = createOrientationResponse(true, true);
    request.flush(response);
    await waitFor(() => {
      TestBed.tick();
      expect(service.radarTrayectographyOrientationResource.value()).toEqual(response);
    });
    fixture.detectChanges();

    expect(within(screen.getByTestId('radar-filters')).getAllByRole('combobox')).toHaveLength(1);
  });

  it('shows selectors and preserves decimal values when readonly fields receive focus', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionService);
    const http = TestBed.inject(HttpTestingController);
    service.getRadarTrayectographyOrientation('trial-1', null);
    TestBed.tick();

    const request = http.expectOne((req) => req.url.endsWith('/execution/trajectography-radar/orientation'));
    const response = createOrientationResponse(false, false);
    request.flush(response);
    await waitFor(() => {
      TestBed.tick();
      expect(service.radarTrayectographyOrientationResource.value()).toEqual(response);
    });
    fixture.detectChanges();

    expect(within(screen.getByTestId('radar-filters')).getAllByRole('combobox')).toHaveLength(3);
    const xPieza = screen.getByRole('textbox', { name: /X_PIEZA_LABEL/ });
    expect(xPieza).toHaveValue('10');
    expect(xPieza).toBeDisabled();
    xPieza.focus();
    expect(xPieza).toHaveValue('10');
  });

  it('renders backend precision, thousands and measurement units without changing values', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionService);
    const http = TestBed.inject(HttpTestingController);
    const response = createOrientationResponse(false, true);
    const data = response.series[0]?.shots[0]?.orientationData;
    if (!data) throw new Error('Expected orientation data');
    Object.assign(data, {
      pieceX: null,
      plannedImpactDistance: 12345.678,
      theoreticalInitialVelocity: 115.125,
      theoreticalFlightTime: 400.375,
      fuseGraduation: 50.625,
      shootingAngle: 15.875,
      shootingAngleUnit: 'MILS',
      nominalProjectileWeight: 47.125,
    });
    const secondSeriesShot = response.series[1]?.shots[0];
    if (!secondSeriesShot) throw new Error('Expected second series shot');
    secondSeriesShot.orientationData = {
      ...secondSeriesShot.orientationData,
      pieceX: 0,
      pieceXUnit: 'MM',
      plannedImpactDistance: null,
      theoreticalInitialVelocity: null,
      theoreticalFlightTime: null,
      fuseGraduation: 50.125,
      shootingAngle: null,
    };
    service.getRadarTrayectographyOrientation('trial-1', null);
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/execution/trajectography-radar/orientation')).flush(response);
    await waitFor(() => {
      TestBed.tick();
      expect(service.radarTrayectographyOrientationResource.value()).toEqual(response);
    });
    fixture.detectChanges();

    const formatter = new Intl.NumberFormat(TestBed.inject(LOCALE_SIGNAL)(), { maximumFractionDigits: 3 });
    for (const [label, value] of [
      ['ALCANCE_PREVISTO_LABEL', 12345.678],
      ['VELOCIDAD_INICIAL_LABEL', 115.125],
      ['TIEMPO_VUELO_LABEL', 400.375],
      ['GRAD_ESPOLETA_LABEL', 50.625],
      ['ANGULO_TIRO_LABEL', 15.875],
      ['PESO_PROYECTIL_LABEL', 47.125],
    ] as const) {
      expect(screen.getByRole('textbox', { name: new RegExp(label) })).toHaveValue(formatter.format(value));
    }
    expect(screen.getByRole('textbox', { name: /X_PIEZA_LABEL/ })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'mil', exact: true })).toHaveTextContent('mil');
    expect(screen.getByRole('combobox', { name: 'kg', exact: true })).toHaveTextContent('kg');

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const user = userEvent.setup();
    await manualChangeDetection(async () => {
      const [seriesSelect] = await loader.getAllHarnesses(MatSelectHarness);
      if (!seriesSelect) throw new Error('Expected series selector');
      await seriesSelect.open();
      fixture.detectChanges();
      const [, secondSeriesOption] = screen.getAllByRole('option');
      if (!secondSeriesOption) throw new Error('Expected second series option');
      await user.click(secondSeriesOption);
      fixture.detectChanges();
    });

    expect(screen.getByRole('textbox', { name: /X_PIEZA_LABEL/ })).toHaveValue('0');
    expect(screen.getByRole('textbox', { name: /ALCANCE_PREVISTO_LABEL/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /VELOCIDAD_INICIAL_LABEL/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /TIEMPO_VUELO_LABEL/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /ANGULO_TIRO_LABEL/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /GRAD_ESPOLETA_LABEL/ })).toHaveValue(formatter.format(50.125));
    expect(screen.getByRole('combobox', { name: 'mm', exact: true })).toHaveTextContent('mm');
    expect(screen.getByRole('combobox', { name: 'kg', exact: true })).toHaveTextContent('kg');
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    const state = fixture.componentInstance.formState();
    expect(state.dirty).toBe(false);
    expect(state.touched).toBe(false);
    expect(state.hasChanges).toBe(false);
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-radar-widget');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    const stored = store.radarTrayectographyOrientation();
    expect(stored).toBeDefined();
    expect(stored.serie).toBeNull();
    expect(stored.disparo).toBeNull();
    expect(stored.radar).toBeNull();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateRadarTrayectographySelection({ serie: 'S1', disparo: 'D1', radar: 'radar-01' });

    fixture.componentInstance.resetForm();

    const formValues = (
      fixture.componentInstance as unknown as {
        formModel: () => { serie: string | null; disparo: string | null; radar: string | null };
      }
    ).formModel();
    expect(formValues.serie).toBe('S1');
    expect(formValues.disparo).toBe('D1');
    expect(formValues.radar).toBe('radar-01');
  });

  it('computed values are null when MAO data is missing', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    expect(store.radarTrayectographyOltGeografico()).toBeNull();
    expect(store.radarTrayectographyXPCaida()).toBeNull();
    expect(store.radarTrayectographyYPCaida()).toBeNull();
    expect(store.radarTrayectographyDifAngularRadar()).toBeNull();
    expect(store.radarTrayectographyAlturaBoca()).toBeNull();
  });

  it('radarTrayectographyDifAngularRadar returns a number when radar is selected', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateRadarTrayectographySelection({ radar: 'radar-01' });
    const val = store.radarTrayectographyDifAngularRadar();
    expect(val).not.toBeNull();
    expect(typeof val).toBe('number');
  });

  it('MAO data updates are reflected in the store', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateRadarTrayectographyMaoData({ xPieza: 123.4, yPieza: 567.8, zPieza: 90.1, alcancePrevistoPique: 5000 });
    expect(store.radarTrayectographyOrientation().xPieza).toBe(123.4);
    expect(store.radarTrayectographyOrientation().alcancePrevistoPique).toBe(5000);
  });
});

function createOrientationResponse(
  sameForAllSeries: boolean,
  sameForAllShots: boolean,
): TrajectographyRadarOrientationResponse {
  const orientationData = {
    pieceX: 10,
    pieceXUnit: 'M',
    pieceY: 20,
    pieceYUnit: 'M',
    pieceZ: 1,
    pieceZUnit: 'M',
    plannedImpactDistance: 1000,
    plannedImpactDistanceUnit: 'M',
    theoreticalInitialVelocity: 780,
    theoreticalInitialVelocityUnit: 'M_S',
    theoreticalFlightTime: 3,
    theoreticalFlightTimeUnit: 'S',
    fuseGraduation: 8,
    fuseGraduationUnit: 'S',
    shootingAngle: 15,
    shootingAngleUnit: 'DEGREES',
    nominalProjectileWeight: 16,
    nominalProjectileWeightUnit: 'KG',
  };

  return {
    sameForAllSeries,
    series: [
      {
        seriesId: 'series-1',
        sameForAllShots,
        shots: [
          { shotId: 'shot-1', orientationData },
          { shotId: 'shot-2', orientationData: { ...orientationData, pieceX: 11 } },
        ],
      },
      {
        seriesId: 'series-2',
        sameForAllShots: true,
        shots: [{ shotId: 'shot-3', orientationData }],
      },
    ],
  };
}
