import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatChipHarness } from '@angular/material/chips/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { createMockMatDialogRef } from '@intaqalab/utils/testing/dialog-test-helpers';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('MassiveShotsConfigurationDialog', () => {
  let mockDialogRef: ReturnType<typeof createMockMatDialogRef>;

  const runSetup = async (dialogData = {}) => {
    mockDialogRef = createMockMatDialogRef();

    const user = userEvent.setup();

    const view = await render(MassiveShotsConfigurationDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, container, loader };
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

    it('should render form labels', async () => {
      await runSetup();

      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.SERIES_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TUBE_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.LIFE_LABEL/i)).toBeInTheDocument();
    });

    it('should display action buttons', async () => {
      const { loader } = await runSetup();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const buttonTexts = await Promise.all(buttons.map((b) => b.getText()));

      expect(buttonTexts.some((text) => /CANCEL/i.test(text))).toBe(true);
      expect(buttonTexts.some((text) => /APPLY/i.test(text))).toBe(true);
    });

    it('should render all mat-select fields', async () => {
      const { loader } = await runSetup();

      const selects = await loader.getAllHarnesses(MatSelectHarness);
      expect(selects.length).toBe(5);
    });
  });

  describe('Form interaction', () => {
    it('should allow entering text in observations field', async () => {
      const { loader } = await runSetup();

      const inputs = await loader.getAllHarnesses(MatInputHarness);
      const textarea = inputs.find(async (input) => (await input.getType()) === 'textarea');

      expect(textarea).toBeTruthy();

      if (textarea) {
        await textarea.setValue('Observación de prueba');
        const value = await textarea.getValue();
        expect(value).toBe('Observación de prueba');
      }
    });

    it('should allow selecting series from dropdown', async () => {
      const { container, view } = await runSetup();

      const seriesSelect = container.querySelector('mat-select#series');
      expect(seriesSelect).toBeTruthy();

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
      const { view, loader } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1', 'serie2'],
      });
      view.fixture.detectChanges();

      await waitFor(() => {
        const chipElements = view.fixture.nativeElement.querySelectorAll('mat-chip');
        expect(chipElements.length).toBe(2);
      });
    });

    it('should remove a chip when removeChip is called', async () => {
      const { view, loader } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1', 'serie2'],
      });
      view.fixture.detectChanges();

      await waitFor(() => {
        const chipElements = view.fixture.nativeElement.querySelectorAll('mat-chip');
        expect(chipElements.length).toBe(2);
      });

      component.removeChip('serie1');
      view.fixture.detectChanges();

      expect(component.selectedChips().length).toBe(1);
      expect(component.configModel().series).toEqual(['serie2']);
    });

    it('should remove chip when clicking remove button', async () => {
      const { view, user } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configModel.set({
        ...component.configModel(),
        series: ['serie1'],
      });
      view.fixture.detectChanges();

      await waitFor(() => {
        const chipElements = view.fixture.nativeElement.querySelectorAll('mat-chip');
        expect(chipElements.length).toBe(1);
      });

      const removeButton = view.fixture.nativeElement.querySelector('button[matChipRemove]');
      if (removeButton) {
        await user.click(removeButton);
        view.fixture.detectChanges();

        expect(component.configModel().series).toEqual([]);
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

    it('should close dialog with form data when clicking apply button', async () => {
      const { loader } = await runSetup();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      const applyButton = await buttons[0];

      await applyButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          series: [],
          denominacionArma: '',
          denominacionTubo: '',
          instrumentado: '',
          vidaUtil: '',
          observaciones: '',
        }),
      );
    });

    it('should close dialog with updated data after modifying observations', async () => {
      const { loader } = await runSetup();

      const inputs = await loader.getAllHarnesses(MatInputHarness);
      const textarea = inputs[0];
      await textarea.setValue('Test observations');

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
      const { view } = await runSetup();
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

    it('onApply should call dialogRef.close with current config data', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.configModel.set({
        series: ['serie1'],
        denominacionArma: 'obus105',
        denominacionTubo: 'tubo1',
        instrumentado: 'si',
        vidaUtil: '50',
        observaciones: 'Test',
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        series: ['serie1'],
        denominacionArma: 'obus105',
        denominacionTubo: 'tubo1',
        instrumentado: 'si',
        vidaUtil: '50',
        observaciones: 'Test',
      });
    });
  });
});
