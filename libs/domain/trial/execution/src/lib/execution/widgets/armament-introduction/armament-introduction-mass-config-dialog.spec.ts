import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import {
  ArmamentIntroductionMassConfigDialog,
  type ArmamentIntroductionMassConfigDialogData,
} from './armament-introduction-mass-config-dialog';

const mockData: ArmamentIntroductionMassConfigDialogData = {
  fireTrialId: 'trial-123',
  serieOptions: [
    { value: 'serie-1', label: 'Funcionamiento I' },
    { value: 'serie-2', label: 'Funcionamiento II' },
  ],
  armaOptions: [
    { value: '1', label: 'Arma 01' },
    { value: '2', label: 'Arma 02' },
  ],
  weaponItems: [
    {
      id: 21017,
      tag: 'ARM-17',
      serialNumber: 'SN-A-17',
      denominationId: 1,
      denominationName: 'Arma 01',
      modelName: 'A1',
    },
    {
      id: 21018,
      tag: 'ARM-18',
      serialNumber: 'SN-A-18',
      denominationId: 2,
      denominationName: 'Arma 02',
      modelName: 'A2',
    },
    {
      id: 21019,
      tag: 'ARM-19',
      serialNumber: 'SN-A-19',
      denominationId: 1,
      denominationName: 'Arma 01',
      modelName: 'A1',
    },
  ],
  tuboOptions: [
    { value: '21099', label: 'Tubo 01' },
    { value: '21100', label: 'Tubo 02' },
    { value: '21101', label: 'Tubo 01' },
  ],
  tubeItems: [
    {
      id: 21099,
      tag: 'TUB-99',
      serialNumber: 'SN-T-99',
      denominationId: 5,
      denominationName: 'Tubo 01',
      modelName: 'T1',
    },
    {
      id: 21100,
      tag: 'TUB-100',
      serialNumber: 'SN-T-100',
      denominationId: 6,
      denominationName: 'Tubo 02',
      modelName: 'T2',
    },
    {
      id: 21101,
      tag: 'TUB-101',
      serialNumber: 'SN-T-101',
      denominationId: 5,
      denominationName: 'Tubo 01',
      modelName: 'T1',
    },
  ],
  planningArmament: {
    series: [
      {
        seriesId: 'serie-1',
        seriesName: 'Funcionamiento I',
        shots: [{ shotId: 'shot-1', armament: { weaponExternalId: 1, tubeExternalId: 5 } }],
      },
      {
        seriesId: 'serie-2',
        seriesName: 'Funcionamiento II',
        shots: [{ shotId: 'shot-2', armament: { weaponExternalId: 2, tubeExternalId: 6 } }],
      },
    ],
  },
  current: {
    arma: null,
    tubo: null,
    observations: '',
  },
};

describe('ArmamentIntroductionMassConfigDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  const runSetup = async (
    data: ArmamentIntroductionMassConfigDialogData = mockData,
    routeParams: Record<string, string> = { fireTrialId: 'trial-123' },
  ) => {
    const user = userEvent.setup();
    closeMock = vi.fn();

    const view = await render(ArmamentIntroductionMassConfigDialog, {
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of(routeParams),
            queryParams: of({}),
            snapshot: { params: routeParams, queryParams: {} },
          },
        },
      ],
      imports: [TranslateModule.forRoot()],
    });

    loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getButtonByIndex = async (index: number) => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const button = buttons[index];
    if (!button) {
      throw new Error(`Button at index ${index} not found`);
    }
    return button;
  };

  const getSelectByIndex = async (index: number) => {
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const select = selects[index];
    if (!select) {
      throw new Error(`Select at index ${index} not found`);
    }
    return select;
  };

  it('renders the dialog title', async () => {
    await runSetup();
    expect(screen.getByRole('heading', { name: /MASS_CONFIG_TITLE/i })).toBeInTheDocument();
  });

  it('renders selectors for equipment and serial numbers', async () => {
    await runSetup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(selects.length).toBe(5);
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).not.toHaveAttribute('readonly');
  });

  it('disables tube selectors for series planned without tubes and submits a null tube', async () => {
    const data = structuredClone(mockData);
    data.planningArmament = JSON.parse(`{
      "series": [
        { "seriesId": "serie-1", "seriesName": "Funcionamiento I", "shots": [
          { "shotId": "shot-1", "armament": { "weaponExternalId": "1", "tubeExternalId": null } },
          { "shotId": "shot-2", "armament": { "weaponExternalId": "1", "tubeExternalId": null } }
        ] },
        { "seriesId": "serie-2", "seriesName": "Funcionamiento II", "shots": [
          { "shotId": "shot-3", "armament": { "weaponExternalId": "1", "tubeExternalId": "5" } }
        ] }
      ]
    }`);
    data.current = { arma: '21017', tubo: '21099', observations: '' };
    const { user, view } = await runSetup(data);
    const dialog = view.fixture.componentInstance;
    const series = await getSelectByIndex(0);
    await series.open();
    await user.click(screen.getByRole('option', { name: 'Funcionamiento I' }));
    await series.close();
    expect(dialog.formModel().tubo).toBeNull();
    expect(dialog.tubeOptions()).toEqual([]);
    expect(await (await getSelectByIndex(3)).isDisabled()).toBe(true);
    expect(await (await getSelectByIndex(4)).isDisabled()).toBe(true);
    expect(await (await getButtonByIndex(0)).isDisabled()).toBe(false);
    await dialog.apply();
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne((req) => req.url.endsWith('/armament/bulk-configuration'));
    expect(request.request.body).toEqual({
      assignedSeriesIds: ['serie-1'],
      weaponId: 21017,
      tubeId: null,
      observations: null,
    });
    request.flush({});
    TestBed.tick();
    view.fixture.detectChanges();
    await vi.waitFor(() =>
      expect(closeMock).toHaveBeenCalledWith({
        assignedSeriesIds: ['serie-1'],
        weaponId: 21017,
        tubeId: null,
        observations: '',
      }),
    );
  });

  it('enables tube selectors after changing from a series without a tube to one with a tube', async () => {
    const data = structuredClone(mockData);
    data.planningArmament = JSON.parse(`{
      "series": [
        { "seriesId": "serie-1", "seriesName": "Funcionamiento I", "shots": [
          { "shotId": "shot-1", "armament": { "weaponExternalId": 1, "tubeExternalId": null } }
        ] },
        { "seriesId": "serie-2", "seriesName": "Funcionamiento II", "shots": [
          { "shotId": "shot-2", "armament": { "weaponExternalId": 2, "tubeExternalId": 6 } }
        ] }
      ]
    }`);
    const { user } = await runSetup(data);
    const series = await getSelectByIndex(0);
    await series.open();
    await user.click(screen.getByRole('option', { name: 'Funcionamiento I' }));
    expect(screen.getByRole('option', { name: 'Funcionamiento II' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('option', { name: 'Funcionamiento I' }));
    await user.click(screen.getByRole('option', { name: 'Funcionamiento II' }));
    await series.close();
    expect(await (await getSelectByIndex(3)).isDisabled()).toBe(false);
    expect(await (await getSelectByIndex(4)).isDisabled()).toBe(false);
  });

  it('populates initial data when current state is provided', async () => {
    const prefilledData: ArmamentIntroductionMassConfigDialogData = {
      ...mockData,
      current: {
        arma: '21017',
        tubo: '21099',
        observations: 'Configuracion previa',
      },
    };

    const { view } = await runSetup(prefilledData);
    expect(view.fixture.componentInstance.selectedWeaponSerial()).toBe('');
    expect(view.fixture.componentInstance.selectedTubeSerial()).toBe('');
    expect(view.fixture.componentInstance.weaponOptions()).toEqual([]);
    expect(view.fixture.componentInstance.tubeOptions()).toEqual([]);
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).toHaveValue('Configuracion previa');
  });

  it('selects a weapon serial from the selected denomination', async () => {
    const { user, view } = await runSetup();
    const seriesSelect = await getSelectByIndex(0);
    await seriesSelect.open();
    await user.click(screen.getByText('Funcionamiento I'));

    const weaponSelect = await getSelectByIndex(1);
    await weaponSelect.open();
    await user.click(screen.getByText('Arma 01'));

    const serialSelect = await getSelectByIndex(2);
    await serialSelect.open();
    await user.click(screen.getByText('SN-A-19'));

    expect(await serialSelect.getValueText()).toBe('SN-A-19');
    expect(view.fixture.componentInstance.formModel().weaponItemId).toBe('21019');

    view.fixture.componentInstance.formModel.update((formValue) => ({ ...formValue, tubo: '21099' }));
    view.fixture.detectChanges();
    const tubeSerialSelect = await getSelectByIndex(4);
    await tubeSerialSelect.open();
    await user.click(screen.getByText('SN-T-101'));

    expect(await tubeSerialSelect.getValueText()).toBe('SN-T-101');
    expect(view.fixture.componentInstance.formModel().tubo).toBe('21101');
  });

  it('updates computed serial numbers when weapon and tube selections change', async () => {
    const { view } = await runSetup();

    view.fixture.componentInstance.formModel.update((prev) => ({
      ...prev,
      series: ['serie-2'],
      arma: '21018',
      weaponItemId: '21018',
      tubo: '21100',
    }));
    view.fixture.detectChanges();

    expect(view.fixture.componentInstance.selectedWeaponSerial()).toBe('SN-A-18');
    expect(view.fixture.componentInstance.selectedTubeSerial()).toBe('SN-T-100');
    const weaponSerialSelect = await getSelectByIndex(2);
    const tubeSerialSelect = await getSelectByIndex(4);
    expect(await weaponSerialSelect.getValueText()).toBe('SN-A-18');
    expect(await tubeSerialSelect.getValueText()).toBe('SN-T-100');
  });

  it('disables save button when form is invalid (missing series or weapon or tube)', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: null,
      weaponItemId: null,
      tubo: null,
      observations: '',
    });
    view.fixture.detectChanges();

    const applyBtn = await getButtonByIndex(0);
    expect(await applyBtn.isDisabled()).toBe(true);

    await applyBtn.click();
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('enables save button when at least one series, weapon and tube are selected (observations optional)', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: '21017',
      weaponItemId: '21017',
      tubo: '21099',
      observations: '',
    });
    view.fixture.detectChanges();

    const applyBtn = await getButtonByIndex(0);
    expect(await applyBtn.isDisabled()).toBe(false);
  });

  it('closes with action "cancel" when Cancel button is clicked', async () => {
    await runSetup();
    const cancelBtn = await getButtonByIndex(1);
    await cancelBtn.click();
    expect(closeMock).toHaveBeenCalledWith(undefined);
  });

  it('posts bulk armament configuration and closes when the request resolves', async () => {
    const data = structuredClone(mockData);
    const secondSeries = data.planningArmament?.series[1];
    if (!secondSeries) throw new Error('Second series not found');
    secondSeries.shots = [{ shotId: 'shot-2', armament: { weaponExternalId: 1, tubeExternalId: 5 } }];
    const { view } = await runSetup(data);
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1', 'serie-2'],
      arma: '21017',
      weaponItemId: '21019',
      tubo: '21099',
      observations: 'Sin incidencias.',
    });
    view.fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: /MASS_CONFIG_APPLY_BTN/i }));

    const httpMock = view.fixture.debugElement.injector.get(HttpTestingController);
    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/fire-trials/trial-123/execution/armament/bulk-configuration'),
    );
    expect(closeMock).not.toHaveBeenCalled();
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      assignedSeriesIds: ['serie-1', 'serie-2'],
      weaponId: 21019,
      tubeId: 21099,
      observations: 'Sin incidencias.',
    });
    request.flush({});
    TestBed.tick();
    view.fixture.detectChanges();
    await vi.waitFor(() => {
      expect(
        view.fixture.debugElement.injector.get(ExecutionService).applyArmamentBulkConfigurationResource.status(),
      ).toBe('resolved');
    });

    expect(closeMock).toHaveBeenCalledWith({
      assignedSeriesIds: ['serie-1', 'serie-2'],
      weaponId: 21019,
      tubeId: 21099,
      observations: 'Sin incidencias.',
    });
  });

  it('allows multi-select for series', async () => {
    await runSetup();
    const seriesSelect = await getSelectByIndex(0);
    expect(seriesSelect).toBeTruthy();
    expect(await seriesSelect.isMultiple()).toBe(true);
  });

  it('filters weapon and tube options by selected series', async () => {
    const { user, view } = await runSetup();
    const dialog = view.fixture.componentInstance;
    const seriesSelect = await getSelectByIndex(0);

    expect(dialog.weaponOptions()).toEqual([]);
    expect(dialog.tubeOptions()).toEqual([]);
    expect(dialog.weaponSerialOptions()).toEqual([]);
    expect(dialog.tubeSerialOptions()).toEqual([]);

    await seriesSelect.open();
    await user.click(screen.getByText('Funcionamiento I'));
    expect(dialog.weaponOptions()).toEqual([{ value: '1', label: 'Arma 01' }]);
    expect(dialog.tubeOptions().map((option) => option.value)).toEqual(['21099', '21101']);

    await seriesSelect.open();
    expect(screen.getByRole('option', { name: 'Funcionamiento II' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('option', { name: 'Funcionamiento I' }));
    expect(screen.getByRole('option', { name: 'Funcionamiento II' })).toHaveAttribute('aria-disabled', 'false');
    await user.click(screen.getByText('Funcionamiento II'));
    expect(dialog.weaponOptions()).toEqual([{ value: '2', label: 'Arma 02' }]);
    expect(dialog.tubeOptions().map((option) => option.value)).toEqual(['21100']);
  });

  it('disables series with heterogeneous shots or missing planned equipment', async () => {
    const data = structuredClone(mockData);
    const firstSeries = data.planningArmament?.series[0];
    const secondSeries = data.planningArmament?.series[1];
    if (!firstSeries || !secondSeries) throw new Error('Planning series not found');
    firstSeries.shots.push({ shotId: 'different', armament: { weaponExternalId: 1, tubeExternalId: 6 } });
    secondSeries.shots.push({ shotId: 'missing' });
    await runSetup(data);
    await (await getSelectByIndex(0)).open();
    expect(screen.getByRole('option', { name: 'Funcionamiento I' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Funcionamiento II' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('allows selecting multiple compatible series and keeps selected options enabled', async () => {
    const data = structuredClone(mockData);
    const secondSeries = data.planningArmament?.series[1];
    if (!secondSeries) throw new Error('Second series not found');
    secondSeries.shots = [{ shotId: 'shot-2', armament: { weaponExternalId: 1, tubeExternalId: 5 } }];
    const { user, view } = await runSetup(data);
    await (await getSelectByIndex(0)).open();
    await user.click(screen.getByText('Funcionamiento I'));
    expect(screen.getByRole('option', { name: 'Funcionamiento II' })).toHaveAttribute('aria-disabled', 'false');
    await user.click(screen.getByText('Funcionamiento II'));
    expect(view.fixture.componentInstance.formModel().series).toEqual(['serie-1', 'serie-2']);
    expect(screen.getByRole('option', { name: 'Funcionamiento I' })).toHaveAttribute('aria-disabled', 'false');
    await user.click(screen.getByText('Funcionamiento I'));
    expect(view.fixture.componentInstance.formModel().series).toEqual(['serie-2']);
  });

  it('rejects incompatible series even when form values are set programmatically', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1', 'serie-2'],
      arma: '1',
      weaponItemId: '21017',
      tubo: '21099',
      observations: '',
    });
    view.fixture.detectChanges();
    expect(await (await getButtonByIndex(0)).isDisabled()).toBe(true);
    await view.fixture.componentInstance.apply();
    TestBed.inject(HttpTestingController).expectNone((req) => req.url.endsWith('/armament/bulk-configuration'));
  });

  it('correctly resolves numeric IDs when weapon and tube values are string UUIDs', async () => {
    const customData: ArmamentIntroductionMassConfigDialogData = {
      ...mockData,
      weaponItems: [
        {
          id: 21017,
          tag: 'ARM-101',
          serialNumber: 'SN-01',
          denominationId: 1,
          denominationName: 'Arma 01',
          modelName: 'A1',
        },
      ],
      tubeItems: [
        {
          id: 21099,
          tag: 'TUB-201',
          serialNumber: 'SN-T1',
          denominationId: 5,
          denominationName: 'Tubo 01',
          modelName: 'T1',
        },
      ],
      armaOptions: [{ value: '1', label: 'Arma 01' }],
      tuboOptions: [{ value: '5', label: 'Tubo 01' }],
    };

    const { view } = await runSetup(customData);
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: '1',
      weaponItemId: '21017',
      tubo: '5',
      observations: '',
    });
    view.fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: /MASS_CONFIG_APPLY_BTN/i }));

    const httpMock = view.fixture.debugElement.injector.get(HttpTestingController);
    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/fire-trials/trial-123/execution/armament/bulk-configuration'),
    );
    expect(request.request.body).toEqual({
      assignedSeriesIds: ['serie-1'],
      weaponId: 21017,
      tubeId: 21099,
      observations: null,
    });
    request.flush({});
    TestBed.tick();
    view.fixture.detectChanges();

    await vi.waitFor(() => {
      expect(closeMock).toHaveBeenCalledWith({
        assignedSeriesIds: ['serie-1'],
        weaponId: 21017,
        tubeId: 21099,
        observations: '',
      });
    });
  });
}, 60000);
