import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AngleUnitEnum, DistanceUnitEnum } from '@intaqalab/models';
import { patchState } from '@ngrx/signals';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import type { ShotCameraOrientationResponse } from '../../models/shot-camera-orientation.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { VideoCameraOrientation } from './video-camera-orientation';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('VideoCameraOrientation', () => {
  const renderWidget = (widgetId = 'test-video-camera-widget') =>
    render(VideoCameraOrientation, {
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

  it('should create', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-video-camera-widget');
  });

  it('requests orientation again when the selected camera changes', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const loadOrientation = vi.spyOn(store, 'loadVideoCameraOrientation');
    store.setCameraOptions([
      { value: '4668', label: 'Cam A', x: 1, y: 1 },
      { value: '4669', label: 'Cam B', x: 2, y: 2 },
    ]);
    patchState(store, { fireTrialId: 'trial-1' });
    TestBed.tick();
    fixture.detectChanges();

    expect(loadOrientation).toHaveBeenNthCalledWith(1, 'trial-1', 4668);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.CAMERA_LABEL' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Cam B' }));
    TestBed.tick();

    expect(loadOrientation).toHaveBeenNthCalledWith(2, 'trial-1', 4669);
    expect(loadOrientation).toHaveBeenCalledTimes(2);
  });

  it('sends another GET when selecting a camera option with the same backend ID', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const httpMock = TestBed.inject(HttpTestingController);
    const loadOrientation = vi.spyOn(store, 'loadVideoCameraOrientation');
    const orientationUrl = 'http://localhost:3000/api/execution/fire-trials/trial-1/execution/cameras/4668/orientation';
    patchState(store, { fireTrialId: 'trial-1' });
    TestBed.tick();
    httpMock.expectOne(orientationUrl).flush({
      cameraId: 4668,
      sameForAllSeries: true,
      series: [createSeries('series-1', true, ['shot-1'])],
    } satisfies ShotCameraOrientationResponse);
    await waitFor(() => {
      fixture.detectChanges();
      expect(screen.getByText('1.25')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.CAMERA_LABEL' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Cámara 02' }));
    TestBed.tick();

    expect(httpMock.expectOne(orientationUrl).request.method).toBe('GET');
    expect(loadOrientation).toHaveBeenCalledTimes(2);
  });

  it('requests orientation when the selected series or shot changes', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const seriesId = '10000000-0000-4000-8000-000000000002';
    const shotId = '20000000-0000-4000-8000-000000000004';
    const response: ShotCameraOrientationResponse = {
      cameraId: 4668,
      sameForAllSeries: false,
      series: [
        createSeries('10000000-0000-4000-8000-000000000001', false, [
          '20000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000002',
        ]),
        createSeries('10000000-0000-4000-8000-000000000002', false, [
          '20000000-0000-4000-8000-000000000003',
          '20000000-0000-4000-8000-000000000004',
        ]),
      ],
    };
    vi.spyOn(store, 'videoCameraOrientationResponse').mockReturnValue(response);
    const loadOrientation = vi.spyOn(store, 'loadVideoCameraOrientation').mockImplementation(() => undefined);
    patchState(store, { fireTrialId: 'trial-1' });
    TestBed.tick();
    loadOrientation.mockClear();
    fixture.detectChanges();

    fixture.componentInstance['onSerieChange'](seriesId);
    expect(loadOrientation).toHaveBeenNthCalledWith(1, 'trial-1', 4668);

    fixture.componentInstance['onDisparoChange'](shotId);

    expect(loadOrientation).toHaveBeenNthCalledWith(2, 'trial-1', 4668);
    expect(loadOrientation).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    'settles after GET when active selection is absent from the response and sameForAllSeries is %s',
    async (sameForAllSeries) => {
      const { fixture } = await renderWidget();
      const store = TestBed.inject(ExecutionStore);
      const httpMock = TestBed.inject(HttpTestingController);
      const loadOrientation = vi.spyOn(store, 'loadVideoCameraOrientation');
      patchState(store, {
        fireTrialId: 'trial-1',
        activeSerieId: 'active-series',
        activeShotId: 'active-shot',
      });
      TestBed.tick();

      httpMock
        .expectOne('http://localhost:3000/api/execution/fire-trials/trial-1/execution/cameras/4668/orientation')
        .flush({
          cameraId: 4668,
          sameForAllSeries,
          series: [createSeries('response-series', sameForAllSeries, ['response-shot'])],
        } satisfies ShotCameraOrientationResponse);
      TestBed.tick();
      await waitFor(() => {
        fixture.detectChanges();
        expect(screen.getByText('1.25')).toBeInTheDocument();
      });
      await fixture.componentInstance.saveForm();

      expect(store.videoCameraOrientation()).toMatchObject({
        serie: 'response-series',
        disparo: 'response-shot',
      });
      expect(screen.getByText('1.25')).toBeInTheDocument();
      expect(loadOrientation).toHaveBeenCalledExactlyOnceWith('trial-1', 4668);
      httpMock.expectNone('http://localhost:3000/api/execution/fire-trials/trial-1/execution/cameras/4668/orientation');
    },
  );

  it('preserves manual selection and still follows subsequent active selection changes', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    patchState(store, { activeSerieId: 'series-1', activeShotId: 'shot-1' });
    TestBed.tick();
    loadCameraOrientation({
      cameraId: 4668,
      sameForAllSeries: false,
      series: [createSeries('series-1', false, ['shot-1']), createSeries('series-2', false, ['shot-2', 'shot-3'])],
    });
    await waitFor(() => {
      fixture.detectChanges();
      expect(screen.getByText('1.25')).toBeInTheDocument();
    });
    const loadOrientation = vi.spyOn(store, 'loadVideoCameraOrientation').mockImplementation(() => undefined);
    patchState(store, { fireTrialId: 'trial-1' });
    TestBed.tick();
    loadOrientation.mockClear();
    fixture.detectChanges();

    fixture.componentInstance['onSerieChange']('series-2');
    TestBed.tick();
    fixture.componentInstance['onDisparoChange']('shot-3');
    TestBed.tick();
    await fixture.componentInstance.saveForm();

    expect(store.videoCameraOrientation()).toMatchObject({ serie: 'series-2', disparo: 'shot-3' });
    expect(loadOrientation).toHaveBeenCalledTimes(2);

    patchState(store, { activeSerieId: 'series-2', activeShotId: 'shot-2' });
    TestBed.tick();
    await fixture.componentInstance.saveForm();

    expect(store.videoCameraOrientation()).toMatchObject({ serie: 'series-2', disparo: 'shot-2' });
    expect(loadOrientation).toHaveBeenCalledTimes(3);
  });

  it('hides both series and shot selectors when all series have the same orientation data', async () => {
    const { fixture } = await renderWidget();
    loadCameraOrientation({
      cameraId: 4668,
      sameForAllSeries: true,
      series: [
        createSeries('10000000-0000-4000-8000-000000000001', true, ['20000000-0000-4000-8000-000000000001']),
        createSeries('10000000-0000-4000-8000-000000000002', true, ['20000000-0000-4000-8000-000000000002']),
      ],
    });

    await waitFor(() => {
      fixture.detectChanges();
      expect(
        screen.queryByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_LABEL' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_LABEL' }),
      ).not.toBeInTheDocument();
    });
  });

  it('hides shot selector when selected series has the same orientation data for all shots', async () => {
    const { fixture } = await renderWidget();
    loadCameraOrientation({
      cameraId: 4668,
      sameForAllSeries: false,
      series: [
        createSeries('10000000-0000-4000-8000-000000000001', true, [
          '20000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000002',
        ]),
        createSeries('10000000-0000-4000-8000-000000000002', false, ['20000000-0000-4000-8000-000000000003']),
      ],
    });

    await waitFor(() => {
      fixture.detectChanges();
      expect(
        screen.getByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.SERIE_LABEL' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DISPARO_LABEL' }),
      ).not.toBeInTheDocument();
    });
  });

  function loadCameraOrientation(response: ShotCameraOrientationResponse): void {
    const service = TestBed.inject(ExecutionService);
    const httpMock = TestBed.inject(HttpTestingController);
    service.getShotCameraOrientation('trial-1', 4668);
    TestBed.tick();
    const request = httpMock.expectOne(
      'http://localhost:3000/api/execution/fire-trials/trial-1/execution/cameras/4668/orientation',
    );
    request.flush(response);
    TestBed.tick();
    httpMock.verify();
  }

  function createSeries(seriesId: string, sameForAllShots: boolean, shotIds: string[]) {
    return {
      seriesId,
      sameForAllShots,
      shots: shotIds.map((shotId) => ({
        shotId,
        orientationData: {
          plannedImpactDistance: 1200,
          plannedImpactDistanceUnit: DistanceUnitEnum.M,
          functioningHeight: 20,
          functioningHeightUnit: DistanceUnitEnum.M,
          functioningDistance: 1150,
          functioningDistanceUnit: DistanceUnitEnum.M,
          cameraAngularDifference: 1.25,
          cameraAngularDifferenceUnit: AngleUnitEnum.DEGREES,
        },
      })),
    };
  }
});
