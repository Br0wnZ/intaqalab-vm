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
  const view = await render(MunitionsShellComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: MunitionComponentStore, useValue: makeMunitionComponentStore() },
      { provide: MunitionsDumpsStore, useValue: makeMunitionsDumpsStore() },
      { provide: DenominationsStore, useValue: makeDenominationsStore() },
      { provide: MunitionsStockService, useValue: mockMunitionsStockService() },
      { provide: ClientsDataService, useValue: mockClientsDataService() },
      { provide: TrialsDataService, useValue: mockTrialsDataService() },
      { provide: UiDialogService, useValue: { confirm: vi.fn(), input: vi.fn() } },
      { provide: Router, useValue: { navigateByUrl: vi.fn() } },
    ],
  });

  view.fixture.detectChanges();
  return { user, fixture: view.fixture };
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

  it('should show the identification form when MUNITION category is selected', async () => {
    const { user } = await setup();
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION'));
    expect(screen.queryByTestId('identificationForm')).toBeInTheDocument();
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
});
