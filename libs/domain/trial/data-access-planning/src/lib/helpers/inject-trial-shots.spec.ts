import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningTrialContextService } from '../context/trial-context.service';
import { injectTrialShots } from './inject-trial-shots';

const MOCK_PLANNING_URL = 'http://localhost:3000/api/planning';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_PLANNING_URL,
}));

const MOCK_SERIES = [
  {
    id: 'serie-1',
    name: 'Serie 1',
    shotQuantity: 2,
    executionOrder: 1,
    observations: '',
    shots: [
      { id: 'shot-1', globalNumber: 2, observation: null },
      { id: 'shot-2', globalNumber: 1, observation: 'primero' },
    ],
  },
  {
    id: 'serie-2',
    name: 'Serie 2',
    shotQuantity: 1,
    executionOrder: 2,
    observations: '',
    shots: [{ id: 'shot-3', globalNumber: 3, observation: null }],
  },
];

describe('injectTrialShots', () => {
  let httpTestingController: HttpTestingController;
  let contextService: PlanningTrialContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PlanningTrialContextService],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    contextService = TestBed.inject(PlanningTrialContextService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not fetch until the trial context is set', () => {
    const handle = TestBed.runInInjectionContext(() => injectTrialShots());
    TestBed.tick();

    expect(handle.series()).toBeNull();
    expect(handle.shots()).toEqual([]);
    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
  });

  it('should return series with shots ordered by globalNumber', async () => {
    const handle = TestBed.runInInjectionContext(() => injectTrialShots());

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();

    const req = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_SERIES);
    TestBed.tick();
    await settle();

    const series = handle.series();
    if (!series) throw new Error('series response expected');
    expect(series).toHaveLength(2);

    expect(handle.shots().map((shot) => shot.id)).toEqual(['shot-2', 'shot-1', 'shot-3']);
    expect(handle.findShot('shot-3')?.globalNumber).toBe(3);
    expect(handle.findSeries('serie-2')?.name).toBe('Serie 2');
    expect(handle.shotsOfSeries('serie-1').map((shot) => shot.id)).toEqual(['shot-2', 'shot-1']);
  });

  it('should re-fetch when the trial context changes', async () => {
    const handle = TestBed.runInInjectionContext(() => injectTrialShots());

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();
    httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`).flush(MOCK_SERIES);
    TestBed.tick();
    await settle();
    expect(handle.shots()).toHaveLength(3);

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-456' });
    TestBed.tick();

    const req = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-456/planning/series`);
    req.flush([]);
    TestBed.tick();
    await settle();

    expect(handle.series()).toEqual([]);
    expect(handle.shots()).toEqual([]);
  });
});

function settle(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
