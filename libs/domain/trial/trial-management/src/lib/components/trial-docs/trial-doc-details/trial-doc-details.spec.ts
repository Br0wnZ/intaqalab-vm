import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../services/trial-docs-service';
import type {
  DocumentDetail,
  DocumentFireTrialSync,
  DocumentObservations,
  DocumentVersion,
} from '../../../utils-models/documents-service.model';
import { TrialDocDetails } from './trial-doc-details';

function makeMockDocsService() {
  const documentDetailResource = createMockResource<DocumentDetail>();
  const documentObservationsResource = createMockResource<DocumentObservations>();
  const documentVersionsResource = createMockResource<DocumentVersion[]>();
  const documentAssociatedTrialsResource = createMockResource<DocumentFireTrialSync>();
  const deleteAssociatedDocumentResource = createMockResource<void>();
  const downloadDocumentResource = createMockResource<Blob>();
  const uploadNewDocumentVersionResource = createMockResource<void>();

  return {
    documentDetailResource,
    documentObservationsResource,
    documentVersionsResource,
    documentAssociatedTrialsResource,
    deleteAssociatedDocumentResource,
    downloadDocumentResource,
    uploadNewDocumentVersionResource,
    fireTrialId: vi.fn(() => null),
    getDocumentDetail: vi.fn(),
    getDocumentVersions: vi.fn(),
    getDocumentAssociatedTrials: vi.fn(),
    deleteAssociatedDocument: vi.fn(),
    resetDeleteAssociated: vi.fn(),
    downloadDocument: vi.fn(),
    resetDownloadDocument: vi.fn(),
    resetDocumentDetail: vi.fn(),
    resetDocumentObservations: vi.fn(),
    resetDocumentVersions: vi.fn(),
    resetDocumentAssociatedTrials: vi.fn(),
  };
}

function makeDialog(defaultResult: unknown = null) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(defaultResult)),
    }),
  };
}

async function setup(options: { documentId?: string; mockDialog?: ReturnType<typeof makeDialog> } = {}) {
  const mockService = makeMockDocsService();
  const mockDialog = options.mockDialog ?? makeDialog();

  const view = await render(TrialDocDetails, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      provideAnimationsAsync(),
      { provide: TrialDocsService, useValue: mockService },
      { provide: Router, useValue: { navigateByUrl: vi.fn() } },
    ],
    componentProviders: [{ provide: MatDialog, useValue: mockDialog }],
    componentInputs: options.documentId ? { documentId: options.documentId } : {},
  });

  const fixture = view.fixture;
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, mockService, mockDialog };
}

describe('TrialDocDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should show the section title', async () => {
      await setup();
      expect(screen.getByText('TRIAL_DOCS.DOC_DETAILS.TITLE')).toBeInTheDocument();
    });

    it('should render both tab labels', async () => {
      await setup();
      expect(screen.getByText('TRIAL_DOCS.DOC_DETAILS.DOCUMENT_MAT_LABEL')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_DOCS.DOC_DETAILS.VERSIONS_MAT_LABEL')).toBeInTheDocument();
    });

    it('should render the document info subcomponent in first tab', async () => {
      const { fixture } = await setup();
      expect(fixture.nativeElement.querySelector('inta-trial-doc-info')).toBeTruthy();
    });
  });

  describe('Effect: documentId changes', () => {
    it('should call get* methods when documentId is provided', async () => {
      const { mockService } = await setup({ documentId: 'doc-123' });

      expect(mockService.getDocumentDetail).toHaveBeenCalledWith('doc-123');
      expect(mockService.getDocumentVersions).toHaveBeenCalledWith('doc-123');
      expect(mockService.getDocumentAssociatedTrials).toHaveBeenCalledWith('doc-123');
    });

    it('should call reset* methods when documentId is undefined', async () => {
      const { mockService } = await setup();

      expect(mockService.resetDocumentDetail).toHaveBeenCalled();
      expect(mockService.resetDocumentVersions).toHaveBeenCalled();
      expect(mockService.resetDocumentAssociatedTrials).toHaveBeenCalled();
    });
  });

  describe('Tab navigation', () => {
    it('should start on tab index 0', async () => {
      const { component } = await setup();
      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should update selectedTabIndex when onTabChange is called', async () => {
      const { component } = await setup();
      component.onTabChange(1);
      expect(component.selectedTabIndex()).toBe(1);
    });
  });
});
