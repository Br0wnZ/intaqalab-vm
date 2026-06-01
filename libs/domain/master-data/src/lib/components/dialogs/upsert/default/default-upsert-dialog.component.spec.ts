import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataDefault } from '../../../../models/master-data-default.model';
import { MasterDataDefaultUpsertDialogComponent } from './default-upsert-dialog.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const MOCK_EDIT_DATA: MasterDataDefault = {
  id: '123',
  name: { es: 'Nombre ES', en: 'Name EN' },
  label: 'Test Label',
  active: true,
};

async function setup(data: MasterDataDefault | null = null) {
  const closeFn = vi.fn();
  const events = userEvent.setup();

  const view = await render(MasterDataDefaultUpsertDialogComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: { close: closeFn } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  view.fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(view.fixture);
  return { view, events, loader, closeFn };
}

describe('MasterDataDefaultUpsertDialogComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the create title when data is null', async () => {
      await setup(null);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toContain('MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE');
    });

    it('should render the edit title when data is provided', async () => {
      await setup(MOCK_EDIT_DATA);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toContain('MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE');
    });

    it('should render the cancel button', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL')).toBeInTheDocument();
    });

    it('should render the save button', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should have the save button disabled when form is empty', async () => {
      const { loader } = await setup(null);
      const saveBtn = await loader.getHarness(
        MatButtonHarness.with({ text: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.SAVE/i }),
      );
      expect(await saveBtn.isDisabled()).toBe(true);
    });

    it('should enable the save button after filling both required fields', async () => {
      const { loader } = await setup(null);
      const inputs = await loader.getAllHarnesses(MatInputHarness);

      await inputs[0].setValue('Nombre');
      await inputs[1].setValue('Name');

      const saveBtn = await loader.getHarness(
        MatButtonHarness.with({ text: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.SAVE/i }),
      );
      expect(await saveBtn.isDisabled()).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('should pre-fill form fields with existing data', async () => {
      const { loader } = await setup(MOCK_EDIT_DATA);
      const inputs = await loader.getAllHarnesses(MatInputHarness);

      expect(await inputs[0].getValue()).toBe('Nombre ES');
      expect(await inputs[1].getValue()).toBe('Name EN');
    });
  });

  describe('dialog actions', () => {
    it('should close the dialog with false when cancel is clicked', async () => {
      const { events, closeFn } = await setup(null);

      await events.click(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL'));

      expect(closeFn).toHaveBeenCalledWith(false);
    });

    it('should close the dialog with name data when save is clicked with filled form', async () => {
      const { loader, closeFn } = await setup(null);
      const inputs = await loader.getAllHarnesses(MatInputHarness);

      await inputs[0].setValue('Nombre ES');
      await inputs[1].setValue('Name EN');

      const saveBtn = await loader.getHarness(
        MatButtonHarness.with({ text: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.SAVE/i }),
      );
      await saveBtn.click();

      expect(closeFn).toHaveBeenCalledOnce();
      expect(closeFn.mock.calls[0][0]).toMatchObject({ name: { es: 'Nombre ES', en: 'Name EN' } });
    });
  });
});
