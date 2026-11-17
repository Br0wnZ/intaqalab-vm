import type { ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { createMockSeriesAndShotsStore } from '@intaqalab/utils';
import { createMockMatDialogRef } from '@intaqalab/utils/testing/dialog-test-helpers';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeriesAndShotsStore } from '../../../+state/series-and-shots.store';
import { UpsertSerieDialog } from './upsert-serie-dialog';

describe('UpsertSerieDialog', () => {
  let fixture: ComponentFixture<UpsertSerieDialog>;
  let component: UpsertSerieDialog;
  let mockDialogRef: MatDialogRef<unknown>;
  let mockStore: ReturnType<typeof createMockSeriesAndShotsStore>;

  const defaultData = {
    trialId: 'trial-123',
    isEditing: false,
    name: '',
    numberOfShots: undefined as number | undefined,
    serieId: undefined as string | undefined,
    observations: '',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialogRef = createMockMatDialogRef();

    mockStore = createMockSeriesAndShotsStore();
  });

  const renderDialog = async (data = defaultData) => {
    const view = await render(UpsertSerieDialog, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: SeriesAndShotsStore, useValue: mockStore },
        provideTranslateService(),
      ],
      componentProviders: [{ provide: SeriesAndShotsStore, useValue: mockStore }],
    });
    fixture = view.fixture;
    component = fixture.componentInstance;
  };

  describe('Initial Rendering', () => {
    it('should render new serie title when not editing', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      expect(screen.getByText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.TITLE_NEW')).toBeInTheDocument();
    });

    it('should render edit serie title when editing', async () => {
      await renderDialog({ ...defaultData, isEditing: true });
      expect(screen.getByText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.TITLE_EDIT')).toBeInTheDocument();
    });

    it('should render all form fields when creating new', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      expect(screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL')).toBeInTheDocument();
      expect(screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL')).toBeInTheDocument();
      expect(screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.OBSERVATIONS_LABEL')).toBeInTheDocument();
    });

    it('should not render shots field when editing', async () => {
      await renderDialog({ ...defaultData, isEditing: true });
      expect(screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL')).toBeInTheDocument();
      expect(
        screen.queryByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL'),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.OBSERVATIONS_LABEL')).toBeInTheDocument();
    });

    it('should render save button when not editing', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE' })).toBeInTheDocument();
    });

    it('should render update button when editing', async () => {
      await renderDialog({ ...defaultData, isEditing: true });
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.UPDATE' })).toBeInTheDocument();
    });

    it('should render cancel button', async () => {
      await renderDialog();
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.CANCEL' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when form is invalid', async () => {
      await renderDialog();
      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid (new serie)', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      const user = userEvent.setup();

      const nameInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL');
      const shotsInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL');

      await user.type(nameInput, 'Serie Test');
      await user.type(shotsInput, '5');

      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE' });
      expect(submitButton).toBeEnabled();
    });

    it('should enable submit button when form is valid (edit serie)', async () => {
      await renderDialog({ ...defaultData, isEditing: true });
      const user = userEvent.setup();

      const nameInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL');

      await user.type(nameInput, 'Serie Test');

      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.UPDATE' });
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Submission', () => {
    it('should call addSerie when submitting new serie', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      const user = userEvent.setup();

      const nameInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL');
      const shotsInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL');
      const obsInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.OBSERVATIONS_LABEL');

      await user.type(nameInput, 'New Serie');
      await user.type(shotsInput, '3');
      await user.type(obsInput, 'Some notes');

      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE' });
      await user.click(submitButton);

      expect(mockStore.addSerie).toHaveBeenCalledWith(
        expect.objectContaining({
          trialId: 'trial-123',
          name: 'New Serie',
          numberOfShots: 3,
          observations: 'Some notes',
        }),
      );
    });

    it('should call updateSerie when submitting edited serie', async () => {
      await renderDialog({
        ...defaultData,
        isEditing: true,
        serieId: 'serie-1',
        name: 'Old Name',
        numberOfShots: 2,
        observations: 'Old notes',
      });
      const user = userEvent.setup();

      const nameInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.UPDATE' });
      await user.click(submitButton);

      expect(mockStore.updateSerie).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'serie-1',
          name: 'Updated Name',
          observations: 'Old notes',
        }),
      );
    });

    it('should configure FormRoot with novalidate, submit button type, and submit on Enter key', async () => {
      await renderDialog({ ...defaultData, isEditing: false });
      const user = userEvent.setup();

      const formEl = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
      expect(formEl).toHaveAttribute('novalidate');

      const submitButton = screen.getByRole('button', { name: 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE' });
      expect(submitButton).toHaveAttribute('type', 'submit');

      const nameInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL');
      const shotsInput = screen.getByLabelText('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL');

      await user.type(shotsInput, '4');
      await user.type(nameInput, 'Enter Serie{Enter}');

      expect(mockStore.addSerie).toHaveBeenCalledWith(
        expect.objectContaining({
          trialId: 'trial-123',
          name: 'Enter Serie',
          numberOfShots: 4,
        }),
      );
    });
  });

  describe('Effects', () => {
    it('should close dialog and reset store when addSerieStatus becomes resolved', async () => {
      await renderDialog({ ...defaultData, isEditing: false });

      mockStore._addSerieResource._setStatus('resolved');

      await waitFor(() => {
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockStore.resetAddSerie).toHaveBeenCalled();
      });
    });

    it('should close dialog and reset store when updateSerieStatus becomes resolved', async () => {
      await renderDialog({ ...defaultData, isEditing: true });

      mockStore._updateSerieResource._setStatus('resolved');

      await waitFor(() => {
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockStore.resetUpdateSerie).toHaveBeenCalled();
      });
    });
  });
});
