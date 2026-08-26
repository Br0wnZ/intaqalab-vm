import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import {
  ArmamentIntroductionMassConfigDialog,
  type ArmamentIntroductionMassConfigDialogData,
} from './armament-introduction-mass-config-dialog';

const mockData: ArmamentIntroductionMassConfigDialogData = {
  serieOptions: [
    { value: 'serie-1', label: 'Funcionamiento I' },
    { value: 'serie-2', label: 'Funcionamiento II' },
  ],
  armaOptions: [
    { value: '21017', label: 'Arma 01' },
    { value: '21018', label: 'Arma 02' },
  ],
  weaponItems: [
    { id: 21017, tag: 'ARM-17', serialNumber: 'SN-A-17', denominationId: 1, denominationName: 'Arma 01', modelName: 'A1' },
    { id: 21018, tag: 'ARM-18', serialNumber: 'SN-A-18', denominationId: 2, denominationName: 'Arma 02', modelName: 'A2' },
  ],
  tuboOptions: [
    { value: '21099', label: 'Tubo 01' },
    { value: '21100', label: 'Tubo 02' },
  ],
  tubeItems: [
    { id: 21099, tag: 'TUB-99', serialNumber: 'SN-T-99', denominationId: 5, denominationName: 'Tubo 01', modelName: 'T1' },
    { id: 21100, tag: 'TUB-100', serialNumber: 'SN-T-100', denominationId: 6, denominationName: 'Tubo 02', modelName: 'T2' },
  ],
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

  it('renders all field selectors and readonly inputs', async () => {
    await runSetup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(selects.length).toBe(3);
    expect(screen.getByLabelText(/NÑ_SERIE_ARMA_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/NÑ_SERIE_TUBO_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).not.toHaveAttribute('readonly');
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
    expect(view.fixture.componentInstance.selectedWeaponSerial()).toBe('SN-A-17');
    expect(view.fixture.componentInstance.selectedTubeSerial()).toBe('SN-T-99');
    expect(screen.getByLabelText(/NÑ_SERIE_ARMA_LABEL/)).toHaveValue('SN-A-17');
    expect(screen.getByLabelText(/NÑ_SERIE_TUBO_LABEL/)).toHaveValue('SN-T-99');
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).toHaveValue('Configuracion previa');
  });

  it('updates computed serial numbers when weapon and tube selections change', async () => {
    const { view } = await runSetup();

    view.fixture.componentInstance.formModel.update((prev) => ({
      ...prev,
      arma: '21018',
      tubo: '21100',
    }));
    view.fixture.detectChanges();

    expect(view.fixture.componentInstance.selectedWeaponSerial()).toBe('SN-A-18');
    expect(view.fixture.componentInstance.selectedTubeSerial()).toBe('SN-T-100');
    expect(screen.getByLabelText(/NÑ_SERIE_ARMA_LABEL/)).toHaveValue('SN-A-18');
    expect(screen.getByLabelText(/NÑ_SERIE_TUBO_LABEL/)).toHaveValue('SN-T-100');
  });

  it('disables save button when form is invalid (missing series or weapon or tube)', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: null,
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

  it('calls executionService.bulkConfigureArmament and closes with full configuration when Apply is clicked', async () => {
    const { view } = await runSetup();
    const executionService = view.fixture.debugElement.injector.get(ExecutionService);
    const bulkSpy = vi.spyOn(executionService, 'bulkConfigureArmament').mockResolvedValue(undefined);

    view.fixture.componentInstance.formModel.set({
      series: ['serie-1', 'serie-2'],
      arma: '21017',
      tubo: '21099',
      observations: 'Sin incidencias.',
    });
    view.fixture.detectChanges();

    const applyBtn = await getButtonByIndex(0);
    expect(await applyBtn.isDisabled()).toBe(false);
    await applyBtn.click();

    await vi.waitFor(() => {
      expect(bulkSpy).toHaveBeenCalledWith('trial-123', {
        assignedSeriesIds: ['serie-1', 'serie-2'],
        weaponId: 21017,
        tubeId: 21099,
        observations: 'Sin incidencias.',
      });

      expect(closeMock).toHaveBeenCalledWith({
        assignedSeriesIds: ['serie-1', 'serie-2'],
        weaponId: 21017,
        tubeId: 21099,
        observations: 'Sin incidencias.',
      });
    });
  });

  it('allows multi-select for series', async () => {
    await runSetup();
    const seriesSelect = await getSelectByIndex(0);
    expect(seriesSelect).toBeTruthy();
    expect(await seriesSelect.isMultiple()).toBe(true);
  });
}, 60000);

