import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentPlanningService } from './equipment-planning.service';

describe('EquipmentPlanningService', () => {
  let service: EquipmentPlanningService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EquipmentPlanningService,
      ],
    });
    service = TestBed.inject(EquipmentPlanningService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches planned trial measures and catalog with pageSize 100 upon loading trial', async () => {
    service.load('trial-1');
    TestBed.tick();

    const plannedReq = http.expectOne((request) => request.url.endsWith('/fire-trials/trial-1/planning/measures'));
    expect(plannedReq.request.method).toBe('GET');

    const catalogReq = http.expectOne((request) => request.url.endsWith('/measures'));
    expect(catalogReq.request.method).toBe('GET');
    expect(catalogReq.request.params.get('page')).toBe('1');
    expect(catalogReq.request.params.get('pageSize')).toBe('100');

    plannedReq.flush({
      series: [{ seriesId: 's1', measures: { ballisticsMeasures: [{ id: 'm1' }] } }],
    });
    catalogReq.flush({
      page: 1,
      pageSize: 100,
      totalElements: 1,
      items: [{ id: 'm1', measurements: ['INITIAL_VELOCITY'] }],
    });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(service.catalog()).toHaveLength(1);
    });

    expect(service.catalog()[0]?.id).toBe('m1');
    expect(service.trialMeasuresResource.value()?.series[0]?.seriesId).toBe('s1');
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('exposes catalog HTTP failure instead of staying in loading state', async () => {
    service.load('trial-1');
    TestBed.tick();

    http.expectOne((request) => request.url.endsWith('/fire-trials/trial-1/planning/measures')).flush({ series: [] });
    http
      .expectOne((request) => request.url.endsWith('/measures'))
      .flush('Unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(service.error()).toBeTruthy();
    });

    expect(service.isLoading()).toBe(false);
  });

  it('exposes trial measures HTTP failure', async () => {
    service.load('trial-1');
    TestBed.tick();

    http
      .expectOne((request) => request.url.endsWith('/fire-trials/trial-1/planning/measures'))
      .flush('Forbidden', {
        status: 403,
        statusText: 'Forbidden',
      });
    http
      .expectOne((request) => request.url.endsWith('/measures'))
      .flush({
        page: 1,
        pageSize: 100,
        totalElements: 0,
        items: [],
      });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(service.error()).toBeTruthy();
    });

    expect(service.isLoading()).toBe(false);
  });
});
