/* eslint-disable testing-library/no-node-access */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { UiDialogService } from '@intaqalab/ui';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { MunitionsStockService } from '../../../services/munitions-stock.service';
import { MunitionsShellComponent } from './munitions-shell.component';

// // Mock factories
//

function makeMunitionComponentStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionsDumpsStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeDenominationsStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

function mockClientsDataService() {
  return { clients: signal([]) };
}

function mockTrialsDataService() {
  return {
    source: createMockResource(undefined),
    search: vi.fn(),
  };
}

function mockMunitionsStockService() {
  return {
    saveMunitionResource: createMockResource(undefined),
    saveMunitionComponentsResource: createMockResource(undefined),
    munition: signal(null),
    munitionComponents: signal(null),
    clear: vi.fn(),
  };
}

// // Setup
//

async function setup() {
  const user = userEvent.setup();
  const trialsDataService = mockTrialsDataService();
  const view = await render(MunitionsShellComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: MunitionComponentStore, useValue: makeMunitionComponentStore() },
      { provide: MunitionsDumpsStore, useValue: makeMunitionsDumpsStore() },
      { provide: DenominationsStore, useValue: makeDenominationsStore() },
      { provide: MunitionsStockService, useValue: mockMunitionsStockService() },
      { provide: ClientsDataService, useValue: mockClientsDataService() },
      { provide: TrialsDataService, useValue: trialsDataService },
      { provide: UiDialogService, useValue: { confirm: vi.fn(), input: vi.fn() } },
      { provide: Router, useValue: { navigateByUrl: vi.fn() } },
    ],
  });

  view.fixture.detectChanges();
  return { user, fixture: view.fixture, trialsDataService };
}

// // Tests
//

describe('MunitionsShellComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should search trials by selected client with descending trial number sort', async () => {
    const { fixture, trialsDataService } = await setup();

    fixture.componentInstance.onClientChange('client-1');

    expect(trialsDataService.search).toHaveBeenCalledExactlyOnceWith({
      clientId: 'client-1',
      status: ['PLANNED', 'UNDER_REVIEW', 'IN_PROGRESS', 'INTERRUPTED', 'STARTED'],
      sort: ['trialNumber;desc'],
    });
  });

  it('should show the identification form when MUNITION category is selected', async () => {
    const { user } = await setup();
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION'));
    expect(screen.getByTestId('identificationForm')).toBeInTheDocument();
  });

  it('should add a component form section when "add component" is clicked', async () => {
    const { user } = await setup();
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION'));

    expect(screen.queryAllByTestId('munitionComponent')).toHaveLength(0);

    const addBtn = screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ADD_COMPONENT').closest('button')!;
    await user.click(addBtn);

    expect(screen.queryAllByTestId('munitionComponent')).toHaveLength(1);
  });

  it('should clear batch inputs after reset', async () => {
    const { user, fixture } = await setup();
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION'));

    const inputs = screen.getAllByPlaceholderText(/WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL/i);
    for (const input of inputs) {
      await user.type(input, 'abc');
    }

    const resetBtn = screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.RESET').closest('button')!;
    await user.click(resetBtn);

    expect(screen.queryByTestId('identificationForm')).not.toBeInTheDocument();
    expect(fixture.componentInstance.formModel().batch).toBe('');
    expect(fixture.componentInstance.formModel().category).toBeNull();
  });

  it.each(['MUNITION', 'MUNITION_COMPONENT'] as const)(
    'should remove the selected %s component and preserve the remaining form values',
    async (category) => {
      const { fixture, user } = await setup();
      const component = fixture.componentInstance;
      const isMunition = category === 'MUNITION';
      const field = category === 'MUNITION' ? 'associatedComponents' : 'multipleComponentsData';
      const otherField = category === 'MUNITION' ? 'multipleComponentsData' : 'associatedComponents';
      component.formModel.update((current) => ({
        ...current,
        category,
        [field]: ['first', 'middle', 'last'].map((batch) => ({
          munitionTypeId: '',
          denominationId: '',
          batch,
          quantity: null,
        })),
      }));
      fixture.detectChanges();
      const otherComponents = structuredClone(component.formModel()[otherField]);
      expect(screen.getAllByRole('button', { name: 'COMMONS.DELETE' })).toHaveLength(isMunition ? 3 : 2);
      const removeButton = screen.getAllByRole('button', { name: 'COMMONS.DELETE' })[isMunition ? 1 : 0];
      if (!removeButton) throw new Error('Missing middle component remove button');

      await user.click(removeButton);

      expect(component.formModel()[field].map((item) => item.batch)).toEqual(['first', 'last']);
      expect(structuredClone(component.formModel()[otherField])).toEqual(otherComponents);
      expect(
        component.form[field]()
          .value()
          .map((item) => item.batch),
      ).toEqual(['first', 'last']);
      expect(screen.getAllByRole('button', { name: 'COMMONS.DELETE' })).toHaveLength(isMunition ? 2 : 1);
      expect(screen.getByDisplayValue('first')).toBeInTheDocument();
      expect(screen.getByDisplayValue('last')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('middle')).not.toBeInTheDocument();

      const lastRemoveButton = screen.getAllByRole('button', { name: 'COMMONS.DELETE' }).at(-1);
      if (!lastRemoveButton) throw new Error('Missing last component remove button');
      await user.click(lastRemoveButton);

      expect(component.formModel()[field].map((item) => item.batch)).toEqual(['first']);
      expect(
        component.form[field]()
          .value()
          .map((item) => item.batch),
      ).toEqual(['first']);

      if (isMunition) {
        await user.click(screen.getByRole('button', { name: 'COMMONS.DELETE' }));

        expect(component.formModel()[field]).toHaveLength(0);
        expect(component.form[field]().value()).toHaveLength(0);
        expect(screen.queryByDisplayValue('first')).not.toBeInTheDocument();
      } else {
        expect(screen.getByDisplayValue('first')).toBeInTheDocument();
      }

      expect(screen.queryByRole('button', { name: 'COMMONS.DELETE' })).not.toBeInTheDocument();
    },
  );
});
