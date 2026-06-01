/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { UiDialogService } from '@intaqalab/ui';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionsDumpsListComponent } from './munitions-dumps-list.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeDump(overrides: Partial<MunitionsDumpModel> = {}): MunitionsDumpModel {
  return {
    id: 'dump-1',
    munitionDumpId: 'PolvorÃ­n Norte',
    cells: [{ name: 'A-01' }, { name: 'A-02' }],
    maxRiskGroupNeqPerCell: 100,
    maxNeq: 500,
    active: true,
    ...overrides,
  };
}

function twoRows(): MunitionsDumpModel[] {
  return [
    makeDump({ id: 'dump-1', munitionDumpId: 'PolvorÃ­n Norte' }),
    makeDump({ id: 'dump-2', munitionDumpId: 'PolvorÃ­n Sur', active: false }),
  ];
}

function makeStoreMock(items: MunitionsDumpModel[] = twoRows()) {
  return {
    items: signal(items),
    totalElements: signal(items.length),
    isLoading: signal(false),
    error: signal(null),
    search: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

function makeUiDialogService(confirmed = true) {
  return { confirm: vi.fn().mockResolvedValue(confirmed) };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SetupOptions {
  dialogResult?: any;
  confirmed?: boolean;
  items?: MunitionsDumpModel[];
}

async function setup(opts: SetupOptions = {}) {
  const dialogDefault = opts.dialogResult === undefined ? makeDump() : opts.dialogResult;
  const mockDialog = createMockMatDialog({ defaultResult: dialogDefault });
  const mockUiDialog = makeUiDialogService(opts.confirmed ?? true);
  const storeMock = makeStoreMock(opts.items ?? twoRows());

  const view = await render(MunitionsDumpsListComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MunitionsDumpsStore, useValue: storeMock },
      { provide: MatDialog, useValue: mockDialog },
      { provide: UiDialogService, useValue: mockUiDialog },
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const container = fixture.nativeElement as HTMLElement;
  const component = fixture.componentInstance;

  return { fixture, container, component, mockDialog, mockUiDialog, storeMock };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('MunitionsDumpsListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // â”€â”€ Initialization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('Initialization', () => {
    it('should render the page title', async () => {
      await setup();
      expect(screen.getByText('MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITIONS_DUMPS')).toBeTruthy();
    });

    it('should render the create button', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.CREATE')).toBeTruthy();
    });

    it('should render the table column headers', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NAME')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.CELLS_COUNT')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NEQMAX')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NEQMAXCELL')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.ACTIONS')).toBeTruthy();
    });

    it('should render one row per item returned by the store', async () => {
      await setup();
      expect(screen.getByText('PolvorÃ­n Norte')).toBeTruthy();
      expect(screen.getByText('PolvorÃ­n Sur')).toBeTruthy();
    });

    it('should call store.search() on init via the effect', async () => {
      const { storeMock } = await setup();
      expect(storeMock.search).toHaveBeenCalledOnce();
      expect(storeMock.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortDirection: '',
        sortField: undefined,
      });
    });
  });

  // â”€â”€ Create â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('create()', () => {
    it('should open MatDialog when the create button is clicked', async () => {
      const { container, mockDialog } = await setup();
      const createBtn = container.querySelector('[mat-flat-button]') as HTMLElement;
      fireEvent.click(createBtn);
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should call store.createItem() when dialog closes with a result', async () => {
      const newItem = makeDump({ id: 'new-1', munitionDumpId: 'Nuevo PolvorÃ­n' });
      const { container, storeMock } = await setup({ dialogResult: newItem });
      const createBtn = container.querySelector('[mat-flat-button]') as HTMLElement;
      fireEvent.click(createBtn);
      expect(storeMock.createItem).toHaveBeenCalledWith(newItem);
    });

    it('should NOT call store.createItem() when dialog is cancelled (null result)', async () => {
      const { container, storeMock } = await setup({ dialogResult: null });
      const createBtn = container.querySelector('[mat-flat-button]') as HTMLElement;
      fireEvent.click(createBtn);
      expect(storeMock.createItem).not.toHaveBeenCalled();
    });
  });

  // â”€â”€ Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('edit()', () => {
    it('should open MatDialog when the edit button is clicked', async () => {
      const { container, mockDialog } = await setup();
      // Edit is the first icon button in the first row's actions cell
      const editBtn = container.querySelectorAll('td button')[0] as HTMLElement;
      fireEvent.click(editBtn);
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should pass the row item as dialog data when editing', async () => {
      const { container, mockDialog } = await setup();
      const editBtn = container.querySelectorAll('td button')[0] as HTMLElement;
      fireEvent.click(editBtn);
      const callArg = mockDialog.open.mock.calls[0][1];
      expect(callArg.data.item.id).toBe('dump-1');
    });

    it('should call store.updateItem() when dialog closes with a result', async () => {
      const updatedItem = makeDump({ id: 'dump-1', munitionDumpId: 'PolvorÃ­n Actualizado' });
      const { container, storeMock } = await setup({ dialogResult: updatedItem });
      const editBtn = container.querySelectorAll('td button')[0] as HTMLElement;
      fireEvent.click(editBtn);
      expect(storeMock.updateItem).toHaveBeenCalledWith(updatedItem);
    });

    it('should NOT call store.updateItem() when dialog is cancelled (null result)', async () => {
      const { container, storeMock } = await setup({ dialogResult: null });
      const editBtn = container.querySelectorAll('td button')[0] as HTMLElement;
      fireEvent.click(editBtn);
      expect(storeMock.updateItem).not.toHaveBeenCalled();
    });
  });

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('delete()', () => {
    it('should call uiDialogs.confirm() when the delete button is clicked', async () => {
      const { container, mockUiDialog, fixture } = await setup();
      // Delete is the second icon button in the first row's actions cell
      const deleteBtn = container.querySelectorAll('td button')[1] as HTMLElement;
      fireEvent.click(deleteBtn);
      await fixture.whenStable();
      expect(mockUiDialog.confirm).toHaveBeenCalledOnce();
    });

    it('should call store.deleteItem() when the user confirms deletion', async () => {
      const { container, storeMock, fixture } = await setup({ confirmed: true });
      const deleteBtn = container.querySelectorAll('td button')[1] as HTMLElement;
      fireEvent.click(deleteBtn);
      await fixture.whenStable();
      expect(storeMock.deleteItem).toHaveBeenCalledOnce();
    });

    it('should NOT call store.deleteItem() when the user cancels deletion', async () => {
      const { container, storeMock, fixture } = await setup({ confirmed: false });
      const deleteBtn = container.querySelectorAll('td button')[1] as HTMLElement;
      fireEvent.click(deleteBtn);
      await fixture.whenStable();
      expect(storeMock.deleteItem).not.toHaveBeenCalled();
    });
  });

  // â”€â”€ Toggle active â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('toogleActive()', () => {
    it('should call store.toogleEnabledItem() with the item and the new checked state', async () => {
      const { component, storeMock } = await setup();
      const item = twoRows()[0];
      const fakeChangeEvent = { checked: false } as any;
      component.toogleActive(item, fakeChangeEvent);
      expect(storeMock.toogleEnabledItem).toHaveBeenCalledWith(item, false);
    });
  });

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('onPage()', () => {
    it('should update pageIndex and pageSize signals', async () => {
      const { component } = await setup();
      component.onPage({ pageIndex: 2, pageSize: 25, length: 100 } as any);
      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(25);
    });

    it('should trigger store.search() again after a page change', async () => {
      const { component, storeMock, fixture } = await setup();
      vi.clearAllMocks(); // clear the initial search call
      component.onPage({ pageIndex: 1, pageSize: 10, length: 100 } as any);
      fixture.detectChanges(); // flush the effect triggered by signal change
      expect(storeMock.search).toHaveBeenCalledWith({
        page: 2, // pageIndex(1) + 1
        pageSize: 10,
        sortDirection: '',
        sortField: undefined,
      });
    });
  });

  // â”€â”€ Sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('onSort()', () => {
    it('should update sortField and sortDirection signals', async () => {
      const { component } = await setup();
      component.onSort({ active: 'munitionDumpId', direction: 'asc' });
      expect(component.sortField()).toBe('munitionDumpId');
      expect(component.sortDirection()).toBe('asc');
    });

    it('should trigger store.search() with the updated sort params', async () => {
      const { component, storeMock, fixture } = await setup();
      vi.clearAllMocks();
      component.onSort({ active: 'maxNeq', direction: 'desc' });
      fixture.detectChanges(); // flush the effect triggered by signal change
      expect(storeMock.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortDirection: 'desc',
        sortField: 'maxNeq',
      });
    });
  });
});
