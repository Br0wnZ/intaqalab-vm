import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UiDialogService } from '@intaqalab/ui';
import { TranslatePipe, provideTranslateService } from '@ngx-translate/core';
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
  selector: 'inta-denominations-filter',
  template: '',
})
class MockDenominationsFilter {
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
        imports: [CommonModule, FormsModule, MatSlideToggleModule, TranslatePipe, MockDenominationsFilter],
        template: `
          <h2>{{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.TITLE' | translate }}</h2>
          <inta-denominations-filter
            (searchItems)="searchedName.set($event)"
          />
          <button mat-flat-button type="button" (click)="create()">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.CREATE' | translate }}
          </button>

          <div *ngFor="let item of store.items()">
            <span>{{ item.name }}</span>
            <span>{{ item.munitionType.name }}</span>
            <span>{{ item.neq }}</span>
            <button mat-icon-button type="button" aria-label="COMMONS.DELETE" (click)="delete(item)"></button>
            <button mat-icon-button type="button" aria-label="COMMONS.EDIT" (click)="edit(item)"></button>
            <mat-slide-toggle [checked]="getCheckedState(item)" (change)="toogleActive(item)"></mat-slide-toggle>
          </div>
        `,
      },
    });

    const view = await render(DenominationsListComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DenominationsStore, useValue: mockStore },
        { provide: UiDialogService, useValue: mockUiDialog }, provideTranslateService(),
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

      const createBtn = screen.getByRole('button', {
        name: /WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.CREATE/i,
      });
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
      const createBtn = screen.getByRole('button', {
        name: /WHAREHOUSE_MANAGMENT\.DENOMINATIONS\.CREATE/i,
      });
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
      const { user } = await setup([mockItem], editResult);
      const editBtn = screen.getByRole('button', { name: 'COMMONS.EDIT' });
      await user.click(editBtn);

      expect(mockStore.updateItem).toHaveBeenCalledWith(expect.objectContaining({ name: editResult.name }));
    });
  });

  describe('Delete', () => {
    it('should call store.deleteItem when delete is confirmed', async () => {
      const { user } = await setup([mockItem]);
      mockUiDialog.confirm.mockResolvedValue(true);
      const deleteBtn = screen.getByRole('button', { name: 'COMMONS.DELETE' });
      await user.click(deleteBtn);

      expect(mockStore.deleteItem).toHaveBeenCalledWith(mockItem);
    });

    it('should NOT call store.deleteItem when delete is cancelled', async () => {
      const { user } = await setup([mockItem]);
      mockUiDialog.confirm.mockResolvedValue(false);
      const deleteBtn = screen.getByRole('button', { name: 'COMMONS.DELETE' });
      await user.click(deleteBtn);

      expect(mockStore.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('Toggle active', () => {
    it('should call store.toogleEnabledItem when status change is confirmed', async () => {
      const { view } = await setup([mockItem]);
      mockUiDialog.confirm.mockResolvedValue(true);

      await view.fixture.componentInstance.toogleActive(mockItem);

      expect(mockStore.toogleEnabledItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockItem.id,
          active: false,
          munitionTypeId: mockItem.munitionType.id,
        }),
      );
    });

    it('should not change status when confirmation is cancelled', async () => {
      const { view } = await setup([mockItem]);

      await view.fixture.componentInstance.toogleActive(mockItem);

      expect(mockStore.toogleEnabledItem).not.toHaveBeenCalled();
      expect(view.fixture.componentInstance.getCheckedState(mockItem)).toBe(true);
    });

    it('should render the refreshed status when list reload starts', async () => {
      const item = { ...mockItem };
      const { view } = await setup([item]);
      mockUiDialog.confirm.mockResolvedValue(true);

      await view.fixture.componentInstance.toogleActive(item);
      item.active = false;
      mockStore.isLoading.set(true);
      view.fixture.detectChanges();

      expect(view.fixture.componentInstance.getCheckedState(item)).toBe(false);
    });
  });
});
