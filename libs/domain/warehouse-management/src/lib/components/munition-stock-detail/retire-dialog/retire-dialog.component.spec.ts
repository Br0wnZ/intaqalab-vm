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
import { RetireDialogComponent } from './retire-dialog.component';

let mockDialog: ReturnType<typeof createMockMatDialog>;
let mockDialogRef: { close: ReturnType<typeof vi.fn> };

async function setup() {
  const user = userEvent.setup();
  mockDialogRef = { close: vi.fn() };
  const sortPaginationChanges = vi.fn();
  mockDialog = createMockMatDialog({
    defaultResult: null,
  });
  const view = await render(RetireDialogComponent, {
    declarations: [],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MunitionsStockDetailService, useValue: { retire: signal(undefined) } },
      provideTranslateService(),
    ],
    componentProviders: [
      { provide: MatDialog, useValue: mockDialog },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          item: { id: 'stock-1', denomination: { id: '1', name: 'name' }, batch: 'B1', quantity: 1000 },
          category: 'MUNITION',
        },
      },
    ],
  });
  const fixture = view.fixture;
  fixture.detectChanges();
  return { user, fixture, component: fixture.componentInstance, sortPaginationChanges };
}

describe('RetireDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should enforce bounded quantity [1, item.quantity] via boundedNumberSchema', async () => {
    const { component, fixture } = await setup();

    component.formModel.set({ quantity: 0, reason: 'DESTRUCTION' });
    fixture.detectChanges();
    expect(component.form().invalid()).toBe(true);

    component.formModel.set({ quantity: 1001, reason: 'DESTRUCTION' });
    fixture.detectChanges();
    expect(component.form().invalid()).toBe(true);

    component.formModel.set({ quantity: 50, reason: 'DESTRUCTION' });
    fixture.detectChanges();
    expect(component.form().valid()).toBe(true);
  });

  it('should submit via FormRoot on Save click and close dialog with true', async () => {
    const { user, component, fixture } = await setup();
    const retireSpy = vi.spyOn(component.retireService.retire, 'set');

    component.formModel.set({ quantity: 10, reason: 'RETURN' });
    fixture.detectChanges();

    const saveBtn = screen.getByRole('button', { name: 'MODIFY_DOC_DIALOG.SAVE' });
    expect(saveBtn).toHaveAttribute('type', 'submit');
    await user.click(saveBtn);
    await fixture.whenStable();

    expect(retireSpy).toHaveBeenCalledWith({
      quantity: 10,
      reason: 'RETURN',
      category: 'MUNITION',
      stockId: 'stock-1',
    });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false and not submit when Cancel is clicked', async () => {
    const { user, component, fixture } = await setup();
    const retireSpy = vi.spyOn(component.retireService.retire, 'set');

    component.formModel.set({ quantity: 10, reason: 'RETURN' });
    fixture.detectChanges();

    const cancelBtn = screen.getByRole('button', { name: 'MODIFY_DOC_DIALOG.CANCEL' });
    expect(cancelBtn).toHaveAttribute('type', 'button');
    await user.click(cancelBtn);

    expect(retireSpy).not.toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
