import { Component, signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MasterDataMeasureItem, SelectOption } from '../../utils-models/catalog.model';
import type {
  MeasureCategoryDef,
  MeasureCategoryType,
  MeasureSelectionData,
} from '../../utils-models/measure-serie.model';
import { MeasureCategoryCard } from './measure-category-card';

@Component({
  template: `
    <inta-measure-category-card
      [category]="category()"
      [isOpen]="isOpen()"
      [options]="options()"
      [selectedValues]="selectedValues()"
      [readonly]="readonly()"
      [measuresCatalog]="measuresCatalog()"
      (toggleOpen)="onToggleOpen()"
      (selectedValuesChange)="onSelectedValuesChange($event)"
      (toggleFavorite)="onToggleFavorite($event)"
      (removeMeasure)="onRemoveMeasure($event)"
      (toggleMeasureExpanded)="onToggleMeasureExpanded($event)"
      (updateLimit)="onUpdateLimit($event)"
    />
  `,
  imports: [MeasureCategoryCard],
})
class TestHostComponent {
  readonly category = signal<MeasureCategoryDef>({
    key: 'topografia',
    title: 'Topografía',
    subtitle: 'Magnitudes y registros de topografía',
  });
  readonly isOpen = signal<boolean>(false);
  readonly options = signal<SelectOption[]>([
    { id: 'meas-1', name: 'Inclinación', active: true, favorite: false },
    { id: 'meas-2', name: 'Azimut', active: true, favorite: true },
  ]);
  readonly selectedValues = signal<MeasureSelectionData[]>([]);
  readonly readonly = signal<boolean>(false);
  readonly measuresCatalog = signal<MasterDataMeasureItem[]>([
    { id: 'meas-1', qualificationType: 'QUANTITATIVE' } as MasterDataMeasureItem,
    { id: 'meas-2', qualificationType: 'QUALITATIVE' } as MasterDataMeasureItem,
  ]);

  readonly onToggleOpen = vi.fn();
  readonly onSelectedValuesChange = vi.fn();
  readonly onToggleFavorite = vi.fn();
  readonly onRemoveMeasure = vi.fn();
  readonly onToggleMeasureExpanded = vi.fn();
  readonly onUpdateLimit = vi.fn();
}

describe('MeasureCategoryCard', () => {
  const runSetup = async (initialState?: {
    category?: MeasureCategoryDef;
    isOpen?: boolean;
    options?: SelectOption[];
    selectedValues?: MeasureSelectionData[];
    readonly?: boolean;
    measuresCatalog?: MasterDataMeasureItem[];
  }) => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent, {
      providers: [provideAnimationsAsync(), provideTestingEnvironment()],
    });
    const host = view.fixture.componentInstance;
    if (initialState?.category) {
      host.category.set(initialState.category);
    }
    if (initialState?.isOpen !== undefined) {
      host.isOpen.set(initialState.isOpen);
    }
    if (initialState?.options) {
      host.options.set(initialState.options);
    }
    if (initialState?.selectedValues) {
      host.selectedValues.set(initialState.selectedValues);
    }
    if (initialState?.readonly !== undefined) {
      host.readonly.set(initialState.readonly);
    }
    if (initialState?.measuresCatalog) {
      host.measuresCatalog.set(initialState.measuresCatalog);
    }
    view.fixture.detectChanges();

    const cardDebug = view.fixture.debugElement.children[0];
    const card = cardDebug.componentInstance as MeasureCategoryCard;
    return { view, user, host, card };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header & Collapsed State', () => {
    it('should render category title, subtitle, and expand_more icon when collapsed', async () => {
      await runSetup();
      expect(screen.getByText('Topografía')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de topografía')).toBeInTheDocument();
      expect(screen.getByText('expand_more')).toBeInTheDocument();
    });

    it('should render correct headers for each category key', async () => {
      const { host, view } = await runSetup({
        category: { key: 'topografia', title: 'Topografía', subtitle: 'Sub topografia' },
      });
      expect(screen.getByText('Topografía')).toBeInTheDocument();
      expect(screen.getByText('Sub topografia')).toBeInTheDocument();

      host.category.set({ key: 'municiones', title: 'Municiones', subtitle: 'Sub municiones' });
      view.fixture.detectChanges();
      expect(screen.getByText('Municiones')).toBeInTheDocument();

      host.category.set({ key: 'armamento', title: 'Armamento', subtitle: 'Sub armamento' });
      view.fixture.detectChanges();
      expect(screen.getByText('Armamento')).toBeInTheDocument();

      host.category.set({ key: 'balistica', title: 'Balística', subtitle: 'Sub balistica' });
      view.fixture.detectChanges();
      expect(screen.getByText('Balística')).toBeInTheDocument();
    });

    it('should not render multi-select or limit cards when isOpen is false', async () => {
      await runSetup({
        isOpen: false,
        selectedValues: [{ id: 'meas-1', expanded: false }],
      });
      expect(screen.queryByText('Selecciona magnitudes y/o registros')).not.toBeInTheDocument();
      expect(screen.queryByText('Inclinación')).not.toBeInTheDocument();
    });

    it('should emit toggleOpen when header is clicked', async () => {
      const { user, host } = await runSetup();
      const header = screen.getByRole('button');
      await user.click(header);
      expect(host.onToggleOpen).toHaveBeenCalledTimes(1);
    });

    it('should emit toggleOpen when Enter is pressed on header', async () => {
      const { host } = await runSetup();
      const header = screen.getByRole('button');
      fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
      expect(host.onToggleOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Expanded State', () => {
    it('should render expand_less icon when isOpen is true', async () => {
      await runSetup({ isOpen: true });
      expect(screen.getByText('expand_less')).toBeInTheDocument();
    });

    it('should render multi-select search field when isOpen is true', async () => {
      await runSetup({ isOpen: true });
      expect(screen.getByText('Selecciona magnitudes y/o registros')).toBeInTheDocument();
    });

    it('should render measure limit cards for each item in selectedValues', async () => {
      await runSetup({
        isOpen: true,
        selectedValues: [
          { id: 'meas-1', expanded: false },
          { id: 'meas-2', expanded: false },
        ],
      });
      expect(screen.getByText('Inclinación')).toBeInTheDocument();
      expect(screen.getByText('Azimut')).toBeInTheDocument();
    });
  });

  describe('Delegation & Outputs', () => {
    it('should emit removeMeasure with measureId when a limit card emits remove', async () => {
      const { user, host } = await runSetup({
        isOpen: true,
        selectedValues: [{ id: 'meas-1', expanded: false }],
      });
      const deleteBtn = screen.getByText('delete').closest('button');
      expect(deleteBtn).not.toBeNull();
      if (deleteBtn) {
        await user.click(deleteBtn);
      }
      expect(host.onRemoveMeasure).toHaveBeenCalledWith('meas-1');
    });

    it('should emit toggleMeasureExpanded with measureId when a limit card toggles expansion', async () => {
      const { user, host } = await runSetup({
        isOpen: true,
        selectedValues: [{ id: 'meas-1', expanded: false }],
      });
      const toggleBtn = screen.getByText('expand_more').closest('button');
      expect(toggleBtn).not.toBeNull();
      if (toggleBtn) {
        await user.click(toggleBtn);
      }
      expect(host.onToggleMeasureExpanded).toHaveBeenCalledWith('meas-1');
    });

    it('should not emit toggleMeasureExpanded for qualitative measure', async () => {
      const { host, card } = await runSetup({
        isOpen: true,
        selectedValues: [{ id: 'meas-2', expanded: false }],
      });
      expect(screen.queryByText('expand_more')).not.toBeInTheDocument();
      card.onToggleMeasureExpanded('meas-2');
      expect(host.onToggleMeasureExpanded).not.toHaveBeenCalled();
    });

    it('should emit updateLimit when limitChange is triggered', async () => {
      const { host, card } = await runSetup({
        isOpen: true,
        selectedValues: [{ id: 'meas-1', expanded: true }],
      });
      card.onLimitChange('meas-1', { field: 'maxLimit', value: 100 });
      expect(host.onUpdateLimit).toHaveBeenCalledWith({
        measureId: 'meas-1',
        field: 'maxLimit',
        value: 100,
      });
    });

    it('should not emit updateLimit when readonly is true', async () => {
      const { host, card } = await runSetup({
        isOpen: true,
        readonly: true,
        selectedValues: [{ id: 'meas-1', expanded: true }],
      });
      card.onLimitChange('meas-1', { field: 'maxLimit', value: 100 });
      expect(host.onUpdateLimit).not.toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    it('should identify quantitative measures correctly', async () => {
      const { card } = await runSetup();
      expect(card.isQuantitative('meas-1')).toBe(true);
      expect(card.isQuantitative('meas-2')).toBe(false);
      expect(card.isQuantitative('non-existent')).toBe(false);
    });

    it('should resolve measure name from options or fallback to id', async () => {
      const { card } = await runSetup();
      expect(card.getMeasureName('meas-1')).toBe('Inclinación');
      expect(card.getMeasureName('unknown-id')).toBe('unknown-id');
    });
  });
});
