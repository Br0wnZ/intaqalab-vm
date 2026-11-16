import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { MunitionComponentStore } from '../../../../+state/munition-component.store';
import type { MunitionComponentsModel } from '../../../../models/munition-components.model';
import { DenominationsFilter } from './denominations-filter.component';

function createMunitionComponentStore() {
  return {
    search: vi.fn(),
    items: signal<MunitionComponentsModel[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    hasError: signal(false),
    isMutating: signal(false),
  };
}

async function setup() {
  const mockStore = createMunitionComponentStore();
  const filtersSpy = vi.fn();
  const user = userEvent.setup();

  const view = await render(DenominationsFilter, {
    on: { filters: filtersSpy },
    providers: [{ provide: MunitionComponentStore, useValue: mockStore }, provideTranslateService()],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const container = fixture.nativeElement as HTMLElement;
  return { user, view, fixture, container, mockStore, filtersSpy };
}

describe('DenominationsFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the search input', async () => {
      await setup();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render the search button', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.SEARCH')).toBeInTheDocument();
    });

    it('should render the search button disabled when input is empty', async () => {
      await setup();
      const button = screen.getByRole('button', {
        name: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.SEARCH',
      });
      expect(button).toBeDisabled();
    });

    it('should render the clear filter button', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN')).toBeInTheDocument();
    });

    it('should call MunitionComponentStore.search() on init with pageSize 100', async () => {
      const { mockStore } = await setup();
      expect(mockStore.search).toHaveBeenCalledWith({ pageSize: 100 });
    });
  });

  describe('searchByName()', () => {
    it('should enable the search button when input has a value', async () => {
      const { user } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = screen.getByRole('button', {
        name: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.SEARCH',
      });
      expect(button).toBeEnabled();
    });

    it('should emit filters with the typed name when search is clicked', async () => {
      const { user, filtersSpy } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = screen.getByRole('button', {
        name: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.SEARCH',
      });
      await user.click(button);

      expect(filtersSpy).toHaveBeenCalledWith({ name: 'Granada', munitionTypeId: '' });
    });

    it('should NOT emit filters when both fields are empty', async () => {
      const { fixture, filtersSpy } = await setup();
      const component = fixture.componentInstance;
      component.search();

      expect(filtersSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearFilter()', () => {
    it('should emit empty filter values when clear is clicked', async () => {
      const { user, filtersSpy } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const clearBtn = screen.getByRole('button', {
        name: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN',
      });
      await user.click(clearBtn);

      expect(filtersSpy).toHaveBeenCalledWith({ name: '', munitionTypeId: '' });
    });

    it('should reset the input after clear', async () => {
      const { user } = await setup();
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Granada');

      const clearBtn = screen.getByRole('button', {
        name: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN',
      });
      await user.click(clearBtn);

      expect(input).toHaveValue('');
    });
  });
});
