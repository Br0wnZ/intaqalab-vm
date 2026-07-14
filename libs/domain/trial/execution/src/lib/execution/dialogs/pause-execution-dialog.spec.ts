import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../+state/execution.store';
import { PauseExecutionDialog, type PauseExecutionDialogData } from './pause-execution-dialog';

const mockData: PauseExecutionDialogData = { trialName: 'Prueba Alpha', trialId: 'trial-1' };

describe('PauseExecutionDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let pauseExecutionMock: ReturnType<typeof vi.fn>;
  let pauseStatus: ReturnType<typeof signal<string>>;

  const setup = async () => {
    closeMock = vi.fn();
    pauseExecutionMock = vi.fn();
    pauseStatus = signal<string>('idle');

    const mockStore = {
      pauseExecutionStatus: pauseStatus,
      pauseExecution: pauseExecutionMock,
    };

    const view = await render(PauseExecutionDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      // Reemplaza el `providers: [ExecutionStore]` declarado en el componente
      componentProviders: [{ provide: ExecutionStore, useValue: mockStore }],
      imports: [TranslateModule.forRoot()],
    });
    return view;
  };

  const getPauseBtn = () => screen.getByRole('button', { name: 'Pausar prueba' });
  const getCancelBtn = () => screen.getByRole('button', { name: 'Cancelar pausa' });

  it('renders the dialog title with pause icon', async () => {
    await setup();
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE');
    expect(heading.querySelector('mat-icon')).toBeTruthy();
  });

  it('shows the trial name inside the dialog content', async () => {
    await setup();
    expect(screen.getByText(/Prueba Alpha/i)).toBeInTheDocument();
  });

  it('renders two action buttons', async () => {
    await setup();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('delegates to the store when "Pausar prueba" is clicked, without closing yet', async () => {
    await setup();
    getPauseBtn().click();
    expect(pauseExecutionMock).toHaveBeenCalledWith('trial-1');
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('closes with { action: "pause" } when the store reports the pause as resolved', async () => {
    const { fixture } = await setup();
    pauseStatus.set('resolved');
    await fixture.whenStable();
    expect(closeMock).toHaveBeenCalledWith({ action: 'pause' });
  });

  it('closes with { action: "back" } when "Cancelar" button is clicked', async () => {
    await setup();
    getCancelBtn().click();
    expect(closeMock).toHaveBeenCalledWith({ action: 'back' });
  });
});
