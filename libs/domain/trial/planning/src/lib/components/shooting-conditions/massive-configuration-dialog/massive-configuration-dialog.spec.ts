import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import { ShootingConditionsService } from '../../../services/shooting-conditions.service';
import { MassiveConfigurationDialog } from './massive-configuration-dialog';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('MassiveConfigurationDialog', () => {
  function createFullMockDialogRef() {
    return {
      close: vi.fn(),
      afterClosed: vi.fn(() => ({ subscribe: vi.fn() })),
      backdropClick: vi.fn(() => ({ subscribe: vi.fn() })),
      keydownEvents: vi.fn(() => ({ subscribe: vi.fn() })),
    };
  }
  const mockTargetTypes = [
    { id: 'target-1', label: 'Blanco tipo 1' },
    { id: 'target-2', label: 'Blanco tipo 2' },
  ];

  const mockMaterials = [
    { id: 'mat-1', label: 'Acero' },
    { id: 'mat-2', label: 'Hormigón' },
  ];

  const mockImpactZones = [
    { id: 'zone-1', label: 'Zona A' },
    { id: 'zone-2', label: 'Zona B' },
  ];

  const mockDimensions = [
    { id: 'dim-1', label: '1x1m' },
    { id: 'dim-2', label: '2x2m' },
  ];

  const mockThicknesses = [
    { id: 'thick-1', name: '10cm' },
    { id: 'thick-2', name: '20cm' },
  ];

  const mockShootingConditionsService = {
    getTargetTypesResource: createMockResource(mockTargetTypes),
    getTargetMaterialsResource: createMockResource(mockMaterials),
    getImpactZonesResource: createMockResource(mockImpactZones),
    getTargetDimensionsResource: createMockResource(mockDimensions),
    getTargetThicknessesResource: createMockResource(mockThicknesses),
    getTrialSchedulesResource: createMockResource<Array<{ date: string; lineOfShootId: string }>>([]),
    updateConditionsResource: createMockResource<void>(),
    updateShootingConditions: vi.fn(),
  };

  const mockStore = {
    series: () => [
      { id: 'serie-1', name: 'Serie 1' },
      { id: 'serie-2', name: 'Serie 2' },
    ],
  };
  const renderDialog = async (dialogRefMock = createFullMockDialogRef()) => {
    return render(MassiveConfigurationDialog, {
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            series: [
              { seriesId: 'serie-1', seriesName: 'Serie 1', shots: [] },
              { seriesId: 'serie-2', seriesName: 'Serie 2', shots: [] },
            ],
            trialId: 'trial-123',
          },
        },
        { provide: ShootingConditionsService, useValue: mockShootingConditionsService },
      ],
      componentProviders: [{ provide: PlanningGeneralDataStore, useValue: mockStore }],
    });
  };

  it('should render dialog with title and form fields', async () => {
    await renderDialog();

    expect(screen.getByText(/Configuración masiva de disparos/i)).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Blanco')).toBeInTheDocument();
    expect(screen.getByText('Material blanco')).toBeInTheDocument();
    expect(screen.getByText('Zona impacto')).toBeInTheDocument();
    expect(screen.getByText('Dimensiones blanco')).toBeInTheDocument();
    expect(screen.getByText('Espesor blanco')).toBeInTheDocument();
    expect(screen.getByText('Distancia')).toBeInTheDocument();
    expect(screen.getByText('Orientación')).toBeInTheDocument();
    expect(screen.getByText('Elevación')).toBeInTheDocument();
    expect(screen.getByText('Ángulo tiro')).toBeInTheDocument();
    expect(screen.getByText('Alcance')).toBeInTheDocument();
    expect(screen.getByText('Altura funcionamiento')).toBeInTheDocument();
    expect(screen.getByText('Peso de pólvora')).toBeInTheDocument();
  });

  it('should display action buttons', async () => {
    await renderDialog();

    expect(screen.getByRole('button', { name: /Aplicar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('should populate selects with data from service', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const targetSelect = document.querySelector('#bulk-target') as HTMLElement;
    await user.click(targetSelect);

    expect(await screen.findByRole('option', { name: 'Blanco tipo 1' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Blanco tipo 2' })).toBeInTheDocument();
  });

  it('should allow selecting target type', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const targetSelect = document.querySelector('#bulk-target') as HTMLElement;
    await user.click(targetSelect);

    const option = await screen.findByRole('option', { name: 'Blanco tipo 1' });
    await user.click(option);

    expect(targetSelect).toHaveTextContent('Blanco tipo 1');
  });

  it('should allow selecting material', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const materialSelect = document.querySelector('#bulk-material') as HTMLElement;
    await user.click(materialSelect);

    const option = await screen.findByRole('option', { name: 'Acero' });
    await user.click(option);

    expect(materialSelect).toHaveTextContent('Acero');
  });

  it('should allow selecting impact zone', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const impactSelect = document.querySelector('#bulk-impact') as HTMLElement;
    await user.click(impactSelect);

    const option = await screen.findByRole('option', { name: 'Zona A' });
    await user.click(option);

    expect(impactSelect).toHaveTextContent('Zona A');
  });

  it('should allow selecting dimensions', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const dimsSelect = document.querySelector('#bulk-dims') as HTMLElement;
    await user.click(dimsSelect);

    const option = await screen.findByRole('option', { name: '1x1m' });
    await user.click(option);

    expect(dimsSelect).toHaveTextContent('1x1m');
  });

  it('should allow selecting thickness', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const thickSelect = document.querySelector('#bulk-thick') as HTMLElement;
    await user.click(thickSelect);

    const option = await screen.findByRole('option', { name: '10cm' });
    await user.click(option);

    expect(thickSelect).toHaveTextContent('10cm');
  });

  it('should allow selecting multiple series', async () => {
    const user = userEvent.setup();
    await renderDialog();

    const seriesSelect = document.querySelector('#bulk-series') as HTMLElement;
    await user.click(seriesSelect);

    const serie1 = await screen.findByRole('option', { name: 'Serie 1' });
    await user.click(serie1);

    const serie2 = await screen.findByRole('option', { name: 'Serie 2' });
    await user.click(serie2);

    await user.keyboard('{Escape}');

    expect(seriesSelect).toHaveTextContent('Serie 1');
    expect(seriesSelect).toHaveTextContent('Serie 2');
  });

  it('should close dialog when clicking Cancelar button', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    await renderDialog(dialogRefMock);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(cancelButton).toBeInTheDocument();
  });

  it('should call updateShootingConditions when clicking Aplicar', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    await renderDialog(dialogRefMock);

    const targetSelect = document.querySelector('#bulk-target') as HTMLElement;
    await user.click(targetSelect);
    const option = await screen.findByRole('option', { name: 'Blanco tipo 1' });
    await user.click(option);

    const applyButton = screen.getByRole('button', { name: /Aplicar/i });
    await user.click(applyButton);

    expect(mockShootingConditionsService.updateShootingConditions).toHaveBeenCalledWith(
      expect.objectContaining({ trialId: 'trial-123' }),
    );
  });

  it('should call updateShootingConditions when applying multiple fields', async () => {
    const user = userEvent.setup();
    const dialogRefMock = createFullMockDialogRef();
    await renderDialog(dialogRefMock);

    const targetSelect = document.querySelector('#bulk-target') as HTMLElement;
    await user.click(targetSelect);
    await user.click(await screen.findByText('Blanco tipo 2'));

    const materialSelect = document.querySelector('#bulk-material') as HTMLElement;
    await user.click(materialSelect);
    await user.click(await screen.findByText('Hormigón'));

    const impactSelect = document.querySelector('#bulk-impact') as HTMLElement;
    await user.click(impactSelect);
    await user.click(await screen.findByText('Zona B'));

    const applyButton = screen.getByRole('button', { name: /Aplicar/i });
    await user.click(applyButton);

    expect(mockShootingConditionsService.updateShootingConditions).toHaveBeenCalledWith(
      expect.objectContaining({ trialId: 'trial-123' }),
    );
  });

  it('should call updateShootingConditions with empty shots when no config selected', async () => {
    const dialogRefMock = createFullMockDialogRef();
    await renderDialog(dialogRefMock);

    const applyButton = screen.getByRole('button', { name: /Aplicar/i });
    await userEvent.setup().click(applyButton);

    // data.series all have empty shots — result is empty shots array
    expect(mockShootingConditionsService.updateShootingConditions).toHaveBeenCalledWith(
      expect.objectContaining({ trialId: 'trial-123', shots: [] }),
    );
  });
});
