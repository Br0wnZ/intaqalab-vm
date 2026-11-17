import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { TrialTableSelectorModalShellComponent } from './trial-table-selector-modal-shell.component';

// vi.mock hoisted by Vitest
describe('TrialTableSelectorModalShellComponent', () => {
  const setup = () =>
    render(TrialTableSelectorModalShellComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: {} },
        provideTranslateService(),
      ],
    });

  it('should render the dialog title', async () => {
    await setup();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should render the cancel button', async () => {
    await setup();
    const cancelButton = screen.getByRole('button', { name: /cancel|cancelar/i });
    expect(cancelButton).toBeInTheDocument();
  });
});
