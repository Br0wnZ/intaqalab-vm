/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MunitionStockFormModel } from '../../../models/munition-stock.model';
import { MunitionGeneralDataComponent } from './general-data.component';

@Component({
  imports: [MunitionGeneralDataComponent],
  template: `
    <inta-general-data [form]="componentForm" [associatedTrials]="associatedTrials" />
  `,
})
class TestWrapperComponent {
  formModel = signal<MunitionStockFormModel>({
    category: null,
    munitionTypeId: '',
    denominationId: '',
    batch: '',
    quantity: null,
    generalData: {
      clientId: '',
      entryDate: '',
      plannedFireTrialId: '',
      observations: '',
    },
    location: {
      munitionDumpId: '',
      cellName: '',
    },
    associatedComponents: [],
    multipleComponentsData: [],
  });

  componentForm = form(this.formModel);
  associatedTrials: { id: string; label: string }[] = [];
}

function makeClientsDataService() {
  return {
    clients: signal<any[]>([
      { id: 'client-1', name: 'Client Alpha' },
      { id: 'client-2', name: 'Client Beta' },
    ]),
  };
}

function makeTrialsDataService() {
  return {
    search: vi.fn(),
  };
}

async function setup(
  opts: {
    associatedTrials?: { id: string; label: string }[];
  } = {},
) {
  const user = userEvent.setup();
  const trialsService = makeTrialsDataService();
  const clientsService = makeClientsDataService();

  const view = await render(TestWrapperComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: ClientsDataService, useValue: clientsService },
      { provide: TrialsDataService, useValue: trialsService },
    ],
  });

  const fixture = view.fixture;
  if (opts.associatedTrials) {
    fixture.componentInstance.associatedTrials = opts.associatedTrials;
  }
  fixture.detectChanges();

  const componentDebug = fixture.debugElement.query(By.directive(MunitionGeneralDataComponent));
  const component = componentDebug.componentInstance as MunitionGeneralDataComponent;

  return { fixture, user, component, trialsService, clientsService, wrapper: fixture.componentInstance };
}

describe('MunitionGeneralDataComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should render the section title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_GENERAL_DATA')).toBeTruthy();
    });

    it('should render the entry date input placeholder', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_PLACEHOLDER')).toBeTruthy();
    });

    it('should render the observations input placeholder', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.OBSERVATIONS_PLACEHOLDER')).toBeTruthy();
    });

    it('should render client label and placeholder', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_LABEL')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_PLACEHOLDER')).toBeTruthy();
    });

    it('should render planned trial label and placeholder', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_LABEL')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_PLACEHOLDER')).toBeTruthy();
    });
  });

  describe('onClientChangeHandler()', () => {
    it('should call trialsDataService.search with clientId and PLANNED/UNDER_REVIEW statuses', async () => {
      const { component, trialsService } = await setup();
      component.onClientChangeHandler({ value: 'client-1' } as any);
      expect(trialsService.search).toHaveBeenCalledOnce();
      expect(trialsService.search).toHaveBeenCalledWith({
        clientId: 'client-1',
        status: [TrialStatus.PLANNED, TrialStatus.UNDER_REVIEW],
      });
    });
  });
});
