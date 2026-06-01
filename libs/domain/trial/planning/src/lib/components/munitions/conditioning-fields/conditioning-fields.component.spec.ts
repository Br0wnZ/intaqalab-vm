import type { ComponentFixture } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReconditioningData } from '../../../utils-models/munitions.model';
import { ConditioningFieldsComponent } from './conditioning-fields.component';

const defaultImports = [TranslateModule.forRoot()];

describe('ConditioningFieldsComponent', () => {
  let fixture: ComponentFixture<ConditioningFieldsComponent>;

  const defaultData: ReconditioningData = {
    temperature: 25,
    tolerance: 2,
    timeMin: 4,
    timeMax: 8,
    observations: 'Test observations',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render all form fields', async () => {
      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
      });

      expect(
        screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.tolerance_label/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.min_time_label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.max_time_label/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.observations_label/i),
      ).toBeInTheDocument();
    });

    it('should display initial values correctly', async () => {
      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
      });

      const tempInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i,
      ) as HTMLInputElement;
      const toleranceInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.tolerance_label/i,
      ) as HTMLInputElement;
      const minTimeInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.min_time_label/i,
      ) as HTMLInputElement;
      const maxTimeInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.max_time_label/i,
      ) as HTMLInputElement;
      const observationsInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.observations_label/i,
      ) as HTMLTextAreaElement;

      expect(tempInput.value).toBe('25');
      expect(toleranceInput.value).toBe('2');
      expect(minTimeInput.value).toBe('4');
      expect(maxTimeInput.value).toBe('8');
      expect(observationsInput.value).toBe('Test observations');
    });
  });

  describe('Field interaction', () => {
    it('should emit changes when user modifies temperature', async () => {
      const user = userEvent.setup();
      const dataChangeSpy = vi.fn();

      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
        on: { dataChange: dataChangeSpy },
      });

      const tempInput = screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i);
      await user.clear(tempInput);
      await user.type(tempInput, '30');
      fireEvent.blur(tempInput);

      expect(dataChangeSpy).toHaveBeenCalled();
      const emittedData = dataChangeSpy.mock.calls.at(-1)?.[0];
      expect(emittedData.temperature).toBe(30);
    });

    it('should emit changes when user modifies tolerance', async () => {
      const user = userEvent.setup();
      const dataChangeSpy = vi.fn();

      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
        on: { dataChange: dataChangeSpy },
      });

      const toleranceInput = screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.tolerance_label/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '5');
      fireEvent.blur(toleranceInput);

      expect(dataChangeSpy).toHaveBeenCalled();
      const emittedData = dataChangeSpy.mock.calls.at(-1)?.[0];
      expect(emittedData.tolerance).toBe(5);
    });

    it('should emit changes when user modifies time values', async () => {
      const user = userEvent.setup();
      const dataChangeSpy = vi.fn();

      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
        on: { dataChange: dataChangeSpy },
      });

      const minTimeInput = screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.min_time_label/i);
      await user.clear(minTimeInput);
      await user.type(minTimeInput, '6');
      fireEvent.blur(minTimeInput);

      expect(dataChangeSpy).toHaveBeenCalled();
      const emittedData = dataChangeSpy.mock.calls.at(-1)?.[0];
      expect(emittedData.timeMin).toBe(6);
    });

    it('should emit changes when user modifies observations', async () => {
      const user = userEvent.setup();
      const dataChangeSpy = vi.fn();

      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
        on: { dataChange: dataChangeSpy },
      });

      const observationsInput = screen.getByLabelText(
        /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.observations_label/i,
      );
      await user.clear(observationsInput);
      await user.type(observationsInput, 'New observations');
      fireEvent.blur(observationsInput);

      expect(dataChangeSpy).toHaveBeenCalled();
      const emittedData = dataChangeSpy.mock.calls.at(-1)?.[0];
      expect(emittedData.observations).toBe('New observations');
    });
  });

  describe('Data emission', () => {
    it('should emit complete data object when field changes', async () => {
      const user = userEvent.setup();
      const dataChangeSpy = vi.fn();

      await render(ConditioningFieldsComponent, {
        imports: defaultImports,
        componentInputs: { data: defaultData },
        on: { dataChange: dataChangeSpy },
      });

      const tempInput = screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i);
      await user.clear(tempInput);
      await user.type(tempInput, '35');

      expect(dataChangeSpy).toHaveBeenCalled();
      const emittedData = dataChangeSpy.mock.calls[dataChangeSpy.mock.calls.length - 1][0];
      expect(emittedData).toHaveProperty('temperature');
      expect(emittedData).toHaveProperty('tolerance');
      expect(emittedData).toHaveProperty('timeMin');
      expect(emittedData).toHaveProperty('timeMax');
    });
  });
});
