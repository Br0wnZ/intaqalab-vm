import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockState } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../../../services/trial-docs-service';
import type { DocumentVersion } from '../../../../../utils-models/documents-service.model';
import { TrialDocVersionsTab } from './trial-doc-versions-tab';

function makeMockDocsService() {
  const documentVersionsResource = createMockResource<DocumentVersion[]>();
  return {
    documentVersionsResource,
    getDocumentVersions: vi.fn(),
    resetDocumentVersions: vi.fn(),
    _documentVersionsResource: documentVersionsResource,
  };
}

const mockDocumentVersions: DocumentVersion[] = [
  {
    id: '1',
    versionTag: 'v1.0',
    createdAt: '2025-01-01',
    createdBy: 'User 1',
    isActive: true,
  },
];

describe('TrialDocVersionsTab', () => {
  it('should render the component', async () => {
    const mockService = makeMockDocsService();
    const { fixture } = await render(TrialDocVersionsTab, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        provideAnimationsAsync(),
        { provide: TrialDocsService, useValue: mockService },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(true) })) } },
      ],
      componentInputs: { documentId: 'doc-001' },
    });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render versions when documentVersionsResource has value', async () => {
    const mockService = makeMockDocsService();
    mockService._documentVersionsResource._setValue(mockDocumentVersions);

    const { fixture } = await render(TrialDocVersionsTab, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        provideAnimationsAsync(),
        { provide: TrialDocsService, useValue: mockService },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(true) })) } },
      ],
      componentInputs: { documentId: 'doc-001' },
    });

    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    expect(deferBlocks.length).toBeGreaterThan(0);
    await deferBlocks[0].render(DeferBlockState.Complete);

    expect(fixture.nativeElement.querySelector('inta-trial-doc-versions')).toBeTruthy();
  });
});
