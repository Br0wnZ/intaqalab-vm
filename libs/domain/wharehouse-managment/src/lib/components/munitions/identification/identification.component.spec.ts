import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type { DenominationModel } from '../../../models/denominations.model';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
import { MunitionIdentificationComponent } from './identification.component';

// // Factories
//

function makeDenomination(overrides: Partial<DenominationModel> = {}): DenominationModel {
  return {
    id: 'denom-1',
    name: 'Vaso 1',
    category: 'MUNITION_COMPONENT',
    munitionType: { id: 'vaso', name: 'Vaso' },
    neq: 2,
    unNumber: 'UN0001',
    weight: 3,
    active: true,
    ...overrides,
  };
}

function makeMunitionComponent(overrides: Partial<MunitionComponentsModel> = {}): MunitionComponentsModel {
  return {
    id: 'GRANADA_MORTERO',
    label: 'Granada mortero',
    name: { es: 'Granada mortero', en: 'Granada mortero' },
    observations: '',
    category: 'MUNITION',
    active: true,
    ...overrides,
  };
}

function makeDenominationsStore(items: DenominationModel[] = []) {
  return {
    items: signal<DenominationModel[]>(items),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionComponentStore(items: MunitionComponentsModel[] = []) {
  return {
    items: signal<MunitionComponentsModel[]>(items),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

// Setup
async function setup(
  opts: {
    denominationsItems?: DenominationModel[];
    munitionComponentItems?: MunitionComponentsModel[];
  } = {},
) {
  const user = userEvent.setup();
  const denominationsStore = makeDenominationsStore(opts.denominationsItems ?? []);
  const munitionComponentStore = makeMunitionComponentStore(opts.munitionComponentItems ?? []);

  const view = await render(MunitionIdentificationComponent, {
    componentInputs: { category: 'MUNITION' },
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: DenominationsStore, useValue: denominationsStore },
      { provide: MunitionComponentStore, useValue: munitionComponentStore },
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const component = fixture.componentInstance;
  return { fixture, user, component, denominationsStore, munitionComponentStore };
}

// Tests
describe('MunitionIdentificationComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Initialization
  describe('Initialization', () => {
    it('should render the denomination input', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_PLACEHOLDER')).toBeTruthy();
    });

    it('should render the batch input', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL')).toBeTruthy();
    });

    it('should render the quantity input', async () => {
      await setup();
      expect(screen.getByRole('spinbutton')).toBeTruthy();
    });

    it('should have denomination field disabled when no munitionType is selected', async () => {
      const { component } = await setup();
      expect(component.form.denominationId().disabled()).toBe(true);
    });

    it('should have touched signal set to false initially', async () => {
      const { component } = await setup();
      expect(component.touched()).toBe(false);
    });
  });

  // errors() computed
  describe('errors() computed', () => {
    it('should return true when all required fields are empty', async () => {
      const { component } = await setup();
      expect(component.errors()).toBe(true);
    });

    it('should return false when all required fields are filled correctly', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.denominationId().setControlValue(makeDenomination());
      component.form.batch().setControlValue('BATCH-001');
      component.form.quantity().setControlValue(10);
      fixture.detectChanges();
      expect(component.errors()).toBe(false);
    });

    it('should return true when denominationId is a plain string (not selected from list)', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      // Use â‰¤2 chars so filteredOptions$ filter guard (length > 2) does NOT fire
      // and avoid reading undefined repositoryDenominations entries
      component.form.denominationId().setControlValue('ab');
      component.form.batch().setControlValue('BATCH-001');
      component.form.quantity().setControlValue(10);
      fixture.detectChanges();
      expect(component.errors()).toBe(true);
    });

    it('should return true when quantity is zero (min validation)', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.denominationId().setControlValue(makeDenomination());
      component.form.batch().setControlValue('BATCH-001');
      component.form.quantity().setControlValue(0);
      fixture.detectChanges();
      expect(component.errors()).toBe(true);
    });
  });

  // value() computed
  describe('value() computed', () => {
    it('should return false when the form has errors', async () => {
      const { component } = await setup();
      expect(component.value()).toBe(false);
    });

    it('should return the form control value when there are no errors', async () => {
      const { component, fixture } = await setup();
      const denom = makeDenomination();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.denominationId().setControlValue(denom);
      component.form.batch().setControlValue('BATCH-001');
      component.form.quantity().setControlValue(10);
      fixture.detectChanges();
      expect(component.value()).toStrictEqual({
        munitionTypeId: 'GRANADA_MORTERO',
        denominationId: denom,
        batch: 'BATCH-001',
        quantity: 10,
      });
    });
  });

  // Denomination enabled/disabled
  describe('denomination field disabled state', () => {
    it('should enable the denomination field after munitionTypeId is set', async () => {
      const { component, fixture } = await setup();
      expect(component.form.denominationId().disabled()).toBe(true);
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(component.form.denominationId().disabled()).toBe(false);
    });

    it('should disable denomination again when munitionTypeId is cleared', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(component.form.denominationId().disabled()).toBe(false);

      component.form.munitionTypeId().setControlValue('');
      fixture.detectChanges();
      expect(component.form.denominationId().disabled()).toBe(true);
    });
  });

  // markAsTouched()
  describe('markAsTouched()', () => {
    it('should set touched signal to true', async () => {
      const { component } = await setup();
      component.markAsTouched();
      expect(component.touched()).toBe(true);
    });

    it('should show required validation errors in the template when touched and form is empty', async () => {
      const { component, fixture } = await setup();
      component.markAsTouched();
      fixture.detectChanges();
      expect(screen.getAllByText('COMMONS.REQUIRED_FIELD').length).toBeGreaterThan(0);
    });
  });

  // reset()
  describe('reset()', () => {
    it('should reset the formModel to initial empty state', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.batch().setControlValue('BATCH-001');
      fixture.detectChanges();

      component.reset();
      fixture.detectChanges();

      expect(component.formModel()).toEqual({
        batch: '',
        denominationId: '',
        munitionTypeId: '',
        quantity: 0,
      });
    });
  });

  // munitionTypeChangeHandler()
  describe('munitionTypeChangeHandler()', () => {
    it('should reset the denomination field to empty string', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.denominationId().setControlValue(makeDenomination());
      fixture.detectChanges();

      component.munitionTypeChangeHandler();
      fixture.detectChanges();

      expect(component.form.denominationId().controlValue()).toBe('');
    });

    it('should return empty filteredOptions() after munitionTypeChangeHandler() resets denominationId', async () => {
      const { component, fixture } = await setup();
      // Set a non-empty denomination search term
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      component.form.denominationId().setControlValue('Vas');
      fixture.detectChanges();

      // After reset, denominationId becomes '' (length <= 2) → filteredOptions() returns []
      component.munitionTypeChangeHandler();
      fixture.detectChanges();

      expect(component.filteredOptions()).toEqual([]);
    });
  });

  // munitionTypeOptions() computed
  describe('munitionTypeOptions() computed', () => {
    it('should return empty array when component store has no items', async () => {
      const { component } = await setup();
      expect(component.munitionTypeOptions()).toEqual([]);
    });

    it('should return only MUNITION category items from the component store', async () => {
      const munitionItem = makeMunitionComponent({ id: 'GRANADA', category: 'MUNITION' });
      const componentItem = makeMunitionComponent({ id: 'VASO', category: 'MUNITION_COMPONENT' });
      const { component } = await setup({ munitionComponentItems: [munitionItem, componentItem] });
      const options = component.munitionTypeOptions();
      expect(options).toHaveLength(1);
      expect(options[0].id).toBe('GRANADA');
    });
  });

  // Effect: DenominationsStore.search()
  describe('Effect: denominationsStore.search()', () => {
    it('should call search on DenominationsStore when munitionTypeId is set', async () => {
      const { component, denominationsStore, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(denominationsStore.search).toHaveBeenCalledWith({
        munitionTypeId: 'GRANADA_MORTERO',
        pageSize: 500,
        active: true,
      });
    });

    it('should not call search twice for the same munitionTypeId (initialized cache)', async () => {
      const { component, denominationsStore, fixture } = await setup();
      // The effect fires once during creation for the initial '' value.
      // Clear that call so we only count subsequent explicit changes.
      vi.clearAllMocks();

      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(denominationsStore.search).toHaveBeenCalledTimes(1);

      // Setting the same value again must NOT trigger a second search call
      component.form.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(denominationsStore.search).toHaveBeenCalledTimes(1);
    });
  });

  // Effect: repositoryDenominations
  describe('Effect: repositoryDenominations population', () => {
    it('should return filtered denominations via filteredOptions() when items match munitionType', async () => {
      // #repositoryDenominations is private; test the behavior via filteredOptions() instead.
      const denominations = [
        makeDenomination({ id: 'd1', name: 'Vaso 1', munitionType: { id: 'Vaso', name: 'Vaso' } }),
        makeDenomination({ id: 'd2', name: 'Vaso 2', munitionType: { id: 'Vaso', name: 'Vaso' } }),
      ];
      const { component, fixture } = await setup({ denominationsItems: denominations });
      component.form.munitionTypeId().setControlValue('Vaso');
      component.form.denominationId().setControlValue('Vas'); // 3+ chars, matches 'Vaso 1' and 'Vaso 2'
      fixture.detectChanges();
      expect(component.filteredOptions()).toHaveLength(2);
    });

    it('should return empty filteredOptions() when denominationsStore has no items', async () => {
      const { component, fixture } = await setup({ denominationsItems: [] });
      component.form.munitionTypeId().setControlValue('Vaso');
      component.form.denominationId().setControlValue('Vas'); // 3+ chars but no repository data
      fixture.detectChanges();
      expect(component.filteredOptions()).toEqual([]);
    });
  });
});
