import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import type { UserEvent } from '@testing-library/user-event';
import { userEvent } from '@testing-library/user-event';

import type { MunitionsDumpDialog, MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionsDumpsDialogComponent } from './munitions-dumps-dialog.component';

async function renderDialog(data: MunitionsDumpDialog, closeFn?: ReturnType<typeof vi.fn>) {
  const defaultImports = [TranslateModule.forRoot()];
  return render(MunitionsDumpsDialogComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
      { provide: MAT_DIALOG_DATA, useValue: data || { document: { id: 'doc-1', name: 'test-document' } } },
    ],
    imports: defaultImports,
  });
}

describe('MunitionsDumpsDialogComponent', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let user: UserEvent;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let closeMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    user = userEvent.setup();
    closeMock = vi.fn();
  });
  it('should display the dialog with item values', async () => {
    const item: MunitionsDumpModel = {
      id: 'id',
      munitionDumpId: 'name',
      cells: [{ name: 'a' }, { name: 'b' }],
      maxRiskGroupNeqPerCell: 3,
      maxNeq: 4,
      active: true,
    };
    await renderDialog({ item });
    let input = screen.getByLabelText(/WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.ID/i) as HTMLInputElement;
    expect(input.value).toBe(item.munitionDumpId);

    input = screen.getByLabelText(/WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXCELL/i) as HTMLInputElement;
    expect(input.value).toBe(String(item.maxRiskGroupNeqPerCell));

    input = screen.getByLabelText(/WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXTOTAL/i) as HTMLInputElement;
    expect(input.value).toBe(String(item.maxNeq));

    const inputCells = screen.queryAllByLabelText(/WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELL_PREFIX/i);
    expect(inputCells.length).toBe(item.cells.length);

    const select = screen.getByRole('combobox', { name: /WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELLS_COUNT/i });
    expect(select).toHaveAttribute('aria-disabled', 'true');
  });
});
