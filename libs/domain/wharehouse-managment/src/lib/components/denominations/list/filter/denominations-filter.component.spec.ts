import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { DenominationsStore } from '../../../../+state/denominations.store';
import { DenominationsFilter } from './denominations-filter.component';

function createMockStore() {
  return {
    search: vi.fn(),
    items: signal([]),
    totalElements: signal(0),
    isLoading: signal(false),
    hasError: signal(false),
    isMutating: signal(false),
  };
}

async function setup() {
  const mockStore = createMockStore();
  const user = userEvent.setup();

  const view = await render(DenominationsFilter, {
    imports: [TranslateModule.forRoot()],
    providers: [provideAnimationsAsync(), { provide: DenominationsStore, useValue: mockStore }],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const container = fixture.nativeElement as HTMLElement;
  return { user, view, fixture, container, mockStore };
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
  });

  describe('searchByName()', () => {
    it('should enable the search button when input has a value', async () => {
      const { user, container } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should call store.search with name when search is clicked', async () => {
      const { user, container, mockStore } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      await user.click(button);

      expect(mockStore.search).toHaveBeenCalledWith({ name: 'Granada' });
    });

    it('should NOT call store.search when input is empty', async () => {
      const { container, mockStore } = await setup();
      const button = container.querySelector('button[role="button"]') as HTMLButtonElement;
      button.click();
      await Promise.resolve();

      expect(mockStore.search).not.toHaveBeenCalled();
    });
  });

  describe('clearFilter()', () => {
    it('should call store.search with empty params when clear is clicked', async () => {
      const { user, container, mockStore } = await setup();
      const input = screen.getByRole('textbox');
      await user.type(input, 'Granada');

      const clearBtn = screen
        .getByText('WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN')
        .closest('button') as HTMLButtonElement;
      await user.click(clearBtn);

      expect(mockStore.search).toHaveBeenCalledWith({});
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
