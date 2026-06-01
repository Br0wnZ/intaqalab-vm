import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataRemoveDialog } from '../../../models/master-data-remove-dialog.model';
import { MasterDataRemoveDialogComponent } from './remove-dialog.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const MOCK_DIALOG_DATA: MasterDataRemoveDialog = {
  title: 'MASTER_DATA.DIALOGS.DELETE.TITLE',
  description: 'MASTER_DATA.DIALOGS.DELETE.DESCRIPTION',
  data: { id: 'item-123', masterServiceRef: {} },
};

async function setup(data: MasterDataRemoveDialog = MOCK_DIALOG_DATA, closeFn = vi.fn()) {
  const events = userEvent.setup();

  const view = await render(MasterDataRemoveDialogComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      { provide: MatDialogRef, useValue: { close: closeFn } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  view.fixture.detectChanges();
  return { view, events, closeFn };
}

describe('MasterDataRemoveDialogComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the dialog title', async () => {
      await setup();
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toContain(MOCK_DIALOG_DATA.title);
    });

    it('should render the description', async () => {
      await setup();
      expect(screen.getByText(MOCK_DIALOG_DATA.description)).toBeInTheDocument();
    });

    it('should render the confirmation message', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.DELETE.CONFIRMATION')).toBeInTheDocument();
    });

    it('should render the cancel button', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.DELETE.BUTTONS.CANCEL')).toBeInTheDocument();
    });

    it('should render the remove button', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.DELETE.BUTTONS.REMOVE')).toBeInTheDocument();
    });
  });

  describe('dialog actions', () => {
    it('should close the dialog with false when cancel is clicked', async () => {
      const { events, closeFn } = await setup();

      await events.click(screen.getByText('MASTER_DATA.DIALOGS.DELETE.BUTTONS.CANCEL'));

      expect(closeFn).toHaveBeenCalledWith(false);
    });

    it('should close the dialog with true when remove is clicked', async () => {
      const { events, closeFn } = await setup();

      await events.click(screen.getByText('MASTER_DATA.DIALOGS.DELETE.BUTTONS.REMOVE'));

      expect(closeFn).toHaveBeenCalledWith(true);
    });
  });
});
