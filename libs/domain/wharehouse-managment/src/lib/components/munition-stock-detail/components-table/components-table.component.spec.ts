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

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsStockDetailStore } from '../../../+state/munition-stock-detail.store';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import { ComponentsTableComponent } from './components-table.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

function makeMunitionComponentStore() {
  return {
    items: signal<any[]>([
      { id: 'mt-1', label: 'Proyectil', name: 'Proyectil', shortName: 'P' },
      { id: 'mt-2', label: 'Vaso', name: 'Vaso', shortName: 'V' },
    ]),
    totalElements: signal(2),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    search: vi.fn(),
    reset: vi.fn(),
  };
}

function makeUiDialogService(confirmed = true) {
  return { confirm: vi.fn().mockResolvedValue(confirmed) };
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let mockDialog: ReturnType<typeof createMockMatDialog>;
let stockDetailStore: ReturnType<typeof makeMunitionDetailStore>;
let componentStore: ReturnType<typeof makeMunitionComponentStore>;
let uiDialog: ReturnType<typeof makeUiDialogService>;

async function setup(options?: {
  confirmed?: boolean;
  dialogResult?: any;
  munitionOverrides?: Partial<MunitionDetailResponseModel>;
}) {
  stockDetailStore = makeMunitionDetailStore(options?.munitionOverrides);
  componentStore = makeMunitionComponentStore();
  uiDialog = makeUiDialogService(options?.confirmed ?? true);
  mockDialog = createMockMatDialog({
    defaultResult: options?.dialogResult ?? {
      batch: 'Lote Nuevo',
      denominationId: { id: 'den-new', name: 'Denom Nueva' },
      munitionTypeId: 'Proyectil',
    },
  });

  const renderResult = await render(ComponentsTableComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    componentProviders: [
      { provide: MunitionsStockDetailStore, useValue: stockDetailStore },
      { provide: MunitionComponentStore, useValue: componentStore },
      { provide: MatDialog, useValue: mockDialog },
      { provide: UiDialogService, useValue: uiDialog },
    ],
    componentInputs: {
      munition: munitionData(options?.munitionOverrides),
    },
  });

  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ComponentsTableComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should render a row for each associatedComponent', async () => {
      await setup();
      const rows = screen.getAllByRole('row').slice(1); // skip header
      expect(rows).toHaveLength(2);
    });

    it('should display batch values in rows', async () => {
      await setup();
      expect(screen.getByText('Lote 1')).toBeInTheDocument();
      expect(screen.getByText('Lote 2')).toBeInTheDocument();
    });

    it('should display denomination names in rows', async () => {
      await setup();
      expect(screen.getByText('DenominaciÃ³n 1')).toBeInTheDocument();
      expect(screen.getByText('DenominaciÃ³n 2')).toBeInTheDocument();
    });

    it('should display munitionType names in rows', async () => {
      await setup();
      expect(screen.getByText('Proyectil')).toBeInTheDocument();
      expect(screen.getByText('Vaso')).toBeInTheDocument();
    });

    it('should render the Add Components button', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ADD_COMPONENTS')).toBeInTheDocument();
    });
  });

  describe('Delete component', () => {
    it('should call updateAssociatedComponents without the deleted item when confirmed', async () => {
      const { fixture } = await setup({ confirmed: true });
      const rows = screen.getAllByRole('row').slice(1);
      const deleteBtn = within(rows[0]).getAllByRole('button')[1];

      await userEvent.click(deleteBtn);
      await fixture.whenStable();

      expect(stockDetailStore.updateAssociatedComponents).toHaveBeenCalledWith({
        id: 'stock-1',
        data: [
          {
            batch: 'Lote 2',
            denominationId: 'den-comp-2',
            munitionTypeId: 'Vaso',
          },
        ],
      });
    });

    it('should NOT call updateAssociatedComponents when delete is cancelled', async () => {
      const { fixture } = await setup({ confirmed: false });
      const rows = screen.getAllByRole('row').slice(1);
      const deleteBtn = within(rows[0]).getAllByRole('button')[1];

      await userEvent.click(deleteBtn);
      await fixture.whenStable();

      expect(stockDetailStore.updateAssociatedComponents).not.toHaveBeenCalled();
    });

    it('should show the confirmation dialog before deleting', async () => {
      const { fixture } = await setup({ confirmed: true });
      const rows = screen.getAllByRole('row').slice(1);
      const deleteBtn = within(rows[0]).getAllByRole('button')[1];

      await userEvent.click(deleteBtn);
      await fixture.whenStable();

      expect(uiDialog.confirm).toHaveBeenCalledOnce();
    });
  });

  describe('Edit component', () => {
    it('should open the dialog when clicking the edit button', async () => {
      await setup();
      const rows = screen.getAllByRole('row').slice(1);
      const editBtn = within(rows[0]).getAllByRole('button')[0];

      await userEvent.click(editBtn);

      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should call updateAssociatedComponents with updated data after edit dialog closes', async () => {
      const { component, fixture } = await setup({
        dialogResult: {
          batch: 'Lote Editado',
          denominationId: { id: 'den-edited', name: 'Denom Editada' },
          munitionTypeId: 'Proyectil',
        },
      });

      component.itemToEdit.set({ value: 0 });
      fixture.detectChanges();
      await fixture.whenStable();

      expect(stockDetailStore.updateAssociatedComponents).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'stock-1' }),
      );
    });
  });

  describe('Add component', () => {
    it('should open the dialog in add mode (item: undefined) when clicking the Add button', async () => {
      await setup();
      const addBtn = screen
        .getByText('WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ADD_COMPONENTS')
        .closest('button') as HTMLButtonElement;

      await userEvent.click(addBtn);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ item: undefined }),
        }),
      );
    });

    it('should call updateAssociatedComponents with the new item appended', async () => {
      const { component, fixture } = await setup({
        dialogResult: {
          batch: 'Lote AÃ±adido',
          denominationId: { id: 'den-new', name: 'Denom Nueva' },
          munitionTypeId: 'Vaso',
        },
      });

      component.itemToEdit.set({ value: -1 });
      fixture.detectChanges();
      await fixture.whenStable();

      const call = (stockDetailStore.updateAssociatedComponents as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.data).toHaveLength(3); // original 2 + 1 new
      expect(call.data[2]).toEqual({
        batch: 'Lote AÃ±adido',
        denominationId: 'den-new',
        munitionTypeId: 'Vaso',
      });
    });
  });
});
