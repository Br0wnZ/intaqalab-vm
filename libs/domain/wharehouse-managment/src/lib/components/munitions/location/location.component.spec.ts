import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionLocationComponent } from './location.component';

// // Factories
//

function makeDump(overrides: Partial<MunitionsDumpModel> = {}): MunitionsDumpModel {
  return {
    id: 'dump-1',
    munitionDumpId: 'PolvorÃ­n Norte',
    cells: [{ name: 'Cell A' }, { name: 'Cell B' }, { name: 'Cell C' }],
    maxRiskGroupNeqPerCell: 100,
    maxNeq: 500,
    active: true,
    ...overrides,
  };
}

function defaultDumps(): MunitionsDumpModel[] {
  return [
    makeDump({ id: 'dump-1', munitionDumpId: 'PolvorÃ­n Norte', cells: [{ name: 'A-01' }, { name: 'A-02' }] }),
    makeDump({
      id: 'dump-2',
      munitionDumpId: 'PolvorÃ­n Sur',
      cells: [{ name: 'B-01' }, { name: 'B-02' }, { name: 'B-03' }],
    }),
  ];
}

// // Setup
//

async function setup(dumps: MunitionsDumpModel[] = defaultDumps()) {
  const user = userEvent.setup();
  const view = await render(MunitionLocationComponent, {
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
  const component = fixture.componentInstance;
  return { fixture, loader, user, component };
}

// // Tests
//

describe('MunitionLocationComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Initialization
  describe('Initialization', () => {
    it('should render the section title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_LOCATION')).toBeTruthy();
    });

    it('should render the dump selector label', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_LABEL')).toBeTruthy();
    });

    it('should render the cell selector label', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_LABEL')).toBeTruthy();
    });

    it('should have touched signal set to false initially', async () => {
      const { component } = await setup();
      expect(component.touched()).toBe(false);
    });
  });

  // errors() computed
  describe('errors() computed', () => {
    it('should return true when both fields are empty', async () => {
      const { component } = await setup();
      expect(component.errors()).toBe(true);
    });

    it('should return true when only munitionDumpId is filled', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('dump-1');
      fixture.detectChanges();
      expect(component.errors()).toBe(true);
    });

    it('should return false when both required fields are filled', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('dump-1');
      component.form.cellName().setControlValue('A-01');
      fixture.detectChanges();
      expect(component.errors()).toBe(false);
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
      component.form.munitionDumpId().setControlValue('dump-1');
      component.form.cellName().setControlValue('A-01');
      fixture.detectChanges();
      expect(component.value()).toEqual({ munitionDumpId: 'dump-1', cellName: 'A-01' });
    });
  });

  // cellOptions() computed
  describe('cellOptions() computed', () => {
    it('should return empty array when no dump is selected', async () => {
      const { component } = await setup();
      expect(component.cellOptions()).toEqual([]);
    });

    it('should return empty array when selected dump id is not found in the list', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('unknown-id');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([]);
    });

    it('should return the cells of the selected dump as { id: name } objects', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('dump-1');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'A-01' }, { id: 'A-02' }]);
    });

    it('should update cell options when a different dump is selected', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('dump-2');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'B-01' }, { id: 'B-02' }, { id: 'B-03' }]);
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
    it('should clear both form fields back to empty strings', async () => {
      const { component, fixture } = await setup();
      component.form.munitionDumpId().setControlValue('dump-1');
      component.form.cellName().setControlValue('A-01');
      fixture.detectChanges();
      expect(component.errors()).toBe(false);

      component.reset();
      fixture.detectChanges();

      expect(component.formModel()).toEqual({ cellName: '', munitionDumpId: '' });
      expect(component.errors()).toBe(true);
    });
  });

  // munitionsDumpList from store
  describe('munitionsDumpList from store', () => {
    it('should expose empty list when store has no items', async () => {
      const { component } = await setup([]);
      expect(component.munitionsDumpList()).toEqual([]);
      expect(component.cellOptions()).toEqual([]);
    });

    it('should use store items to populate cell options', async () => {
      const dumps = [makeDump({ id: 'custom-1', cells: [{ name: 'X-01' }] })];
      const { component, fixture } = await setup(dumps);
      component.form.munitionDumpId().setControlValue('custom-1');
      fixture.detectChanges();
      expect(component.cellOptions()).toEqual([{ id: 'X-01' }]);
    });
  });
});
