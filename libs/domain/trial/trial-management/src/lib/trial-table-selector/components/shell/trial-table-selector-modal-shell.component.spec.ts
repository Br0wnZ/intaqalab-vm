import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { TrialTableSelectorModalShellComponent } from './trial-table-selector-modal-shell.component';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('TrialTableSelectorModalShellComponent', () => {
  beforeEach(async () => {
    await render(TrialTableSelectorModalShellComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: {} },
      ],
    });
  });

  it('should render the dialog title', () => {
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should render the cancel button', () => {
    const cancelButton = screen.getByRole('button', { name: /cancel|cancelar/i });
    expect(cancelButton).toBeInTheDocument();
  });
});
