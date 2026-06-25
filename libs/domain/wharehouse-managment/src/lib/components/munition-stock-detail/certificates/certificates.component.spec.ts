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
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MunitionsStockDetailStore } from '../../../+state/munition-stock-detail.store';
import { MunitionsStockCertificatesStore } from '../../../+state/munitions-stock-certificates.store';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import { CertificatesComponent } from './certificates.component';

// // Factories
//

function mockStore(overrides?: { items?: any[]; totalElements?: number }) {
  const { items = [], totalElements = 0 } = overrides ?? {};
  return {
    items: signal(items),
    totalElements: signal(totalElements),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    searchById: vi.fn(),
    deleteItem: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionDetailStore(overrides?: Partial<MunitionDetailResponseModel>) {
  return {
    item: signal<MunitionDetailResponseModel | undefined>(munitionData(overrides)),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    searchById: vi.fn(),
    updateAssociatedComponents: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function munitionData(overrides?: Partial<MunitionDetailResponseModel>): MunitionDetailResponseModel {
  return {
    id: 'stock-1',
    munitionType: { id: 'mt-root', name: 'Tipo RaÃ­z' },
    denomination: { id: 'den-root', name: 'DenominaciÃ³n RaÃ­z' },
    batch: 'Lote X',
    quantity: 10,
    totalNeq: 100,
    weight: 20,
    generalData: {
      client: { id: 'cli-1', name: 'Cliente A' },
      entryDate: '2026-01-01',
      plannedFireTrial: { id: 'trial-1', name: 'Prueba A', scheduledDate: '2026-06-01' },
      observations: '',
    },
    location: {
      munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n A' },
      cellName: 'Celda 1',
    },
    associatedComponents: [
      {
        id: 'comp-0',
        munitionType: { id: 'Proyectil', name: 'Proyectil' },
        denomination: { id: 'den-comp-1', name: 'DenominaciÃ³n 1' },
        batch: 'Lote 1',
        quantity: 10,
      },
      {
        id: 'comp-1',
        munitionType: { id: 'Vaso', name: 'Vaso' },
        denomination: { id: 'den-comp-2', name: 'DenominaciÃ³n 2' },
        batch: 'Lote 2',
        quantity: 5,
      },
    ],
    retirementDate: '',
    retirementReason: '',
    status: 'ACTIVE',
    createdBy: 'user',
    modifiedBy: 'user',
    ...overrides,
  } as any;
}

function mockUiDialogService(confirmed = true) {
  return { confirm: vi.fn().mockResolvedValue(confirmed) };
}

function stockDetail(overrides?: Partial<MunitionDetailResponseModel>): MunitionDetailResponseModel {
  return {
    id: 'stock-1',
    munitionType: { id: 'mt-1', name: 'Tipo A' },
    denomination: { id: 'den-1', name: 'DenominaciÃ³n A' },
    batch: 'Lote A',
    quantity: 10,
    totalNeq: 100,
    weight: 20,
    generalData: {
      client: { id: 'cli-1', name: 'Cliente A' },
      entryDate: '2026-01-01',
      plannedFireTrial: { id: 'trial-1', name: 'Prueba A', scheduledDate: '2026-06-01' },
      observations: '',
    },
    location: {
      munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n A' },
      cellName: 'Celda 1',
    },
    associatedComponents: [
      {
        id: 'comp-1',
        munitionType: { id: 'mt-1', name: 'Proyectil' },
        denomination: { id: 'comp-den-1', name: 'DenominaciÃ³n Comp A' },
        batch: 'Lote C1',
        quantity: 5,
      },
    ],
    retirementDate: '',
    retirementReason: '',
    status: 'ACTIVE',
    createdBy: 'user',
    modifiedBy: 'user',
    ...overrides,
  } as any;
}

function certificateItem(id: string, name: string) {
  return {
    id,
    name,
    createdAt: '2026-01-10T10:00:00Z',
    components: [{ id: 'comp-1', name: 'Proyectil' }],
  };
}

// // Setup helper
//

let mockDialog: ReturnType<typeof createMockMatDialog>;
let store: ReturnType<typeof mockStore>;
let stockDetailStore: ReturnType<typeof makeMunitionDetailStore>;
let uiDialog: ReturnType<typeof mockUiDialogService>;

async function setup(options?: {
  storeOverrides?: { items?: any[]; totalElements?: number };
  confirmed?: boolean;
  detail?: MunitionDetailResponseModel;
}) {
  mockDialog = createMockMatDialog({ defaultResult: null });
  store = mockStore(options?.storeOverrides);
  stockDetailStore = makeMunitionDetailStore();
  uiDialog = mockUiDialogService(options?.confirmed ?? true);

  const renderResult = await render(CertificatesComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    componentProviders: [
      { provide: MatDialog, useValue: mockDialog },
      { provide: MunitionsStockCertificatesStore, useValue: store },
      { provide: MunitionsStockDetailStore, useValue: stockDetailStore },
      { provide: UiDialogService, useValue: uiDialog },
    ],
    componentInputs: {
      stockDetail: options?.detail ?? stockDetail(),
      contextComponents: [],
    },
  });

  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// // Tests
//

describe('CertificatesComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should call store.searchById with stockDetail id on init', async () => {
      await setup({ detail: stockDetail({ id: 'stock-abc' }) });
      expect(store.searchById).toHaveBeenCalledWith('stock-abc');
    });

    it('should not call store.searchById more than once for the same instance', async () => {
      const { fixture } = await setup();
      fixture.detectChanges();
      fixture.detectChanges();
      expect(store.searchById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty state (no certificates)', () => {
    it('should show the upload area when there are no certificates', async () => {
      await setup({ storeOverrides: { totalElements: 0 } });
      expect(screen.getByRole('button', { name: /TRIAL_DOCS\.ADD_DOC/i })).toBeInTheDocument();
    });

    it('should open CertificatesFilePicker when clicking the add button', async () => {
      await setup({ storeOverrides: { totalElements: 0 } });
      const btn = screen.getByRole('button', { name: /TRIAL_DOCS\.ADD_DOC/i });
      await userEvent.click(btn);
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });
  });

  describe('With certificates (table visible)', () => {
    it('should render the table with certificate rows', async () => {
      const items = [certificateItem('cert-1', 'Certificado Alpha'), certificateItem('cert-2', 'Certificado Beta')];
      await setup({ storeOverrides: { items, totalElements: 2 } });
      expect(screen.getAllByText('Certificado Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Certificado Beta').length).toBeGreaterThan(0);
    });

    it('should show the add button in the table header', async () => {
      await setup({ storeOverrides: { items: [certificateItem('cert-1', 'Doc 1')], totalElements: 1 } });
      expect(
        screen.getByRole('button', { name: /WHAREHOUSE_MANAGMENT\.CERTIFICATES\.BUTTON_ADD/i }),
      ).toBeInTheDocument();
    });

    it('should open CertificatesFilePicker when clicking the table add button', async () => {
      await setup({ storeOverrides: { items: [certificateItem('cert-1', 'Doc 1')], totalElements: 1 } });
      const btn = screen.getByRole('button', { name: /WHAREHOUSE_MANAGMENT\.CERTIFICATES\.BUTTON_ADD/i });
      await userEvent.click(btn);
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });
  });

  describe('Delete certificate', () => {
    it('should call store.deleteItem when confirm dialog is accepted', async () => {
      const items = [certificateItem('cert-del', 'Para borrar')];
      const { fixture } = await setup({
        storeOverrides: { items, totalElements: 1 },
        confirmed: true,
      });

      const rows = screen.getAllByRole('row').slice(1);
      const deleteBtn = within(rows[0]).getAllByRole('button')[1];
      await userEvent.click(deleteBtn);
      await fixture.whenStable();

      expect(store.deleteItem).toHaveBeenCalledWith('stock-1', 'cert-del');
    });

    it('should NOT call store.deleteItem when confirm dialog is cancelled', async () => {
      const items = [certificateItem('cert-del', 'Para borrar')];
      const { fixture } = await setup({
        storeOverrides: { items, totalElements: 1 },
        confirmed: false,
      });

      const rows = screen.getAllByRole('row').slice(1);
      const deleteBtn = within(rows[0]).getAllByRole('button')[1];
      await userEvent.click(deleteBtn);
      await fixture.whenStable();

      expect(store.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('Link certificate', () => {
    it('should open LinkCertificatesDialogComponent when clicking the link button', async () => {
      const items = [certificateItem('cert-link', 'Para vincular')];
      await setup({ storeOverrides: { items, totalElements: 1 } });

      const rows = screen.getAllByRole('row').slice(1);
      const linkBtn = within(rows[0]).getAllByRole('button')[2];
      await userEvent.click(linkBtn);

      expect(mockDialog.open).toHaveBeenCalledOnce();
    });
  });
});
