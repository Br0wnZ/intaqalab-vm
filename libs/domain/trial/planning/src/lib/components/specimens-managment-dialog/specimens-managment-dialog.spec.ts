import type { ComponentFixture } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createMockPlanningGeneralDataStore, createSpecimens } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SpecimensManagmentDialog } from './specimens-managment-dialog';

describe('SpecimensManagmentDialog', () => {
  let fixture: ComponentFixture<SpecimensManagmentDialog>;
  let component: SpecimensManagmentDialog;
  let mockStore: ReturnType<typeof createMockPlanningGeneralDataStore>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const specimensResponse = createSpecimens(4);
    specimensResponse.items[0] = {
      ...specimensResponse.items[0],
      label: 'Munición inerte 105mm',
      type: 'denomination',
    };
    specimensResponse.items[1] = {
      ...specimensResponse.items[1],
      label: 'Cañón 120mm L44',
      type: 'weapon',
    };
    specimensResponse.items[2] = {
      ...specimensResponse.items[2],
      label: 'Tubo de ensayo T-1',
      type: 'tube',
    };
    specimensResponse.items[3] = {
      ...specimensResponse.items[3],
      label: 'Probeta de ensayo A-105',
      type: 'denomination',
    };

    mockStore = createMockPlanningGeneralDataStore({ specimens: specimensResponse });
    mockDialogRef = { close: vi.fn() };

    const renderResult = await render(SpecimensManagmentDialog, {
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
      componentProviders: [{ provide: PlanningGeneralDataStore, useValue: mockStore }],
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

    it('should render dialog title', () => {
      expect(screen.getByText(/SPECIMENS_MANAGMENT_DIALOG.TITLE/i)).toBeInTheDocument();
    });

    it('should render specimen input field', () => {
      expect(screen.getByPlaceholderText(/SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_PLACEHOLDER/i)).toBeInTheDocument();
    });

    it('should render save and cancel buttons', () => {
      expect(screen.getByRole('button', { name: /SPECIMENS_MANAGMENT_DIALOG.SAVE/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /SPECIMENS_MANAGMENT_DIALOG.CANCEL/i })).toBeInTheDocument();
    });

    it('should render add button when a specimen is selected', () => {
      const specimens = component.specimens();
      component.formModel.update((current) => ({
        ...current,
        specimenId: specimens[0]?.id ?? '',
      }));
      fixture.detectChanges();

      expect(screen.getByRole('button', { name: /Añadir/i })).toBeInTheDocument();
    });
  });

  describe('Autocomplete Behavior', () => {
    it('should filter specimens when typing in search', async () => {
      const input = screen.getByPlaceholderText(/SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_PLACEHOLDER/i);
      const user = userEvent.setup();

      await user.click(input);
      await user.type(input, 'Munición');

      fixture.detectChanges();

      const denominationOptions = component.filteredDenominationOptions();
      expect(denominationOptions.some((s) => s.label?.includes('Munición inerte 105mm'))).toBe(true);
    });

    it('should update search term when typing', async () => {
      const input = screen.getByPlaceholderText(/SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_PLACEHOLDER/i);
      const user = userEvent.setup();

      await user.click(input);
      await user.type(input, 'Tubo');

      expect(component.searchTerm()).toBe('Tubo');
    });

    it('should enable autocomplete after search', async () => {
      const input = screen.getByPlaceholderText(/SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_PLACEHOLDER/i);
      const user = userEvent.setup();

      expect(component.autocompleteEnabled()).toBe(false);

      await user.click(input);
      await user.type(input, 'T');

      expect(component.autocompleteEnabled()).toBe(true);
    });
  });

  describe('Form State', () => {
    it('should have selectedOption when a specimen is selected', () => {
      expect(component.selectedOption()).toBe(null);

      const specimens = component.specimens();
      component.formModel.update((current) => ({
        ...current,
        specimenId: specimens[0]?.id ?? '',
      }));

      expect(component.selectedOption()).not.toBe(null);
    });

    it('should have empty initial form model', () => {
      expect(component.formModel().specimenId).toBe('');
      expect(component.formModel().serialNumber).toBe('');
      expect(component.formModel().lot).toBe('');
    });

    it('should have empty selected specimens initially', () => {
      expect(component.selectedSpecimens()).toEqual([]);
    });
  });

  describe('Store Interaction', () => {
    it('should call loadSpecimens on initialization', () => {
      expect(mockStore.loadSpecimens).toHaveBeenCalled();
    });

    it('should get specimens from store', () => {
      const specimens = component.specimens();
      expect(specimens.length).toBeGreaterThan(0);
    });
  });

  describe('Button Actions', () => {
    it('should close dialog without result on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Selection Management', () => {
    it('should reset selection correctly', () => {
      component.formModel.update((current) => ({
        ...current,
        specimenId: 'test-id',
        serialNumber: 'SN123',
        lot: 'LOT456',
      }));
      component.searchTerm.set('Test search');
      component.autocompleteEnabled.set(true);

      component.resetSelection();

      expect(component.formModel().specimenId).toBe('');
      expect(component.formModel().serialNumber).toBe('');
      expect(component.formModel().lot).toBe('');
      expect(component.searchTerm()).toBe('');
      expect(component.autocompleteEnabled()).toBe(false);
    });

    it('should remove specimen from selection', () => {
      component.selectedSpecimens.set([
        { id: 'specimen-1', label: 'Specimen 1', type: 'denomination' },
        { id: 'specimen-2', label: 'Specimen 2', type: 'weapon' },
      ]);

      component.removeSelection('specimen-1');

      expect(component.selectedSpecimens()).toHaveLength(1);
      expect(component.selectedSpecimens()[0].id).toBe('specimen-2');
    });
  });

  describe('Helper Methods', () => {
    it('should get specimen label correctly', () => {
      const specimenWithLabel = { id: '1', label: 'Test Label', name: { es: 'Nombre', en: 'Name' } };
      expect(component.getSpecimenLabel(specimenWithLabel)).toBe('Test Label');
    });

    it('should use name.es when label is empty', () => {
      const specimenWithName = { id: '1', label: '', name: { es: 'Nombre ES', en: 'Name EN' } };
      expect(component.getSpecimenLabel(specimenWithName)).toBe('Nombre ES');
    });

    it('should use string name when label is empty and name is string', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const specimenWithStringName = { id: '1', label: '', name: 'String Name' } as any;
      expect(component.getSpecimenLabel(specimenWithStringName)).toBe('String Name');
    });
  });

  describe('Conditional Fields by Specimen Type', () => {
    it('should show serial number field for WEAPON type', () => {
      const specimens = component.specimens();
      const weaponSpecimen = specimens.find((s) => s.type === 'weapon');
      if (weaponSpecimen) {
        component.formModel.update((current) => ({
          ...current,
          specimenId: weaponSpecimen.id,
        }));
        fixture.detectChanges();

        expect(component.showSerialNumberField()).toBe(true);
        expect(component.showLotField()).toBe(false);
      }
    });

    it('should show serial number field for TUBE type', () => {
      const specimens = component.specimens();
      const tubeSpecimen = specimens.find((s) => s.type === 'tube');
      if (tubeSpecimen) {
        component.formModel.update((current) => ({
          ...current,
          specimenId: tubeSpecimen.id,
        }));
        fixture.detectChanges();

        expect(component.showSerialNumberField()).toBe(true);
        expect(component.showLotField()).toBe(false);
      }
    });

    it('should show lot field for MUNITION (denomination) type', () => {
      const specimens = component.specimens();
      const munitionSpecimen = specimens.find((s) => s.type === 'denomination');
      if (munitionSpecimen) {
        component.formModel.update((current) => ({
          ...current,
          specimenId: munitionSpecimen.id,
        }));
        fixture.detectChanges();

        expect(component.showLotField()).toBe(true);
        expect(component.showSerialNumberField()).toBe(false);
      }
    });
  });

  describe('Filtered Options', () => {
    it('should filter weapon and tube options by search term', () => {
      component.searchTerm.set('cañón');

      const filtered = component.filteredWeaponAndTubeOptions();
      expect(filtered.every((s) => s.label?.toLowerCase().includes('cañón'))).toBe(true);
    });

    it('should filter denomination options by search term', () => {
      component.searchTerm.set('munición');

      const filtered = component.filteredDenominationOptions();
      expect(filtered.every((s) => s.label?.toLowerCase().includes('munición'))).toBe(true);
    });

    it('should separate specimens by type in filtered options', () => {
      component.searchTerm.set('');

      const weaponAndTube = component.filteredWeaponAndTubeOptions();
      const denominations = component.filteredDenominationOptions();

      expect(weaponAndTube.every((s) => s.type === 'weapon' || s.type === 'tube')).toBe(true);
      expect(denominations.every((s) => s.type === 'denomination')).toBe(true);
    });
  });

  describe('Change Detection (hasChanges)', () => {
    it('should have no changes initially', () => {
      expect(component.hasChanges()).toBe(false);
    });

    it('should detect changes when a specimen is added', () => {
      expect(component.hasChanges()).toBe(false);

      component.selectedSpecimens.set([{ id: 'specimen-1', label: 'Specimen 1', type: 'denomination' }]);

      expect(component.hasChanges()).toBe(true);
    });

    it('should detect changes when a specimen is removed', () => {
      const initial = [
        { id: 'specimen-1', label: 'Specimen 1', type: 'denomination' as const },
        { id: 'specimen-2', label: 'Specimen 2', type: 'weapon' as const },
      ];
      component.selectedSpecimens.set(initial);
      fixture.detectChanges();

      component.selectedSpecimens.set([initial[0]]);

      expect(component.hasChanges()).toBe(true);
    });

    it('should detect changes when lot/serialNumber is modified', () => {
      const initial = [{ id: 'specimen-1', label: 'Specimen 1', type: 'denomination' as const, lot: 'LOT001' }];
      component.selectedSpecimens.set(initial);
      fixture.detectChanges();

      component.selectedSpecimens.set([{ id: 'specimen-1', label: 'Specimen 1', type: 'denomination', lot: 'LOT002' }]);

      expect(component.hasChanges()).toBe(true);
    });
  });

  describe('Specimen Overwrite', () => {
    it('should overwrite existing specimen when added again', async () => {
      const specimens = component.specimens();
      const specimen = specimens[0];

      component.selectedSpecimens.set([{ id: specimen.id, label: 'Specimen', type: 'denomination', lot: 'LOT001' }]);

      expect(component.selectedSpecimens()).toHaveLength(1);
      expect(component.selectedSpecimens()[0].lot).toBe('LOT001');

      component.selectedSpecimens.update((list) => {
        const entry = { id: specimen.id, label: 'Specimen', type: 'denomination' as const, lot: 'LOT002' };
        const filtered = list.filter((i) => i.id !== entry.id);
        return [...filtered, entry];
      });

      expect(component.selectedSpecimens()).toHaveLength(1);
      expect(component.selectedSpecimens()[0].lot).toBe('LOT002');
    });
  });
});
