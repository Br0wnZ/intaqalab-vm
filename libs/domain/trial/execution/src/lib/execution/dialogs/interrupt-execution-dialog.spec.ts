import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { InterruptExecutionDialog, type InterruptExecutionDialogData } from './interrupt-execution-dialog';

const mockData: InterruptExecutionDialogData = { trialName: 'Prueba Alpha' };

describe('InterruptExecutionDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let loader: HarnessLoader;

  const setup = async () => {
    closeMock = vi.fn();
    const view = await render(InterruptExecutionDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(view.fixture);
    return view;
  };

  const getInterruptBtn = () => loader.getHarness(MatButtonHarness.with({ text: /^Interrumpir prueba$/ }));
  const getCountDownBtn = () => loader.getHarness(MatButtonHarness.with({ text: /^Iniciar cuenta de seguridad$/ }));
  const getVolverBtn = () => loader.getHarness(MatButtonHarness.with({ text: /^Volver$/ }));
  const getReasonInput = () => loader.getHarness(MatInputHarness);

  it('renders the dialog title', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /Interrumpir prueba de fuego/i })).toBeInTheDocument();
  });

  it('shows the trial name inside the dialog content', async () => {
    await setup();
    expect(screen.getByText(/Prueba Alpha/i)).toBeInTheDocument();
  });

  it('"Interrumpir prueba" button is disabled while reason is empty', async () => {
    await setup();
    expect(await (await getInterruptBtn()).isDisabled()).toBe(true);
  });

  it('"Iniciar cuenta de seguridad" button is disabled while reason is empty', async () => {
    await setup();
    expect(await (await getCountDownBtn()).isDisabled()).toBe(true);
  });

  it('action buttons become enabled after the reason field is filled', async () => {
    await setup();
    await (await getReasonInput()).setValue('Fallo en sensor');
    expect(await (await getInterruptBtn()).isDisabled()).toBe(false);
    expect(await (await getCountDownBtn()).isDisabled()).toBe(false);
  });

  it('closes with { action: "interrupt" } when "Interrumpir prueba" is clicked with a valid reason', async () => {
    await setup();
    await (await getReasonInput()).setValue('Fallo en sensor');
    await (await getInterruptBtn()).click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'interrupt', reason: 'Fallo en sensor' });
  });

  it('closes with { action: "startCountDown" } when "Iniciar cuenta de seguridad" is clicked with a valid reason', async () => {
    await setup();
    await (await getReasonInput()).setValue('Activar cuenta regresiva');
    await (await getCountDownBtn()).click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'startCountDown', reason: 'Activar cuenta regresiva' });
  });

  it('closes with { action: "back" } when "Volver" is clicked', async () => {
    await setup();
    await (await getVolverBtn()).click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'back' });
  });

  it('does not close the dialog when clicking "Interrumpir prueba" while disabled', async () => {
    await setup();
    const btn = await getInterruptBtn();
    expect(await btn.isDisabled()).toBe(true);
    expect(closeMock).not.toHaveBeenCalled();
  });
});
