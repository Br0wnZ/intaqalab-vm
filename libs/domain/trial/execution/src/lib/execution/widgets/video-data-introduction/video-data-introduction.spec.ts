import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, EquipmentTypeEnum } from '../../models/equipment.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { injectInitialVideoEquipments } from './inject-initial-video-equipments';
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

  it('uses global shot numbers without a hash in shot options', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({});
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const httpMock = TestBed.inject(HttpTestingController);

    store.setFireTrialId('trial-123');
    TestBed.tick();
    const planningSeriesRequest = httpMock.expectOne((request) => request.url.endsWith('/planning/series'));
    planningSeriesRequest.flush([
      {
        id: 'series-1',
        name: 'Serie 1',
        shots: [
          { id: 'shot-1', globalNumber: 12 },
          { id: 'shot-2', globalNumber: 3 },
        ],
      },
    ]);

    await vi.waitFor(() => expect(store.planningSeries()).toHaveLength(1));
    fixture.componentInstance['selectorModel'].update((value) => ({ ...value, serie: 'series-1' }));

    expect(fixture.componentInstance['disparoOptions']()).toEqual([
      { value: 'shot-1', label: 'Disparo 12' },
      { value: 'shot-2', label: 'Disparo 3' },
    ]);
  });

  it('injectInitialVideoEquipments extracts selections from resource for AV and C', () => {
    const mockExecutionService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [
          {
            measurementGroup: EquipmentMeasurementGroupEnum.HIGH_SPEED_VIDEO,
            selections: [
              {
                equipmentItemId: 101,
                categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
              },
            ],
          },
          {
            measurementGroup: EquipmentMeasurementGroupEnum.CONVENTIONAL_VIDEO,
            selections: [
              {
                equipmentItemId: 202,
                categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
              },
            ],
          },
        ],
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockExecutionService }],
    });

    const avSelections = TestBed.runInInjectionContext(() => injectInitialVideoEquipments(() => 'AV'));
    expect(avSelections()).toEqual([
      {
        equipmentItemId: 101,
        categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
      },
    ]);

    const cSelections = TestBed.runInInjectionContext(() => injectInitialVideoEquipments(() => 'C'));
    expect(cSelections()).toEqual([
      {
        equipmentItemId: 202,
        categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
      },
    ]);
  });

  it('equipmentOptions returns empty array when GET of equipment returns nothing (no hardcoded data)', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({});
    const { fixture } = await renderWidget();
    const executionService = TestBed.inject(ExecutionService);

    Object.defineProperty(executionService, 'equipmentSelectorResource', {
      value: {
        hasValue: () => true,
        value: () => [],
      },
      configurable: true,
    });

    fixture.componentInstance['selectorModel'].update((v) => ({
      ...v,
      serie: 'series-1',
      disparo: 'shot-1',
      tipoVideo: 'AV',
    }));

    expect(fixture.componentInstance['equipmentOptions']()).toEqual([]);
    expect(fixture.componentInstance['canalOptions']()).toEqual([]);
  });

  it('equipmentOptions builds combined options for camera, recorder, and channel based on tag (AV or C)', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.HIGH_SPEED_CAMERA]: [{ id: 'cam-av-1', label: 'Photron SA-X2 / CAM-AV-001' }],
      [EquipmentTypeEnum.CONVENTIONAL_CAMERA]: [{ id: 'cam-c-1', label: 'Sony PXW-Z280 / CAM-C-001' }],
      [EquipmentTypeEnum.RECORDER]: [{ id: 'rec-1', label: 'Fastcam R1 / REC-001' }],
      [EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM]: [{ id: 'daq-1', label: 'Yokogawa DL850 / DAQ-001' }],
    });

    const { fixture } = await renderWidget();
    const executionService = TestBed.inject(ExecutionService);

    Object.defineProperty(executionService, 'equipmentSelectorResource', {
      value: {
        hasValue: () => true,
        value: () => [
          {
            measurementGroup: EquipmentMeasurementGroupEnum.HIGH_SPEED_VIDEO,
            selections: [
              {
                equipmentItemId: 'cam-av-1',
                categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
                channel: 1,
                seriesIds: ['series-1'],
                shotIds: ['shot-1'],
              },
              {
                equipmentItemId: 'rec-1',
                categoryId: EquipmentTypeEnum.RECORDER,
                channel: 1,
                seriesIds: ['series-1'],
                shotIds: ['shot-1'],
              },
            ],
          },
          {
            measurementGroup: EquipmentMeasurementGroupEnum.CONVENTIONAL_VIDEO,
            selections: [
              {
                equipmentItemId: 'cam-c-1',
                categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
                channel: 2,
                seriesIds: ['series-1'],
                shotIds: ['shot-1'],
              },
            ],
          },
        ],
      },
      configurable: true,
    });

    fixture.componentInstance['selectorModel'].update((v) => ({
      ...v,
      serie: 'series-1',
      disparo: 'shot-1',
      tipoVideo: 'AV',
    }));

    await vi.waitFor(() => {
      expect(fixture.componentInstance['equipmentOptions']()).toEqual([
        {
          value: 'cam-av-1|rec-1|01',
          label: 'Photron SA-X2 / CAM-AV-001 / Fastcam R1 / REC-001 / Canal 01',
        },
      ]);
    });

    // Switch to conventional video tag (C)
    fixture.componentInstance.updateTipoVideo('C');
    expect(fixture.componentInstance['equipmentOptions']()).toEqual([
      {
        value: 'cam-c-1||02',
        label: 'Sony PXW-Z280 / CAM-C-001 / Canal 02',
      },
    ]);
  });

  it('onEquipmentSelected splits value and updates camera, grabador, and canal in the form', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    fixture.componentInstance.onEquipmentSelected('cam-av-1|rec-1|01');

    const model = fixture.componentInstance['selectorModel']();
    expect(model.equipment).toBe('cam-av-1|rec-1|01');
    expect(model.camera).toBe('cam-av-1');
    expect(model.grabador).toBe('rec-1');
    expect(model.canal).toBe('01');

    const stored = store.videoDataIntroduction();
    expect(stored.camera).toBe('cam-av-1');
    expect(stored.grabador).toBe('rec-1');
    expect(stored.canal).toBe('01');
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
      expect(fixture.componentInstance['selectorModel']().equipment).toBe('camera-av-1|recorder-1|01');
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
