import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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

// Issue #14: ng2-pdf-viewer crashes JSDOM — must be mocked BEFORE any import
// that transitively loads it. Use a SYNCHRONOUS factory (async fails in this project).
// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

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
    _documentDetailResource: documentDetailResource,
    _deleteAssociatedDocumentResource: deleteAssociatedDocumentResource,
    _downloadDocumentResource: downloadDocumentResource,
  };
}

const MOCK_DOCUMENT_DETAIL: DocumentDetail = {
  id: 'doc-001',
  name: 'informe-prueba.pdf',
  category: 'GENERAL',
  type: {
    id: 'type-1',
    label: 'Subtipo 1',
    name: { es: 'Subtipo 1', en: 'Subtype 1' },
    active: true,
    category: 'GENERAL',
  },
  versions: [],
  centerId: 'center-1',
  createdBy: 'usuario@inta.es',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Dialog mock (real Observable — compatible with firstValueFrom and .subscribe)
// ---------------------------------------------------------------------------

function makeDialog(defaultResult: unknown = null) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(defaultResult)),
    }),
  };
}

// ---------------------------------------------------------------------------
// Setup helper
// ---------------------------------------------------------------------------

async function setup(options: { documentId?: string; mockDialog?: ReturnType<typeof makeDialog> } = {}) {
  const mockService = makeMockDocsService();
  const mockDialog = options.mockDialog ?? makeDialog();
  const user = userEvent.setup();

  const renderResult = await render(TrialDocDetails, {
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

  const fixture = renderResult.fixture;
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, mockService, mockDialog, user };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TrialDocDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    it('should show the Actions button', async () => {
      await setup();
      expect(screen.getByText('TRIAL_DOCS.DOC_DETAILS.ACTIONS')).toBeInTheDocument();
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

  describe('Actions menu', () => {
    it('should open edit dialog when onAction("edit") is called', async () => {
      const mockDialog = makeDialog(null);
      const { component } = await setup({ documentId: 'doc-001', mockDialog });
      component.onAction('edit');
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should open delete confirm dialog when onAction("delete") is called with document loaded', async () => {
      const mockDialog = makeDialog(null);
      const { component, mockService } = await setup({ documentId: 'doc-001', mockDialog });
      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL);
      component.onAction('delete');
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should NOT open dialog when onAction("delete") is called without loaded document', async () => {
      const mockDialog = makeDialog(null);
      const { component } = await setup({ mockDialog });
      component.onAction('delete');
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open file picker dialog when onAction("new_version") is called', async () => {
      const mockDialog = makeDialog(null);
      const { component } = await setup({ documentId: 'doc-001', mockDialog });
      component.onAction('new_version');
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should open associated trials dialog when onAction("associated_trials") is called', async () => {
      const mockDialog = makeDialog(null);
      const { component } = await setup({ documentId: 'doc-001', mockDialog });
      component.onAction('associated_trials');
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should not open any dialog for unknown action', async () => {
      const mockDialog = makeDialog(null);
      const { component } = await setup({ mockDialog });
      component.onAction('unknown_action');
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('opened signal', () => {
    it('should start with opened = false', async () => {
      const { component } = await setup();
      expect(component.opened()).toBe(false);
    });
  });

  describe('downloadDocument()', () => {
    it('should call service downloadDocument when document is loaded', async () => {
      const { component, mockService } = await setup({ documentId: 'doc-001' });
      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL);
      component.downloadDocument();
      expect(mockService.downloadDocument).toHaveBeenCalledWith('doc-001');
    });

    it('should not call service when no document is loaded', async () => {
      const { component, mockService } = await setup();
      component.downloadDocument();
      expect(mockService.downloadDocument).not.toHaveBeenCalled();
    });
  });
});
