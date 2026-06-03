import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { UiDialogService } from '@intaqalab/ui';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MunitionsStockDetailStore } from '../../../+state/munition-stock-detail.store';
import { MunitionComponentService } from '../../../services/munition-component.service';
import { MunitionsStockCertificatesService } from '../../../services/munitions-stock-certificates.service';
import { MunitionsStockDetailService } from '../../../services/munitions-stock-detail.service';
import { TransferDialogComponent } from '../../shared/transfer-dialog/transfer-dialog.component';
import { RetireDialogComponent } from '../retire-dialog/retire-dialog.component';
import { MunitionStockDetailShellComponent } from './munition-stock-detail-shell.component';

// // Factories
//

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStockDetailStore(data = stock()): any {
  return {
    item: signal(data),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    searchById: vi.fn(),
    updateAssociatedComponents: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionsStockDetailService() {
  return {
    response: createMockResource(stock()),
    searchById: vi.fn(),
    updateAssociatedComponents: vi.fn(),
    deleteResource: createMockResource(),
    retire: signal<unknown>(undefined),
    retireResource: createMockResource(),
    transfer: signal<unknown>(undefined),
    transferResource: createMockResource(),
  };
}

function makeMunitionComponentService() {
  return {
    searchItems: { set: vi.fn() },
    paginatedResponse: createMockResource({ items: [], totalElements: 0 }),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteResource: createMockResource(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

function makeMunitionsStockCertificatesService() {
  return {
    response: createMockResource({ items: [], totalElements: 0 }),
    deleteResource: createMockResource(),
    searchById: vi.fn(),
    deleteItem: vi.fn(),
    uploadDocument: vi.fn(),
    uploadDocumentResource: createMockResource(),
    link: signal<unknown>(undefined),
    munitionCertificateLinkResource: createMockResource(),
  };
}

// // Setup
//

let dialogMock: { open: ReturnType<typeof vi.fn> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockStore: any;
let router: { navigateByUrl: ReturnType<typeof vi.fn> };

async function setup(entity: 'munitions' | 'munition-components' = 'munitions') {
  dialogMock = { open: vi.fn() };
  router = { navigateByUrl: vi.fn() };
  mockStore = makeStockDetailStore();

  const renderResult = await render(MunitionStockDetailShellComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialog, useValue: dialogMock },
      { provide: Router, useValue: router },
      // Shell's own store mock (shell has no providers[] for this store)
      { provide: MunitionsStockDetailStore, useValue: mockStore },
      // Services for child components' internally-created stores
      { provide: MunitionsStockDetailService, useValue: makeMunitionsStockDetailService() },
      { provide: MunitionComponentService, useValue: makeMunitionComponentService() },
      { provide: MunitionsStockCertificatesService, useValue: makeMunitionsStockCertificatesService() },
      { provide: UiDialogService, useValue: { confirm: vi.fn().mockResolvedValue(true) } },
    ],
    componentInputs: { id: 'stock-1', entity },
  });

  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// // Tests
//

describe('MunitionStockDetailShellComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should call store.searchById with id and entity "munitions" on init', async () => {
      await setup('munitions');
      expect(mockStore.searchById).toHaveBeenCalledWith('stock-1', 'munitions');
    });

    it('should call store.searchById with entity "munition-components" on init', async () => {
      await setup('munition-components');
      expect(mockStore.searchById).toHaveBeenCalledWith('stock-1', 'munition-components');
    });
  });

  describe('Form data display', () => {
    it('should display the client name', async () => {
      await setup();
      expect(screen.getByDisplayValue('Cliente X')).toBeInTheDocument();
    });

    it('should display the munition type name', async () => {
      await setup();
      expect(screen.getByDisplayValue('tipo de municion')).toBeInTheDocument();
    });

    it('should display the denomination name', async () => {
      await setup();
      expect(screen.getByDisplayValue('Una denominaciÃ³n')).toBeInTheDocument();
    });

    it('should display the batch value', async () => {
      await setup();
      expect(screen.getByDisplayValue('Lote X')).toBeInTheDocument();
    });

    it('should display the munitionDumpId value', async () => {
      await setup();
      expect(screen.getByDisplayValue('PolvorÃ­n X')).toBeInTheDocument();
    });

    it('should display the cell name', async () => {
      await setup();
      expect(screen.getByDisplayValue('Celda X')).toBeInTheDocument();
    });
  });

  describe('Entity-specific rendering', () => {
    it('should render the ComponentsTable for "munitions" entity', async () => {
      await setup('munitions');
      expect(screen.getAllByText('WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.HEADING').length).toBeGreaterThan(0);
    });

    it('should NOT render the ComponentsTable for "munition-components" entity', async () => {
      await setup('munition-components');
      expect(screen.queryByText('WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.HEADING')).not.toBeInTheDocument();
    });
  });

  describe('Actions menu', () => {
    it('should open RetireDialogComponent when retire() is called', async () => {
      const { component } = await setup();
      component.retire();
      expect(dialogMock.open).toHaveBeenCalledOnce();
      const [componentType] = dialogMock.open.mock.calls[0];
      expect(componentType).toBe(RetireDialogComponent);
    });

    it('should pass item and category to the retire dialog', async () => {
      const { component } = await setup('munitions');
      component.retire();
      const [, options] = dialogMock.open.mock.calls[0];
      expect(options.data).toEqual(expect.objectContaining({ category: 'MUNITION' }));
    });

    it('should open TransferDialogComponent when transfer() is called', async () => {
      const { component } = await setup();
      component.transfer();
      expect(dialogMock.open).toHaveBeenCalledOnce();
      const [componentType] = dialogMock.open.mock.calls[0];
      expect(componentType).toBe(TransferDialogComponent);
    });

    it('should pass item and category to the transfer dialog', async () => {
      const { component } = await setup('munitions');
      component.transfer();
      const [, options] = dialogMock.open.mock.calls[0];
      expect(options.data).toEqual(expect.objectContaining({ category: 'MUNITION' }));
    });

    it('should navigate to movements URL when movements() is called', async () => {
      const { component } = await setup();
      component.movements();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/wharehouse-managment/movements');
    });

    it('should toggle opened signal when actions menu is opened/closed', async () => {
      const { component } = await setup();
      expect(component.opened()).toBe(false);
      component.opened.set(true);
      expect(component.opened()).toBe(true);
    });
  });

  describe('categoryView computed', () => {
    it('should return "MUNITION" for entity "munitions"', async () => {
      const { component } = await setup('munitions');
      expect(component.categoryView()).toBe('MUNITION');
    });

    it('should return "MUNITION_COMPONENT" for entity "munition-components"', async () => {
      const { component } = await setup('munition-components');
      expect(component.categoryView()).toBe('MUNITION_COMPONENT');
    });
  });

  describe('componentesCertificates computed', () => {
    it('should map associatedComponents for "munitions" entity', async () => {
      const { component } = await setup('munitions');
      const certs = component.componentesCertificates();
      expect(certs).toHaveLength(3);
      expect(certs[0]).toEqual(expect.objectContaining({ id: expect.any(String) }));
    });

    it('should return a single entry with stock id for "munition-components" entity', async () => {
      const { component } = await setup('munition-components');
      const certs = component.componentesCertificates();
      expect(certs).toHaveLength(1);
      expect(certs[0].id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });
  });
});

// // Data
//

function stock() {
  return {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    munitionType: { id: 'munitionType', name: 'tipo de municion' },
    denomination: { id: 'denominationId', name: 'Una denominaciÃ³n' },
    batch: 'Lote X',
    quantity: 10,
    totalNeq: 100,
    weight: 20,
    generalData: {
      client: { id: 'cli-1', name: 'Cliente X' },
      entryDate: '2026-02-18',
      plannedFireTrial: { id: 'trial-1', name: 'Prueba X', scheduledDate: '2026-02-18' },
      observations: '',
    },
    location: {
      munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n X' },
      cellName: 'Celda X',
    },
    associatedComponents: [
      {
        id: '1',
        munitionType: { id: 'Proyectil', name: 'Proyectil' },
        denomination: { id: 'den-1', name: 'DenominaciÃ³n 1' },
        batch: 'Lote 1',
        quantity: 10,
      },
      {
        id: '2',
        munitionType: { id: 'Vaso', name: 'Vaso' },
        denomination: { id: 'den-2', name: 'DenominaciÃ³n 2' },
        batch: 'Lote 2',
        quantity: 200,
      },
      {
        id: '3',
        munitionType: { id: 'Vaso', name: 'Vaso' },
        denomination: { id: 'den-3', name: 'Vaso XXX' },
        batch: 'Lote 3',
        quantity: 200,
      },
    ],
    retirementDate: '2026-02-18',
    retirementReason: 'Retirada por motivos X',
    status: 'AVAILABLE',
    createdBy: 'username',
    modifiedBy: 'username',
    createdAt: '2026-02-12T10:30:00Z',
    updatedAt: '2026-02-12T12:15:00Z',
  };
}
