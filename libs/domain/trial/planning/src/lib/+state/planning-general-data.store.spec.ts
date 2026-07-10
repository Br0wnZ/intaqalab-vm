import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UsersService } from '@intaqalab/data-access';
import type { TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import {
  createMockDataPlanningService,
  createMockPlanningLifecycleService,
  createMockSeriesAndShotsService,
  createMockShootingConditionsService,
} from '@intaqalab/utils';
import { vi } from 'vitest';

import { DataPlanningService } from '../services/data-planning-service';
import { PlanningLifecycleService } from '../services/planning-lifecycle-service';
import { SeriesAndShotsService } from '../services/series-and-shots-service';
import { ShootingConditionsService } from '../services/shooting-conditions.service';
import { PlanningGeneralDataStore } from './planning-general-data.store';

describe('PlanningGeneralDataStore', () => {
  let store: InstanceType<typeof PlanningGeneralDataStore>;
  let dataPlanningServiceMock: ReturnType<typeof createMockDataPlanningService>;
  let seriesAndShotsServiceMock: ReturnType<typeof createMockSeriesAndShotsService>;
  let shootingConditionsServiceMock: ReturnType<typeof createMockShootingConditionsService>;
  let lifecycleServiceMock: ReturnType<typeof createMockPlanningLifecycleService>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usersServiceMock: any;

  beforeEach(() => {
    dataPlanningServiceMock = createMockDataPlanningService();
    seriesAndShotsServiceMock = createMockSeriesAndShotsService();
    shootingConditionsServiceMock = createMockShootingConditionsService();
    lifecycleServiceMock = createMockPlanningLifecycleService();
    usersServiceMock = {
      users: signal([]),
      usersResource: {
        value: signal({
          page: 1,
          pageSize: 25,
          totalElements: 0,
          items: [],
        }),
        isLoading: signal(false),
        error: signal(undefined),
      },
      load: vi.fn(),
      queryParams: signal(null),
      associatedPlanningUserId: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        PlanningGeneralDataStore,
        { provide: DataPlanningService, useValue: dataPlanningServiceMock },
        { provide: SeriesAndShotsService, useValue: seriesAndShotsServiceMock },
        { provide: ShootingConditionsService, useValue: shootingConditionsServiceMock },
        { provide: PlanningLifecycleService, useValue: lifecycleServiceMock },
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

  describe('planning validation', () => {
    it('should default isPlanningValidable to false and validation errors to an empty array', () => {
      expect(store.isPlanningValidable()).toBe(false);
      expect(store.planningValidationErrors()).toEqual([]);
    });

    it('should expose isValidable and validationErrors from the planning info resource', () => {
      Object.assign(dataPlanningServiceMock.getPlanningDataResource, {
        hasValue: vi.fn(() => true),
        value: vi.fn(() => ({
          goal: 'Goal',
          specimens: [],
          isValidable: false,
          validationErrors: ['El objetivo de la prueba es obligatorio.'],
        })),
        error: vi.fn(() => undefined),
        status: vi.fn(() => 'resolved'),
        isLoading: vi.fn(() => false),
      });

      expect(store.isPlanningValidable()).toBe(false);
      expect(store.planningValidationErrors()).toEqual(['El objetivo de la prueba es obligatorio.']);
    });
  });
});
