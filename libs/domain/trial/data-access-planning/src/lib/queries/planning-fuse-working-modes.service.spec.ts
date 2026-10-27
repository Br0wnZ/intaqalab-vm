import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningFuseWorkingModesService } from './planning-fuse-working-modes.service';

const PLANNING_URL = 'http://localhost:3000/api/planning';
const FUSE_WORKING_MODES_URL = `${PLANNING_URL}/fuse-working-modes`;

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => PLANNING_URL,
}));

describe('PlanningFuseWorkingModesService', () => {
  let service: PlanningFuseWorkingModesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PlanningFuseWorkingModesService],
    });
    service = TestBed.inject(PlanningFuseWorkingModesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not fetch fuse working modes before load is requested', () => {
    TestBed.tick();

    httpTestingController.expectNone(FUSE_WORKING_MODES_URL);
  });

  it('should fetch the first page of active fuse working modes', async () => {
    service.load();
    TestBed.tick();

    const request = httpTestingController.expectOne((candidate) => candidate.url === FUSE_WORKING_MODES_URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('active')).toBe('true');

    request.flush({
      page: 1,
      pageSize: 10,
      totalElements: 1,
      items: [{ id: 'mode-1', label: 'Impacto' }],
    });
    TestBed.tick();
    await settle();

    expect(service.fuseWorkingModesResource.value()?.items).toEqual([{ id: 'mode-1', label: 'Impacto' }]);
  });
});

function settle(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
