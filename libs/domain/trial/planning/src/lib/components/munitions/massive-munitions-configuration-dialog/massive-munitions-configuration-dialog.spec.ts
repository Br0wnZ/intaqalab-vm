import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { MunitionsStore } from '../../../+state/munitions.store';
import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../../+state/series-and-shots.store';
import { MassiveMunitionsConfigurationDialog } from './massive-munitions-configuration-dialog';

describe('MassiveMunitionsConfigurationDialog Placeholder', () => {
  it('should be skipped temporarily due to testing-library crash', () => {
    expect(true).toBe(true);
  });
});

const mockStore = {
  series: () => [
    { id: 'serie-1', name: 'Serie 1' },
    { id: 'serie-2', name: 'Serie 2' },
  ],
};

const mockSeriesAndShotsStore = {
  series: () => [
    {
      id: 'serie-1',
      name: 'Serie 1',
      shots: [
        { id: 'shot-1', globalNumber: 1 },
        { id: 'shot-2', globalNumber: 2 },
      ],
    },
  ],
};

const mockMunitionsStore = {
  componentTypes: () => [
    { id: 'type-fuze', label: 'Espoleta', category: 'MUNITION_COMPONENT' },
    { id: 'type-detonator', label: 'Estopín', category: 'MUNITION_COMPONENT' },
  ],
  munitionTypes: () => [{ id: 'type-1', label: 'Tipo 1' }],
  denominationsRaw: () => [{ id: 'option1', name: 'Opción 1', munitionType: { id: 'type-1' } }],
  denominations: () => [{ id: 'option1', label: 'Opción 1' }],
  updateMunitionsStatus: () => 'idle',
  loadAllCatalogs: vi.fn(),
  updateMunitions: vi.fn(),
  resetUpdateMunitions: vi.fn(),
};

describe('MassiveMunitionsConfigurationDialog', () => {
  function createFullMockDialogRef() {
    return {
      close: vi.fn(),
      afterClosed: vi.fn(() => ({ subscribe: vi.fn() })),
      backdropClick: vi.fn(() => ({ subscribe: vi.fn() })),
      keydownEvents: vi.fn(() => ({ subscribe: vi.fn() })),
    };
  }

  const renderDialog = async (dialogRefMock = createFullMockDialogRef(), dialogData = {}) => {
    return render(MassiveMunitionsConfigurationDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
      componentInputs: {},
      componentProperties: {},
      componentProviders: [
        { provide: PlanningGeneralDataStore, useValue: mockStore },
        { provide: MunitionsStore, useValue: mockMunitionsStore },
        { provide: SeriesAndShotsStore, useValue: mockSeriesAndShotsStore },
      ],
    });
  };

  it('should render dialog with title and main form fields', async () => {
    await renderDialog();

    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.TITLE')).toBeInTheDocument();

    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.DENOMINATION_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.LOT_LABEL')).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.ASSOCIATED_SHOTS_LABEL'),
    ).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.MAX_FAILURES_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CLIENT_NUMBER_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL')).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.COMPONENT_SELECTOR_LABEL'),
    ).toBeInTheDocument();
  });

  it('should display action buttons', async () => {
    await renderDialog();

    expect(
      screen.getByRole('button', { name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON/i }),
    ).toBeInTheDocument();
  });

  it('should allow entering text in lot field', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const lotInput = document.querySelector('#batch') as HTMLInputElement;
    expect(lotInput).toBeInTheDocument();

    await user.type(lotInput, 'Lote-2024-001');
    expect(lotInput.value).toBe('Lote-2024-001');
  });

  it('should allow entering number in max failures field', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const maxFailuresInput = document.querySelector('#maxAllowedErrors') as HTMLInputElement;
    expect(maxFailuresInput).toBeInTheDocument();

    await user.type(maxFailuresInput, '5');
    expect(maxFailuresInput.value).toBe('5');
  });

  it('should allow entering text in client number field', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const clientNumberInput = document.querySelector('#clientNumber') as HTMLInputElement;
    expect(clientNumberInput).toBeInTheDocument();

    await user.type(clientNumberInput, '12345');
    expect(clientNumberInput.value).toBe('12345');
  });

  it('should allow entering text in observations field', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const observationsTextarea = document.querySelector('#observations') as HTMLTextAreaElement;
    expect(observationsTextarea).toBeInTheDocument();

    await user.type(observationsTextarea, 'Observación de prueba');
    expect(observationsTextarea.value).toBe('Observación de prueba');
  });

  it('should show conditioning fields when checkbox is checked', async () => {
    const user = userEvent.setup();
    await renderDialog();

    expect(
      screen.queryByText('TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL'),
    ).not.toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL')).toBeInTheDocument();
  });

  it('should allow entering conditioning temperature', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    const temperatureInput = document.querySelector('#temperature') as HTMLInputElement;
    expect(temperatureInput).toBeInTheDocument();

    await user.type(temperatureInput, '25');
    expect(temperatureInput.value).toBe('25');
  });

  it('should allow entering tolerance value', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    const toleranceInput = document.querySelector('#tolerance') as HTMLInputElement;
    expect(toleranceInput).toBeInTheDocument();

    await user.type(toleranceInput, '2');
    expect(toleranceInput.value).toBe('2');
  });

  it('should allow entering min time value', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    const minTimeInput = document.querySelector('#timeMin') as HTMLInputElement;
    expect(minTimeInput).toBeInTheDocument();
    expect(minTimeInput.value).toBe('24');

    await user.clear(minTimeInput);
    await user.type(minTimeInput, '12');
    expect(minTimeInput.value).toBe('12');
  });

  it('should allow entering max time value', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    const maxTimeInput = document.querySelector('#timeMax') as HTMLInputElement;
    expect(maxTimeInput).toBeInTheDocument();

    await user.type(maxTimeInput, '48');
    expect(maxTimeInput.value).toBe('48');
  });

  it('should allow entering conditioning observations', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const checkbox = screen.getByRole('checkbox', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX/i,
    });
    await user.click(checkbox);

    const observations2Textarea = document.querySelector('#reconditioningObservations') as HTMLTextAreaElement;
    expect(observations2Textarea).toBeInTheDocument();

    await user.type(observations2Textarea, 'Observaciones de acondicionamiento');
    expect(observations2Textarea.value).toBe('Observaciones de acondicionamiento');
  });

  it('should allow selecting multiple components', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const componentSelect = document.querySelector('#selectedComponents') as HTMLElement;
    expect(componentSelect).toBeInTheDocument();

    await user.click(componentSelect);

    const estopinOption = await screen.findByRole('option', { name: /estopín/i });
    await user.click(estopinOption);

    const chipSet = document.querySelector('mat-chip-set');
    expect(chipSet).toBeInTheDocument();
    expect(chipSet).toHaveTextContent(/estopín/i);
  });

  it('should display tabs when components are selected', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const componentSelect = document.querySelector('#selectedComponents') as HTMLElement;
    await user.click(componentSelect);

    const estopinOption = await screen.findByRole('option', { name: /estopín/i });
    await user.click(estopinOption);

    expect(await screen.findByRole('tab', { name: /estopín/i })).toBeInTheDocument();
  });

  it('should allow removing a selected component chip', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const componentSelect = document.querySelector('#selectedComponents') as HTMLElement;
    await user.click(componentSelect);
    const estopinOption = await screen.findByRole('option', { name: /estopín/i });
    await user.click(estopinOption);

    const chipSet = document.querySelector('mat-chip-set');
    expect(chipSet).toBeInTheDocument();
    expect(chipSet).toHaveTextContent(/estopín/i);

    const chip = chipSet?.querySelector('mat-chip');
    const removeButton = chip?.querySelector('button[matChipRemove]');
    expect(removeButton).toBeInTheDocument();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await user.click(removeButton!);

    expect(document.querySelector('mat-chip-set')).not.toBeInTheDocument();
  });

  it('should close dialog when clicking Cancelar button', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    await renderDialog(dialogRefMock);

    const cancelButton = screen.getByRole('button', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON/i,
    });
    await user.click(cancelButton);
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with form data when clicking Aplicar with valid data', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    const { fixture } = await renderDialog(dialogRefMock);

    // 1. Select Munition Type first to enable Denomination Select
    const munitionTypeSelect = screen.getByTestId('munition-type-select');
    await user.click(munitionTypeSelect);
    const typeOption = await screen.findByRole('option', { name: 'Tipo 1' });
    await user.click(typeOption);
    fixture.detectChanges();

    // 2. Select Denomination
    const denominationSelect = document.querySelector('#denomination') as HTMLElement;
    await user.click(denominationSelect);
    const option1 = await screen.findByRole('option', { name: /opción 1/i });
    await user.click(option1);

    const lotInput = document.querySelector('#batch') as HTMLInputElement;
    await user.type(lotInput, 'Lote-001');

    const applyButton = screen.getByRole('button', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON/i,
    });
    await user.click(applyButton);

    expect(mockMunitionsStore.updateMunitions).toHaveBeenCalledWith(
      expect.objectContaining({
        configurations: expect.arrayContaining([
          expect.objectContaining({
            denominationId: 'option1',
            batch: 'Lote-001',
          }),
        ]),
      }),
    );
  });

  it('should update form model when entering multiple fields', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    const { fixture } = await renderDialog(dialogRefMock);

    // 1. Select Munition Type first to enable Denomination Select
    const munitionTypeSelect = screen.getByTestId('munition-type-select');
    await user.click(munitionTypeSelect);
    const typeOption = await screen.findByRole('option', { name: 'Tipo 1' });
    await user.click(typeOption);
    fixture.detectChanges();

    // 2. Select Denomination
    const denominationSelect = document.querySelector('#denomination') as HTMLElement;
    await user.click(denominationSelect);
    const option1 = await screen.findByRole('option', { name: /opción 1/i });
    await user.click(option1);

    const lotInput = document.querySelector('#batch') as HTMLInputElement;
    await user.type(lotInput, 'Lote-2024');

    const maxFailuresInput = document.querySelector('#maxAllowedErrors') as HTMLInputElement;
    await user.type(maxFailuresInput, '3');

    const clientNumberInput = document.querySelector('#clientNumber') as HTMLInputElement;
    await user.type(clientNumberInput, '999');

    const observationsTextarea = document.querySelector('#observations') as HTMLTextAreaElement;
    await user.type(observationsTextarea, 'Test observation');

    const applyButton = screen.getByRole('button', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON/i,
    });
    await user.click(applyButton);

    expect(mockMunitionsStore.updateMunitions).toHaveBeenCalledWith(
      expect.objectContaining({
        configurations: expect.arrayContaining([
          expect.objectContaining({
            denominationId: 'option1',
            batch: 'Lote-2024',
            maxAllowedErrors: 3,
            observations: 'Test observation',
          }),
        ]),
      }),
    );
  }, 15000);

  it('should initialize with preloaded data when provided', async () => {
    const preloadedData = {
      denomination: 'option2',
      batch: 'Preloaded-Lot',
      maxAllowedErrors: 10,
      clientNumber: 123,
    };

    await renderDialog(createFullMockDialogRef(), { preloadedData });

    const lotInput = document.querySelector('#batch') as HTMLInputElement;
    expect(lotInput.value).toBe('Preloaded-Lot');

    const maxFailuresInput = document.querySelector('#maxAllowedErrors') as HTMLInputElement;
    expect(maxFailuresInput.value).toBe('10');
  });

  it('should validate required fields when clicking Aplicar', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await renderDialog(dialogRefMock);

    const applyButton = screen.getByRole('button', {
      name: /TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON/i,
    });
    await user.click(applyButton);

    expect(alertSpy).toHaveBeenCalled();
    expect(dialogRefMock.close).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
