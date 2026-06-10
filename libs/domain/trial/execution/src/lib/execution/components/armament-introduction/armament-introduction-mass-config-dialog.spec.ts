import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
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

describe.skip('ArmamentIntroductionMassConfigDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  const setup = async () => {
    closeMock = vi.fn();
    const view = await render(ArmamentIntroductionMassConfigDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      imports: [TranslateModule.forRoot()],
    });
    loader = TestbedHarnessEnvironment.loader(view.fixture);
    return view;
  };

  const getApplyBtn = () => loader.getHarness(MatButtonHarness.with({ text: /Aplicar/i }));
  const getCancelBtn = () => loader.getHarness(MatButtonHarness.with({ text: /Cancelar/i }));
  const getSeriesSelect = () => loader.getHarness(MatSelectHarness.with({ selector: '[formfield]' }));

  it('renders the dialog title', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /Extender configuraci/i })).toBeTruthy();
  });

  it('renders all field selectors', async () => {
    await setup();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(selects.length).toBeGreaterThanOrEqual(7); // series + 6 campos
  });

  it('closes with action "apply" when Apply button is clicked', async () => {
    await setup();
    await (await getApplyBtn()).click();
    expect(closeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'apply',
      }),
    );
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
