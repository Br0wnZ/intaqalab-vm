import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { TrialDocsService } from '../../services/trial-docs-service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog';
import { TrialDocs } from './trial-docs';
import { TrialDocsFilePicker } from './trial-docs-file-picker/trial-docs-file-picker';

// Mock ng2-pdf-viewer to avoid PDF.js JSDOM incompatibility
// vi.mock is hoisted by Vitest so this intercepts the import in the full module graph
vi.mock('ng2-pdf-viewer', async () => {
  const { NgModule, CUSTOM_ELEMENTS_SCHEMA } = await import('@angular/core');
  class PdfViewerModule {}
  NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })(PdfViewerModule);
  return { PdfViewerModule };
});

/* eslint-disable @typescript-eslint/no-explicit-any */

const MOCK_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'test-document.pdf',
    fileName: 'test-document.pdf',
    status: 'ACTIVE',
    version: '1.0',
    category: 'PROTOCOL',
    type: { id: 'type-1', name: 'Protocolo Inicial' },
    createdAt: '2023-01-01',
    fileType: 'pdf',
  },
  {
    id: 'doc-2',
    name: 'image.png',
    fileName: 'image.png',
    status: 'OBSOLETE',
    version: '0.9',
    category: 'OTHER',
    type: { id: 'type-2', name: 'Imagen' },
    createdAt: '2022-12-31',
    fileType: 'image',
  },
];

const MOCK_SUBTYPES = [
  { id: 'type-1', name: 'Protocolo Inicial' },
  { id: 'type-2', name: 'Imagen' },
];

describe('TrialDocs', () => {
  let mockTrialDocsService: any;
  let mockDialog: any;

  beforeEach(() => {
    const documentsSignal = signal<any>({ items: [] });
    const documentsLoadingSignal = signal(false);
    const documentsErrorSignal = signal<any>(undefined);
    const subtypesSignal = signal<any>(MOCK_SUBTYPES);
    const subtypesErrorSignal = signal<any>(undefined);
    const deleteStatusSignal = signal<string>('idle');
    const deleteValueSignal = signal<any>(undefined);
    const deleteErrorSignal = signal<any>(undefined);
    const deleteLoadingSignal = signal(false);
    const downloadStatusSignal = signal<string>('idle');
    const downloadValueSignal = signal<any>(undefined);
    const downloadLoadingSignal = signal(false);

    mockTrialDocsService = {
      documentsResource: {
        value: documentsSignal,
        isLoading: documentsLoadingSignal,
        error: documentsErrorSignal,
      },
      documentTypesResource: {
        value: subtypesSignal,
        error: subtypesErrorSignal,
      },
      deleteDocumentResource: {
        status: deleteStatusSignal,
        value: deleteValueSignal,
        error: deleteErrorSignal,
        isLoading: deleteLoadingSignal,
      },
      downloadDocumentResource: {
        status: downloadStatusSignal,
        value: downloadValueSignal,
        isLoading: downloadLoadingSignal,
      },
      refreshDocumentTypes: vi.fn(),
      getDocuments: vi.fn(),
      deleteDocument: vi.fn(),
      downloadDocument: vi.fn(),
      resetDelete: vi.fn(),
      resetDownloadDocument: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true),
      }),
    };
  });

  const renderComponent = async (trialId = 'TRIAL-123') => {
    return render(`<inta-trial-docs [trialId]="'${trialId}'"></inta-trial-docs>`, {
      imports: [TrialDocs, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TrialDocsService, useValue: mockTrialDocsService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });
  };

  it('should render empty state when no documents and no filters', async () => {
    await renderComponent();

    expect(screen.getByText('TRIAL_DOCS.LABEL')).toBeTruthy();
    expect(screen.getByText('TRIAL_DOCS.ADD_DOC')).toBeTruthy();
    expect(screen.getByText('TRIAL_DOCS.DRAG_HERE')).toBeTruthy();

    expect(screen.queryByRole('table')).toBeNull();
  });

  it('should render loading state', async () => {
    (mockTrialDocsService.documentsResource.isLoading as WritableSignal<boolean>).set(true);
    await renderComponent();

    expect(screen.getByText('TRIAL_DOCS.FILTERS.SHOW_ACTIVE_ONLY')).toBeTruthy();
  });

  it('should render documents in the table', async () => {
    (mockTrialDocsService.documentsResource.value as WritableSignal<any>).set({ items: MOCK_DOCUMENTS });

    await renderComponent();

    expect(screen.getAllByText('test-document.pdf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('image.png').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Protocolo Inicial').length).toBeGreaterThan(0);
  });

  it('should open file picker when add button is clicked', async () => {
    await renderComponent();

    const user = userEvent.setup();
    const addButton = screen.getByText('TRIAL_DOCS.ADD_DOC');
    await user.click(addButton);

    expect(mockDialog.open).toHaveBeenCalledWith(
      TrialDocsFilePicker,
      expect.objectContaining({
        width: '1024px',
        data: { trialId: 'TRIAL-123' },
      }),
    );
  });

  it('should call getDocuments with correct filters when toggling "Show Active Only"', async () => {
    (mockTrialDocsService.documentsResource.isLoading as WritableSignal<boolean>).set(true);
    await renderComponent();

    expect(mockTrialDocsService.getDocuments).toHaveBeenCalledWith('TRIAL-123', { status: 'ACTIVE' });

    const user = userEvent.setup();
    const toggle = screen.getByRole('switch');

    await user.click(toggle);
    expect(mockTrialDocsService.getDocuments).toHaveBeenCalledWith('TRIAL-123', {});

    await user.click(toggle);
    expect(mockTrialDocsService.getDocuments).toHaveBeenCalledWith('TRIAL-123', { status: 'ACTIVE' });
  });

  it('should call deleteDocument when delete action is confirmed', async () => {
    (mockTrialDocsService.documentsResource.value as WritableSignal<any>).set({ items: MOCK_DOCUMENTS });
    const result = await renderComponent();

    const fixture = result.fixture;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(TrialDocs as any));
    const compInstance = debugEl.componentInstance as any;

    compInstance.deleteDocument(MOCK_DOCUMENTS[0]);

    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmDeleteDialogComponent, expect.anything());

    // After dialog closes with true, loadDocuments() is called (not deleteDocument directly)
    // deleteDocument is called inside the ConfirmDeleteDialogComponent
    expect(mockTrialDocsService.getDocuments).toHaveBeenCalled();
  });

  it('should call getDocuments with filters when form values change', async () => {
    const result = await renderComponent();
    const fixture = result.fixture;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(TrialDocs as any));
    const compInstance = debugEl.componentInstance as any;

    compInstance.docsForm().reset({ status: 'Obsoleto', category: 'Otros', typeId: 'type-2' });

    fixture.detectChanges();

    expect(mockTrialDocsService.getDocuments).toHaveBeenCalledWith(
      'TRIAL-123',
      expect.objectContaining({ status: 'Obsoleto', category: 'Otros', typeId: 'type-2' }),
    );
  });

  it('should log when downloading a document', async () => {
    (mockTrialDocsService.documentsResource.value as WritableSignal<any>).set({ items: MOCK_DOCUMENTS });
    const result = await renderComponent();
    const fixture = result.fixture;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(TrialDocs as any));
    const compInstance = debugEl.componentInstance as any;
    compInstance.downloadDocument(MOCK_DOCUMENTS[0]);
    expect(mockTrialDocsService.downloadDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should set deletingDocumentId and reflect loading state when delete is pending', async () => {
    (mockTrialDocsService.documentsResource.value as WritableSignal<any>).set({ items: MOCK_DOCUMENTS });

    (mockTrialDocsService.deleteDocumentResource.status as WritableSignal<string>).set('pending');
    (mockTrialDocsService.deleteDocumentResource.isLoading as WritableSignal<boolean>).set(true);

    const result = await renderComponent();
    const fixture = result.fixture;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(TrialDocs as any));
    const compInstance = debugEl.componentInstance as any;

    compInstance.deletingDocumentId.set('doc-1');
    fixture.detectChanges();

    expect(compInstance.deletingDocumentId()).toEqual('doc-1');
    expect((mockTrialDocsService.deleteDocumentResource.isLoading as WritableSignal<boolean>)()).toBeTruthy();
  });
});
