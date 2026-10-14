import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EquipmentTypeEnum } from '../execution/models';
import { EquipmentCatalogService } from './equipment-catalog.service';

describe('EquipmentCatalogService', () => {
  let service: EquipmentCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EquipmentCatalogService,
      ],
    });
    service = TestBed.inject(EquipmentCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    service.clearCache();
  });

  it('loads equipment items for a category and formats id and label', async () => {
    const promise = service.loadCategoryItems(EquipmentTypeEnum.DOPPLER_RADAR);

    const req = http.expectOne(
      (request) =>
        request.url.endsWith('/equipment/items') &&
        request.params.get('categoryId') === EquipmentTypeEnum.DOPPLER_RADAR,
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      totalElements: 2,
      items: [
        { id: 101, denominationName: 'Doppler 101', tag: 'DOP-01' },
        { id: null, denominationName: 'Unavailable', tag: 'N/A' },
      ],
    });

    const result = await promise;
    expect(result).toEqual([{ id: '101', label: 'Doppler 101 / DOP-01' }]);
  });

  it('returns cached results on subsequent requests for the same category without firing new HTTP calls', async () => {
    const firstPromise = service.loadCategoryItems(EquipmentTypeEnum.ANTENNA);
    const req = http.expectOne((r) => r.params.get('categoryId') === EquipmentTypeEnum.ANTENNA);
    req.flush({ totalElements: 1, items: [{ id: 201, denominationName: 'Antenna Horn', tag: 'ANT-01' }] });
    await firstPromise;

    const secondPromise = service.loadCategoryItems(EquipmentTypeEnum.ANTENNA);
    http.expectNone((r) => r.params.get('categoryId') === EquipmentTypeEnum.ANTENNA);
    const secondResult = await secondPromise;

    expect(secondResult).toEqual([{ id: '201', label: 'Antenna Horn / ANT-01' }]);
  });

  it('deduplicates in-flight requests for the same category', async () => {
    const promise1 = service.loadCategoryItems(EquipmentTypeEnum.AMPLIFIER);
    const promise2 = service.loadCategoryItems(EquipmentTypeEnum.AMPLIFIER);

    const req = http.expectOne((r) => r.params.get('categoryId') === EquipmentTypeEnum.AMPLIFIER);
    req.flush({ totalElements: 1, items: [{ id: 301, denominationName: 'Amp 301', tag: 'AMP-01' }] });

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1).toEqual(res2);
    expect(res1).toEqual([{ id: '301', label: 'Amp 301 / AMP-01' }]);
  });

  it('loads multiple categories in parallel', async () => {
    const promise = service.loadEquipmentItemsByCategories([
      EquipmentTypeEnum.DOPPLER_RADAR,
      EquipmentTypeEnum.ANTENNA,
    ]);

    const reqRadar = http.expectOne((r) => r.params.get('categoryId') === EquipmentTypeEnum.DOPPLER_RADAR);
    const reqAntenna = http.expectOne((r) => r.params.get('categoryId') === EquipmentTypeEnum.ANTENNA);

    reqRadar.flush({ totalElements: 1, items: [{ id: 11, denominationName: 'Radar', tag: 'R-01' }] });
    reqAntenna.flush({ totalElements: 1, items: [{ id: 22, denominationName: 'Antenna', tag: 'A-01' }] });

    const result = await promise;
    expect(result[EquipmentTypeEnum.DOPPLER_RADAR]).toEqual([{ id: '11', label: 'Radar / R-01' }]);
    expect(result[EquipmentTypeEnum.ANTENNA]).toEqual([{ id: '22', label: 'Antenna / A-01' }]);
  });

  it('handles empty category array without HTTP requests', async () => {
    const result = await service.loadEquipmentItemsByCategories([]);
    http.expectNone((r) => r.url.includes('/equipment/items'));
    expect(result).toEqual({});
  });
});
