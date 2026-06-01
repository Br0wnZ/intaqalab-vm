import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { GeneralDataService } from './general-data.service';

describe('GeneralDataService', () => {
  let service: GeneralDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeneralDataService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(GeneralDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.searchItems).toBeDefined();
    expect(service.filtersItems).toBeDefined();
  });
});
