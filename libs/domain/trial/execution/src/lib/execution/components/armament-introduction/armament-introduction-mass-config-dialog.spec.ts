import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    { value: 'arma-01', label: 'Arma 01' },
    { value: 'arma-02', label: 'Arma 02' },
  ],
  serieArmaOptions: [
    { value: 'serie-arma-01', label: 'Serie Arma 01' },
    { value: 'serie-arma-02', label: 'Serie Arma 02' },
  ],
  tuboOptions: [
    { value: 'tubo-01', label: 'Tubo 01' },
    { value: 'tubo-02', label: 'Tubo 02' },
  ],
  serieTuboOptions: [
    { value: 'serie-tubo-01', label: 'Serie Tubo 01' },
    { value: 'serie-tubo-02', label: 'Serie Tubo 02' },
  ],
  equipoAtacadoOptions: [
    { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
    { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
  ],
  equipoRetrocesoOptions: [
    { value: 'eq-retro-01', label: 'Equipo Retroceso 01' },
    { value: 'eq-retro-02', label: 'Equipo Retroceso 02' },
  ],
  current: {
    arma: null,
    serieArma: null,
    tubo: null,
    serieTubo: null,
    equipoAtacado: null,
    equipoRetroceso: null,
  },
};

describe('ArmamentIntroductionMassConfigDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  const runSetup = async (data: ArmamentIntroductionMassConfigDialogData = mockData) => {
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

  it('renders all field selectors', async () => {
    await runSetup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(selects.length).toBe(5); // series + 4 fields (arma, serieArma, tubo, serieTubo)
  });

  it('closes with action "apply" and form data when Apply button is clicked', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: null,
      serieArma: null,
      tubo: null,
      serieTubo: null,
    });
    view.fixture.detectChanges();

    // Click Apply
    const applyBtn = await getButtonByIndex(0);
    await applyBtn.click();

    expect(closeMock).toHaveBeenCalledWith({
      action: 'apply',
      series: ['serie-1'],
      arma: null,
      serieArma: null,
      tubo: null,
      serieTubo: null,
    });
  });

  it('closes with action "cancel" when Cancel button is clicked', async () => {
    await runSetup();
    const cancelBtn = await getButtonByIndex(1);
    await cancelBtn.click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('allows selecting other fields and closing with full configuration', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.formModel.set({
      series: ['serie-1'],
      arma: 'arma-01',
      serieArma: 'serie-arma-01',
      tubo: 'tubo-01',
      serieTubo: 'serie-tubo-01',
    });
    view.fixture.detectChanges();

    // Click Apply
    const applyBtn = await getButtonByIndex(0);
    await applyBtn.click();

    expect(closeMock).toHaveBeenCalledWith({
      action: 'apply',
      series: ['serie-1'],
      arma: 'arma-01',
      serieArma: 'serie-arma-01',
      tubo: 'tubo-01',
      serieTubo: 'serie-tubo-01',
    });
  });

  it('allows multi-select for series', async () => {
    await runSetup();
    const seriesSelect = await getSelectByIndex(0);
    expect(seriesSelect).toBeTruthy();
    expect(await seriesSelect.isMultiple()).toBe(true);
  });
}, 60000);
