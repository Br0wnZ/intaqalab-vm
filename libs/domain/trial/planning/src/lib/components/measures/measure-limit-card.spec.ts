import { Component, type OnInit, signal } from '@angular/core';
import { disabled, form, required, validate } from '@angular/forms/signals';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MeasureSelectionData } from '../../utils-models/measure-serie.model';
import { MeasureLimitCard } from './measure-limit-card';

@Component({
  template: `
    <inta-measure-limit-card
      [measure]="measure"
      [measureName]="measureName"
      [measureForm]="measureForm"
      [isQuantitative]="isQuantitative"
      [readonly]="readonly"
      (remove)="onRemove()"
      (toggleExpanded)="onToggleExpanded()"
      (limitChange)="onLimitChange($event)"
    />
  `,
  imports: [MeasureLimitCard],
})
class TestHostComponent implements OnInit {
  measure: MeasureSelectionData = {
    id: 'm-1',
    expanded: false,
    minLimit: 10,
    maxLimit: 50,
    deviation: 2,
  };
  readonly measureModel = signal<MeasureSelectionData>(this.measure);
  readonly isReadonly = signal(false);
  readonly measureForm = form(this.measureModel, (measurePath) => {
    disabled(measurePath, () => this.isReadonly());
    required(measurePath.minLimit, {
      message: 'COMMONS.REQUIRED_FIELD',
      when: () => this.isQuantitative,
    });
    required(measurePath.maxLimit, {
      message: 'COMMONS.REQUIRED_FIELD',
      when: () => this.isQuantitative,
    });
    validate(measurePath.minLimit, ({ value, valueOf }) =>
      this.#isInvalidLimit(value(), valueOf(measurePath.maxLimit))
        ? { kind: 'invalidLimitRange', message: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.INVALID_RANGE' }
        : undefined,
    );
    validate(measurePath.maxLimit, ({ value, valueOf }) =>
      this.#isInvalidLimit(valueOf(measurePath.minLimit), value())
        ? { kind: 'invalidLimitRange', message: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.INVALID_RANGE' }
        : undefined,
    );
  });
  measureName = 'Presión';
  isQuantitative = true;
  readonly = false;

  readonly onRemove = vi.fn();
  readonly onToggleExpanded = vi.fn();
  readonly onLimitChange = vi.fn();

  ngOnInit(): void {
    this.measureModel.set(this.measure);
    this.isReadonly.set(this.readonly);
  }

  #isInvalidLimit(minLimit: number | null, maxLimit: number | null): boolean {
    return this.isQuantitative && minLimit !== null && maxLimit !== null && minLimit >= maxLimit;
  }
}

describe('MeasureLimitCard', () => {
  const runSetup = async (initialState?: Partial<TestHostComponent>) => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent, {
      componentProperties: initialState,
      providers: [provideAnimationsAsync(), provideTestingEnvironment()],
    });
    const host = view.fixture.componentInstance;
    return { view, user, host };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Collapsed State', () => {
    it('should render collapsed card with measure name', async () => {
      await runSetup({ measureName: 'Velocidad' });
      expect(screen.getByText('Velocidad')).toBeInTheDocument();
    });

    it('should render expand_more icon when collapsed', async () => {
      await runSetup();
      expect(screen.getByText('expand_more')).toBeInTheDocument();
    });

    it('should not render limit inputs when collapsed even if isQuantitative is true', async () => {
      await runSetup({
        isQuantitative: true,
        measure: { id: 'm-1', expanded: false, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      expect(screen.queryByLabelText(/Límite máximo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Límite mínimo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Desviación/i)).not.toBeInTheDocument();
    });

    it('should emit toggleExpanded when expand icon button is clicked', async () => {
      const { user, host } = await runSetup();
      const toggleBtn = screen.getByText('expand_more').closest('button');
      expect(toggleBtn).not.toBeNull();
      if (toggleBtn) {
        await user.click(toggleBtn);
      }
      expect(host.onToggleExpanded).toHaveBeenCalledTimes(1);
    });

    it('should emit remove when delete button is clicked in collapsed state', async () => {
      const { user, host } = await runSetup();
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).not.toBeNull();
      if (deleteBtn) {
        await user.click(deleteBtn);
      }
      expect(host.onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Expanded State', () => {
    it('should show invalid range messages in both limit fields', async () => {
      const { user } = await runSetup({
        measure: { id: 'm-1', expanded: true, minLimit: 50, maxLimit: 10, deviation: 2 },
      });
      const minInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MIN_LIMIT|Límite mínimo/i);
      const maxInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MAX_LIMIT|Límite máximo/i);

      await user.click(minInput);
      await user.tab();
      await user.click(maxInput);
      await user.tab();

      expect(
        screen.getAllByText(
          /TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.INVALID_RANGE|El límite mínimo debe ser menor que el máximo/i,
        ),
      ).toHaveLength(2);
    });

    it('should show the required message when minimum limit is empty and touched', async () => {
      const { user } = await runSetup({
        measure: { id: 'm-1', expanded: true, minLimit: null, maxLimit: 50, deviation: 2 },
      });
      const minInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MIN_LIMIT|Límite mínimo/i);

      await user.click(minInput);
      await user.tab();

      expect(screen.getByText(/COMMONS\.REQUIRED_FIELD|Valor requerido/i)).toBeInTheDocument();
    });

    it('should render expand_less icon when expanded', async () => {
      await runSetup({
        measure: { id: 'm-1', expanded: true, minLimit: null, maxLimit: null, deviation: null },
      });
      expect(screen.getByText('expand_less')).toBeInTheDocument();
    });

    it('should not render limit inputs when expanded and isQuantitative is false', async () => {
      await runSetup({
        isQuantitative: false,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      expect(screen.queryByLabelText(/Límite máximo/i)).not.toBeInTheDocument();
    });

    it('should render quantitative limit inputs with values when expanded and isQuantitative is true', async () => {
      await runSetup({
        isQuantitative: true,
        measure: { id: 'm-1', expanded: true, minLimit: 15, maxLimit: 85, deviation: 3 },
      });

      const maxInput = screen.getByLabelText(
        /TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MAX_LIMIT|Límite máximo/i,
      ) as HTMLInputElement;
      const minInput = screen.getByLabelText(
        /TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MIN_LIMIT|Límite mínimo/i,
      ) as HTMLInputElement;
      const devInput = screen.getByLabelText(
        /TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.DEVIATION|Desviación/i,
      ) as HTMLInputElement;

      expect(maxInput).toBeInTheDocument();
      expect(maxInput.value).toBe('85');
      expect(minInput.value).toBe('15');
      expect(devInput.value).toBe('3');
    });

    it('should emit toggleExpanded when collapse icon button is clicked in expanded state', async () => {
      const { user, host } = await runSetup({
        measure: { id: 'm-1', expanded: true, minLimit: null, maxLimit: null, deviation: null },
      });
      const collapseBtn = screen.getByText('expand_less').closest('button');
      expect(collapseBtn).not.toBeNull();
      if (collapseBtn) {
        await user.click(collapseBtn);
      }
      expect(host.onToggleExpanded).toHaveBeenCalledTimes(1);
    });

    it('should emit remove when delete button is clicked in expanded state', async () => {
      const { user, host } = await runSetup({
        measure: { id: 'm-1', expanded: true, minLimit: null, maxLimit: null, deviation: null },
      });
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).not.toBeNull();
      if (deleteBtn) {
        await user.click(deleteBtn);
      }
      expect(host.onRemove).toHaveBeenCalledTimes(1);
    });

    it('should emit limitChange when maximum limit is modified', async () => {
      const { user, host } = await runSetup({
        isQuantitative: true,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      const maxInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MAX_LIMIT|Límite máximo/i);
      await user.clear(maxInput);
      await user.type(maxInput, '90');
      expect(host.onLimitChange).toHaveBeenCalledWith({ field: 'maxLimit', value: 90 });
    });

    it('should emit limitChange when minimum limit is modified', async () => {
      const { user, host } = await runSetup({
        isQuantitative: true,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      const minInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MIN_LIMIT|Límite mínimo/i);
      await user.clear(minInput);
      await user.type(minInput, '5');
      expect(host.onLimitChange).toHaveBeenCalledWith({ field: 'minLimit', value: 5 });
    });

    it('should emit limitChange when deviation is modified', async () => {
      const { user, host } = await runSetup({
        isQuantitative: true,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      const devInput = screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.DEVIATION|Desviación/i);
      await user.clear(devInput);
      await user.type(devInput, '4');
      expect(host.onLimitChange).toHaveBeenCalledWith({ field: 'deviation', value: 4 });
    });
  });

  describe('Readonly Mode', () => {
    it('should disable delete button in collapsed state when readonly is true', async () => {
      await runSetup({ readonly: true });
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).toBeDisabled();
    });

    it('should disable delete button and inputs in expanded state when readonly is true', async () => {
      await runSetup({
        readonly: true,
        isQuantitative: true,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).toBeDisabled();
      expect(screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MAX_LIMIT|Límite máximo/i)).toBeDisabled();
      expect(screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.MIN_LIMIT|Límite mínimo/i)).toBeDisabled();
      expect(screen.getByLabelText(/TRIAL_PLANNING\.MEASURES\.LIMIT_CARD\.DEVIATION|Desviación/i)).toBeDisabled();
    });

    it('should not emit limitChange when onLimitChange is called while readonly', async () => {
      const { view, host } = await runSetup({ readonly: true });
      const cardDebug = view.fixture.debugElement.children[0];
      const cardInstance = cardDebug.componentInstance as MeasureLimitCard;

      cardInstance.onLimitChange('maxLimit', 100);
      expect(host.onLimitChange).not.toHaveBeenCalled();
    });
  });

  describe('Qualitative Measure (Non-expandable)', () => {
    it('should render measure name and delete button without expand_more or expand_less icons', async () => {
      await runSetup({ isQuantitative: false, measureName: 'Cámara alta velocidad' });
      expect(screen.getByText('Cámara alta velocidad')).toBeInTheDocument();
      expect(screen.getByText('delete')).toBeInTheDocument();
      expect(screen.queryByText('expand_more')).not.toBeInTheDocument();
      expect(screen.queryByText('expand_less')).not.toBeInTheDocument();
    });

    it('should not render expanded state or limit inputs even if measure.expanded is true', async () => {
      await runSetup({
        isQuantitative: false,
        measure: { id: 'm-1', expanded: true, minLimit: 10, maxLimit: 50, deviation: 2 },
      });
      expect(screen.queryByText('expand_less')).not.toBeInTheDocument();
      expect(screen.queryByText('expand_more')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Límite máximo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Límite mínimo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Desviación/i)).not.toBeInTheDocument();
    });

    it('should not emit toggleExpanded when onToggleExpanded is called while isQuantitative is false', async () => {
      const { view, host } = await runSetup({ isQuantitative: false });
      const cardDebug = view.fixture.debugElement.children[0];
      const cardInstance = cardDebug.componentInstance as MeasureLimitCard;

      cardInstance.onToggleExpanded();
      expect(host.onToggleExpanded).not.toHaveBeenCalled();
    });

    it('should still allow deleting qualitative measures', async () => {
      const { user, host } = await runSetup({ isQuantitative: false });
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).not.toBeNull();
      if (deleteBtn) {
        await user.click(deleteBtn);
      }
      expect(host.onRemove).toHaveBeenCalledTimes(1);
    });
  });
});
