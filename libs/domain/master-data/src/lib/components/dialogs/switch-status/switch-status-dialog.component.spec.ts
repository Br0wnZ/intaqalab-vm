import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MasterDataSwitchStatusDialogComponent } from './switch-status-dialog.component';

describe('MasterDataSwitchStatusDialogComponent', () => {
  const defaultImports = [TranslateModule.forRoot()];
  const renderDialog = async (data?: Record<string, unknown>, closeFn?: ReturnType<typeof vi.fn>) => {
    return render(MasterDataSwitchStatusDialogComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: defaultImports,
    });
  };

  it('should render the title', async () => {
    await renderDialog({ text: { title: 'title', description: 'description', buttons: {} } });
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toBeInTheDocument();
  });
});
