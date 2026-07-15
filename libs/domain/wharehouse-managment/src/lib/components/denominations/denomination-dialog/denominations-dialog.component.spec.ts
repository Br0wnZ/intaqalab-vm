import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type { DenominationModel } from '../../../models/denominations.model';
import { DenominationsDialogComponent } from './denominations-dialog.component';

const createMockMunitionStore = () => ({
  items: signal([]),
  search: vi.fn(),
});

describe('DenominationsDialogComponent', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const setup = async (
    data: { item: DenominationModel | null } = { item: null },
    closeFn?: ReturnType<typeof vi.fn>,
  ) => {
    const user = userEvent.setup();
    const view = await render(DenominationsDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeFn ?? vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      componentProviders: [{ provide: MunitionComponentStore, useValue: createMockMunitionStore() }],
    });
    view.fixture.detectChanges();
    return { user, view, component: view.fixture.componentInstance };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    closeMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Create mode (item is null)', () => {
    it('should render the create title', async () => {
      await setup({ item: null });
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.TITLE_CREATE/i)).toBeInTheDocument();
    });

    it('should have the save button disabled when form is invalid', async () => {
      await setup({ item: null });
      const saveButton = screen.getByText(/MODIFY_DOC_DIALOG.SAVE/i).closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should close with false when cancel is clicked', async () => {
      const { user } = await setup({ item: null }, closeMock);
      const cancelButton = screen.getByText(/MODIFY_DOC_DIALOG.CANCEL/i);
      await user.click(cancelButton);
      expect(closeMock).toHaveBeenCalledWith(false);
    });
  });

  describe('Edit mode (item is provided)', () => {
    const editItem: DenominationModel = {
      active: true,
      category: 'MUNITION',
      id: 'item-id',
      munitionType: { id: 'munition-type-id', name: 'Type Name' },
      name: 'Test Denomination',
      compatibility: 'A',
      neq: 1,
      riskGroups: '1.2',
      unNumber: 'UN1234',
      weight: 3,
    };

    it('should render the edit title', async () => {
      await setup({ item: editItem });
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.TITLE_EDIT/i)).toBeInTheDocument();
    });

    it('should populate all form fields with item data', async () => {
      const { component } = await setup({ item: editItem });
      const formValue = component.formModel();
      expect(formValue.name).toBe(editItem.name);
      expect(formValue.category).toBe(editItem.category);
      expect(formValue.munitionTypeId).toBe(editItem.munitionType.id);
      expect(formValue.neq).toBe(editItem.neq);
      expect(formValue.unNumber).toBe(editItem.unNumber);
      expect(formValue.riskGroups).toBe(editItem.riskGroups);
      expect(formValue.compatibility).toBe(editItem.compatibility);
      expect(formValue.weight).toBe(editItem.weight);
    });

    it('should have the save button enabled when form is valid', async () => {
      await setup({ item: editItem });
      const saveButton = screen.getByText(/MODIFY_DOC_DIALOG.SAVE/i).closest('button');
      expect(saveButton).toBeEnabled();
    });

    it('should close with the correct payload when save is clicked', async () => {
      const { user } = await setup({ item: editItem }, closeMock);
      const saveButton = screen.getByText(/MODIFY_DOC_DIALOG.SAVE/i).closest('button') as HTMLButtonElement;
      await user.click(saveButton);

      const expectedPayload: Partial<DenominationModel> = {
        id: editItem.id,
        name: editItem.name,
        active: editItem.active,
        category: editItem.category,
        munitionTypeId: editItem.munitionType.id,
        neq: editItem.neq,
        weight: editItem.weight,
        compatibility: editItem.compatibility,
        riskGroups: editItem.riskGroups,
        unNumber: editItem.unNumber,
      };
      expect(closeMock).toHaveBeenCalledWith(expectedPayload);
    });
  });
});
