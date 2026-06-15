import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { ConfirmDialogData } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog';

// vi.mock hoisted by Vitest
type DialogData = ConfirmDialogData & { trialId: string; documentId: string };

describe('ConfirmDeleteDialogComponent', () => {
  const defaultData: DialogData = {
    title: 'Eliminar documento',
    message: '¿Estás seguro de que quieres eliminar este documento?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    trialId: 'trial-1',
    documentId: 'doc-1',
  };

  const createMockService = () => {
    const service = {
      deleteDocumentResource: createMockResource(),
      fireTrialId: vi.fn(() => defaultData.trialId),
      deleteDocument: vi.fn(),
      resetDelete: vi.fn(),
    };
    service.deleteDocument.mockImplementation(() => {
      service.deleteDocumentResource._setStatus('loading');
    });
    return service;
  };

  const setup = async (data: Partial<DialogData> = {}) => {
    const user = userEvent.setup();
    const closeMock = vi.fn();
    const mockService = createMockService();

    const mergedData: DialogData = { ...defaultData, ...data };

    await render(ConfirmDeleteDialogComponent, {
      providers: [
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mergedData },
        { provide: TrialDocsService, useValue: mockService },
      ],
    });

    return { user, closeMock, mockService };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default data', async () => {
    await setup();
    expect(screen.getByText('Eliminar documento')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de que quieres eliminar este documento?')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders correctly with fallback text for buttons', async () => {
    await setup({
      title: 'Warning',
      message: 'This is a warning',
      confirmText: undefined,
      cancelText: undefined,
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders the description when provided', async () => {
    await setup({ description: 'Extra description text' });
    expect(screen.getByText('Extra description text')).toBeInTheDocument();
  });

  it('closes dialog with false when cancel button is clicked', async () => {
    const { user, closeMock } = await setup();
    const cancelButton = screen.getByText('Cancelar').closest('button')!;

    await user.click(cancelButton);
    expect(closeMock).toHaveBeenCalledWith(false);
  });

  it('calls deleteDocument on confirm and closes dialog when resolved', async () => {
    const { user, closeMock, mockService } = await setup();
    const confirmButton = screen.getByText('Eliminar').closest('button')!;

    await user.click(confirmButton);
    expect(mockService.deleteDocument).toHaveBeenCalledWith('trial-1', 'doc-1');

    // Simulate resolved status
    mockService.deleteDocumentResource._setStatus('resolved');
    await vi.waitFor(() => {
      expect(mockService.resetDelete).toHaveBeenCalled();
      expect(closeMock).toHaveBeenCalledWith(true);
    });
  });
});
