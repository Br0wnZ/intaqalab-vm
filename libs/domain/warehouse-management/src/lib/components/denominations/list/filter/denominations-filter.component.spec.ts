import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
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
    imports: [TranslateModule.forRoot()],
    on: { filters: filtersSpy },
    providers: [provideAnimationsAsync(), { provide: MunitionComponentStore, useValue: mockStore }],
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
      const { container } = await setup();
      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
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
      const { user, container } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should emit filters with the typed name when search is clicked', async () => {
      const { user, container, filtersSpy } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      await user.click(button);

      expect(filtersSpy).toHaveBeenCalledWith({ name: 'Granada', munitionTypeId: '' });
    });

    it('should NOT emit filters when both fields are empty', async () => {
      const { container, filtersSpy } = await setup();
      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      button.click();
      await Promise.resolve();

      expect(filtersSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearFilter()', () => {
    it('should emit empty filter values when clear is clicked', async () => {
      const { user, container, filtersSpy } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const clearBtn = screen
        .getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN')
        .closest('button') as HTMLButtonElement;
      await user.click(clearBtn);

      expect(filtersSpy).toHaveBeenCalledWith({ name: '', munitionTypeId: '' });
    });

    it('should reset the input after clear', async () => {
      const { user } = await setup();
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Granada');

      const clearBtn = screen
        .getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN')
        .closest('button') as HTMLButtonElement;
      await user.click(clearBtn);

      expect(input).toHaveValue('');
    });
  });
});
