/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MunitionGeneralDataComponent } from './general-data.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeClientsDataService() {
  return {
    clients: signal<any[]>([
      { id: 'client-1', name: 'Client Alpha' },
      { id: 'client-2', name: 'Client Beta' },
    ]),
  };
}

function makeTrialsDataService(sourceValue: any = undefined) {
  return {
    source: createMockResource(sourceValue),
    search: vi.fn(),
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function setup(opts: { trialsSource?: any } = {}) {
  const user = userEvent.setup();
  const trialsService = makeTrialsDataService(opts.trialsSource);
  const clientsService = makeClientsDataService();

  const view = await render(MunitionGeneralDataComponent, {
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
  fixture.detectChanges();
  const component = fixture.componentInstance;
  return { fixture, user, component, trialsService, clientsService };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('MunitionGeneralDataComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // â”€â”€ Initialization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('Initialization', () => {
    it('should render the section title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_GENERAL_DATA')).toBeTruthy();
    });

    it('should render the entry date input', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_PLACEHOLDER')).toBeTruthy();
    });

    it('should render the observations input', async () => {
      await setup();
      expect(screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.OBSERVATIONS_PLACEHOLDER')).toBeTruthy();
    });

    it('should have touched signal set to false initially', async () => {
      const { component } = await setup();
      expect(component.touched()).toBe(false);
    });
  });

  // â”€â”€ errors() computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('errors() computed', () => {
    it('should return true when the form is empty (required fields missing)', async () => {
      const { component } = await setup();
      expect(component.errors()).toBe(true);
    });

    it('should return false when all required fields are filled via setControlValue', async () => {
      const { component, fixture } = await setup();
      component.form.client().setControlValue('client-1');
      component.form.entryDate().setControlValue('2025-01-01');
      component.form.plannedFireTrialId().setControlValue('trial-1');
      fixture.detectChanges();
      expect(component.errors()).toBe(false);
    });

    it('should return false when all required fields are filled via formModel', async () => {
      const { component, fixture } = await setup();
      component.formModel.set({
        client: 'client-1',
        entryDate: '2025-01-01',
        observations: '',
        plannedFireTrialId: 'trial-1',
      });
      fixture.detectChanges();
      expect(component.errors()).toBe(false);
    });
  });

  // â”€â”€ value() computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('value() computed', () => {
    it('should return false when the form has errors', async () => {
      const { component } = await setup();
      expect(component.value()).toBe(false);
    });

    it('should return the full form value when there are no errors', async () => {
      const { component, fixture } = await setup();
      const expected = {
        client: 'client-1',
        entryDate: '2025-01-01',
        observations: 'some notes',
        plannedFireTrialId: 'trial-1',
      };
      component.formModel.set(expected);
      fixture.detectChanges();
      expect(component.value()).toEqual(expected);
    });
  });

  // â”€â”€ markAsTouched() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('markAsTouched()', () => {
    it('should set touched signal to true', async () => {
      const { component } = await setup();
      expect(component.touched()).toBe(false);
      component.markAsTouched();
      expect(component.touched()).toBe(true);
    });

    it('should show required validation errors in the template when touched and form is empty', async () => {
      const { component, fixture } = await setup();
      component.markAsTouched();
      fixture.detectChanges();
      expect(screen.getAllByText('COMMONS.REQUIRED_FIELD').length).toBeGreaterThan(0);
    });
  });

  // â”€â”€ reset() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('reset()', () => {
    it('should clear all form fields back to empty strings', async () => {
      const { component, fixture } = await setup();
      component.formModel.set({
        client: 'client-1',
        entryDate: '2025-01-01',
        observations: 'some notes',
        plannedFireTrialId: 'trial-1',
      });
      fixture.detectChanges();

      component.reset();
      fixture.detectChanges();

      expect(component.formModel()).toEqual({
        client: '',
        entryDate: '',
        observations: '',
        plannedFireTrialId: '',
      });
    });

    it('should have errors after reset because required fields become empty', async () => {
      const { component, fixture } = await setup();
      component.formModel.set({
        client: 'c',
        entryDate: '2025-01-01',
        observations: '',
        plannedFireTrialId: 'p',
      });
      fixture.detectChanges();
      expect(component.errors()).toBe(false);

      component.reset();
      fixture.detectChanges();
      expect(component.errors()).toBe(true);
    });
  });

  // â”€â”€ optionsTrialCombo() computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('optionsTrialCombo()', () => {
    it('should return empty array when trials source value is undefined', async () => {
      const { component } = await setup();
      expect(component.optionsTrialCombo()).toEqual([]);
    });

    it('should return mapped label/id options when trials source has items', async () => {
      const { component } = await setup({
        trialsSource: {
          items: [
            { id: 'trial-1', trialNumber: '0001/25', description: 'Trial Alpha' },
            { id: 'trial-2', trialNumber: '0002/25', description: '' },
          ],
        },
      });
      const options = component.optionsTrialCombo();
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ id: 'trial-1', label: '0001/25 - Trial Alpha' });
      expect(options[1]).toEqual({ id: 'trial-2', label: '0002/25 - ' });
    });
  });

  // â”€â”€ onClientChangeHandler() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    it('should call trialsDataService.search again when a different client is selected', async () => {
      const { component, trialsService } = await setup();
      component.onClientChangeHandler({ value: 'client-1' } as any);
      component.onClientChangeHandler({ value: 'client-2' } as any);
      expect(trialsService.search).toHaveBeenCalledTimes(2);
      expect(trialsService.search).toHaveBeenLastCalledWith({
        clientId: 'client-2',
        status: [TrialStatus.PLANNED, TrialStatus.UNDER_REVIEW],
      });
    });
  });
});
