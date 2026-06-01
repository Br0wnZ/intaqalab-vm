import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { LoadingZoneDenominationsService } from './loading-zone-denominations.service';

describe('LoadingZoneDenominationsService', () => {
  let service: LoadingZoneDenominationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadingZoneDenominationsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
      ],
    });
    service = TestBed.inject(LoadingZoneDenominationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.getDenominationsResponse).toBeDefined();
  });
});
