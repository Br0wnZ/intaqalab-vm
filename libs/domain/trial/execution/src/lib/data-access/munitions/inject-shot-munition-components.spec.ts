import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { PlanningMunitionsService, PlanningTrialContextService } from '@intaqalab/data-access-planning';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { injectShotMunitionComponents } from './inject-shot-munition-components';

describe('injectShotMunitionComponents', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        PlanningMunitionsService,
        PlanningTrialContextService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initializes with empty options before data arrives', () => {
    const seriesId = signal<string | null>('serie-1');
    const shotId = signal<string | null>('shot-1');
    const fireTrialId = signal<string | null>('trial-123');

    const handle = TestBed.runInInjectionContext(() => injectShotMunitionComponents({ seriesId, shotId, fireTrialId }));
    TestBed.tick();

    // Initial state before HTTP requests respond
    expect(handle.components()).toEqual([]);
    expect(handle.configs()).toEqual([]);

    // Respond to warehouse munition-types
    const typesReq = httpMock.expectOne((req) => req.url.includes('/munition-types'));
    typesReq.flush({ items: [] });
    TestBed.tick();

    // Respond to planning munitions
    const planReq = httpMock.expectOne((req) => req.url.includes('planning/munitions'));
    planReq.flush({ series: [] });
    TestBed.tick();

    expect(handle.components()).toEqual([]);
  });

  it('updates components when trial data is loaded and scopes to selected shot', async () => {
    const seriesId = signal<string | null>('serie-1');
    const shotId = signal<string | null>('shot-1');
    const fireTrialId = signal<string | null>('trial-123');

    const handle = TestBed.runInInjectionContext(() => injectShotMunitionComponents({ seriesId, shotId, fireTrialId }));
    TestBed.tick();

    const typesReq = httpMock.expectOne((req) => req.url.includes('/munition-types'));
    typesReq.flush({
      items: [
        { id: 'type-proj', category: 'MUNITION', label: 'Proyectil 155mm', active: true },
        { id: 'type-fuse', category: 'MUNITION_COMPONENT', label: 'Espoleta M1', active: true },
      ],
    });
    await Promise.resolve();
    TestBed.tick();

    const planReq = httpMock.expectOne((req) => req.url.includes('planning/munitions'));
    planReq.flush({
      series: [
        {
          seriesId: 'serie-1',
          configurations: [
            {
              id: 'cfg-1',
              munitionTypeId: 'type-proj',
              denomination: { id: 'den-proj', name: '155 HE' },
              batch: 'LOT-P',
              assignedShotIds: ['shot-1'],
              components: [
                {
                  id: 'comp-1',
                  type: { id: 'type-fuse', label: 'Espoleta M1' },
                  denomination: { id: 'den-fuse', name: 'M1' },
                  batch: 'LOT-F',
                  fuseMeasurement: 12,
                },
              ],
            },
            {
              id: 'cfg-2',
              munitionTypeId: 'type-other',
              assignedShotIds: ['shot-2'],
              components: [],
            },
          ],
        },
      ],
    });
    await Promise.resolve();
    TestBed.tick();

    // Check components for shot-1
    const comps = handle.components();
    expect(comps).toHaveLength(2);
    expect(comps[0].value).toBe('type-proj');
    expect(comps[0].source).toBe('CONFIGURATION');
    expect(comps[1].value).toBe('type-fuse');
    expect(comps[1].source).toBe('COMPONENT');
    expect(comps[1].isFuse).toBe(true);

    // Switch shot to shot-2
    shotId.set('shot-2');
    const shot2Comps = handle.components();
    expect(shot2Comps).toHaveLength(1);
    expect(shot2Comps[0].value).toBe('type-other');
  });
});
