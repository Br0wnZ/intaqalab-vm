import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Signal } from '@angular/core';
import { Component, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { injectionTokenTabCommand, provideTestingEnvironment } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TrialStore } from '../../+state/trial-list.store';
import { DataTrialCreateModifyService } from '../../../../services/data-trial-create-modify-service';
import { FeatureTrialListShellComponent } from './feature-trial-list-shell.component';

// vi.mock hoisted by Vitest
@Component({
  selector: 'inta-trial-list',
  template: '',
})
class TrialListStubComponent {
  readonly sortChange = output<string>();
}

const loadTrials = vi.fn<(arg: Signal<string>) => void>();
const search = vi.fn();
const items = vi.fn();
const totalElements = vi.fn(() => 10);
const currentSearch = signal({});
const mockStore = {
  trials: signal(null),
  sortField: signal(null),
  sortDirection: signal(null),
  isLoading: signal(false),
  total: signal(null),
  pageIndex: signal(null),
  pageSize: signal(null),
  error: signal<string | null>(null),
  loadTrials,
  search,
  items,
  totalElements,
  currentSearch,
};

describe('FeatureTrialListShellComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    totalElements.mockReturnValue(10);
  });

  it('should render success state by default', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set(null);

    const { container } = await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    expect(container.querySelector('inta-trial-list')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MENU_LEFT.GESTION_TRIALS_LIST' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TAPS_TOP.TRIAL_LIST' })).toBeInTheDocument();
  });

  it('exports current filters and sort when clicking the Excel button', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set(null);
    const user = userEvent.setup();

    const { fixture } = await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });
    const exportSpy = vi.spyOn(TestBed.inject(DataTrialCreateModifyService), 'exportFireTrials');

    fixture.componentInstance.onFiltersChange({ description: 'pressure test' });
    fixture.componentInstance.onSortChange('createdAt;desc');
    await user.click(screen.getByRole('button', { name: 'TRIALS_LIST.EXPORT_EXCEL_BUTTON' }));

    expect(exportSpy).toHaveBeenCalledWith({ description: 'pressure test' }, ['createdAt;desc']);
  });

  it('should preserve a selected status in planning view', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set(null);
    const tabCommand = vi.fn();

    const { fixture } = await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: tabCommand,
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'true' } } },
        },
      ],
    });

    expect(screen.getByRole('heading', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TRIALS_LIST.PLANNING_TITLE' })).toBeInTheDocument();
    fixture.componentInstance.onFiltersChange({ status: [TrialStatus.PLANNED] });

    expect(fixture.componentInstance.filters()).toEqual({ status: [TrialStatus.PLANNED] });
    fixture.componentInstance.handleNavigation({ id: 'trial-42' });

    expect(tabCommand).toHaveBeenCalledWith({
      command: 'TRIAL_DETAIL',
      argument: 'trial-42',
      queryParams: { tab: '1' },
    });
  });

  it('should render loading state with skeletons when store is loading', async () => {
    mockStore.isLoading.set(true);
    mockStore.error.set(null);

    const { container } = await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    expect(container.querySelector('ui-skeleton')).toBeTruthy();
    expect(container.querySelector('inta-trial-list')).toBeFalsy();
  });

  it('should render error state when store has an error', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set('Failed to fetch data');

    const { container } = await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    expect(container.querySelector('ui-error-state')).toBeTruthy();
    expect(container.querySelector('inta-trial-list')).toBeFalsy();
  });

  it('should not render the Excel button when there are no results from store', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set(null);
    totalElements.mockReturnValue(0);

    await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    expect(screen.queryByRole('button', { name: 'TRIALS_LIST.EXPORT_EXCEL_BUTTON' })).not.toBeInTheDocument();
  });

  it('should render the Excel button when there are results from store', async () => {
    mockStore.isLoading.set(false);
    mockStore.error.set(null);
    totalElements.mockReturnValue(5);

    await render(FeatureTrialListShellComponent, {
      declarations: [TrialListStubComponent],
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [
        { provide: TrialStore, useValue: mockStore },
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    expect(screen.getByRole('button', { name: 'TRIALS_LIST.EXPORT_EXCEL_BUTTON' })).toBeInTheDocument();
  });
});
