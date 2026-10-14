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

  it('hides both series and shot selectors when all series have the same orientation data', async () => {
    const { container, fixture } = await renderWidget();
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
      expect(container.querySelector('#serie-select')).toBeNull();
      expect(container.querySelector('#disparo-select')).toBeNull();
    });
  });

  it('hides shot selector when selected series has the same orientation data for all shots', async () => {
    const { container, fixture } = await renderWidget();
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
      expect(container.querySelector('#serie-select')).not.toBeNull();
      expect(container.querySelector('#disparo-select')).toBeNull();
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
