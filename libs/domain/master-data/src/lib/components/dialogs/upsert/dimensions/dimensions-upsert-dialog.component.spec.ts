import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MasterDataStore } from '../../../../+state/master-data.store';
import type { MasterDataDimension } from '../../../../models/master-data-dimension.model';
import { MasterDataService } from '../../../../services/master-data.service';
import { DimensionsUpsertDialogComponent } from './dimensions-upsert-dialog.component';

function createMockMasterDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource(),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    resetUpsert: vi.fn(),
    resetSwitchStatus: vi.fn(),
    resetDelete: vi.fn(),
  };
}

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
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: MasterDataService, useValue: createMockMasterDataService() },
      MasterDataStore,
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
  await events.tab(); // trigger blur → LocaleDecimalInputDirective commits value to Signal Forms model
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
      expect(title).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.CREATE_TITLE/);
    });

    it('should render the edit title when data is provided', async () => {
      await setup(MOCK_EDIT_DATA);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.EDIT_TITLE/);
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
      await setup(null);
      const saveBtn = screen.getByRole('button', {
        name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE',
      }) as HTMLButtonElement;
      expect(saveBtn).toBeDisabled();
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

      const saveBtn = screen.getByRole('button', {
        name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE',
      }) as HTMLButtonElement;
      expect(saveBtn).toBeEnabled();
    });

    it('should enable save button when diameter is set', async () => {
      const { events, view, container } = await setup(null);
      await typeInInput(events, view, container, 'diameter', '50');

      const saveBtn = screen.getByRole('button', {
        name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE',
      }) as HTMLButtonElement;
      expect(saveBtn).toBeEnabled();
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
  });
});
