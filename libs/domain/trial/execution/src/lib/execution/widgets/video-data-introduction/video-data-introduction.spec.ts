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
import { EquipmentTypeEnum } from '../../models/equipment.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { VideoDataIntroduction } from './video-data-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('VideoDataIntroduction', () => {
  const renderWidget = (widgetId = 'test-video-data-introduction-widget') =>
    render(VideoDataIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionService,
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-video-data-introduction-widget');
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-video-data-introduction-widget');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.videoDataIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).videoDataIntroduction();
    expect(fixture.componentInstance['selectorModel']().tipoVideo).toBe(stored.tipoVideo);
  });

  it('loads equipment items for cameras and recorders from ExecutionService', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.HIGH_SPEED_CAMERA]: [{ id: 'cam-av-1', label: 'Photron SA-X2 / CAM-AV-001' }],
      [EquipmentTypeEnum.CONVENTIONAL_CAMERA]: [{ id: 'cam-c-1', label: 'Sony PXW-Z280 / CAM-C-001' }],
      [EquipmentTypeEnum.RECORDER]: [{ id: 'rec-1', label: 'Fastcam R1 / REC-001' }],
      [EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM]: [{ id: 'daq-1', label: 'Yokogawa DL850 / DAQ-001' }],
    });

    const { fixture } = await renderWidget();
    await vi.waitFor(() => {
      expect(fixture.componentInstance['cameraOptions']().length).toBeGreaterThan(0);
    });

    // Test camera options when AV is selected
    fixture.componentInstance.updateTipoVideo('AV');
    expect(fixture.componentInstance['cameraOptions']()).toEqual([
      { value: 'cam-av-1', label: 'Photron SA-X2 / CAM-AV-001' },
    ]);

    // Test camera options when C is selected
    fixture.componentInstance.updateTipoVideo('C');
    expect(fixture.componentInstance['cameraOptions']()).toEqual([
      { value: 'cam-c-1', label: 'Sony PXW-Z280 / CAM-C-001' },
    ]);

    // Test grabador options
    expect(fixture.componentInstance['grabadorOptions']()).toEqual([
      { value: 'rec-1', label: 'Fastcam R1 / REC-001' },
      { value: 'daq-1', label: 'Yokogawa DL850 / DAQ-001' },
    ]);
  });

  it('loads initial shot data and preserves the other video block when saving', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({});
    const { fixture } = await renderWidget();
    const executionService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const response = {
      highSpeedVideoData: {
        cameraId: 'camera-av-1',
        recorderId: 'recorder-1',
        channel: 1,
        measureId: 'measure-1',
        observedResult: 'AV result',
        observations: 'AV observations',
      },
      conventionalVideoData: {
        cameraId: 'camera-c-1',
        recorderId: 'recorder-1',
        channel: 2,
        measureId: 'measure-2',
        observedResult: 'C result',
        observations: 'C observations',
      },
    };
    const fetchSpy = vi.spyOn(executionService, 'fetchShotVideoData').mockResolvedValue(response);
    const updateSpy = vi.spyOn(executionService, 'updateShotVideoData').mockResolvedValue(response);

    store.setFireTrialId('trial-123');
    store.setOptimisticActiveShot('series-1', 'shot-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 'series-1', 'shot-1');
      expect(fixture.componentInstance['selectorModel']().camera).toBe('camera-av-1');
    });

    fixture.componentInstance['selectorModel'].update((value) => ({ ...value, camera: 'camera-av-2' }));
    await fixture.componentInstance.saveForm();

    expect(updateSpy).toHaveBeenCalledWith('trial-123', 'series-1', 'shot-1', {
      highSpeedVideoData: {
        ...response.highSpeedVideoData,
        cameraId: 'camera-av-2',
      },
      conventionalVideoData: response.conventionalVideoData,
    });
  });
});
