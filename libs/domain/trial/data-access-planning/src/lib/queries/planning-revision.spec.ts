import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlanningRevision } from '../models/planning-revision.model';
import { isPlanningRevision } from '../models/planning-revision.model';
import { PLANNING_REVISION, planningRevisionParams } from '../revision/planning-revision';
import { PlanningArmamentService } from './planning-armament.service';
import { PlanningConditionsService } from './planning-conditions.service';
import { PlanningMeasuresService } from './planning-measures.service';
import { PlanningMunitionsService } from './planning-munitions.service';
import { PlanningSeriesService } from './planning-series.service';

const MOCK_PLANNING_URL = 'http://localhost:3000/api/planning';
const TRIAL_URL = `${MOCK_PLANNING_URL}/fire-trials/trial-1/planning`;

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_PLANNING_URL,
}));

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function configure(revision?: PlanningRevision): HttpTestingController {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      ...(revision ? [{ provide: PLANNING_REVISION, useValue: revision }] : []),
    ],
  });
  return TestBed.inject(HttpTestingController);
}

describe('planningRevisionParams', () => {
  it('should build the revision query param', () => {
    expect(planningRevisionParams('execution')).toEqual({ revision: 'execution' });
    expect(planningRevisionParams('baseline')).toEqual({ revision: 'baseline' });
  });

  it('should validate supported revisions', () => {
    expect(isPlanningRevision('baseline')).toBe(true);
    expect(isPlanningRevision('execution')).toBe(true);
    expect(isPlanningRevision('other')).toBe(false);
  });
});

describe('planning queries revision param', () => {
  let http: HttpTestingController;

  afterEach(() => {
    http.verify();
  });

  describe('default (execution)', () => {
    beforeEach(() => {
      http = configure();
    });

    it('should send revision=execution on the series GET', async () => {
      TestBed.inject(PlanningSeriesService).load('trial-1');
      TestBed.tick();
      await settle();
      const req = http.expectOne(`${TRIAL_URL}/series?revision=execution`);
      expect(req.request.params.get('revision')).toBe('execution');
      req.flush([]);
    });

    it('should send revision=execution on the conditions GET', async () => {
      TestBed.inject(PlanningConditionsService).load('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/conditions?revision=execution`).flush({ units: {}, series: [] });
    });

    it('should send revision=execution on the munitions GET', async () => {
      TestBed.inject(PlanningMunitionsService).load('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/munitions?revision=execution`).flush({ series: [] });
    });

    it('should send revision=execution on the imperative munitions fetch', async () => {
      const promise = TestBed.inject(PlanningMunitionsService).fetchMunitions('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/munitions?revision=execution`).flush({ series: [] });
      await expect(promise).resolves.toEqual({ series: [] });
    });

    it('should send revision=execution on the armament GET', async () => {
      TestBed.inject(PlanningArmamentService).load('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/armament?revision=execution`).flush({ series: [] });
    });

    it('should send revision=execution on the imperative armament fetch', async () => {
      const promise = TestBed.inject(PlanningArmamentService).fetchArmament('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/armament?revision=execution`).flush({ series: [] });
      await expect(promise).resolves.toEqual({ series: [] });
    });

    it('should send revision=execution on the measures GET', async () => {
      TestBed.inject(PlanningMeasuresService).load('trial-1');
      TestBed.tick();
      await settle();
      http.expectOne(`${TRIAL_URL}/measures?revision=execution`).flush({ series: [] });
    });
  });

  describe('overridden token (baseline)', () => {
    beforeEach(() => {
      http = configure('baseline');
    });

    it('should send revision=baseline when the token is overridden', async () => {
      TestBed.inject(PlanningSeriesService).load('trial-1');
      TestBed.tick();
      await settle();
      const req = http.expectOne(`${TRIAL_URL}/series?revision=baseline`);
      expect(req.request.params.get('revision')).toBe('baseline');
      req.flush([]);
    });
  });
});
