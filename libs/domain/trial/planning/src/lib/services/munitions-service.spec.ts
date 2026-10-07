import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MunitionBulkUpdateRequest } from '../utils-models/munitions.model';
import { MunitionsService } from './munitions-service';

const TRIAL_ID = 'trial-123';
const MUNITIONS_URL = `http://api.test/planning/fire-trials/${TRIAL_ID}/planning/munitions`;

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => 'http://api.test/planning',
  injectFuseWorkingModesEndpoint: () => 'http://api.test/fuse-working-modes',
  injectMunitionComponentTypesEndpoint: () => 'http://api.test/munition-component-types',
  injectMunitionDenominationsEndpoint: () => 'http://api.test/munition-denominations',
  injectWharehouseEndpoint: () => 'http://api.test/warehouse',
  injectWharehouseEndpoint: () => 'http://api.test/warehouse',
}));

describe('MunitionsService', () => {
  let service: MunitionsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MunitionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should GET munitions for a trial', () => {
    service.getMunitions(TRIAL_ID);
    TestBed.tick();

    const request = httpTestingController.expectOne(MUNITIONS_URL);
    expect(request.request.method).toBe('GET');
    request.flush({ series: [] });
  });

  it('should PUT munitions for a trial', () => {
    const body: MunitionBulkUpdateRequest = { configurations: [] };
    service.updateMunitions(TRIAL_ID, body);
    TestBed.tick();

    const request = httpTestingController.expectOne(MUNITIONS_URL);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(null);
  });
});
