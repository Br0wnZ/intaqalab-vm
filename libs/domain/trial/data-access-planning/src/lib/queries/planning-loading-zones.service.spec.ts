import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningLoadingZonesService } from './planning-loading-zones.service';

const PLANNING_URL = 'http://localhost:3000/api/planning';
const LOADING_ZONES_URL = `${PLANNING_URL}/loading-zone`;

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => PLANNING_URL,
}));

describe('PlanningLoadingZonesService', () => {
  let service: PlanningLoadingZonesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PlanningLoadingZonesService],
    });
    service = TestBed.inject(PlanningLoadingZonesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not fetch loading zones before load is requested', () => {
    TestBed.tick();

    httpTestingController.expectNone(LOADING_ZONES_URL);
  });

  it('should fetch active loading zones with pageSize 100 when load is called', async () => {
    service.load();
    TestBed.tick();

    const request = httpTestingController.expectOne((candidate) => candidate.url === LOADING_ZONES_URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('pageSize')).toBe('100');
    expect(request.request.params.get('active')).toBe('true');

    request.flush({
      page: 1,
      pageSize: 100,
      totalElements: 1,
      items: [
        {
          id: 'lz-1',
          denomination: { id: 'denom-1', name: 'Charge 1' },
          zone: ['Z1', 'Z2'],
        },
      ],
    });
    TestBed.tick();
    await settle();

    expect(service.loadingZonesResource.value()).toEqual([
      {
        id: 'lz-1',
        denomination: { id: 'denom-1', name: 'Charge 1' },
        zone: ['Z1', 'Z2'],
      },
    ]);
  });
});

function settle(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
