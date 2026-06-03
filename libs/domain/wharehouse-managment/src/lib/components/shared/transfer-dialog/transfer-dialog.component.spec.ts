import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { TransferDialogComponent } from './transfer-dialog.component';

let mockDialog: ReturnType<typeof createMockMatDialog>;

let mockDialogRef: { close: ReturnType<typeof vi.fn> };
async function setup() {
  mockDialogRef = { close: vi.fn() };
  const sortPaginationChanges = vi.fn();
  mockDialog = createMockMatDialog({
    defaultResult: null,
  });
  const renderResult = await render(TransferDialogComponent, {
    declarations: [],
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      provideTestingEnvironment(),
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
describe('TransferDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
