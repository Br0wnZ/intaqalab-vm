import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { RetireDialogComponent } from './retire-dialog.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

let mockDialog: ReturnType<typeof createMockMatDialog>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockService: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
let mockDialogRef: { close: ReturnType<typeof vi.fn> };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setup(data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
  mockDialogRef = { close: vi.fn() };
  mockService = {
    conscreateItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  };
  const sortPaginationChanges = vi.fn();
  mockDialog = createMockMatDialog({
    defaultResult: null,
  });
  const renderResult = await render(RetireDialogComponent, {
    declarations: [],
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
    ],
    componentProviders: [
      { provide: MatDialog, useValue: mockDialog },
      { provide: MAT_DIALOG_DATA, useValue: { item: { denomination: { id: 1, name: 'name' }, quantity: 1000 } } },
    ],
  });
  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return { fixture, sortPaginationChanges };
}

describe('RetireDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza la componente ', async () => {
    await setup('munitions');
  });
});
