import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { TrialTypeService } from './trial-type.service';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('TrialTypeService', () => {
  let service: TrialTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), TrialTypeService],
    });
    service = TestBed.inject(TrialTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
