import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { createMockSeriesAndShotsStore } from '@intaqalab/utils';
import { createMockMatDialogRef } from '@intaqalab/utils/testing/dialog-test-helpers';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import { ConfirmDeleteShotDialog } from './confirm-delete-shot-dialog';

type DialogData = ConfirmDialogData & { shotId: string };

const createMockDialogData = (overrides?: Partial<DialogData>): DialogData => ({
  title: 'Eliminar disparo',
  message: '¿Está seguro de que desea eliminar este disparo?',
  description: 'Esta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  shotId: 'disparo-123',
  ...overrides,
});

describe('ConfirmDeleteShotDialog', () => {
  let mockDialogRef: MatDialogRef<unknown>;
  let mockStore: ReturnType<typeof createMockSeriesAndShotsStore>;
  let mockDialogData: DialogData;

  beforeEach(async () => {
    mockDialogRef = createMockMatDialogRef();
    mockStore = createMockSeriesAndShotsStore();
    mockDialogData = createMockDialogData();

    vi.clearAllMocks();
  });

  const renderDialog = async (
    customData?: Partial<DialogData>,
    customStore?: Partial<ReturnType<typeof createMockSeriesAndShotsStore>>,
  ) => {
    const data = customData ? createMockDialogData(customData) : mockDialogData;
    const store = customStore ? { ...mockStore, ...customStore } : mockStore;

    return render(ConfirmDeleteShotDialog, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: SeriesAndShotsStore, useValue: store },
      ],
      componentProviders: [{ provide: SeriesAndShotsStore, useValue: store }],
    });
  };

  describe('Initial Rendering', () => {
    it('should render dialog with title', async () => {
      await renderDialog();

      const title = screen.getByRole('heading', { name: /eliminar disparo/i });
      expect(title).toBeInTheDocument();
    });

    it('should render custom title from data', async () => {
      await renderDialog({ title: 'Confirmar Eliminación Permanente' });

      expect(screen.getByRole('heading', { name: /confirmar eliminación permanente/i })).toBeInTheDocument();
    });

    it('should render delete icon in title', async () => {
      await renderDialog();
      const title = screen.getByRole('heading');
      // Query for the custom icon component by selector
      const icon = title.querySelector('ui-inta-icon');
      expect(icon).toBeTruthy();
    });

    it('should render message content', async () => {
      await renderDialog({
        message: '¿Desea eliminar el disparo XYZ-001?',
      });

      expect(screen.getByText(/¿desea eliminar el disparo xyz-001?/i)).toBeInTheDocument();
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
    it('should render confirm and cancel buttons enabled by default', async () => {
      await renderDialog();
      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(confirmButton).toBeEnabled();
      expect(cancelButton).toBeEnabled();
    });

    it('should disable buttons when deletion is in progress', async () => {
      await renderDialog();
      mockStore._deleteShotResource._setStatus('loading');
      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: /eliminar/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call service and close dialog when confirm button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog({ shotId: 'shot-456' });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteShot).toHaveBeenCalledOnce();
      expect(mockStore.deleteShot).toHaveBeenCalledWith('shot-456');
    });

    it('should close dialog with false when cancel button is clicked', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockStore.deleteShot).not.toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledOnce();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should handle multiple clicks on confirm button gracefully', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });

      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(mockStore.deleteShot).toHaveBeenCalledTimes(3);
    });

    it('should pass correct shotId to service on deletion', async () => {
      const user = userEvent.setup();
      const customShotId = 'custom-shot-789';

      await renderDialog({ shotId: customShotId });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteShot).toHaveBeenCalledWith(customShotId);
    });
  });

  describe('Effect Behavior', () => {
    it('should close dialog when delete status changes to resolved', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._deleteShotResource._setStatus('resolved');

      await vi.waitFor(() => {
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      });
    });

    it('should not close dialog when delete status is loading', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._deleteShotResource._setStatus('loading');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when delete status is idle', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._deleteShotResource._setStatus('idle');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when delete status is error', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      mockStore._deleteShotResource._setStatus('error');

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

      expect(mockStore.deleteShot).toHaveBeenCalledOnce();
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
      const specialShotId = 'serie-!@#$%^&*()_+-=[]{}|;:,.<>?';

      await renderDialog({ shotId: specialShotId });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteShot).toHaveBeenCalledWith(specialShotId);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete deletion workflow', async () => {
      const user = userEvent.setup();
      await renderDialog({ shotId: 'shot-complete-flow' });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      expect(mockStore.deleteShot).toHaveBeenCalledWith('shot-complete-flow');

      mockStore._deleteShotResource._setStatus('resolved');
    });

    it('should handle user canceling before deletion completes', async () => {
      const user = userEvent.setup();
      await renderDialog();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockStore.deleteShot).not.toHaveBeenCalled();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });
});
