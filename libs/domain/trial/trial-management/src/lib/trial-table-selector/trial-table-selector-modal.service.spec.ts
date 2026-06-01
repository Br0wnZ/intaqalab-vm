import { TestBed } from '@angular/core/testing';

import { TrialTableSelectorModalService } from './trial-table-selector-modal.service';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('TrialTableSelectorModalService', () => {
  let service: TrialTableSelectorModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrialTableSelectorModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
