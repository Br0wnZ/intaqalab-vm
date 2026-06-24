import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DocumentTypesService } from '../../services/documents/document-types/document-types.service';
import { DocumentsService } from '../../services/documents/documents.service';
import { GeneralDataService } from '../../services/general-data/general-data.service';
import { MeasuresService } from '../../services/measures/measures.service';
import { SeriesAndShootsService } from '../../services/series-and-shoots/series-and-shoots.service';
import { UserDataService } from '../../services/user-data.service';
import { EventLogShellComponent } from './event-log-shell.component';

function makeMockDocumentsService() {
  return {
    searchItems: signal({}),
    filtersItems: signal({}),
    paginatedResponse: createMockResource({ page: 1, pageSize: 10, totalElements: 0, items: [] }),
  };
}

function makeMockGeneralDataService() {
  return {
    searchItems: signal({}),
    filtersItems: signal({}),
    paginatedResponse: createMockResource({ page: 1, pageSize: 10, totalElements: 0, items: [] }),
  };
}

function makeMockSeriesAndShootsService() {
  return {
    searchItems: signal({}),
    filtersItems: signal({}),
    paginatedResponse: createMockResource({ page: 1, pageSize: 10, totalElements: 0, items: [] }),
  };
}

function makeMockMeasuresService() {
  return {
    searchItems: signal({}),
    filtersItems: signal({}),
    paginatedResponse: createMockResource({ page: 1, pageSize: 10, totalElements: 0, items: [] }),
  };
}

function makeMockUserDataService() {
  return { getUsersResponse: createMockResource([]) };
}

function makeMockDocumentTypesService() {
  return { getDocumentTypesResponse: createMockResource([]) };
}

async function setup() {
  const events = userEvent.setup();

  const view = await render(EventLogShellComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: DocumentsService, useValue: makeMockDocumentsService() },
      { provide: GeneralDataService, useValue: makeMockGeneralDataService() },
      { provide: SeriesAndShootsService, useValue: makeMockSeriesAndShootsService() },
      { provide: MeasuresService, useValue: makeMockMeasuresService() },
      { provide: UserDataService, useValue: makeMockUserDataService() },
      { provide: DocumentTypesService, useValue: makeMockDocumentTypesService() },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  const loader = TestbedHarnessEnvironment.loader(view.fixture);
  return { view, container, events, loader };
}

describe('EventLogShellComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render all four tab labels', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.TABS.DOCUMENTS')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.TABS.GENERAL_DATA')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.TABS.SERIES_AND_SHOOTS')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.TABS.MEASURES')).toBeTruthy();
    });

    it('should render the mat-tab-group', async () => {
      const { loader } = await setup();
      const tabGroup = await loader.getHarness(MatTabGroupHarness);
      expect(tabGroup).toBeTruthy();
    });

    it('should render the documents tab content by default (first tab active)', async () => {
      const { container } = await setup();
      expect(container.querySelector('inta-event-log-documents')).not.toBeNull();
    });
  });

  describe('tab navigation', () => {
    it('should mark the General Data tab as selected on click', async () => {
      const { loader } = await setup();
      const tabGroup = await loader.getHarness(MatTabGroupHarness);
      await tabGroup.selectTab({ label: 'EVENT_LOG.TABS.GENERAL_DATA' });

      const tabs = await tabGroup.getTabs();
      expect(await tabs[1].isSelected()).toBe(true);
    });

    it('should mark the Series and Shoots tab as selected on click', async () => {
      const { loader } = await setup();
      const tabGroup = await loader.getHarness(MatTabGroupHarness);
      await tabGroup.selectTab({ label: 'EVENT_LOG.TABS.SERIES_AND_SHOOTS' });

      const tabs = await tabGroup.getTabs();
      expect(await tabs[2].isSelected()).toBe(true);
    });

    it('should mark the Measures tab as selected on click', async () => {
      const { loader } = await setup();
      const tabGroup = await loader.getHarness(MatTabGroupHarness);
      await tabGroup.selectTab({ label: 'EVENT_LOG.TABS.MEASURES' });

      const tabs = await tabGroup.getTabs();
      expect(await tabs[3].isSelected()).toBe(true);
    });

    it('should have the Documents tab selected by default', async () => {
      const { loader } = await setup();
      const tabGroup = await loader.getHarness(MatTabGroupHarness);

      const tabs = await tabGroup.getTabs();
      expect(await tabs[0].isSelected()).toBe(true);
    });
  });
});
