import type { ResourceStatus } from '@angular/core';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { createMockMatDialogRef } from '@intaqalab/utils/testing/dialog-test-helpers';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import { ConfirmDeleteSerieDialog } from './confirm-delete-serie-dialog';

type DialogData = ConfirmDialogData & { serieId: string };

const createMockDialogData = (overrides?: Partial<DialogData>): DialogData => ({
  title: 'Eliminar Serie',
  message: '¿Está seguro de que desea eliminar esta serie?',
  description: 'Esta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  serieId: 'serie-123',
  ...overrides,
});

const createMockStore = () => {
  const deleteSerieStatusSignal = signal<ResourceStatus>('idle');
  const isDeletingSerieSignal = signal(false);

  return {
    deleteSerie: vi.fn(),
    deleteSerieStatus: deleteSerieStatusSignal,
    isDeletingSerie: isDeletingSerieSignal,
    _simulateDeleteStatus: (status: ResourceStatus) => {
      deleteSerieStatusSignal.set(status);
      isDeletingSerieSignal.set(status === 'loading');
    },
  };
};

describe('ConfirmDeleteSerieDialog', () => {
  let mockDialogRef: MatDialogRef<unknown>;
  let mockStore: ReturnType<typeof createMockStore>;
  let mockDialogData: DialogData;

  beforeEach(() => {
    mockDialogRef = createMockMatDialogRef();
    mockStore = createMockStore();
    mockDialogData = createMockDialogData();

    vi.clearAllMocks();
  });

  const renderDialog = async (
    customData?: Partial<DialogData>,
    customStore?: Partial<ReturnType<typeof createMockStore>>,
  ) => {
    const data = customData ? createMockDialogData(customData) : mockDialogData;
    const store = customStore ? { ...mockStore, ...customStore } : mockStore;

    return render(ConfirmDeleteSerieDialog, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      componentProviders: [{ provide: SeriesAndShotsStore, useValue: store }],
    });
  };

  describe('Initial Rendering', () => {
    it('should render dialog with title', async () => {
      await renderDialog();

      const title = screen.getByRole('heading', { name: /eliminar serie/i });
      expect(title).toBeInTheDocument();
    });

    it('should render custom title from data', async () => {
      await renderDialog({ title: 'Confirmar Eliminación Permanente' });

      expect(screen.getByRole('heading', { name: /confirmar eliminación permanente/i })).toBeInTheDocument();
    });

    it('should render delete icon in title', async () => {
      await renderDialog();

      const title = screen.getByRole('heading');
      const icon = within(title).getByText('delete_forever');
      expect(icon).toBeInTheDocument();
    });

    it('should render message content', async () => {
      await renderDialog({
        message: '¿Desea eliminar la serie XYZ-001?',
      });

      expect(screen.getByText(/¿desea eliminar la serie xyz-001?/i)).toBeInTheDocument();
    });

    it('should render description when provided', async () => {
      await renderDialog({
        description: 'Esta serie contiene 5 fotos asociadas.',
      });

      expect(screen.getByText(/esta serie contiene 5 fotos asociadas/i)).toBeInTheDocument();
    });

    it('should not render description section when not provided', async () => {
      await renderDialog({ description: undefined });

      const paragraphs = screen.getAllByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p';
      });

      expect(paragraphs).toHaveLength(1);
    });

    it('should render HTML content in message safely', async () => {
      await renderDialog({
        message: 'Serie: <strong>ABC-123</strong>',
      });

      const strong = screen.getByText('ABC-123');
      expect(strong).toBeInTheDocument();
      expect(strong.tagName).toBe('STRONG');
    });
  });

  describe('Action Buttons', () => {
    it('should render confirm button with default text', async () => {
      await renderDialog({ confirmText: undefined });

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      expect(confirmButton).toBeInTheDocument();
    });

    it('should render confirm button with custom text', async () => {
      await renderDialog({ confirmText: 'Eliminar Permanentemente' });

      const confirmButton = screen.getByRole('button', {
        name: /eliminar permanentemente/i,
      });
      expect(confirmButton).toBeInTheDocument();
    });

    it('should render cancel button with default text', async () => {
      await renderDialog({ cancelText: undefined });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should render cancel button with custom text', async () => {
      await renderDialog({ cancelText: 'No, mantener' });

      const cancelButton = screen.getByRole('button', { name: /no, mantener/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have confirm button with initial focus', async () => {
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      expect(confirmButton).toHaveAttribute('cdkFocusInitial');
    });

    it('should disable buttons when deletion is in progress', async () => {
      await renderDialog();

      mockStore._simulateDeleteStatus('loading');

      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: /eliminar/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
      });
    });

    it('should render buttons in correct order', async () => {
      await renderDialog();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent(/eliminar/i);
      expect(buttons[1]).toHaveTextContent(/cancelar/i);
    });
  });

  describe('User Interactions', () => {
    it('should call service and close dialog when confirm button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog({ serieId: 'serie-456' });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteSerie).toHaveBeenCalledExactlyOnceWith('serie-456');
    });

    it('should close dialog with false when cancel button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockStore.deleteSerie).not.toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('should handle multiple clicks on confirm button gracefully', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });

      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(mockStore.deleteSerie).toHaveBeenCalledTimes(3);
    });

    it('should pass correct serieId to service on deletion', async () => {
      const user = userEvent.setup();
      const customSerieId = 'custom-serie-789';

      await renderDialog({ serieId: customSerieId });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteSerie).toHaveBeenCalledWith(customSerieId);
    });
  });

  describe('Effect Behavior', () => {
    it('should close dialog when delete status changes to resolved', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._simulateDeleteStatus('resolved');

      await vi.waitFor(() => {
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      });
    });

    it('should not close dialog when delete status is loading', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._simulateDeleteStatus('loading');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when delete status is idle', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._simulateDeleteStatus('idle');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when delete status is error', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._simulateDeleteStatus('error');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', async () => {
      await renderDialog();

      expect(screen.getByRole('heading')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have semantic HTML for content', async () => {
      const { container } = await renderDialog();

      const dialogContent = container.querySelector('mat-dialog-content');
      expect(dialogContent).toBeInTheDocument();

      const dialogActions = container.querySelector('mat-dialog-actions');
      expect(dialogActions).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      await renderDialog();

      await user.tab();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      expect(confirmButton).toHaveFocus();

      await user.tab();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelButton).toHaveFocus();
    });

    it('should allow confirming with Enter key', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      confirmButton.focus();

      await user.keyboard('{Enter}');

      expect(mockStore.deleteSerie).toHaveBeenCalledOnce();
    });

    it('should allow canceling with Enter key when cancel is focused', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      cancelButton.focus();

      await user.keyboard('{Enter}');

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional data fields gracefully', async () => {
      await renderDialog({
        description: undefined,
        confirmText: undefined,
        cancelText: undefined,
      });

      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should handle empty strings in data', async () => {
      await renderDialog({
        description: '',
        message: 'Mensaje principal',
      });

      expect(screen.getByText(/mensaje principal/i)).toBeInTheDocument();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(500);

      await renderDialog({ message: longMessage });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in serieId', async () => {
      const user = userEvent.setup();
      const specialSerieId = 'serie-!@#$%^&*()_+-=[]{}|;:,.<>?';

      await renderDialog({ serieId: specialSerieId });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteSerie).toHaveBeenCalledWith(specialSerieId);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete deletion workflow', async () => {
      const user = userEvent.setup();
      await renderDialog({ serieId: 'serie-complete-flow' });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteSerie).toHaveBeenCalledWith('serie-complete-flow');

      mockStore._simulateDeleteStatus('resolved');
    });

    it('should handle user canceling before deletion completes', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockStore.deleteSerie).not.toHaveBeenCalled();

      expect(mockDialogRef.close).toHaveBeenCalledExactlyOnceWith(false);
    });
  });
});
