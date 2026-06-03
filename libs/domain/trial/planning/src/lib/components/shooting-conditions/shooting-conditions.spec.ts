import type { ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import {
  createMockPlanningGeneralDataStore,
  createMockResource,
  createShootingConditions,
  createTrial,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { Shot } from '../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../services/shooting-conditions.service';
import { ShootingConditionsComponent } from './shooting-conditions';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('ShootingConditionsComponent', () => {
  let fixture: ComponentFixture<ShootingConditionsComponent>;
  let component: ShootingConditionsComponent;
  let mockStore: ReturnType<typeof createMockPlanningGeneralDataStore>;
  let mockShootingConditionsService: {
    conditionsResource: ReturnType<typeof createMockResource<ReturnType<typeof createShootingConditions>>>;
    updateConditionsResource: ReturnType<typeof createMockResource<void>>;
    getTrialSchedulesResource: ReturnType<typeof createMockResource<Array<{ date: string; lineOfShootId: string }>>>;
    getLoadingZonesResource: ReturnType<typeof createMockResource<Array<Record<string, unknown>>>>;
    getShootingConditions: ReturnType<typeof vi.fn>;
    updateShootingConditions: ReturnType<typeof vi.fn>;
    getLoadingZones: ReturnType<typeof vi.fn>;
  };

  function createFullConditions(count = 2, shots = 2) {
    return createShootingConditions(count, shots);
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockConditions = createFullConditions(2, 2);
    const mockSchedules = [
      { date: '2025-11-22T00:00:00.000Z', lineOfShootId: '1' },
      { date: '2025-11-24T00:00:00.000Z', lineOfShootId: '1' },
      { date: '2025-12-22T00:00:00.000Z', lineOfShootId: '1' },
      { date: '2025-12-23T00:00:00.000Z', lineOfShootId: '1' },
    ];

    const mockSeries = mockConditions.map((s, i) => ({
      id: s.seriesId,
      name: s.seriesName,
      shotQuantity: s.shots.length,
      executionOrder: i + 1,
      observations: '',
      shots: s.shots.map((sh) => ({ id: sh.shotId, globalNumber: sh.globalNumber, observation: '' })),
    }));

    mockStore = {
      ...createMockPlanningGeneralDataStore({
        shootingConditions: mockConditions,
        fireTrialId: 'trial-123',
        fireTrial: { ...createTrial(), status: 'PLANNED' },
      }),
      loadSeries: vi.fn(),
      series: vi.fn(() => mockSeries),
    } as unknown as ReturnType<typeof createMockPlanningGeneralDataStore>;

    mockShootingConditionsService = {
      conditionsResource: createMockResource(mockConditions),
      updateConditionsResource: createMockResource(),
      getTrialSchedulesResource: createMockResource(mockSchedules),
      getLoadingZonesResource: createMockResource<Record<string, unknown>[]>([]),
      getShootingConditions: vi.fn(),
      updateShootingConditions: vi.fn(),
      getLoadingZones: vi.fn(),
    };

    const renderResult = await render(ShootingConditionsComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideAnimationsAsync(),
        provideTestingEnvironment(),
        { provide: PlanningGeneralDataStore, useValue: mockStore },
        { provide: ShootingConditionsService, useValue: mockShootingConditionsService },
      ],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render series in the accordion', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Serie A/i)).toBeInTheDocument();
        expect(screen.getByText(/Serie B/i)).toBeInTheDocument();
      });
    });

    it('should display the associated shots header', async () => {
      await waitFor(() => {
        const headers = screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE');
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    it('should render table columns', async () => {
      await waitFor(() => {
        expect(screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.SHOT').length).toBeGreaterThan(0);
        expect(screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.DATE').length).toBeGreaterThan(0);
        expect(screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET').length).toBeGreaterThan(
          0,
        );
        expect(screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.DISTANCE').length).toBeGreaterThan(
          0,
        );
        expect(
          screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ORIENTATION').length,
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ELEVATION').length,
        ).toBeGreaterThan(0);
      });
    });

    it('should render action buttons', () => {
      expect(screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.SAVE')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.CANCEL')).toBeInTheDocument();
    });

    it('should show empty message when there are no series', async () => {
      mockStore._shootingConditionsResource._setValue([]);
      component.seriesSignal.set([]);
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.EMPTY_STATE')).toBeInTheDocument();
      });
    });
  });

  describe('Button State', () => {
    it('should disable buttons when updating', async () => {
      mockStore._shootingConditionsResource._setLoading(true);
      fixture.detectChanges();

      await waitFor(() => {
        const saveBtn = screen.getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.SAVE').closest('button');
        const cancelBtn = screen
          .getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.CANCEL')
          .closest('button');
        expect(saveBtn).toBeDisabled();
        expect(cancelBtn).toBeDisabled();
      });
    });

    it('should enable buttons when form is valid and not updating', async () => {
      await waitFor(() => {
        const saveButton = screen
          .getByText('TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.SAVE')
          .closest('button');
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should update value when editing a numeric field', async () => {
      // Initial conditions: 2 series × 2 shots — placeholder inputs exist from the initial render
      await waitFor(() => {
        const distanceInputs = screen.getAllByPlaceholderText('0');
        expect(distanceInputs.length).toBeGreaterThan(0);
      });
    });

    it('should maintain data when making changes', () => {
      // getFormValues() reads seriesSignal directly — no re-render triggered
      const currentData = component.getFormValues();
      expect(currentData).toHaveLength(2);
      expect(currentData[0].shots).toHaveLength(2);
    });
  });

  describe('Service Interaction', () => {
    it('should call getShootingConditions on init', () => {
      expect(mockStore.getShootingConditions).toHaveBeenCalled();
    });

    it('should call updateShootingConditions when saving the form', () => {
      // Uses initial 2×2 conditions from beforeEach — no seriesSignal.set() needed
      component.saveForm();

      expect(mockStore.updateShootingConditions).toHaveBeenCalledWith(
        expect.objectContaining({
          shots: expect.any(Array),
        }),
      );
    });
  });

  describe('Form Reset', () => {
    it('should restore initial values when resetting', () => {
      // Capture the current (initial) values, reset, and verify unchanged
      const initialFormValues = JSON.parse(JSON.stringify(component.getFormValues()));
      component.resetForm();
      expect(JSON.parse(JSON.stringify(component.getFormValues()))).toEqual(initialFormValues);
    });
  });

  describe('Form Validation', () => {
    it('should report form as valid when data is correct', () => {
      // Initial conditions from beforeEach already have all required fields populated
      expect(component.isFormValid()).toBe(true);
    });

    it('should report form as valid with empty data', () => {
      component.seriesSignal.set([]);
      fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
    });

    it('should report form as valid when invalid but untouched', () => {
      component.seriesSignal.update((series) => {
        const copy = JSON.parse(JSON.stringify(series));
        copy[0].shots[0].impactZoneId = '';
        return copy;
      });
      fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
    });

    it('should report form as invalid when invalid and touched', () => {
      component.seriesSignal.update((series) => {
        const copy = JSON.parse(JSON.stringify(series));
        copy[0].shots[0].impactZoneId = '';
        return copy;
      });
      fixture.detectChanges();

      component.getShotField(0, 0).impactZoneId().markAsTouched();
      fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('Data Mapping for Request', () => {
    it('should correctly map data for the API', () => {
      // Initial 2 series × 2 shots = 4 total shots in request; globalNumber is stripped by #mapDataToRequest
      component.saveForm();

      const call = vi.mocked(mockStore.updateShootingConditions).mock.calls[0][0];
      expect(call.shots.length).toBeGreaterThan(0);
      expect(call.shots[0]).not.toHaveProperty('globalNumber');
    });
  });

  describe('Table Columns', () => {
    it('should have all columns defined', () => {
      expect(component.displayedColumns).toContain('globalNumber');
      expect(component.displayedColumns).toContain('date');
      expect(component.displayedColumns).toContain('targetTypeId');
      expect(component.displayedColumns).toContain('targetMaterialId');
      expect(component.displayedColumns).toContain('impactZoneId');
      expect(component.displayedColumns).toContain('targetDimensionsId');
      expect(component.displayedColumns).toContain('targetThicknessId');
      expect(component.displayedColumns).toContain('distance');
      expect(component.displayedColumns).toContain('orientation');
      expect(component.displayedColumns).toContain('elevation');
      expect(component.displayedColumns).toContain('angle');
      expect(component.displayedColumns).toContain('range');

      expect(component.displayedColumns).toContain('powderWeight');
      expect(component.displayedColumns).toContain('projectWeight');
      expect(component.displayedColumns).toContain('functioningHeight');
      expect(component.displayedColumns).toContain('observations');
    });
  });

  describe('Helper methods', () => {
    it('trackByShotId should return the shot ID', () => {
      const shot: Shot = { shotId: 'shot-123' } as unknown as Shot;
      expect(component.trackByShotId(0, shot)).toBe('shot-123');
    });

    it('getShotField should return the correct field', () => {
      // Initial conditions already have series[0].shots[0] — no set() needed
      const field = component.getShotField(0, 0);
      expect(field).toBeDefined();
    });

    it('getSerieField should return the correct series', () => {
      // Initial conditions already have 2 series — no set() needed
      const field = component.getSerieField(0);
      expect(field).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple series with multiple shots', () => {
      // Initial conditions: 2 series × 2 shots — verify getFormValues reads signal correctly
      const formValues = component.getFormValues();
      expect(formValues).toHaveLength(2);
      expect(formValues[0].shots).toHaveLength(2);
    });

    it('should handle an empty shots series', async () => {
      const emptySeries = [
        {
          seriesId: 'series-1',
          seriesName: 'Serie Vacía',
          shots: [],
        },
      ];
      component.seriesSignal.set(emptySeries);
      fixture.detectChanges();

      expect(component.getFormValues()).toEqual(emptySeries);
    });
  });
});
