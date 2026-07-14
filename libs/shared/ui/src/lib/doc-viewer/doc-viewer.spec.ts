import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import type { DocViewerData } from './doc-viewer';
import { DOC_VIEWER_SERVICE } from './doc-viewer.contract';

// Mock ng2-pdf-viewer para evitar errores de PDF.js en JSDOM
// Debe ir antes de importar DocViewer ya que este importa PdfViewerModule
vi.mock('ng2-pdf-viewer', () => {
  @NgModule({})
  class MockPdfViewerModule {}
  return {
    PdfViewerModule: MockPdfViewerModule,
  };
});

describe('DocViewer', () => {
  // Import dinámico DESPUÉS de vi.mock para que DocViewer reciba el mock
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let DocViewer: Awaited<typeof import('./doc-viewer')>['DocViewer'];

  beforeAll(async () => {
    const mod = await import('./doc-viewer');
    DocViewer = mod.DocViewer;
  });

  const setup = async () => {
    const user = userEvent.setup();
    const afterClosedSubject = new Subject<void>();
    const dialogRefSpy = {
      close: vi.fn(),
      afterClosed: vi.fn().mockReturnValue(afterClosedSubject.asObservable()),
    };

    const mockDialogData: DocViewerData = {
      documentId: 'doc-123',
      documentName: 'Test Document Report.pdf',
    };

    // Signals para simular el recurso
    const isLoadingSignal = signal(false);
    const valueSignal = signal<Blob | null | undefined>(undefined);

    const mockDocsService = {
      viewDocumentBlob: vi.fn(),
      resetViewDocumentBlob: vi.fn(),
      viewDocumentResource: {
        isLoading: isLoadingSignal,
        value: valueSignal,
      },
    };

    // Mock de createObjectURL/revokeObjectURL
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock');
      window.URL.revokeObjectURL = vi.fn();
    }

    const view = await render(DocViewer, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DOC_VIEWER_SERVICE, useValue: mockDocsService },
      ],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return {
      user,
      view,
      loader,
      dialogRefSpy,
      mockDocsService,
      mockDialogData,
      afterClosedSubject,
      isLoadingSignal,
      valueSignal,
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
    const { view, isLoadingSignal } = await setup();

    isLoadingSignal.set(true);
    view.fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByText(/cargando documento/i)).toBeInTheDocument();
    });
  });

  it('should render PDF viewer when a valid PDF blob is loaded', async () => {
    const { view, valueSignal } = await setup();

    const pdfBlob = new Blob(['fake-content'], { type: 'application/pdf' });
    valueSignal.set(pdfBlob);
    view.fixture.detectChanges();

    await waitFor(() => {
      const pdfViewer = view.fixture.nativeElement.querySelector('pdf-viewer');
      expect(pdfViewer).toBeTruthy();
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
    });
  });

  it('should display unsupported format message when no blob is loaded and not loading', async () => {
    const { view, isLoadingSignal, valueSignal } = await setup();

    // The "unsupported" message shows when value is null/undefined and not loading
    isLoadingSignal.set(false);
    valueSignal.set(null);
    view.fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByText(/ningún documento seleccionado o el formato no es soportado/i)).toBeInTheDocument();
    });
  });

  it('should close dialog when clicking the close button', async () => {
    const { loader, dialogRefSpy } = await setup();

    // Busca el botón por rol y aria-label (mejor que selector)
    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[mat-icon-button]' }));
    await closeButton.click();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should reset view document blob when dialog is closed', async () => {
    const { afterClosedSubject, mockDocsService } = await setup();

    afterClosedSubject.next();

    expect(mockDocsService.resetViewDocumentBlob).toHaveBeenCalled();
  });
});
