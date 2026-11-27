import { describe, expect, it } from 'vitest';

import {
  EquipmentMagnitudeTagEnum,
  getEquipmentSelectorState,
  updateEquipmentSelectorState,
} from './equipment-selector-store';

describe('Equipment selector store mock', () => {
  const trialId = 'trial-equipment-all-measures-test';

  it('returns all 12 measurement groups in default state', () => {
    const state = getEquipmentSelectorState(trialId);

    const expectedGroups = Object.values(EquipmentMagnitudeTagEnum);
    expect(state).toHaveLength(expectedGroups.length);

    const returnedGroups = state.map((group) => group.measurementGroup);
    for (const expected of expectedGroups) {
      expect(returnedGroups).toContain(expected);
    }
  });

  it('contains selections for each measurement group', () => {
    const state = getEquipmentSelectorState(trialId);

    for (const group of state) {
      expect(group.selections.length).toBeGreaterThan(0);
      for (const selection of group.selections) {
        expect(selection.equipmentItemId).toBeDefined();
        expect(selection.categoryId).toBeDefined();
      }
    }
  });

  it('updates and persists equipment selector state', () => {
    const initial = getEquipmentSelectorState(trialId);
    const updated = updateEquipmentSelectorState(trialId, initial);
    expect(updated).toHaveLength(initial.length);
  });
});
