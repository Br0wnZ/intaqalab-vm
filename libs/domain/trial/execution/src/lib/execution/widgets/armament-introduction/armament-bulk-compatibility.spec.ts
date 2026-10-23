import type { TrialArmamentResponse } from '@intaqalab/data-access-planning';
import { describe, expect, it } from 'vitest';

import { getBulkCompatibleArmamentSeries } from './armament-bulk-compatibility';

describe('getBulkCompatibleArmamentSeries', () => {
  it('accepts string IDs from the backend and groups verification and initial series together', () => {
    const planning: TrialArmamentResponse = JSON.parse(`{
      "series": [
        {
          "seriesId": "assurance", "seriesName": "Serie aseguramiento",
          "shots": [
            { "shotId": "4", "armament": { "weaponExternalId": "449", "tubeExternalId": null } },
            { "shotId": "5", "armament": { "weaponExternalId": "449", "tubeExternalId": null } },
            { "shotId": "6", "armament": { "weaponExternalId": "450", "tubeExternalId": null } }
          ]
        },
        {
          "seriesId": "verification", "seriesName": "Serie verificación",
          "shots": [
            { "shotId": "7", "armament": { "weaponExternalId": "446", "tubeExternalId": "447" } },
            { "shotId": "8", "armament": { "weaponExternalId": "446", "tubeExternalId": "447" } },
            { "shotId": "9", "armament": { "weaponExternalId": "446", "tubeExternalId": "447" } }
          ]
        },
        {
          "seriesId": "initial", "seriesName": "Serie inicial",
          "shots": [
            { "shotId": "1", "armament": { "weaponExternalId": 446, "tubeExternalId": 447 } },
            { "shotId": "2", "armament": { "weaponExternalId": "446", "tubeExternalId": "447" } },
            { "shotId": "3", "armament": { "weaponExternalId": "446", "tubeExternalId": "447" } }
          ]
        }
      ]
    }`);
    const groups = getBulkCompatibleArmamentSeries(planning);
    expect([...groups.keys()]).toEqual(['verification', 'initial']);
    expect(groups.get('verification')).toBe(groups.get('initial'));
  });

  it('excludes empty series and shots with missing armament or equipment IDs', () => {
    const planning: TrialArmamentResponse = {
      series: [
        { seriesId: 'empty', seriesName: 'Empty', shots: [] },
        { seriesId: 'missing', seriesName: 'Missing', shots: [{ shotId: '1' }] },
        {
          seriesId: 'weapon-only',
          seriesName: 'Weapon only',
          shots: [{ shotId: '1', armament: { weaponExternalId: 1 } }],
        },
        { seriesId: 'tube-only', seriesName: 'Tube only', shots: [{ shotId: '1', armament: { tubeExternalId: 2 } }] },
      ],
    };
    expect(getBulkCompatibleArmamentSeries(planning).size).toBe(0);
    expect(getBulkCompatibleArmamentSeries(null).size).toBe(0);
  });

  it('excludes series when any shot has a different weapon, tube or missing armament', () => {
    const armament = { weaponExternalId: 1, tubeExternalId: 2 };
    const planning: TrialArmamentResponse = {
      series: [
        {
          seriesId: 'weapon',
          seriesName: 'Weapon',
          shots: [
            { shotId: '1', armament },
            { shotId: '2', armament: { ...armament, weaponExternalId: 3 } },
          ],
        },
        {
          seriesId: 'tube',
          seriesName: 'Tube',
          shots: [
            { shotId: '1', armament },
            { shotId: '2', armament: { ...armament, tubeExternalId: 3 } },
          ],
        },
        { seriesId: 'missing', seriesName: 'Missing', shots: [{ shotId: '1', armament }, { shotId: '2' }] },
      ],
    };
    expect(getBulkCompatibleArmamentSeries(planning).size).toBe(0);
  });

  it('groups homogeneous series only when both planned equipment IDs match', () => {
    const armament = { weaponExternalId: 1, tubeExternalId: 2 };
    const planning: TrialArmamentResponse = {
      series: [
        {
          seriesId: 'first',
          seriesName: 'First',
          shots: [
            { shotId: '1', armament },
            { shotId: '2', armament },
          ],
        },
        { seriesId: 'same', seriesName: 'Same', shots: [{ shotId: '3', armament }] },
        {
          seriesId: 'different',
          seriesName: 'Different',
          shots: [{ shotId: '4', armament: { ...armament, tubeExternalId: 3 } }],
        },
      ],
    };
    const groups = getBulkCompatibleArmamentSeries(planning);
    expect(groups.size).toBe(3);
    expect(groups.get('first')).toBe(groups.get('same'));
    expect(groups.get('first')).not.toBe(groups.get('different'));
  });
});
