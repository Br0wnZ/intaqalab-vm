/* eslint-disable vitest/no-conditional-expect */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatChipHarness } from '@angular/material/chips/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { createMockArmamentService, createMockMatDialogRef } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArmamentService } from '../../services/armament-service';
import { SpecimenType } from '../../utils-models/specimen.model';
import { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => 'http://api.test/planning',
}));

describe('MassiveShotsConfigurationDialog', () => {
  let mockDialogRef: ReturnType<typeof createMockMatDialogRef>;
  let mockArmamentService: ReturnType<typeof createMockArmamentService>;

  const runSetup = async (dialogData = {}) => {
    mockDialogRef = createMockMatDialogRef();
    mockArmamentService = createMockArmamentService();

    const user = userEvent.setup();

    const view = await render(MassiveShotsConfigurationDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ArmamentService, useValue: mockArmamentService },
      ],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should create the component', async () => {
      const { view } = await runSetup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should render dialog title', async () => {
      await runSetup();

      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TITLE/i)).toBeInTheDocument();
    });

    it('should render initial form labels', async () => {
      await runSetup();

      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.SERIES_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TYPE_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TUBE_LABEL/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_LABEL/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.LIFE_LABEL/i)).not.toBeInTheDocument();
    });

    it('should display action buttons', async () => {
      const { loader } = await runSetup();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const buttonTexts = await Promise.all(buttons.map((b) => b.getText()));

      expect(buttonTexts.some((text) => /CANCEL/i.test(text))).toBe(true);
      expect(buttonTexts.some((text) => /APPLY/i.test(text))).toBe(true);
    });

    it('should render initial mat-select fields', async () => {
      const { loader } = await runSetup();

      const selects = await loader.getAllHarnesses(MatSelectHarness);
      expect(selects.length).toBe(4);
    });
  });

  describe('Form interaction', () => {
    it('should allow entering text in observations field', async () => {
      const { loader } = await runSetup();

      const inputs = await loader.getAllHarnesses(MatInputHarness);
      let textarea: MatInputHarness | undefined;
      for (const input of inputs) {
        if ((await input.getType()) === 'textarea') {
          textarea = input;
          break;
        }
      }

      expect(textarea).toBeTruthy();

      if (textarea) {
        await textarea.setValue('Observación de prueba');
        const value = await textarea.getValue();
        expect(value).toBe('Observación de prueba');
      }
    });

    it('should allow selecting series from dropdown', async () => {
      const { loader, view } = await runSetup();

      const selects = await loader.getAllHarnesses(MatSelectHarness);
      expect(selects.length).toBeGreaterThan(0);

      const component = view.fixture.componentInstance;
      expect(component.selectedChips).toBeDefined();
    });
  });

  describe('Chip management', () => {
    it('should show no chips initially', async () => {
      const { loader } = await runSetup();

      const chips = await loader.getAllHarnesses(MatChipHarness);
      expect(chips.length).toBe(0);
    });

    it('should display chips when series are selected', async () => {
      const mockData = {
        series: [
          { id: 'serie1', name: 'Serie 1' },
          { id: 'serie2', name: 'Serie 2' },
        ],
      };
      const { loader, view } = await runSetup(mockData);
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1', 'serie2'],
      });
      view.fixture.detectChanges();

      const chips = await loader.getAllHarnesses(MatChipHarness);
      expect(chips.length).toBe(2);
    });

    it('should remove a chip when removeChip is called', async () => {
      const mockData = {
        series: [
          { id: 'serie1', name: 'Serie 1' },
          { id: 'serie2', name: 'Serie 2' },
        ],
      };
      const { loader, view } = await runSetup(mockData);
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1', 'serie2'],
      });
      view.fixture.detectChanges();

      const chips = await loader.getAllHarnesses(MatChipHarness);
      expect(chips.length).toBe(2);

      component.removeChip('serie1');
      view.fixture.detectChanges();

      expect(component.selectedChips().length).toBe(1);
      expect(component.configModel().series).toEqual(['serie2']);
    });

    it('should remove chip when remove button is clicked', async () => {
      const mockData = {
        series: [{ id: 'serie1', name: 'Serie 1' }],
      };
      const { loader, view } = await runSetup(mockData);
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1'],
      });
      view.fixture.detectChanges();

      const chips = await loader.getAllHarnesses(MatChipHarness);
      expect(chips.length).toBe(1);

      if (chips.length > 0) {
        const removeButton = await chips[0].getRemoveButton();
        if (removeButton) {
          await removeButton.click();
          view.fixture.detectChanges();

          expect(component.configModel().series).toEqual([]);
        }
      }
    });
  });

  describe('Dialog actions', () => {
    it('should close dialog when clicking cancel button', async () => {
      const { loader } = await runSetup();
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const cancelButton = await buttons[1];

      await cancelButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should disable apply button when form is invalid and enable when valid', async () => {
      const { loader, view } = await runSetup();
      const component = view.fixture.componentInstance;
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const applyButton = buttons[0];

      expect(await applyButton.isDisabled()).toBe(true);

      component.configForm.series().reset(['serie-1']);
      component.configForm.tipo().reset(SpecimenType.Mortar);
      component.configForm.denominacionArma().reset('weapon-1');
      view.fixture.detectChanges();

      expect(await applyButton.isDisabled()).toBe(false);
    });

    it('should close dialog with form data when clicking apply button', async () => {
      const { loader, view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configForm.series().reset(['serie-1']);
      component.configForm.tipo().reset(SpecimenType.Mortar);
      component.configForm.denominacionArma().reset('weapon-1');
      view.fixture.detectChanges();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const applyButton = buttons[0];

      await applyButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          series: ['serie-1'],
          tipo: SpecimenType.Mortar,
          denominacionArma: 'weapon-1',
        }),
      );
    });

    it('should close dialog with updated data after modifying observations', async () => {
      const { loader, view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configForm.series().reset(['serie-1']);
      component.configForm.tipo().reset(SpecimenType.Mortar);
      component.configForm.denominacionArma().reset('weapon-1');
      component.configForm.observaciones().reset('Test observations');
      view.fixture.detectChanges();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const applyButton = buttons[0];

      await applyButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          observaciones: 'Test observations',
        }),
      );
    });
  });

  describe('Component logic', () => {
    it('should have correct initial config model', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      const model = component.configModel();
      expect(model.series).toEqual([]);
      expect(model.denominacionArma).toBe('');
      expect(model.denominacionTubo).toBe('');
      expect(model.instrumentado).toBe('');
      expect(model.vidaUtil).toBe('');
      expect(model.observaciones).toBe('');
    });

    it('should compute selectedChips from configModel series', async () => {
      const mockData = {
        series: [
          { id: 'serie1', name: 'Serie 1' },
          { id: 'serie3', name: 'Serie 3' },
        ],
      };
      const { view } = await runSetup(mockData);
      const component = view.fixture.componentInstance;

      expect(component.selectedChips().length).toBe(0);

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1', 'serie3'],
      });

      const chips = component.selectedChips();
      expect(chips.length).toBe(2);
      expect(chips[0].label).toBe('Serie 1');
      expect(chips[1].label).toBe('Serie 3');
    });

    it('onCancel should call dialogRef.close', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('onApply should close dialog with current config data', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configModel.set({
        series: ['serie1'],
        tipo: SpecimenType.Weapon,
        denominacionArma: 'obus105',
        denominacionTubo: 'tubo1',
        instrumentado: 'si',
        vidaUtil: '50',
        observaciones: 'Test',
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        series: ['serie1'],
        tipo: SpecimenType.Weapon,
        denominacionArma: 'obus105',
        denominacionTubo: 'tubo1',
        instrumentado: 'si',
        vidaUtil: '50',
        observaciones: 'Test',
      });
    });
  });

  describe('Cascade reset behavior', () => {
    it('should reset weapon, tube, instrumented and life fields when weapon type changes or is cleared', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configForm.denominacionArma().reset('weapon-1');
      component.configForm.denominacionTubo().reset('tube-1');
      component.configForm.instrumentado().reset('si');
      component.configForm.vidaUtil().reset('50');

      component.onTypeChange(null);
      view.fixture.detectChanges();

      expect(component.configForm.denominacionArma().value()).toBe('');
      expect(component.configForm.denominacionTubo().value()).toBe('');
      expect(component.configForm.instrumentado().value()).toBe('');
      expect(component.configForm.vidaUtil().value()).toBe('');
    });

    it('should reset tube field when weapon denomination changes or is cleared', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configForm.denominacionTubo().reset('tube-1');

      component.onWeaponChange(null);
      view.fixture.detectChanges();

      expect(component.configForm.denominacionTubo().value()).toBe('');
    });
  });
});
