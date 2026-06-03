import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataDimension } from '../../../../models/master-data-dimension.model';
import { DimensionsUpsertDialogComponent } from './dimensions-upsert-dialog.component';

const MOCK_EDIT_DATA: MasterDataDimension = {
  id: '1',
  width: 100,
  height: 200,
  diameter: 0,
  active: true,
};

async function setup(data: MasterDataDimension | null = null) {
  const closeFn = vi.fn();
  const events = userEvent.setup();

  const view = await render(DimensionsUpsertDialogComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: { close: closeFn } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, events, container, closeFn };
}

function getInput(container: HTMLElement, id: string) {
  return container.querySelector(`#${id}`) as HTMLInputElement;
}

async function typeInInput(
  events: ReturnType<typeof userEvent.setup>,
  view: { fixture: { detectChanges(): void } },
  container: HTMLElement,
  id: string,
  value: string,
) {
  const input = getInput(container, id);
  await events.clear(input);
  await events.type(input, value);
  view.fixture.detectChanges();
}

describe('DimensionsUpsertDialogComponent', () => {
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
      await setup(null);
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL')).toBeInTheDocument();
    });

    it('should render the save button', async () => {
      await setup(null);
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE')).toBeInTheDocument();
    });
  });

  describe('form validation & disabled state', () => {
    it('should have the save button disabled when no values are set', async () => {
      const { container } = await setup(null);
      const saveBtn = container.querySelector('button[cdkFocusInitial], button[cdkfocusinitial]') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });

    it('should disable width and height when diameter has a value', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'diameter', '50');

      expect(getInput(container, 'width').disabled).toBe(true);
      expect(getInput(container, 'height').disabled).toBe(true);
    });

    it('should disable diameter when width has a value', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'width', '30');

      expect(getInput(container, 'diameter').disabled).toBe(true);
    });

    it('should disable diameter when height has a value', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'height', '20');

      expect(getInput(container, 'diameter').disabled).toBe(true);
    });

    it('should enable save button when both width and height are set', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'width', '30');
      await typeInInput(events, view, container, 'height', '20');

      const saveBtn = container.querySelector('button[cdkFocusInitial], button[cdkfocusinitial]') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });

    it('should enable save button when diameter is set', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'diameter', '50');

      const saveBtn = container.querySelector('button[cdkFocusInitial], button[cdkfocusinitial]') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('should pre-fill width and height fields with existing data', async () => {
      const { container } = await setup(MOCK_EDIT_DATA);

      expect(getInput(container, 'width').value).toBe('100');
      expect(getInput(container, 'height').value).toBe('200');
    });
  });

  describe('dialog actions', () => {
    it('should close the dialog with false when cancel is clicked', async () => {
      const { events, closeFn } = await setup(null);

      await events.click(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL'));

      expect(closeFn).toHaveBeenCalledWith(false);
    });

    it('should close the dialog with form data when save is clicked after filling width and height', async () => {
      const { events, view, container, closeFn } = await setup(null);

      await typeInInput(events, view, container, 'width', '30');
      await typeInInput(events, view, container, 'height', '20');

      const saveBtn = container.querySelector('button[cdkFocusInitial], button[cdkfocusinitial]') as HTMLButtonElement;
      await events.click(saveBtn);

      expect(closeFn).toHaveBeenCalledOnce();
      expect(closeFn.mock.calls[0][0]).toMatchObject({ width: 30, height: 20, diameter: null });
    });
  });
});

describe('DimensionsUpsertDialogComponent', () => {
  const defaultImports = [TranslateModule.forRoot()];
  let closeMock: ReturnType<typeof vi.fn>;

  const renderDialog = async (data: MasterDataDimensionUpsertDialog | null = null) => {
    closeMock = vi.fn();
    const user = userEvent.setup();
    const view = await render(DimensionsUpsertDialogComponent, {
      imports: defaultImports,
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    const container = view.fixture.nativeElement as HTMLElement;
    return { user, view, container };
  };

  const getInput = (container: HTMLElement, id: string) => container.querySelector(`#${id}`) as HTMLInputElement;

  const typeInInput = async (
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement,
    id: string,
    value: string,
  ) => {
    const input = getInput(container, id);
    await user.clear(input);
    await user.type(input, value);
  };

  it('should render the create title when data is null', async () => {
    await renderDialog(null);
    const title = screen.getByRole('heading', { name: /MASTER_DATA\.DIALOGS\.UPSERT\.CREATE_TITLE/i });
    expect(title).toBeInTheDocument();
  });

  it('should render the edit title when data is provided', async () => {
    await renderDialog({ id: '1', label: 'Test', width: 10, height: 20 });
    const title = screen.getByRole('heading', { name: /MASTER_DATA\.DIALOGS\.UPSERT\.EDIT_TITLE/i });
    expect(title).toBeInTheDocument();
  });

  it('should disable width and height when diameter has a value', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'diameter', '50');

    expect(getInput(container, 'width').disabled).toBe(true);
    expect(getInput(container, 'height').disabled).toBe(true);
  });

  it('should disable diameter when width has a value', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'width', '30');

    expect(getInput(container, 'diameter').disabled).toBe(true);
  });

  it('should disable diameter when height has a value', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'height', '20');

    expect(getInput(container, 'diameter').disabled).toBe(true);
  });

  it('should have confirm button enabled when both width and height are set', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'width', '30');
    await typeInInput(user, container, 'height', '20');

    const confirmBtn = container.querySelector('button[cdkfocusinitial]') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
  });

  it('should have confirm button enabled when diameter is set', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'diameter', '50');

    const confirmBtn = container.querySelector('button[cdkfocusinitial]') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
  });

  it('should pre-fill form fields in edit mode', async () => {
    const { container } = await renderDialog({ id: '1', label: 'Dim1', width: 100, height: 200, diameter: 0 });

    expect(getInput(container, 'width').value).toBe('100');
    expect(getInput(container, 'height').value).toBe('200');
  });

  it('should close dialog with form data on confirm', async () => {
    const { user, container } = await renderDialog(null);
    await typeInInput(user, container, 'width', '30');
    await typeInInput(user, container, 'height', '20');

    const confirmBtn = container.querySelector('button[cdkfocusinitial]') as HTMLButtonElement;
    await user.click(confirmBtn);

    expect(closeMock).toHaveBeenCalledWith(expect.objectContaining({ width: 30, height: 20, diameter: null }));
  });
});
