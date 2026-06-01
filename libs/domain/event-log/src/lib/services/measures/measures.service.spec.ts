import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { MeasuresService } from './measures.service';

describe('MeasuresService', () => {
  let service: MeasuresService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MeasuresService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MeasuresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.searchItems).toBeDefined();
    expect(service.filtersItems).toBeDefined();
  });
});
