import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { createMockMatDialogRef } from '@intaqalab/utils/testing/dialog-test-helpers';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDeleteConfigurationDialog } from './confirm-delete-configuration-dialog';

const createMockDialogData = (overrides?: Partial<ConfirmDialogData>): ConfirmDialogData => ({
  title: 'Eliminar configuración',
  message: '¿Deseas eliminar la configuración 1 para la serie Serie 1?',
  description: 'Esta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  ...overrides,
});

describe('ConfirmDeleteConfigurationDialog', () => {
  let mockDialogRef: MatDialogRef<unknown>;
  let mockDialogData: ConfirmDialogData;

  beforeEach(() => {
    mockDialogRef = createMockMatDialogRef();
    mockDialogData = createMockDialogData();
    vi.clearAllMocks();
  });

  const renderDialog = async (customData?: Partial<ConfirmDialogData>) => {
    const data = customData ? createMockDialogData(customData) : mockDialogData;

    return render(ConfirmDeleteConfigurationDialog, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
  };

  describe('Initial Rendering', () => {
    it('should render dialog with title, message, and description', async () => {
      await renderDialog();

      expect(screen.getByRole('heading', { name: /eliminar configuración/i })).toBeInTheDocument();
      expect(screen.getByText('¿Deseas eliminar la configuración 1 para la serie Serie 1?')).toBeInTheDocument();
      expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
    });

    it('should not render description when not provided', async () => {
      await renderDialog({ description: undefined });

      expect(screen.queryByText('Esta acción no se puede deshacer.')).not.toBeInTheDocument();
      expect(screen.getByText('¿Deseas eliminar la configuración 1 para la serie Serie 1?')).toBeInTheDocument();
    });

    it('should display confirm and cancel buttons with custom texts', async () => {
      await renderDialog({ confirmText: 'Sí, eliminar', cancelText: 'No, volver' });

      expect(screen.getByRole('button', { name: /sí, eliminar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no, volver/i })).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('should close dialog with true when confirm button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with false when cancel button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
