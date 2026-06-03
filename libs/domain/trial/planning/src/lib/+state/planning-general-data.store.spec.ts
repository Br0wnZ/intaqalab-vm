import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UsersService } from '@intaqalab/data-access';
import type { TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import {
  createMockDataPlanningService,
  createMockSeriesAndShotsService,
  createMockShootingConditionsService,
} from '@intaqalab/utils';
import { vi } from 'vitest';

import { DataPlanningService } from '../services/data-planning-service';
import { SeriesAndShotsService } from '../services/series-and-shots-service';
import { ShootingConditionsService } from '../services/shooting-conditions.service';
import { PlanningGeneralDataStore } from './planning-general-data.store';

describe('PlanningGeneralDataStore', () => {
  let store: InstanceType<typeof PlanningGeneralDataStore>;
  let dataPlanningServiceMock: ReturnType<typeof createMockDataPlanningService>;
  let seriesAndShotsServiceMock: ReturnType<typeof createMockSeriesAndShotsService>;
  let shootingConditionsServiceMock: ReturnType<typeof createMockShootingConditionsService>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usersServiceMock: any;

  beforeEach(() => {
    dataPlanningServiceMock = createMockDataPlanningService();
    seriesAndShotsServiceMock = createMockSeriesAndShotsService();
    shootingConditionsServiceMock = createMockShootingConditionsService();
    usersServiceMock = {
      users: signal([]),
      usersResource: {
        isLoading: signal(false),
        error: signal(undefined),
      },
      load: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PlanningGeneralDataStore,
        { provide: DataPlanningService, useValue: dataPlanningServiceMock },
        { provide: SeriesAndShotsService, useValue: seriesAndShotsServiceMock },
        { provide: ShootingConditionsService, useValue: shootingConditionsServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    });

    store = TestBed.inject(PlanningGeneralDataStore);
  });

  it('should initialize with initial state', () => {
    expect(store.fireTrialId()).toBeNull();
    expect(store.fireTrial()).toBeNull();
  });

  it('should set fireTrialId and fireTrial correctly', () => {
    const trialId = '123';
    const trial: TrialCreateModifyForm = {
      code: 'T-001',
      hasAssociatedTrial: false,
      hasLinkedTrial: false,
      associatedTrial: '',
      linkedTrial: '',
      description: '',
      type: '',
      client: '',
      clientReference: '',
      requestedDate: '',
      observations: '',
      status: TrialStatus.PLANNED,
      linkedTrialView: '',
      associatedTrialView: '',
    };

    store.setFireTrialData(trialId, trial);

    expect(store.fireTrialId()).toBe(trialId);
    expect(store.fireTrial()).toEqual(trial);
    expect(store.fireTrialCode()).toBe('T-001');
    expect(dataPlanningServiceMock.getFireTrialPlanningInfo).toHaveBeenCalledWith(trialId);
  });

  it('should not read planning info value when the resource has errored', () => {
    const error = new Error('planning info failed');
    const valueSpy = vi.fn(() => {
      throw error;
    });

    Object.assign(dataPlanningServiceMock.getPlanningDataResource, {
      hasValue: vi.fn(() => false),
      value: valueSpy,
      error: vi.fn(() => error),
      status: vi.fn(() => 'error'),
      isLoading: vi.fn(() => false),
    });

    expect(store.planningInfo()).toBeUndefined();
    expect(store.hasPlanningInfo()).toBe(false);
    expect(store.hasPlanningInfoError()).toBe(true);
    expect(valueSpy).not.toHaveBeenCalled();
  });

  it('should expose no planning info error by default', () => {
    expect(store.hasPlanningInfoError()).toBe(false);
  });
});
