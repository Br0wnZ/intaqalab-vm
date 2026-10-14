import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor, within } from '@testing-library/angular';
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

  it('shows series and shot selectors when response flags indicate different values', async () => {
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
