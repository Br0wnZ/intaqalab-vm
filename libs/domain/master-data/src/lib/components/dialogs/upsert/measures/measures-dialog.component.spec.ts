import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MasterDataStore } from '../../../../+state/master-data.store';
import type { MasterDataMeasures } from '../../../../models/master-data-measures.model';
import { MasterDataService } from '../../../../services/master-data.service';
import { MeasurementsAndRecordsDialogComponent } from './measures-dialog.component';

function createMockMasterDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource(),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    resetUpsert: vi.fn(),
    resetSwitchStatus: vi.fn(),
    resetDelete: vi.fn(),
  };
}

const MOCK_QUANTITATIVE: MasterDataMeasures = {
  id: 'measure-1',
  unit: 'TOPOGRAPHY',
  measurementArea: 'TOP_ATMOSPHERE',
  measurements: ['INITIAL_VELOCITY', 'SOUND'],
  magnitudeCode: 'MG001',
  magnitude: { es: 'Magnitud ES', en: 'Magnitude EN' },
  procedure: { es: 'Procedimiento ES', en: 'Procedure EN' },
  qualificationType: 'QUANTITATIVE',
  measureUnit: 'M_S',
  minValue: 10,
  maxValue: 100,
  uncertainty: '±0.5',
  values: [],
  equipmentTypes: ['DOPPLER_RADAR', '', ''],
  accreditation: true,
  grubbs: false,
  active: true,
};

const MOCK_QUALITATIVE: MasterDataMeasures = {
  id: 'measure-2',
  unit: 'MUNITIONS',
  measurementArea: 'MUN_PROJECTILE',
  measurements: ['WEIGHT'],
  magnitudeCode: 'MG002',
  magnitude: { es: 'Magnitud Cualitativa ES', en: 'Qualitative Magnitude EN' },
  procedure: { es: '', en: '' },
  qualificationType: 'QUALITATIVE',
  measureUnit: '',
  minValue: 0,
  maxValue: 0,
  uncertainty: '',
  values: [{ code: 'VALUE_ONE', name: { es: 'Valor Uno', en: 'Value One' }, active: true }],
  equipmentTypes: ['', '', ''],
  accreditation: false,
  grubbs: false,
  active: true,
};

const VALID_QUANTITATIVE_FORM: MasterDataMeasures = {
  unit: 'TOPOGRAPHY',
  measurementArea: 'TOP_ATMOSPHERE',
  measurements: ['INITIAL_VELOCITY'],
  magnitudeCode: 'MG001',
  magnitude: { es: 'Magnitud', en: 'Magnitude' },
  procedure: { es: '', en: '' },
  qualificationType: 'QUANTITATIVE',
  measureUnit: 'M_S',
  minValue: 1,
  maxValue: 100,
  uncertainty: '±0.5',
  values: [{ code: '', name: { es: '', en: '' }, active: true }],
  equipmentTypes: ['', '', ''],
  accreditation: false,
  grubbs: false,
};

const VALID_QUALITATIVE_FORM: MasterDataMeasures = {
  unit: 'MUNITIONS',
  measurementArea: 'MUN_PROJECTILE',
  measurements: ['WEIGHT'],
  magnitudeCode: 'MG002',
  magnitude: { es: 'Magnitud', en: 'Magnitude' },
  procedure: { es: '', en: '' },
  qualificationType: 'QUALITATIVE',
  measureUnit: '',
  minValue: 0,
  maxValue: 0,
  uncertainty: '',
  values: [{ code: '', name: { es: 'Valor', en: 'Value' }, active: true }],
  equipmentTypes: ['', '', ''],
  accreditation: false,
  grubbs: false,
};

describe('MeasurementsAndRecordsDialogComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = async (data: MasterDataMeasures | null = null) => {
    mockDialogRef = { close: vi.fn() };
    const mockService = createMockMasterDataService();
    const user = userEvent.setup();

    const view = await render(MeasurementsAndRecordsDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MasterDataService, useValue: mockService },
        MasterDataStore,
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return { user, view, mockService };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should create the component', async () => {
      const { view } = await setup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should show create title when data is null', async () => {
      await setup(null);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.CREATE_TITLE/);
    });

    it('should show edit title when data is provided', async () => {
      await setup(MOCK_QUANTITATIVE);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.EDIT_TITLE/);
    });

    it('should allow changing multiple measurements in edit mode and store them as an array', async () => {
      const { view, user } = await setup(MOCK_QUANTITATIVE);
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      const selects = await loader.getAllHarnesses(MatSelectHarness);
      const measurementAreaInput = inputs[0];
      const measurementsSelect = selects[1];

      expect(await measurementAreaInput.getValue()).toBe('TOP_ATMOSPHERE');
      expect(await measurementAreaInput.isDisabled()).toBe(true);
      expect(await measurementsSelect.isDisabled()).toBe(false);

      await measurementsSelect.open();
      const option = screen.getByText('Trayectografía');
      await user.click(option);
      view.fixture.detectChanges();

      expect(view.fixture.componentInstance.formModel().measurements).toEqual([
        'INITIAL_VELOCITY',
        'TRAJECTOGRAPHY',
        'SOUND',
      ]);
    });

    it('should render cancel and save buttons', async () => {
      await setup();
      expect(screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' })).toBeInTheDocument();
    });

    it('should render accreditation checkbox', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.ACCREDITATION')).toBeInTheDocument();
    });

    it('should not render quantitative section when qualificationType is empty', async () => {
      await setup();
      expect(
        screen.queryByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.PLACEHOLDER'),
      ).not.toBeInTheDocument();
    });

    it('should not render qualitative values section when qualificationType is empty', async () => {
      await setup();
      expect(screen.queryByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.TITLE')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation & Save Button States', () => {
    it('should have save button disabled when form is empty in create mode', async () => {
      await setup(null);
      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      expect(saveBtn).toBeDisabled();
    });

    it('should have form in invalid state when initialized empty', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      expect(instance.form().invalid()).toBe(true);
    });

    it('should enable save button when QUANTITATIVE form is fully valid', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set(VALID_QUANTITATIVE_FORM);
      view.fixture.detectChanges();
      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      expect(saveBtn).toBeEnabled();
    });

    it('should enable save button when QUALITATIVE form is fully valid', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set(VALID_QUALITATIVE_FORM);
      view.fixture.detectChanges();
      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      expect(saveBtn).toBeEnabled();
    });

    it('should invalidate QUALITATIVE form when qualitative value names are empty', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set({
        ...VALID_QUALITATIVE_FORM,
        values: [{ code: '', name: { es: '', en: '' }, active: true }],
      });
      view.fixture.detectChanges();
      expect(instance.form().invalid()).toBe(true);
    });

    it('should invalidate QUALITATIVE form when only one translation is provided', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set({
        ...VALID_QUALITATIVE_FORM,
        values: [{ code: '', name: { es: 'Solo ES', en: '' }, active: true }],
      });
      view.fixture.detectChanges();
      expect(instance.form().invalid()).toBe(true);
    });
  });

  describe('Conditional Rendering - QUANTITATIVE', () => {
    it('should show uncertainty, minValue, maxValue fields when QUANTITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUANTITATIVE' }));
      view.fixture.detectChanges();
      expect(
        screen.getByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.PLACEHOLDER'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.MIN_VALUE.PLACEHOLDER'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAX_VALUE.PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should show grubbs checkbox when qualificationType is QUANTITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUANTITATIVE' }));
      view.fixture.detectChanges();
      expect(screen.getByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.GRUBBS')).toBeInTheDocument();
    });

    it('should not show qualitative values section when QUANTITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUANTITATIVE' }));
      view.fixture.detectChanges();
      expect(screen.queryByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.TITLE')).not.toBeInTheDocument();
    });
  });

  describe('Conditional Rendering - QUALITATIVE', () => {
    it('should show qualitative values section when QUALITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUALITATIVE' }));
      view.fixture.detectChanges();
      expect(screen.getByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.TITLE')).toBeInTheDocument();
    });

    it('should not show grubbs checkbox when qualificationType is QUALITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUALITATIVE' }));
      view.fixture.detectChanges();
      expect(screen.queryByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.GRUBBS')).not.toBeInTheDocument();
    });

    it('should not show quantitative fields when QUALITATIVE', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUALITATIVE' }));
      view.fixture.detectChanges();
      expect(
        screen.queryByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.PLACEHOLDER'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode - Form Pre-population & Disabled Fields', () => {
    it('should pre-populate formModel with QUANTITATIVE data', async () => {
      const { view } = await setup(MOCK_QUANTITATIVE);
      view.fixture.detectChanges();
      const formValue = view.fixture.componentInstance.formModel();
      expect(formValue.unit).toBe(MOCK_QUANTITATIVE.unit);
      expect(formValue.measurementArea).toBe(MOCK_QUANTITATIVE.measurementArea);
      expect(formValue.measurements).toEqual(MOCK_QUANTITATIVE.measurements);
      expect(formValue.magnitudeCode).toBe(MOCK_QUANTITATIVE.magnitudeCode);
      expect(formValue.qualificationType).toBe('QUANTITATIVE');
      expect(formValue.measureUnit).toBe(MOCK_QUANTITATIVE.measureUnit);
      expect(formValue.uncertainty).toBe(MOCK_QUANTITATIVE.uncertainty);
      expect(formValue.accreditation).toBe(true);
    });

    it('should pre-populate formModel with QUALITATIVE data', async () => {
      const { view } = await setup(MOCK_QUALITATIVE);
      view.fixture.detectChanges();
      const formValue = view.fixture.componentInstance.formModel();
      expect(formValue.qualificationType).toBe('QUALITATIVE');
      expect(formValue.values).toHaveLength(1);
      expect(formValue.values[0].name.en).toBe('Value One');
      expect(formValue.values[0].name.es).toBe('Valor Uno');
    });

    it('should disable immutable fields in edit mode', async () => {
      const { view } = await setup(MOCK_QUANTITATIVE);
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      const measurementAreaInput = inputs[0];
      const magnitudeCodeInput = inputs[1];

      expect(await measurementAreaInput.isDisabled()).toBe(true);
      expect(await magnitudeCodeInput.isDisabled()).toBe(true);
    });

    it('should keep immutable fields enabled in create mode', async () => {
      const { view } = await setup(null);
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      const measurementAreaInput = inputs[0];
      const magnitudeCodeInput = inputs[1];

      expect(await measurementAreaInput.isDisabled()).toBe(false);
      expect(await magnitudeCodeInput.isDisabled()).toBe(false);
    });

    it('should show QUANTITATIVE section when edit data has QUANTITATIVE type', async () => {
      await setup(MOCK_QUANTITATIVE);
      expect(
        screen.getByPlaceholderText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should show QUALITATIVE section when edit data has QUALITATIVE type', async () => {
      await setup(MOCK_QUALITATIVE);
      expect(screen.getByText('MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.TITLE')).toBeInTheDocument();
    });
  });

  describe('Accreditation Checkbox', () => {
    it('should toggle accreditation from false to true', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      expect(instance.formModel().accreditation).toBe(false);
      instance.accreditationValueChanges();
      expect(instance.formModel().accreditation).toBe(true);
    });

    it('should toggle accreditation back to false on second call', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.accreditationValueChanges();
      instance.accreditationValueChanges();
      expect(instance.formModel().accreditation).toBe(false);
    });

    it('should reflect accreditation=true from edit data', async () => {
      const { view } = await setup(MOCK_QUANTITATIVE);
      view.fixture.detectChanges();
      expect(view.fixture.componentInstance.formModel().accreditation).toBe(true);
    });
  });

  describe('Grubbs Checkbox', () => {
    it('should toggle grubbs from false to true', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      expect(instance.formModel().grubbs).toBe(false);
      instance.grubbsValueChanges();
      expect(instance.formModel().grubbs).toBe(true);
    });

    it('should toggle grubbs back to false on second call', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.grubbsValueChanges();
      instance.grubbsValueChanges();
      expect(instance.formModel().grubbs).toBe(false);
    });
  });

  describe('Add Value Row (QUALITATIVE)', () => {
    it('should add one value row when onAddValueRow is called', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      const initialCount = instance.formModel().values.length;
      instance.onAddValueRow();
      expect(instance.formModel().values.length).toBe(initialCount + 1);
    });

    it('should add an empty value with active=true', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.onAddValueRow();
      const addedValue = instance.formModel().values.at(-1);
      expect(addedValue).toEqual({ code: '', name: { es: '', en: '' }, active: true });
    });

    it('should render new expansion panel after adding a value row in QUALITATIVE mode', async () => {
      const { view } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, qualificationType: 'QUALITATIVE' }));
      view.fixture.detectChanges();
      instance.onAddValueRow();
      view.fixture.detectChanges();
      const panels = screen.getAllByText(/MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.SUBTITLE/);
      expect(panels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dialog Actions & Form Submission', () => {
    it('should close dialog with false when cancel is clicked', async () => {
      const { user } = await setup(null);
      const cancelBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL' });
      await user.click(cancelBtn);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should not call close or service mutation when sendData is invoked with empty qualificationType', async () => {
      const { view, mockService } = await setup(null);
      const instance = view.fixture.componentInstance;
      (instance as unknown as { sendData(): void }).sendData();
      expect(mockService.create).not.toHaveBeenCalled();
      expect(mockService.update).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should call store.create with quantitative data excluding values in create mode', async () => {
      const { view, user, mockService } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set({
        ...VALID_QUANTITATIVE_FORM,
        equipmentTypes: ['DOPPLER_RADAR', '', ''],
      });
      view.fixture.detectChanges();

      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      await user.click(saveBtn);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit: 'TOPOGRAPHY',
          measurementArea: 'TOP_ATMOSPHERE',
          measurements: ['INITIAL_VELOCITY'],
          magnitudeCode: 'MG001',
          magnitude: { es: 'Magnitud', en: 'Magnitude' },
          qualificationType: 'QUANTITATIVE',
          measureUnit: 'M_S',
          minValue: 1,
          maxValue: 100,
          uncertainty: '±0.5',
          equipmentTypes: ['DOPPLER_RADAR'],
          active: true,
        }),
      );
      const payload = mockService.create.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('values');
    });

    it('should call store.create with qualitative data without generating code and setting grubbs false', async () => {
      const { view, user, mockService } = await setup(null);
      const instance = view.fixture.componentInstance;
      instance.formModel.set({
        ...VALID_QUALITATIVE_FORM,
        values: [{ code: '', name: { es: 'Valor Español', en: 'English Value' }, active: true }],
        equipmentTypes: ['', '', ''],
      });
      view.fixture.detectChanges();

      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      await user.click(saveBtn);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit: 'MUNITIONS',
          measurementArea: 'MUN_PROJECTILE',
          measurements: ['WEIGHT'],
          magnitudeCode: 'MG002',
          magnitude: { es: 'Magnitud', en: 'Magnitude' },
          qualificationType: 'QUALITATIVE',
          grubbs: false,
          equipmentTypes: null,
          values: [
            expect.objectContaining({
              name: { es: 'Valor Español', en: 'English Value' },
              active: true,
            }),
          ],
          active: true,
        }),
      );
      const payload = mockService.create.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('measureUnit');
      expect(payload).not.toHaveProperty('minValue');
      expect(payload).not.toHaveProperty('maxValue');
      expect(payload).not.toHaveProperty('uncertainty');
      expect((payload['values'] as Array<Record<string, unknown>>)[0]).not.toHaveProperty('code');
    });

    it('should call store.update with transformed data in edit mode', async () => {
      const { view, user, mockService } = await setup(MOCK_QUANTITATIVE);
      const instance = view.fixture.componentInstance;
      instance.formModel.update((m) => ({ ...m, uncertainty: '±0.8' }));
      view.fixture.detectChanges();

      const saveBtn = screen.getByRole('button', { name: 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' });
      await user.click(saveBtn);

      expect(mockService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'measure-1',
          uncertainty: '±0.8',
        }),
      );
    });
  });

  describe('Store Reaction Effects', () => {
    it('should reset upsert and close dialog with true when saveStatus becomes resolved', async () => {
      const { view, mockService } = await setup(null);
      mockService.saveResource._setStatus('resolved');
      view.fixture.detectChanges();

      expect(mockService.resetUpsert).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should reset upsert and close dialog with true when updateStatus becomes resolved', async () => {
      const { view, mockService } = await setup(MOCK_QUANTITATIVE);
      mockService.updateResource._setStatus('resolved');
      view.fixture.detectChanges();

      expect(mockService.resetUpsert).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
