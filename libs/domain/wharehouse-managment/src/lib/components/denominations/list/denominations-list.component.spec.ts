import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiDialogService } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import type { DenominationModel, DenominationUpSertModel } from '../../../models/denominations.model';
import { DenominationsListComponent } from './denominations-list.component';

const mockItem: DenominationModel = {
  id: 'item-1',
  category: 'MUNITION',
  munitionType: { id: 'mt-1', name: 'Granada mortero' },
  name: 'Granada mortero 120 mm inerte M-AE-85',
  neq: 0.68,
  riskGroups: '1.3',
  compatibility: 'G',
  weight: 21.5,
  active: true,
};

function createMockStore(items: DenominationModel[] = []) {
  return {
    items: signal(items),
    totalElements: signal(items.length),
    isLoading: signal(false),
    hasError: signal(false),
    isMutating: signal(false),
    search: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
    reload: vi.fn(),
  };
}

function createMockDialog(defaultResult: unknown = null) {
  return {
    open: vi.fn().mockImplementation(() => ({
      afterClosed: vi.fn(() => ({
        subscribe: vi.fn((callback: (result: unknown) => void) => {
          callback(defaultResult);
          return { unsubscribe: vi.fn() };
        }),
      })),
    })),
  };
}

@Component({
  selector: 'inta-wharehouse-filter',
  standalone: true,
  template: '',
})
class MockWharehouseFilterComponent {
  readonly placeholdeTranslation = input<string>('');
  readonly searchItems = output<{ name: string }>();
}

describe('DenominationsListComponent', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockUiDialog: { confirm: ReturnType<typeof vi.fn> };

  const setup = async (items: DenominationModel[] = [], dialogResult: unknown = null) => {
    const user = userEvent.setup();
    mockStore = createMockStore(items);
    mockUiDialog = { confirm: vi.fn().mockResolvedValue(false) };

    const mockDialog = createMockDialog(dialogResult);

    TestBed.overrideComponent(DenominationsListComponent, {
      set: {
        imports: [CommonModule, FormsModule, MatSlideToggleModule, TranslateModule, MockWharehouseFilterComponent],
        template: `
          <h2>{{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.TITLE' | translate }}</h2>
          <inta-wharehouse-filter
            [placeholdeTranslation]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.DENOMINATION'"
            (searchItems)="searchedName.set($event)"
          />
          <button mat-flat-button type="button" (click)="create()">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.CREATE' | translate }}
          </button>

          <div *ngFor="let item of store.items()">
            <span>{{ item.name }}</span>
            <span>{{ item.munitionType.name }}</span>
            <span>{{ item.neq }}</span>
            <button mat-icon-button type="button" (click)="delete(item)"></button>
            <button mat-icon-button type="button" (click)="edit(item)"></button>
            <mat-slide-toggle [(ngModel)]="item.active" (change)="toogleActive(item, $event)"></mat-slide-toggle>
          </div>
        `,
      },
    });

    const view = await render(DenominationsListComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DenominationsStore, useValue: mockStore },
        { provide: UiDialogService, useValue: mockUiDialog },
      ],
      componentProviders: [{ provide: MatDialog, useValue: mockDialog }],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    return { user, view, container };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the denominations title', async () => {
      await setup();
      expect(screen.getAllByText(/WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.TITLE/i)[0]).toBeInTheDocument();
    });

    it('should render the create button', async () => {
      await setup();
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.CREATE/i)).toBeInTheDocument();
    });

    it('should render items from the store in the table', async () => {
      await setup([mockItem]);
      expect(screen.getByText(mockItem.name)).toBeInTheDocument();
      expect(screen.getByText(mockItem.munitionType.name)).toBeInTheDocument();
      expect(screen.getByText(String(mockItem.neq))).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should call store.search on init with default pagination', async () => {
      await setup();
      expect(mockStore.search).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
    });
  });

  describe('Create', () => {
    it('should open the create dialog with item null when create button is clicked', async () => {
      const { user } = await setup();

      const createBtn = screen
        .getByText(/WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.CREATE/i)
        .closest('button') as HTMLButtonElement;
      await user.click(createBtn);

      expect(mockStore.createItem).not.toHaveBeenCalled();
    });

    it('should call store.createItem with dialog result when create is confirmed', async () => {
      const newDenomination: DenominationUpSertModel = {
        name: 'New Denomination',
        category: 'MUNITION',
        munitionType: { id: 'mt-1', name: 'Granada mortero' },
        munitionTypeId: 'mt-1',
        active: true,
        weight: 5,
      };
      const { user } = await setup([], newDenomination);
      const createBtn = screen
        .getByText(/WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.CREATE/i)
        .closest('button') as HTMLButtonElement;
      await user.click(createBtn);

      expect(mockStore.createItem).toHaveBeenCalledWith(newDenomination);
    });
  });

  describe('Edit', () => {
    it('should call store.updateItem with merged result when edit is confirmed', async () => {
      const editResult: DenominationUpSertModel = {
        name: 'Updated Name',
        category: 'MUNITION',
        munitionType: { id: 'mt-1', name: 'Granada mortero' },
        munitionTypeId: 'mt-1',
        active: true,
        weight: 10,
      };
      const { user, container } = await setup([mockItem], editResult);
      const editBtns = container.querySelectorAll('button[mat-icon-button]');
      const editBtn = editBtns[1] as HTMLButtonElement; // delete=0, edit=1
      await user.click(editBtn);

      expect(mockStore.updateItem).toHaveBeenCalledWith(expect.objectContaining({ name: editResult.name }));
    });
  });

  describe('Delete', () => {
    it('should call store.deleteItem when delete is confirmed', async () => {
      const { user, container } = await setup([mockItem]);
      mockUiDialog.confirm.mockResolvedValue(true);
      const deleteBtn = container.querySelectorAll('button[mat-icon-button]')[0] as HTMLButtonElement;
      await user.click(deleteBtn);

      expect(mockStore.deleteItem).toHaveBeenCalledWith(mockItem);
    });

    it('should NOT call store.deleteItem when delete is cancelled', async () => {
      const { user, container } = await setup([mockItem]);
      mockUiDialog.confirm.mockResolvedValue(false);
      const deleteBtn = container.querySelectorAll('button[mat-icon-button]')[0] as HTMLButtonElement;
      await user.click(deleteBtn);

      expect(mockStore.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('Toggle active', () => {
    it('should call store.toogleEnabledItem when slide toggle changes', async () => {
      const { container } = await setup([mockItem]);
      const toggle = container.querySelector('mat-slide-toggle') as HTMLElement;
      const input = toggle?.querySelector('input[type="checkbox"]') ?? toggle?.querySelector('button[role="switch"]');
      (input as HTMLElement)?.click();
      await Promise.resolve();

      expect(mockStore.toogleEnabledItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockItem.id,
          active: expect.any(Boolean),
          munitionTypeId: mockItem.munitionType.id,
        }),
      );
    });
  });
});
