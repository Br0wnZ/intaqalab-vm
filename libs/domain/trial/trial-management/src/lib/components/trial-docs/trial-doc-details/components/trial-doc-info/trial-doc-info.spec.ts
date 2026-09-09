import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../../../services/trial-docs-service';
import type {
  DocumentDetail,
  DocumentFireTrialSync,
  DocumentObservations,
  DocumentVersion,
} from '../../../../../utils-models/documents-service.model';
import { TrialDocInfo } from './trial-doc-info';

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
    _documentAssociatedTrialsResource: documentAssociatedTrialsResource,
  };
}

const MOCK_DOCUMENT_DETAIL_GENERAL: DocumentDetail = {
  id: 'doc-001',
  name: 'informe-general.pdf',
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

const MOCK_DOCUMENT_DETAIL_SPECIFIC: DocumentDetail = {
  id: 'doc-002',
  name: 'informe-particular.pdf',
  category: 'SPECIFIC',
  type: {
    id: 'type-2',
    label: 'Subtipo 2',
    name: { es: 'Subtipo 2', en: 'Subtype 2' },
    active: true,
    category: 'SPECIFIC',
  },
  versions: [],
  centerId: 'center-1',
  createdBy: 'usuario2@inta.es',
  createdAt: '2025-01-02T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
};

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

  const view = await render(TrialDocInfo, {
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
  const translateService = fixture.debugElement.injector.get(TranslateService);

  translateService.setTranslation('es', {
    COMMONS: { EDIT: 'Editar' },
    TRIAL_DOCS: {
      DOC_DETAILS: {
        ACTIONS: 'Acciones',
        DELETE: 'Eliminar',
        NEW_VERSION: 'Nueva versión',
        ASSOCIATED_TRIALS: 'Asociar a otras pruebas',
        DOCUMENT_TYPE: 'Tipo de documento',
        CATEGORIES: {
          GENERAL: 'General',
          SPECIFIC: 'Particular',
        },
        TABLE_COLUMNS: {
          TRIAL_NUMBER: 'Número de prueba',
          VINCULATED_USER: 'Usuario vinculación',
          VINCULATED_DATE: 'Fecha vinculación',
        },
        VINCULATED_TRIALS: 'Pruebas a las que está vinculado',
      },
      DELETE_DOCUMENT_DIALOG: {
        TITLE: 'Eliminación de documento',
        DESCRIPTION: 'Vas a eliminar el documento {{ fileName }}',
        MESSAGE: 'Esta acción implica el borrado definitivo',
        CONFIRM: 'Eliminar documento',
        BACK: 'Volver',
      },
    },
  });
  translateService.use('es');

  fixture.detectChanges();

  return { fixture, component, mockService, mockDialog, translateService };
}

describe('TrialDocInfo', () => {
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

    it('should show the Actions button', async () => {
      await setup();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('should initialize with empty form model when no detail is loaded', async () => {
      const { component } = await setup();
      expect(component.docDetailsModel()).toEqual({
        documentCategory: '',
        documentType: '',
        responsibleUser: '',
        documentTitle: '',
      });
    });
  });

  describe('Document Category translations (GENERAL / SPECIFIC)', () => {
    it('should translate GENERAL category to "General"', async () => {
      const { component, mockService, fixture } = await setup({ documentId: 'doc-001' });

      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL_GENERAL);
      fixture.detectChanges();

      expect(component.docDetailsModel().documentCategory).toBe('General');
    });

    it('should translate SPECIFIC category to "Particular"', async () => {
      const { component, mockService, fixture } = await setup({ documentId: 'doc-002' });

      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL_SPECIFIC);
      fixture.detectChanges();

      expect(component.docDetailsModel().documentCategory).toBe('Particular');
    });

    it('should update category translation when language changes', async () => {
      const { component, mockService, fixture, translateService } = await setup({ documentId: 'doc-002' });

      translateService.setTranslation('en', {
        TRIAL_DOCS: {
          DOC_DETAILS: {
            CATEGORIES: {
              GENERAL: 'General',
              SPECIFIC: 'Specific',
            },
          },
        },
      });

      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL_SPECIFIC);
      fixture.detectChanges();
      expect(component.docDetailsModel().documentCategory).toBe('Particular');

      translateService.use('en');
      fixture.detectChanges();
      expect(component.docDetailsModel().documentCategory).toBe('Specific');
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
      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL_GENERAL);
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

  describe('Download document', () => {
    it('should call service downloadDocument when document is loaded', async () => {
      const { component, mockService } = await setup({ documentId: 'doc-001' });
      mockService._documentDetailResource._setValue(MOCK_DOCUMENT_DETAIL_GENERAL);
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
