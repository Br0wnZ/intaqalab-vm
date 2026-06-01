import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { DocumentTypeService } from './document-types.service';

describe('DocumentTypeService', () => {
  let service: DocumentTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentTypeService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(DocumentTypeService);
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
