import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { FuzeTypeService } from './fuze-types.service';

describe('FuzeTypeService', () => {
  let service: FuzeTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuzeTypeService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(FuzeTypeService);
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
