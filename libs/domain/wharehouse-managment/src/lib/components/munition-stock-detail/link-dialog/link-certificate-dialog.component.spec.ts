/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { createMockMatDialog, createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { StockListStore } from '../../../+state/stock-list.store';
import { MunitionsStockCertificatesService } from '../../../services/munitions-stock-certificates.service';
import { MunitionsStockListService } from '../../../services/munitions-stock-list.service';
import { LinkCertificatesDialogComponent } from './link-certificate-dialog.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeStockListStore(items: any[] = stockItems()) {
  return {
    items: signal(items),
    totalElements: signal(items.length),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionComponentStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    search: vi.fn(),
    reset: vi.fn(),
  };
}

function makeClientsDataService() {
  return { clients: signal<any[]>([{ id: 'cli-1', name: 'Cliente A' }]) };
}

function makeCertificatesService() {
  return { link: signal<any>(undefined) };
}

function makeMunitionsStockListService() {
  return {
    searchItems: { set: vi.fn() },
    paginatedResponse: createMockResource({ items: stockItems(), totalElements: 2 }),
  };
}

const DIALOG_DATA = {
  certId: 'cert-123',
  stockDetail: { id: 'stock-1', generalData: {} },
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let mockDialog: ReturnType<typeof createMockMatDialog>;
let mockDialogRef: { close: ReturnType<typeof vi.fn> };
let stockListStore: ReturnType<typeof makeStockListStore>;
let certsService: ReturnType<typeof makeCertificatesService>;

async function setup(options?: { items?: any[] }) {
  mockDialogRef = { close: vi.fn() };
  mockDialog = createMockMatDialog({ defaultResult: null });
  stockListStore = makeStockListStore(options?.items ?? stockItems());
  certsService = makeCertificatesService();

  const renderResult = await render(LinkCertificatesDialogComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA },
      { provide: MunitionsStockListService, useValue: makeMunitionsStockListService() },
      { provide: ClientsDataService, useValue: makeClientsDataService() },
      { provide: MunitionsStockCertificatesService, useValue: certsService },
    ],
    componentProviders: [
      { provide: MatDialog, useValue: mockDialog },
      { provide: StockListStore, useValue: stockListStore },
      { provide: MunitionComponentStore, useValue: makeMunitionComponentStore() },
    ],
  });

  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('LinkCertificatesDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should call stockListStore.search on init', async () => {
      await setup();
      expect(stockListStore.search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('should render the dialog title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.LINK.TITLE')).toBeInTheDocument();
    });
  });

  describe('Table rendering', () => {
    it('should render a row for each stock item', async () => {
      await setup();
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows).toHaveLength(2);
    });

    it('should display denomination names in the table', async () => {
      await setup();
      expect(screen.getByText('Denominacion 1')).toBeInTheDocument();
      expect(screen.getByText('Denominacion 2')).toBeInTheDocument();
    });

    it('should display batch values in the table', async () => {
      await setup();
      expect(screen.getAllByText('Lote1')).toHaveLength(2);
    });
  });

  describe('Search', () => {
    it('should call stockListStore.search with clientId filter when clientId is set', async () => {
      const { component } = await setup();
      component.filterForm.clientId().setControlValue('cli-1');
      component.search();
      expect(stockListStore.search).toHaveBeenCalledWith(expect.objectContaining({ clientIds: ['cli-1'] }));
    });

    it('should call stockListStore.search without clientId when field is empty', async () => {
      const { component } = await setup();
      component.search();
      expect(stockListStore.search).toHaveBeenCalledWith(expect.not.objectContaining({ clientIds: expect.anything() }));
    });

    it('should call stockListStore.search with munitionTypeId filter when set', async () => {
      const { component } = await setup();
      component.filterForm.munitionTypeId().setControlValue('Vaso');
      component.search();
      expect(stockListStore.search).toHaveBeenCalledWith(expect.objectContaining({ munitionTypeIds: ['Vaso'] }));
    });
  });

  describe('Confirm (link)', () => {
    it('should save button be disabled when nothing is selected', async () => {
      await setup();
      const saveBtn = screen.getByText('MODIFY_DOC_DIALOG.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
    });

    it('should call certsService.link.set with certId and selected ids on confirm', async () => {
      const { component, fixture } = await setup();
      const spy = vi.spyOn(certsService.link, 'set');
      component.selection.setSelection(stockItems()[0] as any);
      fixture.detectChanges();

      component.onConfirm();

      expect(spy).toHaveBeenCalledWith({
        certId: 'cert-123',
        munitionIds: [stockItems()[0].id],
      });
    });

    it('should close the dialog with true on confirm', async () => {
      const { component, fixture } = await setup();
      component.selection.setSelection(stockItems()[0] as any);
      fixture.detectChanges();
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('Cancel', () => {
    it('should close the dialog with false when clicking cancel', async () => {
      const { fixture } = await setup();
      const cancelBtn = screen.getByText('MODIFY_DOC_DIALOG.CANCEL').closest('button') as HTMLButtonElement;
      await userEvent.click(cancelBtn);
      await fixture.whenStable();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('Selection (checkboxes)', () => {
    it('should toggle selection when clicking a checkbox', async () => {
      const { component } = await setup();
      const rows = screen.getAllByRole('row').slice(1);
      const checkbox = within(rows[0]).getByRole('checkbox');

      expect(component.selection.selected).toHaveLength(0);
      await userEvent.click(checkbox);
      expect(component.selection.selected).toHaveLength(1);
    });
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function stockItems() {
  return [
    {
      id: 'item-1',
      category: 'MUNITION',
      munitionType: { id: 'DISPARO_COMPLETO', name: 'Disparo completo' },
      denomination: { id: 'den-1', name: 'Denominacion 1' },
      client: { id: 'cli-1', name: 'Cliente A' },
      batch: 'Lote1',
      munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n A' },
      status: 'AVAILABLE',
      plannedFireTrial: { id: 'trial-1', name: 'Trial 2' },
      quantity: 10,
      totalNeq: 50,
      createdBy: 'user',
      modifiedBy: 'user',
      createdAt: '2026-02-12T10:30:00Z',
      updatedAt: '2026-02-12T12:15:00Z',
    },
    {
      id: 'item-2',
      category: 'MUNITION_COMPONENT',
      munitionType: { id: 'Vaso', name: 'Vaso' },
      denomination: { id: 'den-2', name: 'Denominacion 2' },
      client: { id: 'cli-1', name: 'Cliente A' },
      batch: 'Lote1',
      munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n A' },
      status: 'AVAILABLE',
      plannedFireTrial: { id: 'trial-1', name: 'Trial 2' },
      quantity: 5,
      totalNeq: 20,
      createdBy: 'user',
      modifiedBy: 'user',
      createdAt: '2026-02-12T10:30:00Z',
      updatedAt: '2026-02-12T12:15:00Z',
    },
  ];
}
