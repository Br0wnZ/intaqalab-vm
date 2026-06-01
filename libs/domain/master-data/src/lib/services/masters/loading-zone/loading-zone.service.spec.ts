import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { LoadingZoneService } from './loading-zone.service';

describe('LoadingZoneService', () => {
  let service: LoadingZoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingZoneService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(LoadingZoneService);
  });

  it('should be created and delegate to Master Data Resource Factory', () => {
    expect(service).toBeTruthy();
    expect(service.searchItems).toBeDefined();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.create).toBeDefined();
    expect(service.updateItem).toBeDefined();
    expect(service.deleteItem).toBeDefined();
  });
});
