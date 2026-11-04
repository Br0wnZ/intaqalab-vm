import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PauseExecutionDialog, type PauseExecutionDialogData } from './pause-execution-dialog';

const mockData: PauseExecutionDialogData = { trialName: 'Prueba Alpha' };

describe('PauseExecutionDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const setup = async () => {
    closeMock = vi.fn();

    const view = await render(PauseExecutionDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      imports: [TranslateModule.forRoot()],
    });
    return view;
  };

  const getPauseBtn = () =>
    screen.getByRole('button', { name: /TRIAL_EXECUTION\.DIALOGS\.PAUSE_EXECUTION\.CONFIRM|Pausar prueba/i });
  const getCancelBtn = () =>
    screen.getByRole('button', { name: /TRIAL_EXECUTION\.DIALOGS\.PAUSE_EXECUTION\.CANCEL|Cancelar pausa/i });

  it('renders the dialog title with pause icon', async () => {
    await setup();
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE');
  });

  it('shows the trial name inside the dialog content', async () => {
    await setup();
    expect(screen.getByText(/Prueba Alpha/i)).toBeInTheDocument();
  });

  it('renders two action buttons', async () => {
    await setup();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('closes with { action: "pause" } when the confirm button is clicked', async () => {
    await setup();
    await userEvent.setup().click(getPauseBtn());
    expect(closeMock).toHaveBeenCalledWith({ action: 'pause' });
  });

  it('closes with { action: "back" } when "Cancelar" button is clicked', async () => {
    await setup();
    await userEvent.setup().click(getCancelBtn());
    expect(closeMock).toHaveBeenCalledWith({ action: 'back' });
  });
});
