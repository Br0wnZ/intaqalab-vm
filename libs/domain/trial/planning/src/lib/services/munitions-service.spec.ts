import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MunitionsService } from './munitions-service';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => 'http://api.test/planning',
  injectFuseWorkingModesEndpoint: () => 'http://api.test/fuse-working-modes',
  injectMunitionComponentTypesEndpoint: () => 'http://api.test/munition-component-types',
  injectMunitionDenominationsEndpoint: () => 'http://api.test/munition-denominations',
  injectWharehouseEndpoint: () => 'http://api.test/warehouse',
}));

describe('MunitionsService', () => {
  let service: MunitionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MunitionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
