import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { PlanningTrialContextService } from '@intaqalab/data-access-planning';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlanningModification, SubmitPlanningModificationsResponse } from './models/planning-modification.models';
import { PlanningModificationsService } from './planning-modifications.service';

const MOCK_MODIFICATION: PlanningModification = {
  id: 'mod-1',
  parameter: 'elevation',
  action: 'Modificación',
  previousValue: 10,
  newValue: 20,
  affectedShots: ['D2'],
  status: 'BORRADOR',
  classification: 'none',
};

describe('PlanningModificationsService', () => {
  let service: PlanningModificationsService;
  let httpTesting: HttpTestingController;
  let trialContext: PlanningTrialContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        PlanningTrialContextService,
        PlanningModificationsService,
      ],
    });
    service = TestBed.inject(PlanningModificationsService);
    httpTesting = TestBed.inject(HttpTestingController);
    trialContext = TestBed.inject(PlanningTrialContextService);
  });

  afterEach(() => httpTesting.verify());

  it('loads modifications list via httpResource without centerId', async () => {
    service.loadModifications('trial-1');
    TestBed.tick();

    const req = httpTesting.expectOne('http://localhost:3000/api/planning/fire-trials/trial-1/planning/modifications');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_MODIFICATION]);

    await vi.waitFor(() => expect(service.modificationsResource.value()).toEqual([MOCK_MODIFICATION]));
  });

  it('uses explicit centerId when loading modifications', async () => {
    service.loadModifications('trial-1', 'center-42');
    TestBed.tick();

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-42/fire-trials/trial-1/planning/modifications',
    );
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_MODIFICATION]);

    await vi.waitFor(() => expect(service.modificationsResource.value()).toHaveLength(1));
  });

  it('falls back to PlanningTrialContextService centerId when not passed explicitly', async () => {
    trialContext.setTrial({ fireTrialId: 'trial-1', centerId: 'center-ctx' });
    service.loadModifications('trial-1');
    TestBed.tick();

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-ctx/fire-trials/trial-1/planning/modifications',
    );
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_MODIFICATION]);

    await vi.waitFor(() => expect(service.modificationsResource.value()).toEqual([MOCK_MODIFICATION]));
  });

  it('fetches modifications imperatively via fetchModifications', async () => {
    const promise = service.fetchModifications('trial-1', 'center-1');
    TestBed.tick();

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications',
    );
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_MODIFICATION]);

    await expect(promise).resolves.toEqual([MOCK_MODIFICATION]);
  });

  it('loads current planning conditions with revision=execution query param', async () => {
    service.loadCurrentConditions('trial-1', 'center-1');
    TestBed.tick();

    const req = httpTesting.expectOne(
      (request) =>
        request.url === 'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/conditions' &&
        request.params.get('revision') === 'execution',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ elevation: 20 });

    await vi.waitFor(() => expect(service.currentConditionsResource.value()).toEqual({ elevation: 20 }));
  });

  it('loads baseline planning conditions with revision=baseline query param', async () => {
    service.loadBaselineConditions('trial-1', 'center-1');
    TestBed.tick();

    const req = httpTesting.expectOne(
      (request) =>
        request.url === 'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/conditions' &&
        request.params.get('revision') === 'baseline',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ elevation: 10 });

    await vi.waitFor(() => expect(service.baselineConditionsResource.value()).toEqual({ elevation: 10 }));
  });

  it('saves draft modifications via POST', async () => {
    const payload = {
      modifications: [
        {
          parameter: 'elevation',
          action: 'Modificación' as const,
          previousValue: 10,
          newValue: 20,
          affectedShots: ['D2'],
          classification: 'none' as const,
        },
      ],
    };

    const promise = service.saveDraft('trial-1', payload, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ modifications: [MOCK_MODIFICATION] });

    await expect(promise).resolves.toEqual([MOCK_MODIFICATION]);
  });

  it('normalizes array response from submitModifications', async () => {
    const payload = {
      modifications: [
        {
          id: 'mod-1',
          parameter: 'elevation',
          action: 'Modificación' as const,
          previousValue: 10,
          newValue: 20,
          affectedShots: ['D2'],
          classification: 'solicita' as const,
        },
      ],
    };

    const promise = service.submitModifications('trial-1', payload, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications/submit',
    );
    expect(req.request.method).toBe('POST');
    req.flush([{ ...MOCK_MODIFICATION, status: 'PENDIENTE', classification: 'solicita' }]);

    await expect(promise).resolves.toEqual({
      modifications: [{ ...MOCK_MODIFICATION, status: 'PENDIENTE', classification: 'solicita' }],
      acceptedCount: 0,
      pendingCount: 1,
    });
  });

  it('updates classification for a single modification via PUT', async () => {
    const updated: PlanningModification = { ...MOCK_MODIFICATION, classification: 'solicita' };
    const promise = service.updateClassification('trial-1', 'mod-1', { classification: 'solicita' }, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications/mod-1',
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ classification: 'solicita' });
    req.flush(updated);

    await expect(promise).resolves.toEqual(updated);
  });

  it('submits modifications via POST', async () => {
    const submitResponse: SubmitPlanningModificationsResponse = {
      modifications: [{ ...MOCK_MODIFICATION, status: 'ACEPTADO' }],
      acceptedCount: 1,
      pendingCount: 0,
    };

    const payload = {
      modifications: [
        {
          id: 'mod-1',
          parameter: 'elevation',
          action: 'Modificación' as const,
          previousValue: 10,
          newValue: 20,
          affectedShots: ['D2'],
          classification: 'none' as const,
        },
      ],
    };

    const promise = service.submitModifications('trial-1', payload, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications/submit',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(submitResponse);

    await expect(promise).resolves.toEqual(submitResponse);
  });

  it('approves a pending modification via PUT', async () => {
    const approved: PlanningModification = { ...MOCK_MODIFICATION, status: 'ACEPTADO' };
    const promise = service.approveModification('trial-1', 'mod-1', { comment: 'Approved by client' }, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications/mod-1/approve',
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ comment: 'Approved by client' });
    req.flush(approved);

    await expect(promise).resolves.toEqual(approved);
  });

  it('rejects a pending modification via PUT', async () => {
    const rejected: PlanningModification = { ...MOCK_MODIFICATION, status: 'RECHAZADO' };
    const promise = service.rejectModification('trial-1', 'mod-1', { comment: 'Out of spec' }, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/modifications/mod-1/reject',
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ comment: 'Out of spec' });
    req.flush(rejected);

    await expect(promise).resolves.toEqual(rejected);
  });

  it('applies draft planning changes via POST to changes/apply endpoint', async () => {
    const payload = {
      changes: [{ id: 'ch-1', requiresApproval: false, requestClient: false }],
    };

    const promise = service.applyChanges('trial-1', payload, 'center-1');

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/planning/centers/center-1/fire-trials/trial-1/planning/changes/apply',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush([{ id: 'ch-1', status: 'ACCEPTED', requiresApproval: false, requestClient: false }]);

    await expect(promise).resolves.toEqual([
      { id: 'ch-1', status: 'ACCEPTED', requiresApproval: false, requestClient: false },
    ]);
  });
});
