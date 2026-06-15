import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { ChangeDocVersionDialog } from './change-doc-version-dialog';

// vi.mock hoisted by Vitest
describe('ChangeDocVersionDialog', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const version = { id: 'doc-1', versionTag: 'v2' } as any;

  let closeMock: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docsServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: any;

  beforeEach(async () => {
    closeMock = vi.fn();

    docsServiceMock = {
      setDocumentVersionActive: vi.fn(),
      setDocumentVersionActiveResource: {
        statusCode: signal<number | null>(null),
      },
    };

    const result = await render(ChangeDocVersionDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: { version } },
        { provide: TrialDocsService, useValue: docsServiceMock },
      ],
    });

    fixture = result.fixture;
  });

  it('should create', async () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls service on confirm click', async () => {
    const user = userEvent.setup();
    const confirmButton = screen.getByText(/COMMONS.CONFIRM/i);
    await user.click(confirmButton);

    expect(docsServiceMock.setDocumentVersionActive).toHaveBeenCalled();
  });

  it('closes dialog when service resource statusCode becomes 200', async () => {
    docsServiceMock.setDocumentVersionActiveResource.statusCode.set(200);
    fixture.detectChanges();

    expect(closeMock).toHaveBeenCalledWith(true);
  });
});
