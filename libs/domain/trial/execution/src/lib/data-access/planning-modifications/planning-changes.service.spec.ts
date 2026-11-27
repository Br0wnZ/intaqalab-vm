import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type AppEnvironment, provideEnvironment } from '@intaqalab/config';
import type { PlanningFormSnapshotEvent } from '@intaqalab/planning';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { diffPlanningFormSnapshot } from '../../execution/dialogs/modify-planning-dialog/planning-change-diff';
import type { PlanningChange } from '../../execution/models/planning-changes.models';
import { toCreatePlanningChangesRequest } from './planning-changes.mapper';
import { PlanningChangesService } from './planning-changes.service';

const created: PlanningChange = {
  id: 'change-1',
  resourceType: 'PLANNING_INFO',
  resourceId: 'trial-1',
  seriesId: null,
  shotId: null,
  field: 'goal',
  operation: 'UPDATE',
  oldValue: 'Old',
  newValue: 'New',
  status: 'DRAFT',
  requiresApproval: false,
  requestClient: false,
  createdBy: 'user-1',
  createdAt: '2026-11-25T10:00:00Z',
  decidedBy: null,
  decidedAt: null,
};

const API_CENTER_ID = '2f40f684-4201-4903-95ea-0871aa3281e9';
const FIRE_TRIAL_ID = 'c6c5fbc6-5f6e-8a7b-2c5d-5e6f7a8b9c0d';
const PLANNING_API_BASE = `http://localhost:4200/api/centers/${API_CENTER_ID}/planning-api/1.3.0`;
const EXPECTED_CHANGES_URL = `${PLANNING_API_BASE}/fire-trials/${FIRE_TRIAL_ID}/planning/changes`;

const testEnvironment: AppEnvironment = {
  production: false,
  apiUrl: `http://localhost:4200/api/centers/${API_CENTER_ID}`,
  features: { enableTabsNavigation: true, enableExecution: true },
  authConfig: {},
  endpoints: {
    linesOfShot: 'lines-of-shoot',
    fireTrials: 'fire-trials',
    users: 'users',
    clients: 'clients',
    fireTrialTypes: 'fire-trial-types',
    calendar: 'calendar',
    documents: 'documents',
    whareHouse: 'warehouse',
    specimens: 'specimens',
    eventLog: 'event-log',
    munitionComponentTypes: 'munition-component-types',
    munitionDenominations: 'munition-denominations',
    fuseWorkingModes: 'fuse-working-modes',
    planning: 'planning-api/1.3.0',
    execution: 'execution-api/1.0.0',
    centers: 'centers',
  },
};

describe('PlanningChangesService', () => {
  let service: PlanningChangesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideEnvironment(testEnvironment),
        provideHttpClient(),
        provideHttpClientTesting(),
        PlanningChangesService,
      ],
    });
    service = TestBed.inject(PlanningChangesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should keep the base center and load changes without appending another center segment', async () => {
    service.load(FIRE_TRIAL_ID);
    TestBed.tick();

    const request = http.expectOne(EXPECTED_CHANGES_URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([created]);

    await expect.poll(() => service.resource.value()).toEqual([created]);
  });

  it('should create field changes using POST and preserve nullable old and new values', async () => {
    const promise = service.create(FIRE_TRIAL_ID, {
      changes: [
        {
          resourceType: 'PLANNING_INFO',
          resourceId: 'trial-1',
          field: 'goal',
          operation: 'UPDATE',
          oldValue: null,
          newValue: null,
        },
      ],
    });

    const request = http.expectOne(EXPECTED_CHANGES_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.changes[0]).toEqual({
      resourceType: 'PLANNING_INFO',
      resourceId: 'trial-1',
      field: 'goal',
      operation: 'UPDATE',
      oldValue: null,
      newValue: null,
    });
    request.flush([created]);

    await expect(promise).resolves.toEqual([created]);
  });

  it('should apply remote change ids using POST without revision query parameters', async () => {
    const promise = service.apply(FIRE_TRIAL_ID, {
      changes: [{ id: 'change-1', requiresApproval: false, requestClient: true }],
    });

    const request = http.expectOne(`${EXPECTED_CHANGES_URL}/apply`);
    expect(request.request.method).toBe('POST');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.body).toEqual({
      changes: [{ id: 'change-1', requiresApproval: false, requestClient: true }],
    });
    request.flush([{ ...created, status: 'PENDING', requestClient: true }]);

    await expect(promise).resolves.toEqual([{ ...created, status: 'PENDING', requestClient: true }]);
  });

  it('should POST the edited shot, configuration and armament identities from form snapshots', async () => {
    const events: PlanningFormSnapshotEvent[] = [
      {
        section: 'shooting-conditions',
        baseline: {
          series: [
            {
              seriesId: 'series-1',
              shots: [
                { shotId: 'shot-1', elevation: 10 },
                { shotId: 'shot-2', elevation: 20 },
              ],
            },
          ],
        },
        current: {
          series: [
            {
              seriesId: 'series-1',
              shots: [
                { shotId: 'shot-2', elevation: 21.3456789 },
                { shotId: 'shot-1', elevation: 10 },
              ],
            },
          ],
        },
      },
      {
        section: 'munitions',
        baseline: {
          series: [
            {
              seriesId: 'series-1',
              configurations: [
                { id: 'configuration-1', denomination: 'denomination-1', assignedShotIds: ['shot-1'], batch: 'A' },
                { id: 'configuration-2', denomination: 'denomination-2', assignedShotIds: ['shot-2'], batch: 'B' },
              ],
            },
          ],
          persistedConfigurationIds: ['configuration-1', 'configuration-2'],
        },
        current: {
          series: [
            {
              seriesId: 'series-1',
              configurations: [
                { id: 'configuration-2', denomination: 'denomination-2', assignedShotIds: ['shot-2'], batch: 'C' },
                { id: 'configuration-1', denomination: 'denomination-1', assignedShotIds: ['shot-1'], batch: 'A' },
              ],
            },
          ],
        },
      },
      {
        section: 'armament',
        baseline: {
          series: [
            {
              seriesId: 'series-1',
              shots: [
                {
                  shotId: 'shot-1',
                  armament: { id: 'armament-1', weaponExternalId: '101', tubeExternalId: '501', observations: 'First' },
                },
                {
                  shotId: 'shot-2',
                  armament: {
                    id: 'armament-2',
                    weaponExternalId: '101',
                    tubeExternalId: '501',
                    observations: 'Original',
                  },
                },
              ],
            },
          ],
        },
        current: [
          {
            seriesId: 'series-1',
            shots: [
              {
                shotId: 'shot-2',
                armament: { id: 'armament-2', weaponExternalId: '101', tubeExternalId: '501', observations: 'Updated' },
              },
              {
                shotId: 'shot-1',
                armament: { id: 'armament-1', weaponExternalId: '101', tubeExternalId: '501', observations: 'First' },
              },
            ],
          },
        ],
      },
    ];
    const changes = events.flatMap((event) => diffPlanningFormSnapshot(event, { fireTrialId: FIRE_TRIAL_ID }));
    const promise = service.create(FIRE_TRIAL_ID, toCreatePlanningChangesRequest(changes));
    const request = http.expectOne(EXPECTED_CHANGES_URL);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      changes: [
        {
          resourceType: 'SHOT_CONDITIONS',
          resourceId: 'shot-2',
          field: 'elevation',
          operation: 'UPDATE',
          oldValue: '20',
          newValue: '21.3456789',
        },
        {
          resourceType: 'MUNITION',
          resourceId: 'configuration-2',
          field: 'batch',
          operation: 'UPDATE',
          oldValue: 'B',
          newValue: 'C',
        },
        {
          resourceType: 'ARMAMENT',
          resourceId: 'armament-2',
          field: 'observations',
          operation: 'UPDATE',
          oldValue: 'Original',
          newValue: 'Updated',
        },
      ],
    });
    request.flush([]);
    await expect(promise).resolves.toEqual([]);
  });
});
