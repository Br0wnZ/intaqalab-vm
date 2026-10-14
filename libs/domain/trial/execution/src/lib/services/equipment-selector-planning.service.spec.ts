import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentSelectorPlanningService } from './equipment-selector-planning.service';

describe('EquipmentSelectorPlanningService (re-export alias)', () => {
  let service: EquipmentSelectorPlanningService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EquipmentSelectorPlanningService,
      ],
    });
    service = TestBed.inject(EquipmentSelectorPlanningService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('delegates to the underlying planning service implementation', async () => {
    service.load('trial-1');
    TestBed.tick();

    const planned = http.expectOne((request) => request.url.endsWith('/fire-trials/trial-1/planning/measures'));
    expect(planned.request.method).toBe('GET');
    planned.flush({ series: [{ seriesId: 's1', measures: { ballisticsMeasures: [{ id: 'm1' }] } }] });

    const catalog = http.expectOne((request) => request.url.endsWith('/measures'));
    expect(catalog.request.params.get('pageSize')).toBe('100');
    catalog.flush({
      page: 1,
      pageSize: 100,
      totalElements: 1,
      items: [{ id: 'm1', measurements: ['INITIAL_VELOCITY'] }],
    });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(service.catalog()).toHaveLength(1);
    });

    expect(service.isLoading()).toBe(false);
  });
});
