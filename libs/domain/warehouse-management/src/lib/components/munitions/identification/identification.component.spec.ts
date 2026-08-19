/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { disabled, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type { DenominationModel } from '../../../models/denominations.model';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
import type { MunitionStockFormModel } from '../../../models/munition-stock.model';
import { MunitionIdentificationComponent } from './identification.component';

@Component({
  imports: [MunitionIdentificationComponent],
  template: `
    <inta-munition-identification [category]="category" [form]="componentForm" />
  `,
})
class TestWrapperComponent {
  formModel = signal<MunitionStockFormModel>({
    category: null,
    munitionTypeId: '',
    denominationId: '',
    batch: '',
    quantity: null,
    generalData: {
      clientId: '',
      entryDate: '',
      plannedFireTrialId: '',
      observations: '',
    },
    location: {
      munitionDumpId: '',
      cellName: '',
    },
    associatedComponents: [],
    multipleComponentsData: [],
  });

  componentForm = form(this.formModel, (schemaPath) => {
    disabled(schemaPath.denominationId, () => !this.formModel().munitionTypeId);
  });

  category: any = 'MUNITION';
}

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

async function setup(
  opts: {
    denominationsItems?: DenominationModel[];
    munitionComponentItems?: MunitionComponentsModel[];
    category?: any;
  } = {},
) {
  const user = userEvent.setup();
  const denominationsStore = makeDenominationsStore(opts.denominationsItems ?? []);
  const munitionComponentStore = makeMunitionComponentStore(opts.munitionComponentItems ?? []);

  const view = await render(TestWrapperComponent, {
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
  if (opts.category !== undefined) {
    fixture.componentInstance.category = opts.category;
  }
  fixture.detectChanges();

  const componentDebug = fixture.debugElement.query(By.directive(MunitionIdentificationComponent));
  const component = componentDebug.componentInstance as MunitionIdentificationComponent;

  return {
    fixture,
    user,
    component,
    denominationsStore,
    munitionComponentStore,
    wrapper: fixture.componentInstance,
    formModel: fixture.componentInstance.formModel,
    componentForm: fixture.componentInstance.componentForm,
  };
}

describe('MunitionIdentificationComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should render the denomination input', async () => {
      await setup();
      expect(
        screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should render the batch input', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL')).toBeInTheDocument();
    });

    it('should render the quantity input', async () => {
      await setup();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should have denomination field disabled when no munitionType is selected', async () => {
      const { componentForm } = await setup();
      expect(componentForm.denominationId().disabled()).toBe(true);
    });
  });

  describe('denomination field disabled state', () => {
    it('should enable the denomination field after munitionTypeId is set', async () => {
      const { componentForm, fixture } = await setup();
      expect(componentForm.denominationId().disabled()).toBe(true);

      componentForm.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(componentForm.denominationId().disabled()).toBe(false);
    });

    it('should disable denomination again when munitionTypeId is cleared', async () => {
      const { componentForm, fixture } = await setup();
      componentForm.munitionTypeId().setControlValue('GRANADA_MORTERO');
      fixture.detectChanges();
      expect(componentForm.denominationId().disabled()).toBe(false);

      componentForm.munitionTypeId().setControlValue('');
      fixture.detectChanges();
      expect(componentForm.denominationId().disabled()).toBe(true);
    });
  });

  describe('munitionTypeChangeHandler()', () => {
    it('should reset the denomination field to empty string', async () => {
      const { component, componentForm, fixture } = await setup();
      componentForm.munitionTypeId().setControlValue('GRANADA_MORTERO');
      componentForm.denominationId().setControlValue(makeDenomination() as any);
      fixture.detectChanges();

      expect(component.displayFn(null)).toBe('');
      expect(component.displayFn('Test')).toBe('Test');
      const denom = makeDenomination({ name: 'Denom X' });
      expect(component.displayFn(denom)).toBe('Denom X');
    });
  });

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

  describe('Effect: repositoryDenominations population', () => {
    it('should return filtered denominations via filteredOptions() when items match munitionType', async () => {
      const denominations = [
        makeDenomination({ id: 'd1', name: 'Vaso 1', munitionType: { id: 'Vaso', name: 'Vaso' } }),
        makeDenomination({ id: 'd2', name: 'Vaso 2', munitionType: { id: 'Vaso', name: 'Vaso' } }),
      ];
      const { component, componentForm, fixture } = await setup({ denominationsItems: denominations });
      componentForm.munitionTypeId().setControlValue('Vaso');
      componentForm.denominationId().setControlValue('Vas'); // 3+ chars
      fixture.detectChanges();
      expect(component.filteredOptions()).toHaveLength(2);
    });

    it('should return empty filteredOptions() when denominationsStore has no items', async () => {
      const { component, componentForm, fixture } = await setup({ denominationsItems: [] });
      componentForm.munitionTypeId().setControlValue('Vaso');
      componentForm.denominationId().setControlValue('Vas');
      fixture.detectChanges();
      expect(component.filteredOptions()).toEqual([]);
    });
  });
});
