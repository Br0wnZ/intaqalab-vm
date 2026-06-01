import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { SpecialDaysManagerService } from './special-days-manager.service';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('SpecialDaysManagerService', () => {
  let service: SpecialDaysManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(SpecialDaysManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
