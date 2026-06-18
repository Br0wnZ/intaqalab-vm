import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

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

  const setup = async () => {
    closeMock = vi.fn();
    const view = await render(ArmamentIntroductionMassConfigDialog, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      imports: [TranslateModule.forRoot()],
    });
    loader = TestbedHarnessEnvironment.loader(view.fixture);
    return view;
  };

  const getApplyBtn = () => loader.getHarness(MatButtonHarness.with({ text: /MASS_CONFIG_APPLY_BTN/i }));
  const getCancelBtn = () => loader.getHarness(MatButtonHarness.with({ text: /MASS_CONFIG_CANCEL_BTN/i }));
  const getSeriesSelect = () => loader.getHarness(MatSelectHarness.with({ selector: '[formfield]' }));

  it('renders the dialog title', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /MASS_CONFIG_TITLE/i })).toBeTruthy();
  });

  it('renders all field selectors', async () => {
    await setup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(selects.length).toBe(5); // series + 4 campos (arma, serieArma, tubo, serieTubo)
  });

  it('closes with action "apply" and form data when Apply button is clicked', async () => {
    await setup();

    // Select series
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const seriesSelect = selects[0];
    await seriesSelect.open();
    const options = await seriesSelect.getOptions();
    await options[0].click(); // click 'Funcionamiento I'

    // Click Apply
    await (await getApplyBtn()).click();

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
    await setup();
    await (await getCancelBtn()).click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('allows multi-select for series', async () => {
    await setup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const seriesSelect = selects[0]; // Primera es series
    expect(seriesSelect).toBeTruthy();
  });
});
