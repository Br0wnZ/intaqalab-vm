import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { UiDialogService } from '@intaqalab/ui';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
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
  let mockUiDialog: { confirm: ReturnType<typeof vi.fn> };

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
        { provide: UiDialogService, useValue: mockUiDialog },
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
    mockUiDialog = { confirm: vi.fn().mockResolvedValue(true) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shoult paint the header of the table and the rows', async () => {
    await setup();

    expect(await screen.findByText('WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.COMPONENT_TYPE')).toBeInTheDocument();

    expect(await screen.findByText(munitionTable().items[0].name.es)).toBeInTheDocument();
  });

  it('should edit to call to the MunitionComponentService.updateItem', async () => {
    await setup();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows0 = screen.getAllByRole('row');
    const rows = screen.getAllByRole('row').slice(1);
    const firstRow = rows[0];

    const buttons = within(firstRow).getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(mockService.updateItem).toHaveBeenCalled();
  });

  it('should change status only after confirmation', async () => {
    const view = await setup();
    const item = munitionTable().items[0];

    await view.fixture.componentInstance.toogleActive(item);

    expect(mockUiDialog.confirm).toHaveBeenCalledOnce();
    expect(mockService.toogleEnabledItem).toHaveBeenCalledWith(item, false);
  });

  it('should not change status when confirmation is cancelled', async () => {
    mockUiDialog.confirm.mockResolvedValue(false);
    const view = await setup();
    const item = munitionTable().items[0];

    await view.fixture.componentInstance.toogleActive(item);

    expect(mockService.toogleEnabledItem).not.toHaveBeenCalled();
    expect(view.fixture.componentInstance.getCheckedState(item)).toBe(true);
  });
});

function munitionComponentServiceMock() {
  const paginatedResponse = createMockResource(munitionTable());
  const mock = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchItems: signal<any>(null),
    updateItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
    paginatedResponse,
    updateResource: createMockResource({}),
    saveResource: createMockResource({}),
    deleteResource: createMockResource({}),
  };
  return mock;
}

function munitionTable(): { page: number; pageSize: number; totalElements: number; items: MunitionComponentsModel[] } {
  return {
    page: 1,
    pageSize: 25,
    totalElements: 1,
    items: [
      {
        id: '1',
        category: 'MUNITION_COMPONENT',
        name: {
          es: 'nameEs 1',
          en: 'en',
        },
        label: 'label',
        observations: 'bla, bla, bla',
        active: true,
      },
      {
        id: '1',
        category: 'MUNITION_COMPONENT',
        name: {
          es: 'nameEs 2',
          en: 'en',
        },
        label: 'label',
        observations: 'bla, bla, bla',
        active: true,
      },
    ],
  };
}
