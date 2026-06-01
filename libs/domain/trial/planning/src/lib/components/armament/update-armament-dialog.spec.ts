import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UpdateArmamentDialogData } from '../../utils-models/armament.model';
import { UpdateArmamentDialog } from './update-armament-dialog';

vi.mock('@intaqalab/config', () => ({
  injectFireTrialsEndpoint: () => 'http://api.test/fire-trials',
  injectApiUrl: () => 'http://api.test/center',
}));

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
    trialId: 'trial-123',
    shotNumber: 1,
    shotId: 'shot-001',
    armament: {
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

const renderDialog = async (dialogRefMock = createMockDialogRef(), dialogData = createMockDialogData()) => {
  return render(UpdateArmamentDialog, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNoopAnimations(),
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
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
      const renderResult = await renderDialog();
      expect(renderResult.fixture.componentInstance).toBeTruthy();
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
      const renderResult = await renderDialog();
      const component = renderResult.fixture.componentInstance;

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

      const renderResult = await renderDialog(createMockDialogRef(), data);
      const component = renderResult.fixture.componentInstance;

      expect(component.armamentModel().observations).toBe('');
    });
  });

  describe('Form validation', () => {
    it('should have a valid form when all required fields are set', async () => {
      const data = createMockDialogData();
      data.armament.isInstrumented = true;

      const renderResult = await renderDialog(createMockDialogRef(), data);
      const component = renderResult.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(true);
    });

    it('should have invalid form when weaponExternalId is empty', async () => {
      const data = createMockDialogData();
      data.armament.weaponExternalId = '';

      const renderResult = await renderDialog(createMockDialogRef(), data);
      const component = renderResult.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(false);
    });

    it('should have invalid form when tubeExternalId is empty', async () => {
      const data = createMockDialogData();
      data.armament.tubeExternalId = '';

      const renderResult = await renderDialog(createMockDialogRef(), data);
      const component = renderResult.fixture.componentInstance;

      expect(component.armamentForm().valid()).toBe(false);
    });
  });

  describe('Form interaction', () => {
    it('should allow modifying life percentage input', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const lifeInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(lifeInput).toBeInTheDocument();

      await user.clear(lifeInput);
      await user.type(lifeInput, '50');
      expect(lifeInput.value).toBe('50');
    });

    it('should allow entering text in observations field', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();

      await user.clear(textarea);
      await user.type(textarea, 'Updated observations');
      expect(textarea.value).toBe('Updated observations');
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
      const renderResult = await renderDialog(dialogRefMock);
      const component = renderResult.fixture.componentInstance;

      component.onCancel();

      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('onApply should not close dialog when form is invalid', async () => {
      const data = createMockDialogData();
      data.armament.weaponExternalId = '';

      const dialogRefMock = createMockDialogRef();
      const renderResult = await renderDialog(dialogRefMock, data);
      const component = renderResult.fixture.componentInstance;

      component.onApply();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });

  describe('Component logic', () => {
    it('should expose isUpdating as false initially', async () => {
      const renderResult = await renderDialog();
      const component = renderResult.fixture.componentInstance;

      expect(component.isUpdating()).toBe(false);
    });

    it('should have correct data from MAT_DIALOG_DATA', async () => {
      const renderResult = await renderDialog();
      const component = renderResult.fixture.componentInstance;

      expect(component.data.trialId).toBe('trial-123');
      expect(component.data.shotNumber).toBe(1);
      expect(component.data.shotId).toBe('shot-001');
      expect(component.data.weapons.length).toBe(2);
      expect(component.data.tubes.length).toBe(2);
    });

    it('should render weapon options from data', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const weaponSelect = document.querySelectorAll('mat-select')[0] as HTMLElement;
      expect(weaponSelect).toBeInTheDocument();
    });

    it('should render tube options from data', async () => {
      await renderDialog();

      const tubeSelect = document.querySelectorAll('mat-select')[1] as HTMLElement;
      expect(tubeSelect).toBeInTheDocument();
    });
  });
});
