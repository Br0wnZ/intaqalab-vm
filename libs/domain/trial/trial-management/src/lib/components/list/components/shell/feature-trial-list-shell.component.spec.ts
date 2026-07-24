import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Signal } from '@angular/core';
import { Component, signal } from '@angular/core';
import { injectionTokenTabCommand, provideTestingEnvironment } from '@intaqalab/core';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { TrialStore } from '../../+state/trial-list.store';
import { FeatureTrialListShellComponent } from './feature-trial-list-shell.component';

// vi.mock hoisted by Vitest
@Component({
  selector: 'inta-trial-list',
  template: '',
})
class TrialListStubComponent {}

const loadTrials = vi.fn<(arg: Signal<string>) => void>();
const search = vi.fn();
const items = vi.fn();
const totalElements = vi.fn();
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
});
