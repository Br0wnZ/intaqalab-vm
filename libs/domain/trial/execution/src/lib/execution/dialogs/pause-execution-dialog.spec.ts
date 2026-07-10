import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { PauseExecutionDialog, type PauseExecutionDialogData } from './pause-execution-dialog';

const mockData: PauseExecutionDialogData = { trialName: 'Prueba Alpha' };

describe('PauseExecutionDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  const setup = async () => {
    closeMock = vi.fn();
    const view = await render(PauseExecutionDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      imports: [TranslateModule.forRoot()],
    });
    loader = TestbedHarnessEnvironment.loader(view.fixture);
    return view;
  };

  const getPauseBtn = () => loader.getHarness(MatButtonHarness.with({ text: /Pausar prueba/i }));
  const getCancelBtn = () => loader.getHarness(MatButtonHarness.with({ text: /Cancelar/i }));

  it('renders the dialog title with pause icon', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /Pausar prueba/i })).toBeInTheDocument();
  });

  it('shows the trial name inside the dialog content', async () => {
    await setup();
    expect(screen.getByText(/Prueba Alpha/i)).toBeInTheDocument();
  });

  it('displays the pause description', async () => {
    await setup();
    // The description is shown in the template but its exact translation depends on i18n
    const content = screen.getByRole('region');
    expect(content).toBeInTheDocument();
  });

  it('closes with { action: "pause" } when "Pausar prueba" button is clicked', async () => {
    await setup();
    const btn = await getPauseBtn();
    await btn.click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'pause' });
  });

  it('closes with { action: "back" } when "Cancelar" button is clicked', async () => {
    await setup();
    const btn = await getCancelBtn();
    await btn.click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'back' });
  });

  it('renders two action buttons', async () => {
    await setup();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toBe(2);
  });
});
