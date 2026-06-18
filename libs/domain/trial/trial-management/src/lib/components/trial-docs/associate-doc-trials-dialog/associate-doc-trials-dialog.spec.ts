import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { AssociateDocTrialsDialog } from './associate-doc-trials-dialog';

// vi.mock hoisted by Vitest
describe('AssociateDocTrialsDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docsServiceMock: any;
  let fixture: ComponentFixture<AssociateDocTrialsDialog>;
  let component: AssociateDocTrialsDialog;

  const mockData = {
    documentId: 'doc-123',
    fireTrialId: 'TRIAL-004',
  };

  const mockFireTrialIds = ['TRIAL-001', 'TRIAL-002', 'TRIAL-003'];

  const mockFireTrials = [
    { id: 'TRIAL-001', trialNumber: 'TRIAL-001', centerId: 'center_id', status: 'UNDER_REVIEW' as TrialStatus },
    { id: 'TRIAL-002', trialNumber: 'TRIAL-002', centerId: 'center_id', status: 'PLANNED' as TrialStatus },
    { id: 'TRIAL-003', trialNumber: 'TRIAL-003', centerId: 'center_id', status: 'PREPARED' as TrialStatus },
  ];

  beforeEach(async () => {
    closeMock = vi.fn();
    docsServiceMock = {
      documentAssociatedTrialsResource: {
        value: signal({ fireTrialIds: mockFireTrialIds }),
      },
      associateDocResource: {
        status: signal('idle'),
      },
      getDocumentAssociatedTrials: vi.fn(),
      associateDocToTrial: vi.fn(),
      resetAssociateDoc: vi.fn(),
    };

    const renderResult = await render(AssociateDocTrialsDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TrialDocsService, useValue: docsServiceMock },
      ],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and fetch associated trials on init', () => {
    expect(component).toBeTruthy();
    expect(docsServiceMock.getDocumentAssociatedTrials).toHaveBeenCalledWith(mockData.documentId);
  });

  it('should render correct title', () => {
    expect(screen.getByText('TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.TITLE')).toBeInTheDocument();
  });

  it('should have initial previousAssociatedTrials', () => {
    expect(component.previousAssociatedTrials().length).toBe(3);
    expect(component.previousAssociatedTrials()[0]).toBe('TRIAL-001');
  });

  it('should update selectedTrials signal', () => {
    component.selectedTrials.set([mockFireTrials[0]]);
    fixture.detectChanges();
    expect(component.selectedTrials().length).toBe(1);
    expect(component.selectedTrials()[0].trialNumber).toBe('TRIAL-001');
  });

  it('should remove trial when removeTrial is called', () => {
    component.selectedTrials.set([mockFireTrials[0], mockFireTrials[1]]);
    fixture.detectChanges();

    component.removeTrial('TRIAL-001');
    fixture.detectChanges();

    expect(component.selectedTrials().length).toBe(1);
    expect(component.selectedTrials()[0].trialNumber).toBe('TRIAL-002');
  });

  it('should disable Associate button when no trials selected', () => {
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    expect(button).toBeDisabled();
  });

  it('should enable Associate button when trials are selected', () => {
    component.selectedTrials.set([mockFireTrials[0]]);
    fixture.detectChanges();
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    expect(button).toBeEnabled();
  });

  it.skip('should call associateDocToTrial when Associate button is clicked', async () => {
    const user = userEvent.setup();
    component.selectedTrials.set([mockFireTrials[0], mockFireTrials[1]]);
    fixture.detectChanges();

    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    await user.click(button);

    expect(docsServiceMock.associateDocToTrial).toHaveBeenCalledWith({
      documentId: mockData.documentId,
      fireTrialIds: ['TRIAL-001', 'TRIAL-002'],
    });
  });

  it('should close dialog when resource status becomes resolved', async () => {
    expect(closeMock).not.toHaveBeenCalled();

    docsServiceMock.associateDocResource.status.set('resolved');
    fixture.detectChanges();

    expect(closeMock).toHaveBeenCalledWith(true);
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.CANCEL' });
    await user.click(button);

    expect(closeMock).toHaveBeenCalledWith(false);
  });
});
