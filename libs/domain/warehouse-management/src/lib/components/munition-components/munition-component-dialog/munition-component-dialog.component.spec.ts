import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import type { UserEvent } from '@testing-library/user-event';
import { userEvent } from '@testing-library/user-event';

import type { MunitionDialog } from '../../../models/munition-components.model';
import { MunitionComponentDialogComponent } from './munition-component-dialog.component';

describe('MunitionComponentDialogComponent', () => {
  let user: UserEvent;
  const defaultImports = [TranslateModule.forRoot()];
  let closeMock: ReturnType<typeof vi.fn>;

  const renderDialog = async (
    data?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
    closeFn?: ReturnType<typeof vi.fn>,
  ) => {
    return render(MunitionComponentDialogComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data || { document: { id: 'doc-1', name: 'test-document' } } },
      ],
      imports: defaultImports,
    });
  };

  beforeEach(() => {
    user = userEvent.setup();
    closeMock = vi.fn();
  });

  it('should render the title when creating new items', async () => {
    await renderDialog({ item: null });
    expect(screen.getByText(/WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.TITLE_CREATE/i)).toBeInTheDocument();
  });

  it('should close when cancel button is clicked', async () => {
    await renderDialog({ item: null }, closeMock);
    const cancelButton = screen.getByText(/MODIFY_DOC_DIALOG.CANCEL/i);
    await userEvent.click(cancelButton);
    expect(closeMock).toHaveBeenCalledWith(false);
  });

  it('should confirm button close with the data', async () => {
    const data: MunitionDialog = {
      item: {
        enabled: true,
        id: 'id',
        name: {
          en: 'en',
          es: 'es',
        },
        label: 'label',
        observations: 'bar',
        category: 'MUNITION_COMPONENT',
      },
    };
    await renderDialog(data, closeMock);
    const searchInput = screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.NAME_PLACEHOLDER');
    await user.type(searchInput, ' some text');
    const confirmButton = screen.getByText(/MODIFY_DOC_DIALOG.SAVE/i);
    await userEvent.click(confirmButton);
    // expect(closeMock).toHaveBeenCalledWith({
    //   ...data.item,
    //   name: {
    //     es: data.item?.name.es + ' some text',
    //     en: data.item?.name.en,
    //   },
    // });
    expect(closeMock).toHaveBeenCalled();
  });
});
