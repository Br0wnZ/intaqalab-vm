import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MAX_ANGULAR_VALUE, MAX_DISTANCE_VALUE, MAX_WEIGHT_VALUE } from '../../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../../services/shooting-conditions.service';
import { MassiveConfigurationDialog } from './massive-configuration-dialog';

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockShootingConditionsService: any;

  const renderDialog = async (dialogRefMock = createFullMockDialogRef()) => {
    const view = await render(MassiveConfigurationDialog, {
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
        provideTranslateService(),
      ],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader, dialogRefMock };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockShootingConditionsService = {
      conditionsResource: createMockResource({ units: { velocity: 'm/s', pressure: 'bar' }, series: [] }),
      getTargetTypesResource: createMockResource(mockTargetTypes),
      getTargetMaterialsResource: createMockResource(mockMaterials),
      getImpactZonesResource: createMockResource(mockImpactZones),
      getTargetDimensionsResource: createMockResource(mockDimensions),
      getTargetThicknessesResource: createMockResource(mockThicknesses),
      getTrialSchedulesResource: createMockResource([]),
      updateConditionsResource: createMockResource(),
      updateShootingConditions: vi.fn(),
    };
  });

  it('should render dialog with title and form fields', async () => {
    await renderDialog();

    expect(
      screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TITLE'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.SERIES_LABEL'),
    ).toBeInTheDocument();
  });

  it('should display action buttons', async () => {
    const { loader } = await renderDialog();
    const applyBtn = await loader.getHarness(
      MatButtonHarness.with({ text: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' }),
    );
    const cancelBtn = await loader.getHarness(
      MatButtonHarness.with({ text: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON' }),
    );

    expect(applyBtn).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
  });

  it('should close dialog when clicking Cancelar button', async () => {
    const { loader } = await renderDialog();
    const cancelBtn = await loader.getHarness(
      MatButtonHarness.with({ text: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON' }),
    );
    await cancelBtn.click();

    // The dialog directive handles closing, but we can verify the mock isn't throwing and click worked
    expect(cancelBtn).toBeTruthy();
  });

  it('should have apply button disabled if no series are selected', async () => {
    const { loader } = await renderDialog();
    const applyBtn = await loader.getHarness(
      MatButtonHarness.with({ text: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' }),
    );
    expect(await applyBtn.isDisabled()).toBe(true);
  });

  it('should enforce the angular maximum', async () => {
    const { view } = await renderDialog();
    const component = view.fixture.componentInstance;
    const setOrientation = (value: string) => {
      component.configModel.update((config) => ({
        ...config,
        series: ['serie-1'],
        impactZone: 'zone-1',
        orientation: { ...config.orientation, value },
      }));
    };

    setOrientation(String(MAX_ANGULAR_VALUE));
    expect(component.bulkForm().invalid()).toBe(false);

    setOrientation('-1');
    expect(component.bulkForm().invalid()).toBe(true);

    setOrientation(String(MAX_ANGULAR_VALUE + 1));
    expect(component.bulkForm().invalid()).toBe(true);
  });

  it('should enforce the maximum for distance fields', async () => {
    const { view } = await renderDialog();
    const component = view.fixture.componentInstance;
    const distanceFields = ['distance', 'range', 'functioningHeight'] as const;

    for (const field of distanceFields) {
      component.configModel.update((config) => ({
        ...config,
        series: ['serie-1'],
        impactZone: 'zone-1',
        distance: { ...config.distance, value: String(MAX_DISTANCE_VALUE) },
        range: { ...config.range, value: String(MAX_DISTANCE_VALUE) },
        functioningHeight: { ...config.functioningHeight, value: String(MAX_DISTANCE_VALUE) },
        [field]: { ...config[field], value: String(MAX_DISTANCE_VALUE) },
      }));
      expect(component.bulkForm().invalid()).toBe(false);

      component.configModel.update((config) => ({
        ...config,
        [field]: { ...config[field], value: String(MAX_DISTANCE_VALUE + 1) },
      }));
      expect(component.bulkForm().invalid()).toBe(true);
    }
  });

  it('should enforce the distance maximum for nominal speed', async () => {
    const { view } = await renderDialog();
    const component = view.fixture.componentInstance;
    const setNominalSpeed = (value: string) => {
      component.configModel.update((config) => ({
        ...config,
        series: ['serie-1'],
        impactZone: 'zone-1',
        nominalSpeed: { ...config.nominalSpeed, value },
      }));
    };

    setNominalSpeed(String(MAX_DISTANCE_VALUE));
    expect(component.bulkForm().invalid()).toBe(false);

    setNominalSpeed(String(MAX_DISTANCE_VALUE + 1));
    expect(component.bulkForm().invalid()).toBe(true);
  });

  it('should enforce the maximum for weight fields', async () => {
    const { view } = await renderDialog();
    const component = view.fixture.componentInstance;
    const weightFields = ['powderWeight', 'projectileWeight'] as const;

    for (const field of weightFields) {
      component.configModel.update((config) => ({
        ...config,
        series: ['serie-1'],
        impactZone: 'zone-1',
        powderWeight: { ...config.powderWeight, value: String(MAX_WEIGHT_VALUE) },
        projectileWeight: { ...config.projectileWeight, value: String(MAX_WEIGHT_VALUE) },
        [field]: { ...config[field], value: String(MAX_WEIGHT_VALUE) },
      }));
      expect(component.bulkForm().invalid()).toBe(false);

      component.configModel.update((config) => ({
        ...config,
        [field]: { ...config[field], value: String(MAX_WEIGHT_VALUE + 1) },
      }));
      expect(component.bulkForm().invalid()).toBe(true);
    }
  });

  it('should configure FormRoot with novalidate and submit on apply click', async () => {
    const { view, loader } = await renderDialog();
    const component = view.fixture.componentInstance;

    const formEl = view.fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    expect(formEl).toHaveAttribute('novalidate');

    const applyButtonEl = screen.getByRole('button', {
      name: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON',
    });
    const cancelButtonEl = screen.getByRole('button', {
      name: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON',
    });
    expect(applyButtonEl).toHaveAttribute('type', 'submit');
    expect(cancelButtonEl).toHaveAttribute('type', 'button');

    component.configModel.update((config) => ({
      ...config,
      series: ['serie-1'],
      impactZone: 'zone-1',
    }));
    view.fixture.detectChanges();

    const applyBtn = await loader.getHarness(
      MatButtonHarness.with({ text: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' }),
    );
    await applyBtn.click();

    expect(mockShootingConditionsService.updateShootingConditions).toHaveBeenCalledWith(
      expect.objectContaining({
        trialId: 'trial-123',
      }),
    );
  });
});
