import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
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

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionStockFormModel } from '../../../models/munition-stock.model';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionLocationComponent } from './location.component';

@Component({
  imports: [MunitionLocationComponent],
  template: `
    <inta-munition-location [form]="componentForm" />
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

  componentForm = form(this.formModel);
}

function makeDump(overrides: Partial<MunitionsDumpModel> = {}): MunitionsDumpModel {
  return {
    id: 'dump-1',
    munitionDumpId: 'Polvorín Norte',
    cells: [{ name: 'Cell A' }, { name: 'Cell B' }, { name: 'Cell C' }],
    maxRiskGroupNeqPerCell: 100,
    maxNeq: 500,
    active: true,
    ...overrides,
  };
}

function defaultDumps(): MunitionsDumpModel[] {
  return [
    makeDump({ id: 'dump-1', munitionDumpId: 'Polvorín Norte', cells: [{ name: 'A-01' }, { name: 'A-02' }] }),
    makeDump({
      id: 'dump-2',
      munitionDumpId: 'Polvorín Sur',
      cells: [{ name: 'B-01' }, { name: 'B-02' }, { name: 'B-03' }],
    }),
  ];
}

async function setup(dumps: MunitionsDumpModel[] = defaultDumps()) {
  const user = userEvent.setup();
  const view = await render(TestWrapperComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      {
        provide: MunitionsDumpsStore,
        useValue: {
          items: signal<MunitionsDumpModel[]>(dumps),
          search: vi.fn(),
          reload: vi.fn(),
          reset: vi.fn(),
          isLoading: signal(false),
          error: signal(null),
          isInitialized: signal(false),
        },
      },
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const componentDebug = fixture.debugElement.query(By.directive(MunitionLocationComponent));
  const component = componentDebug.componentInstance as MunitionLocationComponent;
  return {
    fixture,
    loader,
    user,
    component,
    wrapper: fixture.componentInstance,
    formModel: fixture.componentInstance.formModel,
    componentForm: fixture.componentInstance.componentForm,
  };
}

describe('MunitionLocationComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should render the section title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_LOCATION')).toBeInTheDocument();
    });

    it('should render the dump selector label', async () => {
      await setup();
      expect(
        screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_LABEL'),
      ).toBeInTheDocument();
    });

    it('should render the cell selector label', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_LABEL')).toBeInTheDocument();
    });
  });

  describe('cellOptions() computed', () => {
    it('should return empty array when no dump is selected', async () => {
      const { component } = await setup();
      expect(component.cellOptions()).toEqual([]);
    });

    it('should return empty array when selected dump id is not found in the list', async () => {
      const { component, componentForm, fixture } = await setup();
      componentForm.location.munitionDumpId().setControlValue('unknown-id');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([]);
    });

    it('should return the cells of the selected dump as { id: name } objects', async () => {
      const { component, componentForm, fixture } = await setup();
      componentForm.location.munitionDumpId().setControlValue('dump-1');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'A-01' }, { id: 'A-02' }]);
    });

    it('should update cell options when a different dump is selected', async () => {
      const { component, componentForm, fixture } = await setup();
      componentForm.location.munitionDumpId().setControlValue('dump-2');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'B-01' }, { id: 'B-02' }, { id: 'B-03' }]);
    });
  });

  describe('munitionsDumpList from store', () => {
    it('should expose empty list when store has no items', async () => {
      const { component } = await setup([]);
      expect(component.munitionsDumpList()).toEqual([]);
      expect(component.cellOptions()).toEqual([]);
    });

    it('should use store items to populate cell options', async () => {
      const dumps = [makeDump({ id: 'custom-1', cells: [{ name: 'X-01' }] })];
      const { component, componentForm, fixture } = await setup(dumps);
      componentForm.location.munitionDumpId().setControlValue('custom-1');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'X-01' }]);
    });
  });
});
