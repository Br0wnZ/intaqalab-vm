import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { SeriesAndShootsService } from './series-and-shoots.service';

describe('SeriesAndShootsService', () => {
  let service: SeriesAndShootsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeriesAndShootsService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(SeriesAndShootsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.searchItems).toBeDefined();
    expect(service.filtersItems).toBeDefined();
  });
});
