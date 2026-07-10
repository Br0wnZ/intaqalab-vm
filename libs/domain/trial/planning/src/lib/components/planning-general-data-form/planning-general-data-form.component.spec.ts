import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
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

interface SetupOptions {
  /** Estado de la prueba. Por defecto 'UNDER_REVIEW' (planificación editable). */
  fireTrialStatus?: string;
  /** Roles del usuario autenticado. Por defecto Admin (puede validar y modificar). */
  roles?: string[];
  /** Marca la planificación como validable (`isValidable: true`) en el resource de info. */
  isValidable?: boolean;
  /** Errores de validación devueltos por el backend, si los hay. */
  validationErrors?: string[];
}

const setup = async (options: SetupOptions = {}) => {
  const {
    fireTrialStatus = 'UNDER_REVIEW',
    roles = ['INTAQALAB_ADMIN'],
    isValidable = false,
    validationErrors,
  } = options;

  // Known Issue #2: fireTrial must include status to avoid crash in trialStatusLabel pipe
  const mockStore = createMockPlanningGeneralDataStore({
    specimens: createSpecimens(),
    users: createUsers(),
    fireTrial: { ...createTrial(), status: fireTrialStatus },
  });

  if (isValidable || validationErrors) {
    mockStore._planningInfoResource._setValue(
      createTrialPlanningInfo({
        specimens: [{ specimenId: TEST_CONSTANTS.IDS.SPECIMEN.MUNITION_INERT, batch: '' }],
        planningUser: { id: TEST_CONSTANTS.IDS.USER.JUAN, name: 'Juan' },
        isValidable,
        validationErrors: validationErrors ?? [],
      }),
    );
  }

  const user = userEvent.setup();
  const view = await render(PlanningGeneralDataFormComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAnimationsAsync(),
      provideTestingEnvironment(),
      { provide: PlanningGeneralDataStore, useValue: mockStore },
      { provide: AuthService, useValue: { userRoles: signal(roles) } },
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
          { provide: AuthService, useValue: { userRoles: signal(['INTAQALAB_ADMIN']) } },
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
      const endInput = screen.getByLabelText(
        /TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL/i,
      ) as HTMLInputElement;

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
      const { view, loader } = await setup({ isValidable: true });

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
    it('should call store.validatePlanning (not updatePlanningInfo) when validate button is clicked', async () => {
      const { view, loader, mockStore } = await setup({ isValidable: true });

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
      await view.fixture.whenStable();

      expect(mockStore.validatePlanning).toHaveBeenCalled();
      expect(mockStore.updatePlanningInfo).not.toHaveBeenCalled();
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

    it('should NOT include ratingCriteriaUnits in payload when rating criteria checkbox is unchecked', async () => {
      const { view, mockStore } = await setup();

      // Ensure showRatingCriteria is false (default state)
      expect(view.fixture.componentInstance.showRatingCriteria()).toBe(false);

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
      });
      view.fixture.detectChanges();

      const draftButton = screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.SAVE_DRAFT').closest('button')!;
      draftButton.click();
      await view.fixture.whenStable();

      const payload = mockStore.updatePlanningInfo.mock.calls[0][0];
      expect(payload).not.toHaveProperty('ratingCriteriaUnits');
      expect(payload).not.toHaveProperty('ratingCriteria');
    });

    it('should include ratingCriteriaUnits with valid MeasureUnitEnum values when checkbox is checked', async () => {
      const { view, mockStore, user } = await setup();

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
      });
      view.fixture.detectChanges();

      // Check the rating criteria checkbox
      const checkbox = screen.getByRole('checkbox', {
        name: /TRIAL_PLANNING\.GENERAL_DATA_SECTION\.SHOW_RATING_CRITERIA/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        expect(view.fixture.componentInstance.showRatingCriteria()).toBe(true);
      });

      const draftButton = screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.SAVE_DRAFT').closest('button')!;
      draftButton.click();
      await view.fixture.whenStable();

      const payload = mockStore.updatePlanningInfo.mock.calls[0][0];
      expect(payload).toHaveProperty('ratingCriteriaUnits');
      // Verify units match MeasureUnitEnum values (M_S, not MS)
      expect(payload.ratingCriteriaUnits.speedUnit).toBe('M_S');
      expect(payload.ratingCriteriaUnits.pressureUnit).toBe('BAR');
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

    it('should check show rating criteria when backend has non-zero rating criteria values', async () => {
      const { view, mockStore } = await setup();

      const mockPlanningInfo = createTrialPlanningInfo({
        specimens: [{ specimenId: TEST_CONSTANTS.IDS.SPECIMEN.MUNITION_INERT, batch: '' }],
        planningUser: { id: TEST_CONSTANTS.IDS.USER.JUAN, name: 'Juan' },
        ratingCriteria: {
          v0c: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          v0cMean: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          v0cStdDev: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          p: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          pMean: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          projectile: { useful1Min: 0, useful1Max: 1, uselessMin: 0, uselessMax: 0 },
          primer: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          fuse: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
        },
      });

      mockStore._planningInfoResource._setValue(mockPlanningInfo);
      mockStore._planningInfoResource._setStatus('resolved');
      view.fixture.detectChanges();

      await waitFor(() => {
        expect(view.fixture.componentInstance.showRatingCriteria()).toBe(true);
      });

      expect(
        screen.getByRole('checkbox', {
          name: /TRIAL_PLANNING\.GENERAL_DATA_SECTION\.SHOW_RATING_CRITERIA/i,
        }),
      ).toBeChecked();
    });

    it('should keep show rating criteria unchecked when backend rating criteria only contains zeros', async () => {
      const { view, mockStore } = await setup();

      const mockPlanningInfo = createTrialPlanningInfo({
        specimens: [{ specimenId: TEST_CONSTANTS.IDS.SPECIMEN.MUNITION_INERT, batch: '' }],
        planningUser: { id: TEST_CONSTANTS.IDS.USER.JUAN, name: 'Juan' },
        ratingCriteria: {
          v0c: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          v0cMean: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          v0cStdDev: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          p: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          pMean: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          projectile: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          primer: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
          fuse: { useful1Min: 0, useful1Max: 0, uselessMin: 0, uselessMax: 0 },
        },
      });

      mockStore._planningInfoResource._setValue(mockPlanningInfo);
      mockStore._planningInfoResource._setStatus('resolved');
      view.fixture.detectChanges();

      await waitFor(() => {
        expect(view.fixture.componentInstance.showRatingCriteria()).toBe(false);
      });

      expect(
        screen.getByRole('checkbox', {
          name: /TRIAL_PLANNING\.GENERAL_DATA_SECTION\.SHOW_RATING_CRITERIA/i,
        }),
      ).not.toBeChecked();
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
      expect(maxDatesInput).toBeEnabled();
    });
  });

  // ── Planning Lifecycle (validate / unlock) ─────────────────────────────────

  describe('Planning Lifecycle', () => {
    it('should NOT render validate button when the trial is not UNDER_REVIEW', async () => {
      await setup({ fireTrialStatus: 'PLANNED', isValidable: true });
      expect(screen.queryByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE')).not.toBeInTheDocument();
    });

    it('should NOT render validate button for a role without validate permission', async () => {
      await setup({ fireTrialStatus: 'UNDER_REVIEW', isValidable: true, roles: ['INTAQALAB_TRIAL_CONSULTANT'] });
      expect(screen.queryByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE')).not.toBeInTheDocument();
    });

    it('should keep validate button disabled when the planning is not validable', async () => {
      const { view, loader } = await setup({ fireTrialStatus: 'UNDER_REVIEW', isValidable: false });

      view.fixture.componentInstance.formModel.set({
        ...view.fixture.componentInstance.formModel(),
        ...validFormValues,
      });
      view.fixture.detectChanges();

      const button = await loader.getHarness(
        MatButtonHarness.with({ text: /TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE/i }),
      );
      expect(await button.isDisabled()).toBe(true);
    });

    it('should render the modify planning button when the trial is PLANNED for a permitted role', async () => {
      await setup({ fireTrialStatus: 'PLANNED', roles: ['INTAQALAB_ADMIN'] });
      expect(screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.MODIFY_PLANNING')).toBeInTheDocument();
    });

    it('should NOT render the modify planning button for a role without modify permission', async () => {
      await setup({ fireTrialStatus: 'PLANNED', roles: ['INTAQALAB_TRIAL_CONSULTANT'] });
      expect(screen.queryByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.MODIFY_PLANNING')).not.toBeInTheDocument();
    });

    it('should NOT render the modify planning button when the trial is UNDER_REVIEW', async () => {
      await setup({ fireTrialStatus: 'UNDER_REVIEW', roles: ['INTAQALAB_ADMIN'] });
      expect(screen.queryByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.MODIFY_PLANNING')).not.toBeInTheDocument();
    });

    it('should call store.unlockPlanning when the modify planning button is clicked', async () => {
      const { mockStore } = await setup({ fireTrialStatus: 'PLANNED', roles: ['INTAQALAB_ADMIN'] });

      const modifyButton = screen.getByText('TRIAL_PLANNING.GENERAL_DATA_SECTION.MODIFY_PLANNING').closest('button');
      modifyButton?.click();

      expect(mockStore.unlockPlanning).toHaveBeenCalled();
    });
  });

  // ── Validation errors icon/tooltip ─────────────────────────────────────────

  describe('Validation errors icon', () => {
    it('should NOT render the icon when there are no validation errors', async () => {
      await setup({ fireTrialStatus: 'UNDER_REVIEW', roles: ['INTAQALAB_ADMIN'], validationErrors: [] });
      expect(
        screen.queryByLabelText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATION_ERRORS_TITLE'),
      ).not.toBeInTheDocument();
    });

    it('should render the icon for a permitted role when there are validation errors', async () => {
      await setup({
        fireTrialStatus: 'UNDER_REVIEW',
        roles: ['INTAQALAB_ADMIN'],
        validationErrors: ['El objetivo de la prueba es obligatorio.'],
      });
      expect(screen.getByLabelText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATION_ERRORS_TITLE')).toBeInTheDocument();
    });

    it('should NOT render the icon for a role without validate permission, even with errors', async () => {
      await setup({
        fireTrialStatus: 'UNDER_REVIEW',
        roles: ['INTAQALAB_TRIAL_CONSULTANT'],
        validationErrors: ['El objetivo de la prueba es obligatorio.'],
      });
      expect(
        screen.queryByLabelText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATION_ERRORS_TITLE'),
      ).not.toBeInTheDocument();
    });

    it('should show the validation errors list on hover and hide it on mouse leave', async () => {
      await setup({
        fireTrialStatus: 'UNDER_REVIEW',
        roles: ['INTAQALAB_ADMIN'],
        validationErrors: ['El objetivo de la prueba es obligatorio.', 'Debe haber al menos un espécimen.'],
      });

      const icon = screen.getByLabelText('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATION_ERRORS_TITLE');
      expect(screen.queryByText('El objetivo de la prueba es obligatorio.')).not.toBeInTheDocument();

      fireEvent.mouseEnter(icon);
      expect(screen.getByText('El objetivo de la prueba es obligatorio.')).toBeInTheDocument();
      expect(screen.getByText('Debe haber al menos un espécimen.')).toBeInTheDocument();

      fireEvent.mouseLeave(icon);
      expect(screen.queryByText('El objetivo de la prueba es obligatorio.')).not.toBeInTheDocument();
    });
  });
});
