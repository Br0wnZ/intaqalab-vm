import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMockSeriesAndShotsService } from '@intaqalab/utils';

import { SeriesAndShotsService } from '../services/series-and-shots-service';
import type { Serie, Shot } from '../utils-models/series-and-shots.model';
import { PlanningGeneralDataStore } from './planning-general-data.store';
import { SeriesAndShotsStore } from './series-and-shots.store';

describe('SeriesAndShotsStore', () => {
  let store: InstanceType<typeof SeriesAndShotsStore>;
  let seriesServiceMock: ReturnType<typeof createMockSeriesAndShotsService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let planningStoreMock: { fireTrialId: any };

  beforeEach(() => {
    seriesServiceMock = createMockSeriesAndShotsService();

    planningStoreMock = {
      fireTrialId: signal<string | null>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        SeriesAndShotsStore,
        { provide: SeriesAndShotsService, useValue: seriesServiceMock },
        { provide: PlanningGeneralDataStore, useValue: planningStoreMock },
      ],
    });

    store = TestBed.inject(SeriesAndShotsStore);
  });

  it('should initialize', () => {
    expect(store).toBeTruthy();
  });

  describe('computed selectors', () => {
    it('should select fireTrialId from planning store', () => {
      planningStoreMock.fireTrialId.set('trial-123');
      expect(store.fireTrialId()).toBe('trial-123');
    });

    it('should select series from service resource', () => {
      const mockSeries: Serie[] = [{ id: 's1', name: 'Series 1', executionOrder: 1, observations: '', shots: [] }];
    });
  });

  describe('methods', () => {
    it('loadSeries should call service.getSeriesAndShots when trialId is present', () => {
      planningStoreMock.fireTrialId.set('trial-123');
      store.loadSeries();
      expect(seriesServiceMock.getSeriesAndShots).toHaveBeenCalledWith('trial-123');
    });

    it('loadSeries should NOT call service.getSeriesAndShots when trialId is missing', () => {
      planningStoreMock.fireTrialId.set(null);
      store.loadSeries();
      expect(seriesServiceMock.getSeriesAndShots).not.toHaveBeenCalled();
    });

    it('addSerie should call service.addNewSerie', () => {
      const request = { trialId: '123', name: 'New Series', numberOfShots: 2 };
      store.addSerie(request);
      expect(seriesServiceMock.addNewSerie).toHaveBeenCalledWith(request);
    });

    it('updateSerie should call service.updateSerie', () => {
      const request = { id: 's1', name: 'Updated Series', observations: 'New obs' };
      store.updateSerie(request);
      expect(seriesServiceMock.updateSerie).toHaveBeenCalledWith(request);
    });

    it('deleteSerie should call service.deleteSerie', () => {
      store.deleteSerie('s1');
      expect(seriesServiceMock.deleteSerie).toHaveBeenCalledWith('s1');
    });

    it('reorderSeries should call service.reorderSeries', () => {
      const request = { trialId: '123', seriesIds: ['s2', 's1'] };
      store.reorderSeries(request);
      expect(seriesServiceMock.reorderSeries).toHaveBeenCalledWith(request);
    });

    it('addShotToSerie should call service.addShotToSerie', () => {
      const request = { serieId: 's1' };
      store.addShotToSerie(request);
      expect(seriesServiceMock.addShotToSerie).toHaveBeenCalledWith(request);
    });

    it('updateShot should call service.updateShot', () => {
      const request = { shotId: 'sh1', observation: 'obs' };
      store.updateShot(request);
      expect(seriesServiceMock.updateShot).toHaveBeenCalledWith(request);
    });

    it('deleteShot should call service.deleteShot', () => {
      store.deleteShot('sh1');
      expect(seriesServiceMock.deleteShot).toHaveBeenCalledWith('sh1');
    });

    it('reloadSeries should reload the resource', () => {
      store.reloadSeries();
      expect(seriesServiceMock.seriesAndShotsResource.reload).toHaveBeenCalled();
    });
  });
});
