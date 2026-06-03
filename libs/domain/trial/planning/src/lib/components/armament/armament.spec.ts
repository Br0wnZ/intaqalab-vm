/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { createMockArmamentService, createMockMatDialog, createMockPlanningGeneralDataStore } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArmamentStore } from '../../+state/armament.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { ArmamentService } from '../../services/armament-service';
import type { TrialArmamentResponse } from '../../utils-models/armament.model';
import { Armament } from './armament';

const createArmamentResponse = (seriesCount = 2, shotsPerSeries = 2): TrialArmamentResponse => ({
  series: Array.from({ length: seriesCount }, (_, seriesIdx) => ({
    seriesId: `series-${seriesIdx + 1}`,
    seriesName: `Serie ${String.fromCharCode(65 + seriesIdx)}`,
    shots: Array.from({ length: shotsPerSeries }, (_, shotIdx) => ({
      shotId: `shot-${seriesIdx + 1}-${shotIdx + 1}`,
      armament: {
        weaponName: `Weapon ${shotIdx + 1}`,
        weaponExternalId: `weapon-${shotIdx + 1}`,
        tubeName: `Tube ${shotIdx + 1}`,
        tubeExternalId: `tube-${shotIdx + 1}`,
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

    mockPlanningStore = createMockPlanningGeneralDataStore({
      fireTrialId: trialId ?? undefined,
      fireTrial: { code: 'TRIAL-001' },
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

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, container, loader };
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
      const { container } = await runSetup();
      const heading = container.querySelector('h2');
      expect(heading).toBeTruthy();
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
      const { view } = await runSetup();

      const button = screen.getByText('TRIAL_PLANNING.ARMAMENT.HEADER.MASSIVE_CONFIG_BUTTON').closest('button')!;
      fireEvent.click(button);
      view.fixture.detectChanges();

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
      const { container, loader, view } = await runSetup();
      await expandPanelByIndex(loader, 0);

      await waitFor(() => {
        const expandedPanel = container.querySelector('mat-expansion-panel.mat-expanded');
        expect(expandedPanel).toBeTruthy();
      });

      // Each observations cell has 2 buttons: [info, edit] per shot row
      // querySelectorAll('td button') returns them in DOM order
      const tdButtons = container.querySelectorAll('td button');
      const editButton = tdButtons[1] as HTMLElement | null; // index 1 = edit button for first row

      expect(editButton).toBeTruthy();

      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(false),
      } as any);

      fireEvent.click(editButton!);
      view.fixture.detectChanges();

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
});
