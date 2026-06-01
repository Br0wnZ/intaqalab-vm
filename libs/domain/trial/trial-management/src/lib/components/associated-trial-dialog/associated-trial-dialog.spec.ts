import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { AssociatedTrialDialog } from './associated-trial-dialog';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('AssociatedTrialDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  const defaultImports = [TranslateModule.forRoot()];

  const renderDialog = async (data?: { title?: string }, closeFn?: ReturnType<typeof vi.fn>) => {
    return render(AssociatedTrialDialog, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data || { title: 'Test Dialog' } },
      ],
      imports: defaultImports,
    });
  };

  beforeEach(() => {
    closeMock = vi.fn();
  });

  it('should render and create', async () => {
    await renderDialog();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
  });

  it('should call close when close button is clicked', async () => {
    await renderDialog(undefined, closeMock);
    const closeButton = screen.getByTestId('cancel-button');
    closeButton.click();
    expect(closeMock).toHaveBeenCalled();
  });

  it('should show translated title if translation is available', async () => {
    await renderDialog({ title: 'associatedTrialDialog.title' });
    expect(screen.getByText(/associatedTrialDialog.title/i)).toBeInTheDocument();
  });

  it('should render dialog content', async () => {
    await renderDialog();
    expect(screen.getByTestId('associated-trial-dialog-content')).toBeInTheDocument();
  });
});
