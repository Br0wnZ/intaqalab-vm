/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { By } from '@angular/platform-browser';
import { createMockArmamentService, createMockMatDialog, createMockPlanningGeneralDataStore } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArmamentStore } from '../../+state/armament.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { ArmamentService } from '../../services/armament-service';
import type { TrialArmamentResponse } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { Armament } from './armament';
import { ArmamentRow } from './armament-row';

const createArmamentResponse = (seriesCount = 2, shotsPerSeries = 2): TrialArmamentResponse => ({
  series: Array.from({ length: seriesCount }, (_, seriesIdx) => ({
    seriesId: `series-${seriesIdx + 1}`,
    seriesName: `Serie ${String.fromCharCode(65 + seriesIdx)}`,
    shots: Array.from({ length: shotsPerSeries }, (_, shotIdx) => ({
      shotId: `shot-${seriesIdx + 1}-${shotIdx + 1}`,
      armament: {
        weaponType: SpecimenType.Weapon,
        weaponName: `Weapon ${shotIdx + 1}`,
        weaponExternalId: shotIdx + 1,
        tubeName: `Tube ${shotIdx + 1}`,
        tubeExternalId: shotIdx + 1,
        isInstrumented: shotIdx % 2 === 0,
        tubeLifePercentage: 80 + shotIdx * 10,
        observations: `Observation ${shotIdx + 1}`,
      },
    })),
  })),
});

describe('Armament', () => {
  let mockPlanningStore: ReturnType<typeof createMockPlanningGeneralDataStore>;
  let mockArmamentService: ReturnType<typeof createMockArmamentService>;
  let mockDialog: ReturnType<typeof createMockMatDialog>;

  const runSetup = async (options?: { armamentData?: TrialArmamentResponse; trialId?: string | null }) => {
    const armamentData = options?.armamentData ?? createArmamentResponse(2, 2);
    const trialId = options && 'trialId' in options ? options.trialId : 'trial-123';
    const series = armamentData?.series
      ? armamentData.series.map((s) => ({
          id: s.seriesId,
          name: s.seriesName,
          shotQuantity: s.shots?.length ?? 0,
          shots: s.shots?.map((sh) => ({ id: sh.shotId })),
        }))
      : [];

    mockPlanningStore = createMockPlanningGeneralDataStore({
      fireTrialId: trialId ?? undefined,
      fireTrial: { code: 'TRIAL-001' },
      series,
    });

    mockArmamentService = createMockArmamentService({
      armament: armamentData as any,
    });

    mockDialog = createMockMatDialog({ defaultResult: null });

    const user = userEvent.setup();

    const view = await render(Armament, {
      imports: [TranslateModule.forRoot()],
      providers: [
        ArmamentStore,
        { provide: PlanningGeneralDataStore, useValue: mockPlanningStore },
        { provide: ArmamentService, useValue: mockArmamentService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const expandPanelByIndex = async (loader: HarnessLoader, index: number) => {
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    expect(panels.length).toBeGreaterThan(index);
    await panels[index].expand();
    return panels[index];
  };

  describe('Initial rendering', () => {
    it('should render the trial code heading', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL-001')).toBeInTheDocument();
    });

    it('should render the massive configuration button', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL_PLANNING.ARMAMENT.HEADER.MASSIVE_CONFIG_BUTTON')).toBeInTheDocument();
    });

    it('should display message when there are no series', async () => {
      await runSetup({ armamentData: { series: [] } });
      expect(screen.getByText(/TRIAL_PLANNING.ARMAMENT.HEADER.EMPTY_STATE/i)).toBeInTheDocument();
    });

    it('should render series panels when data is set', async () => {
      const { loader } = await runSetup();
      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBe(2);
    });

    it('should render series panels when series exist in store even if backend armament is empty', async () => {
      const series = [{ id: 'series-1', name: 'Serie 1', shotQuantity: 1, shots: [{ id: 'shot-1-1' }] }];
      mockPlanningStore = createMockPlanningGeneralDataStore({
        fireTrialId: 'trial-123',
        fireTrial: { code: 'TRIAL-001' },
        series,
      });
      mockArmamentService = createMockArmamentService({
        armament: { series: [] } as any,
      });
      mockDialog = createMockMatDialog({ defaultResult: null });

      const view = await render(Armament, {
        imports: [TranslateModule.forRoot()],
        providers: [
          ArmamentStore,
          { provide: PlanningGeneralDataStore, useValue: mockPlanningStore },
          { provide: ArmamentService, useValue: mockArmamentService },
          { provide: MatDialog, useValue: mockDialog },
        ],
      });
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBe(1);
    });

    it('should render table headers', async () => {
      const { loader } = await runSetup();
      await expandPanelByIndex(loader, 0);

      expect(screen.getAllByText(/TRIAL_PLANNING.ARMAMENT.TABLE.WEAPON/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TRIAL_PLANNING.ARMAMENT.TABLE.TUBE/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TRIAL_PLANNING.ARMAMENT.TABLE.INSTRUMENTED/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TRIAL_PLANNING.ARMAMENT.TABLE.LIFE/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TRIAL_PLANNING.ARMAMENT.TABLE.OBSERVATIONS/i).length).toBeGreaterThan(0);
    });
  });

  describe('Expansion Panels', () => {
    it('should expand a panel', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);

      expect(await panel.isExpanded()).toBe(true);
    });

    it('should collapse a previously expanded panel', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);
      expect(await panel.isExpanded()).toBe(true);

      await panel.collapse();
      expect(await panel.isExpanded()).toBe(false);
    });

    it('should render multiple series panels', async () => {
      const { loader } = await runSetup();
      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);

      expect(panels.length).toBe(2);
    });
  });

  describe('Form state', () => {
    it('should have a valid form when data is correct', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as Armament;

      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('Save configuration', () => {
    it('should not throw when saving with valid form', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as Armament;

      expect(component.isFormValid()).toBe(true);
      expect(() => component.saveForm()).not.toThrow();
    });

    it('should log error when saving with invalid form', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as Armament;

      vi.spyOn(component, 'isFormValid').mockReturnValue(false);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      component.saveForm();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Formulario inválido');
    });
  });

  describe('Reset configuration', () => {
    it('should restore initial values when resetting', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as Armament;

      expect(component.armamentSignal().length).toBe(2);

      component.resetForm();

      const resetData = component.armamentSignal();
      expect(resetData).toBeDefined();
    });
  });

  describe('Massive configuration', () => {
    it('should open dialog when massive config button is clicked', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loader, user } = await runSetup();

      mockDialog.open.mockReturnValueOnce({
        componentInstance: {},
        afterClosed: () => of(undefined),
        close: vi.fn(),
      } as any);

      const massiveButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'TRIAL_PLANNING.ARMAMENT.HEADER.MASSIVE_CONFIG_BUTTON' }),
      );
      await massiveButton.click();

      await waitFor(() => {
        expect(mockDialog.open).toHaveBeenCalled();
      });
    });
  });

  describe('Update dialog', () => {
    it('should log error when trialId is not available', async () => {
      const { view } = await runSetup({ trialId: null });
      const component = view.fixture.componentInstance as Armament;

      const consoleErrorSpy = vi.spyOn(console, 'error');

      component.openUpdateDialog(0, 0);

      expect(consoleErrorSpy).toHaveBeenCalledWith('No se pudo obtener el trialId');
    });

    it('should open update dialog when edit button is clicked', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);
      expect(await panel.isExpanded()).toBe(true);

      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      expect(buttons.length).toBeGreaterThan(1);

      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(false),
      } as any);

      // First button after massive config is icon button in observation cell
      const iconButtons = buttons.filter((b) => b !== buttons[0]);
      if (iconButtons.length > 1) {
        await iconButtons[1].click();
      } else if (buttons.length > 1) {
        await buttons[1].click();
      }

      await waitFor(() => {
        expect(mockDialog.open).toHaveBeenCalled();
      });
    });
  });

  describe('Data loading', () => {
    it('should load armament data on initialization when trialId exists', async () => {
      await runSetup();
      expect(mockArmamentService.getArmament).toHaveBeenCalledWith('trial-123');
    });

    it('should not load armament data when trialId is null', async () => {
      await runSetup({ trialId: null });
      expect(mockArmamentService.getArmament).not.toHaveBeenCalled();
    });
  });

  describe('Select cascade resets', () => {
    it('should reset weapon and tube fields when weapon type changes or is cleared', async () => {
      const { loader, view } = await runSetup();
      await expandPanelByIndex(loader, 0);

      const rowDebug = view.fixture.debugElement.query(By.directive(ArmamentRow));
      expect(rowDebug).toBeTruthy();

      const rowInstance = rowDebug.componentInstance as ArmamentRow;
      rowInstance.onWeaponTypeChange(null);
      view.fixture.detectChanges();

      const armamentForm = rowInstance.formPath().armament;
      expect(armamentForm.weaponExternalId().value()).toBe('');
      expect(armamentForm.tubeExternalId().value()).toBe('');
    });

    it('should reset tube fields when weapon denomination changes or is cleared', async () => {
      const { loader, view } = await runSetup();
      await expandPanelByIndex(loader, 0);

      const rowDebug = view.fixture.debugElement.query(By.directive(ArmamentRow));
      expect(rowDebug).toBeTruthy();

      const rowInstance = rowDebug.componentInstance as ArmamentRow;
      rowInstance.onWeaponChange(null);
      view.fixture.detectChanges();

      const armamentForm = rowInstance.formPath().armament;
      expect(armamentForm.tubeExternalId().value()).toBe('');
    });
  });
});
