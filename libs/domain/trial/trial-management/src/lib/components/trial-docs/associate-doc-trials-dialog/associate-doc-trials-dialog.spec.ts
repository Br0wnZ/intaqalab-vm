import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { TrialStatus } from '@intaqalab/models';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { AssociateDocTrialsDialog } from './associate-doc-trials-dialog';

// vi.mock hoisted by Vitest
describe('AssociateDocTrialsDialog', () => {
  const mockData = {
    documentId: 'doc-123',
    trialIds: ['TRIAL-004'],
  };

  const mockFireTrialIds = ['TRIAL-001', 'TRIAL-002', 'TRIAL-003'];

  const mockFireTrials = [
    { id: 'TRIAL-001', trialNumber: 'TRIAL-001', centerId: 'center_id', status: 'UNDER_REVIEW' as TrialStatus },
    { id: 'TRIAL-002', trialNumber: 'TRIAL-002', centerId: 'center_id', status: 'PLANNED' as TrialStatus },
    { id: 'TRIAL-003', trialNumber: 'TRIAL-003', centerId: 'center_id', status: 'PREPARED' as TrialStatus },
  ];

  const setup = async () => {
    const closeMock = vi.fn();
    const docsServiceMock = {
      documentAssociatedTrialsResource: {
        value: signal({ fireTrialIds: mockFireTrialIds }),
        reload: vi.fn(),
      },
      associateDocResource: {
        status: signal('idle'),
      },
      getDocumentAssociatedTrials: vi.fn(),
      associateDocToTrial: vi.fn(),
      resetAssociateDoc: vi.fn(),
    };

    const view = await render(AssociateDocTrialsDialog, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TrialDocsService, useValue: docsServiceMock },
        provideTranslateService(),
      ],
    });

    const fixture = view.fixture;
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { closeMock, docsServiceMock, fixture, component };
  };

  it('should create and fetch associated trials on init', async () => {
    const { component, docsServiceMock } = await setup();
    expect(component).toBeTruthy();
    expect(docsServiceMock.getDocumentAssociatedTrials).toHaveBeenCalledWith(mockData.documentId);
  });

  it('should render correct title', async () => {
    await setup();
    expect(screen.getByText('TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.TITLE')).toBeInTheDocument();
  });

  it('should update selectedTrials signal', async () => {
    const { fixture, component } = await setup();
    component.selectedTrials.set([mockFireTrials[0]]);
    fixture.detectChanges();
    expect(component.selectedTrials().length).toBe(1);
    expect(component.selectedTrials()[0].trialNumber).toBe('TRIAL-001');
  });

  it('should remove trial when removeTrial is called', async () => {
    const { fixture, component } = await setup();
    component.selectedTrials.set([mockFireTrials[0], mockFireTrials[1]]);
    fixture.detectChanges();

    component.removeTrial('TRIAL-001');
    fixture.detectChanges();

    expect(component.selectedTrials().length).toBe(1);
    expect(component.selectedTrials()[0].trialNumber).toBe('TRIAL-002');
  });

  it('should disable Associate button when no trials selected', async () => {
    await setup();
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    expect(button).toBeDisabled();
  });

  it('should enable Associate button when trials are selected', async () => {
    const { fixture, component } = await setup();
    component.selectedTrials.set([mockFireTrials[0]]);
    fixture.detectChanges();
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    expect(button).toBeEnabled();
  });

  it('should call associateDocToTrial when Associate button is clicked', async () => {
    const { fixture, component, docsServiceMock } = await setup();
    const user = userEvent.setup();
    component.selectedTrials.set([mockFireTrials[0], mockFireTrials[1]]);
    fixture.detectChanges();

    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' });
    await user.click(button);

    expect(docsServiceMock.associateDocToTrial).toHaveBeenCalledWith({
      documentId: mockData.documentId,
      fireTrialIds: ['TRIAL-001', 'TRIAL-002', ...mockData.trialIds],
    });
  });

  it('should close dialog when resource status becomes resolved', async () => {
    const { fixture, docsServiceMock, closeMock } = await setup();
    expect(closeMock).not.toHaveBeenCalled();

    docsServiceMock.associateDocResource.status.set('resolved');
    fixture.detectChanges();

    expect(closeMock).toHaveBeenCalledWith(true);
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const { closeMock } = await setup();
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.CANCEL' });
    await user.click(button);

    expect(closeMock).toHaveBeenCalledWith(false);
  });
});
