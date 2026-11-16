import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArmamentStoreType } from '../../+state/armament.store';
import { ArmamentStore } from '../../+state/armament.store';
import type { UpdateArmamentDialogData } from '../../utils-models/armament.model';
import type { SpecimenItem } from '../../utils-models/catalog.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { UpdateArmamentDialog } from './update-armament-dialog';

function createMockDialogRef() {
  return {
    close: vi.fn(),
    afterClosed: vi.fn(() => ({ subscribe: vi.fn() })),
    backdropClick: vi.fn(() => ({ subscribe: vi.fn() })),
    keydownEvents: vi.fn(() => ({ subscribe: vi.fn() })),
  };
}

function createMockDialogData(overrides: Partial<UpdateArmamentDialogData> = {}): UpdateArmamentDialogData {
  return {
    shotNumber: 1,
    armament: {
      weaponType: SpecimenType.Weapon,
      weaponName: 'Obús 105mm',
      weaponExternalId: 'weapon-1',
      tubeName: 'Tubo 1',
      tubeExternalId: 'tube-1',
      isInstrumented: false,
      tubeLifePercentage: 75,
      observations: 'Initial observations',
    },
    weapons: [
      { id: 'weapon-1', name: 'Obús 105mm', type: 'WEAPON', active: true },
      { id: 'weapon-2', name: 'Obús 155mm', type: 'WEAPON', active: true },
    ],
    tubes: [
      { id: 'tube-1', name: 'Tubo 1', type: 'TUBE', active: true },
      { id: 'tube-2', name: 'Tubo 2', type: 'TUBE', active: true },
    ],
    ...overrides,
  };
}

const renderDialog = async (
  dialogRefMock = createMockDialogRef(),
  dialogData = createMockDialogData(),
  tubeDenominationsForFamily: (familyId: number) => SpecimenItem[] = () => [],
) => {
  const armamentStoreMock: Pick<
    ArmamentStoreType,
    'tubeDenominationsForFamily' | 'loadTubeDenominations' | 'clearTubeDenominations'
  > = {
    tubeDenominationsForFamily: vi.fn(tubeDenominationsForFamily),
    loadTubeDenominations: vi.fn(),
    clearTubeDenominations: vi.fn(),
  };

  return render(UpdateArmamentDialog, {
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      { provide: ArmamentStore, useValue: armamentStoreMock },
      provideTranslateService(),
    ],
  });
};

describe('UpdateArmamentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should create the component', async () => {
      const view = await renderDialog();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should render dialog title', async () => {
      await renderDialog();

      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TITLE/i)).toBeInTheDocument();
    });

    it('should render form labels', async () => {
      await renderDialog();

      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.WEAPON_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TUBE_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.INSTRUMENTED_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.LIFE_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.OBSERVATIONS_LABEL/i)).toBeInTheDocument();
    });

    it('should display action buttons', async () => {
      await renderDialog();

      expect(screen.getByRole('button', { name: /COMMONS.CANCEL/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.APPLY_BUTTON/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Form initialization', () => {
    it('should initialize form with provided armament data', async () => {
      const view = await renderDialog();
      const component = view.fixture.componentInstance;

      const model = component.armamentModel();
      expect(model.weaponExternalId).toBe('weapon-1');
      expect(model.tubeExternalId).toBe('tube-1');
      expect(model.isInstrumented).toBe(false);
      expect(model.tubeLifePercentage).toBe(75);
      expect(model.observations).toBe('Initial observations');
    });

    it('should default observations to empty string when undefined', async () => {
      const data = createMockDialogData();
      data.armament.observations = undefined as never;

      const view = await renderDialog(createMockDialogRef(), data);
      const component = view.fixture.componentInstance;

      expect(component.armamentModel().observations).toBe('');
    });
  });

  describe('Form validation', () => {
    it('should have a valid form when all required fields are set', async () => {
      const data = createMockDialogData();
      data.armament.isInstrumented = true;

      const view = await renderDialog(createMockDialogRef(), data);
      const component = view.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(true);
    });

    it('should have a valid form when isInstrumented is false', async () => {
      const view = await renderDialog();

      expect(view.fixture.componentInstance.armamentForm().valid()).toBe(true);
    });

    it('should have an invalid form when isInstrumented is undefined', async () => {
      const data = createMockDialogData();
      data.armament.isInstrumented = null as never;

      const view = await renderDialog(createMockDialogRef(), data);

      expect(view.fixture.componentInstance.armamentForm().valid()).toBe(false);
    });

    it('should have invalid form when weaponExternalId is empty', async () => {
      const data = createMockDialogData();
      data.armament.weaponExternalId = '';

      const view = await renderDialog(createMockDialogRef(), data);
      const component = view.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(false);
    });

    it('should have invalid form when tubeExternalId is empty', async () => {
      const data = createMockDialogData();
      data.armament.tubeExternalId = '';

      const view = await renderDialog(createMockDialogRef(), data);
      const component = view.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(false);
    });
  });

  describe('Form interaction', () => {
    it('should allow modifying life percentage input', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const lifeInput = screen.getByRole('spinbutton');
      expect(lifeInput).toBeInTheDocument();

      await user.clear(lifeInput);
      await user.type(lifeInput, '50');
      expect(lifeInput).toHaveValue(50);
    });

    it('should allow entering text in observations field', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();

      await user.clear(textarea);
      await user.type(textarea, 'Updated observations');
      expect(textarea).toHaveValue('Updated observations');
    });
  });

  describe('Dialog actions', () => {
    it('should close dialog when clicking cancel button', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const dialogRefMock = createMockDialogRef();
      await renderDialog(dialogRefMock);

      const cancelButton = screen.getByRole('button', { name: /COMMONS.CANCEL/i });
      await user.click(cancelButton);

      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('onCancel should call dialogRef.close', async () => {
      const dialogRefMock = createMockDialogRef();
      const view = await renderDialog(dialogRefMock);
      const component = view.fixture.componentInstance;

      component.onCancel();

      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('onApply should not close dialog when form is invalid', async () => {
      const data = createMockDialogData();
      data.armament.weaponExternalId = '';

      const dialogRefMock = createMockDialogRef();
      const view = await renderDialog(dialogRefMock, data);
      const component = view.fixture.componentInstance;

      component.onApply();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('onApply should close dialog with form data when form is valid', async () => {
      const dialogRefMock = createMockDialogRef();
      const view = await renderDialog(dialogRefMock);

      view.fixture.componentInstance.onApply();

      expect(dialogRefMock.close).toHaveBeenCalledWith({
        weaponExternalId: 'weapon-1',
        tubeExternalId: 'tube-1',
        isInstrumented: false,
        tubeLifePercentage: 75,
        observations: 'Initial observations',
      });
    });
  });

  describe('Component logic', () => {
    it('should have correct data from MAT_DIALOG_DATA', async () => {
      const view = await renderDialog();
      const component = view.fixture.componentInstance;

      expect(component.data.shotNumber).toBe(1);
      expect(component.data.weapons.length).toBe(2);
      expect(component.data.tubes.length).toBe(2);
    });

    it('should render weapon options from data', async () => {
      await renderDialog();

      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeInTheDocument();
    });

    it('should render tube options from data', async () => {
      await renderDialog();

      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toBeInTheDocument();
    });

    it('should read tube options only for selected weapon family', async () => {
      const data = createMockDialogData({
        weapons: [
          { id: 'weapon-1', name: 'Obús 105mm', type: 'WEAPON', active: true, familyId: 10665 },
          { id: 'weapon-2', name: 'Obús 155mm', type: 'WEAPON', active: true, familyId: 10676 },
        ],
      });
      const tubeDenominationsForFamily = vi.fn((familyId: number) =>
        familyId === 10676
          ? [{ id: 'stale-tube', name: 'TUBO DE OTRA FAMILIA', type: 'TUBE' as const, active: true }]
          : [],
      );

      const view = await renderDialog(createMockDialogRef(), data, tubeDenominationsForFamily);
      const component = view.fixture.componentInstance;

      expect(component.tubeOptions().some((tube) => tube.id === 'stale-tube')).toBe(false);
      expect(tubeDenominationsForFamily).toHaveBeenCalledWith(10665);
    });
  });
});
