import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { DenominationModel } from '../../../models/denominations.model';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
import type { MunitionIdentificationForm } from '../../../models/munition-stock.model';
import { ComponentMunitionComponent } from './component-munition.component';

@Component({
  imports: [ComponentMunitionComponent],
  template: `
    <inta-component-munition [form]="componentForm" [hasQuantity]="hasQuantity" />
  `,
})
class TestWrapperComponent {
  formModel = signal<MunitionIdentificationForm>({
    munitionTypeId: '',
    denominationId: '',
    batch: '',
    quantity: null,
  });

  componentForm = form(this.formModel);
  hasQuantity = true;
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

function makeDenominationsStore(items: DenominationModel[] = []) {
  return {
    items: signal<DenominationModel[]>(items),
    search: vi.fn(),
  };
}

function makeMunitionComponentStore(items: MunitionComponentsModel[] = []) {
  return {
    items: signal<MunitionComponentsModel[]>(items),
  };
}

function makeMunitionsDumpsStore() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: signal<any[]>([]),
  };
}

async function setup(
  opts: {
    hasQuantity?: boolean;
    munitionComponentItems?: MunitionComponentsModel[];
    denominationsItems?: DenominationModel[];
  } = {},
) {
  const user = userEvent.setup();
  const denominationsStore = makeDenominationsStore(opts.denominationsItems ?? []);
  const munitionComponentStore = makeMunitionComponentStore(opts.munitionComponentItems ?? []);
  const munitionsDumpsStore = makeMunitionsDumpsStore();

  const view = await render(TestWrapperComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: DenominationsStore, useValue: denominationsStore },
      { provide: MunitionComponentStore, useValue: munitionComponentStore },
      { provide: MunitionsDumpsStore, useValue: munitionsDumpsStore },
    ],
  });

  const fixture = view.fixture;
  fixture.componentInstance.hasQuantity = opts.hasQuantity !== false;
  fixture.detectChanges();

  const componentDebug = fixture.debugElement.query(By.directive(ComponentMunitionComponent));
  const component = componentDebug.componentInstance as ComponentMunitionComponent;

  return {
    fixture,
    user,
    component,
    formModel: fixture.componentInstance.formModel,
    componentForm: fixture.componentInstance.componentForm,
    denominationsStore,
    munitionComponentStore,
  };
}

describe('ComponentMunitionComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should show the munitionType selector', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_LABEL')).toBeInTheDocument();
    });

    it('should show the denomination input', async () => {
      await setup();
      expect(
        screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should show the batch input', async () => {
      await setup();
      expect(screen.getAllByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL').length).toBeGreaterThan(
        0,
      );
    });

    it('should show the quantity input when hasQuantity is true', async () => {
      await setup({ hasQuantity: true });
      expect(
        screen.getAllByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL').length,
      ).toBeGreaterThan(0);
    });

    it('should NOT show the quantity input when hasQuantity is false', async () => {
      await setup({ hasQuantity: false });
      expect(
        screen.queryByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL'),
      ).not.toBeInTheDocument();
    });
  });

  describe('displayFn', () => {
    it('should return empty string when option is null', async () => {
      const { component } = await setup();
      expect(component.displayFn(null)).toBe('');
    });

    it('should return option itself when option is a string', async () => {
      const { component } = await setup();
      expect(component.displayFn('Test')).toBe('Test');
    });

    it('should return option name when option is DenominationModel', async () => {
      const { component } = await setup();
      const denom = makeDenomination({ name: 'Denom X' });
      expect(component.displayFn(denom)).toBe('Denom X');
    });
  });

  describe('munitionTypeChangeHandler', () => {
    it('should reset denominationId and trigger store search', async () => {
      const { component, componentForm, denominationsStore, fixture } = await setup();
      componentForm.denominationId().setControlValue('Some Denom');
      componentForm.munitionTypeId().setControlValue('vaso');
      fixture.detectChanges();

      component.munitionTypeChangeHandler();
      fixture.detectChanges();

      expect(componentForm.denominationId().value()).toBe('');
      expect(denominationsStore.search).toHaveBeenCalledWith({
        munitionTypeId: 'vaso',
        pageSize: 500,
        active: true,
      });
    });
  });

  describe('filteredOptions', () => {
    it('should return empty array when denomination query is <= 2 characters', async () => {
      const denominations = [makeDenomination({ name: 'Vaso 1' })];
      const { component, componentForm, fixture } = await setup({ denominationsItems: denominations });
      componentForm.munitionTypeId().setControlValue('vaso');
      componentForm.denominationId().setControlValue('Va');
      fixture.detectChanges();

      expect(component.filteredOptions()).toEqual([]);
    });

    it('should return matched options when query is > 2 characters and repository matches', async () => {
      const denominations = [
        makeDenomination({ name: 'Vaso 1', munitionType: { id: 'vaso', name: 'Vaso' } }),
        makeDenomination({ name: 'Proyectil 1', munitionType: { id: 'vaso', name: 'Vaso' } }),
      ];
      const { component, componentForm, fixture } = await setup({ denominationsItems: denominations });
      componentForm.munitionTypeId().setControlValue('vaso');
      componentForm.denominationId().setControlValue('Vas');
      fixture.detectChanges();

      const filtered = component.filteredOptions();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Vaso 1');
    });
  });

  describe('munitionTypes', () => {
    it('should filter items by category MUNITION_COMPONENT', async () => {
      const componentItems: MunitionComponentsModel[] = [
        {
          id: 'COMP_A',
          label: 'Comp A',
          name: { es: 'Comp A', en: 'Comp A' },
          observations: '',
          category: 'MUNITION_COMPONENT',
          active: true,
        },
        {
          id: 'MUN_B',
          label: 'Mun B',
          name: { es: 'Mun B', en: 'Mun B' },
          observations: '',
          category: 'MUNITION',
          active: true,
        },
      ];
      const { component } = await setup({ munitionComponentItems: componentItems });

      expect(component.munitionTypes()).toHaveLength(1);
      expect(component.munitionTypes()[0].id).toBe('COMP_A');
    });
  });
});
