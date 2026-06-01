import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import type { DocumentVersion } from '../../../utils-models/documents-service.model';
import { TrialDocVersions } from './trial-doc-versions';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const mockDocumentVersions: DocumentVersion[] = [
  {
    id: '1',
    versionTag: 'v1.0',
    createdAt: '2023-01-01',
    createdBy: 'User 1',
    isActive: true,
  },
  {
    id: '2',
    versionTag: 'v2.0',
    createdAt: '2023-01-02',
    createdBy: 'User 2',
    isActive: false,
  },
];

describe('TrialDocVersions', () => {
  it('should render the document versions', async () => {
    await render(TrialDocVersions, {
      imports: [TranslateModule.forRoot()],
      componentInputs: {
        documentVersions: mockDocumentVersions,
      },
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } }],
    });

    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('v2.0')).toBeInTheDocument();
  });

  it('should have the active version selected by default', async () => {
    await render(TrialDocVersions, {
      imports: [TranslateModule.forRoot()],
      componentInputs: {
        documentVersions: mockDocumentVersions,
      },
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } }],
    });

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();
  });

  it('should open the dialog when a new version is selected', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => of(true) }));
    await render(TrialDocVersions, {
      imports: [TranslateModule.forRoot()],
      componentInputs: {
        documentVersions: mockDocumentVersions,
      },
      providers: [{ provide: MatDialog, useValue: { open: openSpy } }],
    });

    const radioButtons = screen.getAllByRole('radio');
    await userEvent.click(radioButtons[1]);

    expect(openSpy).toHaveBeenCalled();
  });

  it('should not open the dialog when the active version is selected', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => of(true) }));
    await render(TrialDocVersions, {
      imports: [TranslateModule.forRoot()],
      componentInputs: {
        documentVersions: mockDocumentVersions,
      },
      providers: [{ provide: MatDialog, useValue: { open: openSpy } }],
    });

    const radioButtons = screen.getAllByRole('radio');
    await userEvent.click(radioButtons[0]);

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should keep the new version selected when dialog is confirmed', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => of(true) }));
    await render(TrialDocVersions, {
      imports: [TranslateModule.forRoot()],
      componentInputs: {
        documentVersions: mockDocumentVersions,
      },
      providers: [{ provide: MatDialog, useValue: { open: openSpy } }],
    });

    const radioButtons = screen.getAllByRole('radio');
    await userEvent.click(radioButtons[1]);

    await waitFor(() => {
      const updated = screen.getAllByRole('radio');
      expect(updated[0]).not.toBeChecked();
      expect(updated[1]).toBeChecked();
    });
  });
});
