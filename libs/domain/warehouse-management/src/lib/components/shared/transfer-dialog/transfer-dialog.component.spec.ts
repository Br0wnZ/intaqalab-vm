import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MunitionsStockDetailService } from '../../../services/munitions-stock-detail.service';
import { TransferDialogComponent } from './transfer-dialog.component';

let mockDialog: ReturnType<typeof createMockMatDialog>;

let mockDialogRef: { close: ReturnType<typeof vi.fn> };
async function setup() {
  const user = userEvent.setup();
  mockDialogRef = { close: vi.fn() };
  mockDialog = createMockMatDialog({
    defaultResult: null,
  });
  const view = await render(TransferDialogComponent, {
    declarations: [],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MunitionsStockDetailService, useValue: { transfer: signal(undefined) } },
      provideTestingEnvironment(),
      provideTranslateService(),
    ],
    componentProviders: [
      { provide: MatDialog, useValue: mockDialog },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { items: [{ id: 's-1', denomination: { id: '1', name: 'name' }, quantity: 1000 }] },
      },
    ],
  });
  const fixture = view.fixture;
  fixture.detectChanges();
  return { user, fixture, component: fixture.componentInstance };
}
describe('TransferDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should reject quantities outside boundedNumberSchema(0, 999999)', async () => {
    const { component, fixture } = await setup();

    component.formModel.set({ quantity: 1000000, munitionDumpId: 'dump-1', cellName: 'A1' });
    fixture.detectChanges();
    expect(component.form().invalid()).toBe(true);

    component.formModel.set({ quantity: 5, munitionDumpId: 'dump-1', cellName: 'A1' });
    fixture.detectChanges();
    expect(component.form().valid()).toBe(true);
  });

  it('should submit via FormRoot on Save click and close dialog with payload', async () => {
    const { user, component, fixture } = await setup();

    component.formModel.set({ quantity: 5, munitionDumpId: 'dump-1', cellName: 'A1' });
    fixture.detectChanges();

    const saveBtn = screen.getByRole('button', { name: 'MODIFY_DOC_DIALOG.SAVE' });
    expect(saveBtn).toHaveAttribute('type', 'submit');
    await user.click(saveBtn);
    await fixture.whenStable();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      munitionDumpId: 'dump-1',
      cellName: 'A1',
      items: [{ quantity: 5, stockId: 's-1' }],
    });
  });

  it('should close with false when Cancel is clicked', async () => {
    const { user } = await setup();
    const cancelBtn = screen.getByRole('button', { name: 'MODIFY_DOC_DIALOG.CANCEL' });
    expect(cancelBtn).toHaveAttribute('type', 'button');
    await user.click(cancelBtn);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
