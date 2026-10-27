import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import type { DocViewerData } from './doc-viewer';
import { DocViewer } from './doc-viewer';
import { DOC_VIEWER_SERVICE } from './doc-viewer.contract';

describe('DocViewer', () => {
  beforeEach(() => {
    TestBed.overrideComponent(DocViewer, {
      remove: { imports: [PdfViewerModule] },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
    });
  });

  const setup = async () => {
    const afterClosedSubject = new Subject<void>();
    const dialogRefSpy = {
      close: vi.fn(),
      afterClosed: vi.fn().mockReturnValue(afterClosedSubject.asObservable()),
    };

    const mockDialogData: DocViewerData = {
      documentId: 'doc-123',
      documentName: 'Test Document Report.pdf',
    };

    const viewDocumentResource = createMockResource<Blob | null>();
    const mockDocsService = {
      viewDocumentBlob: vi.fn(),
      resetViewDocumentBlob: vi.fn(),
      viewDocumentResource,
    };

    // Mock de createObjectURL/revokeObjectURL
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock');
      window.URL.revokeObjectURL = vi.fn();
    }

    const view = await render(DocViewer, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideTestingEnvironment(),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DOC_VIEWER_SERVICE, useValue: mockDocsService },
      ],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TRIAL_DOCS: {
        DOC_VIEWER: {
          LOADING: 'Cargando documento...',
          NO_DOCUMENT_OR_UNSUPPORTED: 'Ningún documento seleccionado o el formato no es soportado (debe ser PDF)',
        },
      },
    });
    translate.use('es');
    view.fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return {
      view,
      loader,
      dialogRefSpy,
      mockDocsService,
      mockDialogData,
      afterClosedSubject,
      viewDocumentResource,
    };
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should request document blob on init and display document name', async () => {
    const { mockDocsService, mockDialogData } = await setup();

    expect(screen.getByText(mockDialogData.documentName)).toBeInTheDocument();
    expect(mockDocsService.viewDocumentBlob).toHaveBeenCalledWith(mockDialogData.documentId);
  });

  it('should display loading state when resource is loading', async () => {
    const { view, viewDocumentResource } = await setup();

    viewDocumentResource._setLoading(true);
    view.fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByText(/cargando documento/i)).toBeInTheDocument();
    });
  });

  it('should render PDF viewer when a valid PDF blob is loaded', async () => {
    const { view, viewDocumentResource } = await setup();

    const pdfBlob = new Blob(['fake-content'], { type: 'application/pdf' });
    viewDocumentResource._setValue(pdfBlob);
    view.fixture.detectChanges();

    await waitFor(() => {
      const pdfViewer = view.fixture.debugElement.query(By.css('pdf-viewer'));
      expect(pdfViewer).toBeTruthy();
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
    });
  });

  it('should display unsupported format message when no blob is loaded and not loading', async () => {
    const { view, viewDocumentResource } = await setup();

    viewDocumentResource._setLoading(false);
    viewDocumentResource._setValue(null);
    view.fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByText(/ningún documento seleccionado o el formato no es soportado/i)).toBeInTheDocument();
    });
  });

  it('should close dialog when clicking the close button', async () => {
    const { loader, dialogRefSpy } = await setup();

    const [closeButton] = await loader.getAllHarnesses(MatButtonHarness);
    if (!closeButton) throw new Error('Close button not found');
    await closeButton.click();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should reset view document blob when dialog is closed', async () => {
    const { afterClosedSubject, mockDocsService } = await setup();

    afterClosedSubject.next();

    expect(mockDocsService.resetViewDocumentBlob).toHaveBeenCalled();
  });
});
