import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { SpecialDaysDataServiceService } from './special-days-data-service.service';

describe('SpecialDaysDataServiceService', () => {
  let service: SpecialDaysDataServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(SpecialDaysDataServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
