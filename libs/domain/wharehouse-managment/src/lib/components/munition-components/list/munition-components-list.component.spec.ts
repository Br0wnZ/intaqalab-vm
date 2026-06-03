import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionComponentService } from '../../../services/munition-component.service';
import { MunitionComponentsListComponent } from './munition-components-list.component';

const mockDialogFactory = () => ({
  open: () => {
    return {
      afterClosed: () => of(true),
    };
  },
});

describe('MunitionComponentsListComponent', () => {
  let mockService: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;

  async function setup() {
    return await render(MunitionComponentsListComponent, {
      declarations: [],
      imports: [TranslateModule.forRoot(), MatTableModule, MatPaginatorModule, MatSortModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MunitionComponentService, useValue: mockService },
        { provide: MunitionComponentStore },
      ],
      componentProviders: [
        {
          provide: MatDialog,
          useValue: mockDialogFactory(),
        },
      ],
    });
  }

  beforeEach(async () => {
    mockService = munitionComponentServiceMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shoult paint the header of the table and the rows', async () => {
    await setup();

    expect(await screen.findByText('WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.COMPONENT_TYPE')).toBeTruthy();
    expect(await screen.findByText('WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.STATUS')).toBeTruthy();

    expect(await screen.findByText(munitionTable().items[0].name.es)).toBeTruthy();
  });

  it('should edit to call to the MunitionComponentService.updateItem', async () => {
    await setup();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows0 = screen.getAllByRole('row');
    const rows = screen.getAllByRole('row').slice(1);
    const firstRow = rows[0];

    const buttons = within(firstRow).getAllByRole('button');
    await userEvent.click(buttons[1]);
    expect(mockService.updateItem).toHaveBeenCalled();
  });
});

function munitionComponentServiceMock() {
  const paginatedResponse = createMockResource(munitionTable());
  const mock = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchItems: signal<any>(null),
    updateItem: vi.fn(),
    paginatedResponse,
    updateResource: createMockResource({}),
    saveResource: createMockResource({}),
    deleteResource: createMockResource({}),
  };
  return mock;
}

function munitionTable() {
  return {
    page: 1,
    pageSize: 25,
    totalElements: 1,
    items: [
      {
        id: '1',
        name: {
          es: 'nameEs 1',
          en: 'en',
        },
        label: 'label',
        observations: 'bla, bla, bla',
        enabled: true,
      },
      {
        id: '1',
        name: {
          es: 'nameEs 2',
          en: 'en',
        },
        label: 'label',
        observations: 'bla, bla, bla',
        enabled: true,
      },
    ],
  };
}
