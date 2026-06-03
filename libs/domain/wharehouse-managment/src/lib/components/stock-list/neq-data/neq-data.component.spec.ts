import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { NeqDataComponent } from './neq-data.component';

// // Factories
//

function makeMunitionsDumpsStore() {
  return {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

// // Setup
//

async function setup() {
  const munitionsDumpsStore = makeMunitionsDumpsStore();

  const view = await render(NeqDataComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MunitionsDumpsStore, useValue: munitionsDumpsStore },
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const component = fixture.componentInstance;
  const container = fixture.nativeElement as HTMLElement;
  return { fixture, component, container, munitionsDumpsStore };
}

// // Tests
//

describe('NeqDataComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });
});
