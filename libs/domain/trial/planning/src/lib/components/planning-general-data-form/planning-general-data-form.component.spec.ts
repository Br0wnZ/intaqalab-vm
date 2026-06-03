import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import {
  TEST_CONSTANTS,
  createMockPlanningGeneralDataStore,
  createSpecimens,
  createTrial,
  createTrialPlanningInfo,
  createUsers,
  waitForSignal,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { PlanningGeneralDataFormComponent } from './planning-general-data-form.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Valores del formulario que lo dejan completamente válido */
const validFormValues = {
  goal: 'Evaluar resistencia al impacto',
  specimen: [{ specimenId: TEST_CONSTANTS.IDS.SPECIMEN.MUNITION_INERT, batch: '' }],
  planningUser: TEST_CONSTANTS.IDS.USER.JUAN,
  observations: 'Observaciones de prueba',
  requeriments: 'Requisitos de prueba',
  additionalInfo: 'Info adicional',
  maxEmissionDates: '30',
  percentageTechnicalUnits: 40,
  percentageEndTrial: 60,
  daysSignReport: '10',
};

// ─── Setup ───────────────────────────────────────────────────────────────────

const setup = async () => {
  // Known Issue #2: fireTrial must include status to avoid crash in trialStatusLabel pipe
  const mockStore = createMockPlanningGeneralDataStore({
    specimens: createSpecimens(),
    users: createUsers(),
    fireTrial: { ...createTrial(), status: 'PLANNED' },
  });

  const user = userEvent.setup();
  const view = await render(PlanningGeneralDataFormComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAnimationsAsync(),
      provideTestingEnvironment(),
      { provide: PlanningGeneralDataStore, useValue: mockStore },
    ],
  });

  const loader = TestbedHarnessEnvironment.loader(view.fixture);
  return { view, loader, user, mockStore };
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PlanningGeneralDataFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Initial rendering ──────────────────────────────────────────────────────

  describe('Initial rendering', () => {
    it('should render header with trial code', async () => {
      await setup();
      expect(screen.getByText(/TRIAL-2025-001/i)).toBeInTheDocument();
    });

    it('should render validate button disabled initially', async () => {
      const { loader } = await setup();
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: /TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE/i }),
      );
      expect(await button.isDisabled()).toBe(true);
    });

    it('should render save draft button', async () => {
      await setup();
      expect(screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.SAVE_DRAFT')).toBeInTheDocument();
    });

    it('should render cancel button', async () => {
      await setup();
      expect(screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.CANCEL')).toBeInTheDocument();
    });

    it('should render all required field labels', async () => {
      await setup();
      expect(screen.getByText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.TRIAL_GOAL_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL/i)).toBeInTheDocument();
      expect(screen.getByText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL/i)).toBeInTheDocument();
    });

    it('should render scheduled dates label', async () => {
      await setup();
      expect(screen.getByText(/TRIAL_CREATE_MODIFY_FORM.SCHEDULED_DATE/i)).toBeInTheDocument();
    });
  });

  // ── Specimen display ───────────────────────────────────────────────────────

  describe('Specimen display', () => {
    it('should display concatenated specimen labels in readonly input', async () => {
      // selectedSpecimens is a vi.fn() (not a signal), so specimenSummary computed only reads
      // its value on first evaluation. Provide initial data to get correct output from the start.
      const mockStore = createMockPlanningGeneralDataStore({
        specimens: createSpecimens(),
        users: createUsers(),
        fireTrial: { ...createTrial(), status: 'PLANNED' },
        selectedSpecimens: [
          { specimenId: 'specimen-1', batch: '' },
          { specimenId: 'specimen-2', batch: '' },
        ],
      });

      await render(PlanningGeneralDataFormComponent, {
        imports: [TranslateModule.forRoot()],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideAnimationsAsync(),
          provideTestingEnvironment(),
          { provide: PlanningGeneralDataStore, useValue: mockStore },
        ],
      });

      const specimenInput = screen.getByLabelText(
        /TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_LABEL/i,
      ) as HTMLInputElement;
      expect(specimenInput.value).toBe('Munición inerte 105mm, Proyectil de entrenamiento');
      expect(specimenInput.readOnly).toBe(true);
    });

    it('should show empty string in specimen input when no specimens selected', async () => {
      await setup();
      const specimenInput = screen.getByLabelText(
        /TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_LABEL/i,
      ) as HTMLInputElement;
      expect(specimenInput.value).toBe('');
    });
  });

  // ── Percentage validations ─────────────────────────────────────────────────

  describe('Percentage validations', () => {
    it('should show error when percentage sum exceeds 100', async () => {
      const { user } = await setup();
      const techInput = screen.getByLabelText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL/i);
      const endInput = screen.getByLabelText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL/i);

      await user.clear(techInput);
      await user.type(techInput, '60');
      fireEvent.blur(techInput);

      await user.clear(endInput);
      await user.type(endInput, '50');
      fireEvent.blur(endInput);

      await waitFor(() => {
        expect(screen.getAllByText(/La suma de los porcentajes deben ser 100/i).length).toBeGreaterThan(0);
      });
    });

    it('should not show error when sum is exactly 100', async () => {
      const { user } = await setup();
      const techInput = screen.getByLabelText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL/i);
      const endInput = screen.getByLabelText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL/i);

      await user.clear(techInput);
      await user.type(techInput, '60');
      fireEvent.blur(techInput);

      await user.clear(endInput);
      await user.type(endInput, '40');
      fireEvent.blur(endInput);

      await waitFor(() => {
        expect(screen.queryByText(/La suma de los porcentajes deben ser 100/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent negative values on percentageEndTrial field', async () => {
      const { user } = await setup();
      const endInput = screen.getByLabelText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL/i) as HTMLInputElement;

      const event = new KeyboardEvent('keydown', { key: '-' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      endInput.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();

      fireEvent.input(endInput, { target: { value: '-45' } });
      expect(endInput.value).toBe('45');
    });
  });

  // ── Date fields ────────────────────────────────────────────────────────────

  describe('Date validations', () => {
    it('should render date parameters control section header', async () => {
      // Scheduled dates are shown as a readonly chip-set (inta-planning-scheduled-dates).
      // The date parameters section header is always rendered.
      await setup();
      expect(screen.getByText(/TRIAL_PLANNING.GENERAL_DATA_SECTION.DATE_PARAMS_CONTROL/i)).toBeInTheDocument();
    });
  });

  // ── Form state ─────────────────────────────────────────────────────────────

  describe('Form state', () => {
    it('should enable validate button when all required fields are filled and percentages sum to 100', async () => {
      const { view, loader } = await setup();

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
      });
      view.fixture.detectChanges();

      await waitFor(async () => {
        const button = await loader.getHarness(
          MatButtonHarness.with({ text: /TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE/i }),
        );
        expect(await button.isDisabled()).toBe(false);
      });
    });

    it('should keep validate button disabled when goal is empty', async () => {
      const { view, loader } = await setup();

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
        goal: '',
      });
      view.fixture.detectChanges();

      const button = await loader.getHarness(
        MatButtonHarness.with({ text: /TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE/i }),
      );
      expect(await button.isDisabled()).toBe(true);
    });
  });

  // ── Service interaction ────────────────────────────────────────────────────

  describe('Service interaction', () => {
    it('should call updatePlanningInfo when form is validated', async () => {
      const { view, loader, mockStore } = await setup();

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
        goal: 'Evaluar resistencia',
      });
      view.fixture.detectChanges();

      // Wait for button to be enabled, then click
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: /TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE/i }),
      );
      await waitFor(async () => {
        expect(await button.isDisabled()).toBe(false);
      });
      await button.click();

      // Wait for the async onValidate() → submit() → callback to complete
      await view.fixture.whenStable();

      expect(mockStore.updatePlanningInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          goal: 'Evaluar resistencia',
          planningUserId: TEST_CONSTANTS.IDS.USER.JUAN,
        }),
      );
    });

    it('should call updatePlanningInfo when save draft button is clicked and form is valid', async () => {
      const { view, mockStore } = await setup();

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
        goal: 'Borrador de prueba',
      });
      view.fixture.detectChanges();

      const draftButton = screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.SAVE_DRAFT').closest('button')!;
      draftButton.click();
      await view.fixture.whenStable();

      expect(mockStore.updatePlanningInfo).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'Borrador de prueba' }),
      );
    });

    it('should call reloadPlanningInfo when cancel button is clicked', async () => {
      const { view, mockStore } = await setup();

      const cancelButton = screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.CANCEL').closest('button')!;
      cancelButton.click();
      await view.fixture.whenStable();

      expect(mockStore.reloadPlanningInfo).toHaveBeenCalled();
    });
  });

  // ── Loading existing data ──────────────────────────────────────────────────

  describe('Loading existing data', () => {
    it('should populate form when planningInfo resource resolves', async () => {
      const { view, mockStore } = await setup();

      const mockPlanningInfo = createTrialPlanningInfo({
        goal: 'Evaluar resistencia a sequía',
        specimens: [{ specimenId: TEST_CONSTANTS.IDS.SPECIMEN.MUNITION_INERT, batch: '' }],
        planningUser: { id: TEST_CONSTANTS.IDS.USER.JUAN, name: 'Juan' },
      });
      mockStore._planningInfoResource._setValue(mockPlanningInfo);
      mockStore._planningInfoResource._setStatus('resolved');
      view.fixture.detectChanges();

      await waitForSignal(
        () => view.fixture.componentInstance.formModel().goal,
        (goal) => goal === 'Evaluar resistencia a sequía',
      );

      const formModel = view.fixture.componentInstance.formModel();
      expect(formModel.specimen).toHaveLength(1);
      expect(formModel.planningUser).toBe(TEST_CONSTANTS.IDS.USER.JUAN);
      expect(formModel.goal).toBe('Evaluar resistencia a sequía');
    });
  });

  // ── Disabled fields ────────────────────────────────────────────────────────

  describe('Disabled fields', () => {
    it('should keep maxEmissionDates field enabled and editable', async () => {
      const { view } = await setup();
      view.fixture.detectChanges();
      const maxDatesInput = screen.getByLabelText(
        /TRIAL_PLANNING.GENERAL_DATA_SECTION.MAX_DATE_REPORT_LABEL/i,
      ) as HTMLInputElement;
      expect(maxDatesInput.disabled).toBe(false);
    });
  });
});
