import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { StanagService } from './stanag.service';

describe('StanagService', () => {
  let service: StanagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StanagService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(StanagService);
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
