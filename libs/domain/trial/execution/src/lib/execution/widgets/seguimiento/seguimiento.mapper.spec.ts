import { describe, expect, it } from 'vitest';

import type { PlanningSeriesItem, ShotMeasurementsResponse } from '../../../services/execution.service';
import { mapShotMeasurements } from './seguimiento.mapper';

describe('mapShotMeasurements', () => {
  it('maps measurements by piezo position and resolves planned shot numbers', () => {
    const response: ShotMeasurementsResponse = {
      series: [
        {
          seriesId: 'series-1',
          shots: [
            {
              shotId: 'shot-1',
              powderWeights: [{ balanceId: 1, weight: 41.2, weightUnit: 'G' }],
              projectileWeights: [{ balanceId: 2, weight: 261.5, weightUnit: 'G' }],
              velocities: [{ radarDopplerId: 1, antennaId: 4, initialVelocity: 850.5, initialVelocityUnit: 'M_S' }],
              piezoPressures: [
                {
                  position: 'CLOSING',
                  piezoelectricSensorId: 12,
                  amplifierId: 15,
                  dataAcquisitionSystemId: 20,
                  maxPressure: 3200.5,
                  maxPressureUnit: 'BAR',
                },
                {
                  position: 'HALF',
                  piezoelectricSensorId: 13,
                  amplifierId: 16,
                  dataAcquisitionSystemId: 21,
                  maxPressure: 2800,
                  maxPressureUnit: 'BAR',
                },
                {
                  position: 'SHELL',
                  piezoelectricSensorId: 14,
                  amplifierId: 17,
                  dataAcquisitionSystemId: 22,
                  maxPressure: 2500.75,
                  maxPressureUnit: 'BAR',
                },
                {
                  position: 'OTHER',
                  piezoelectricSensorId: 18,
                  amplifierId: 19,
                  dataAcquisitionSystemId: 23,
                  maxPressure: 2400.4,
                  maxPressureUnit: 'BAR',
                },
              ],
            },
          ],
        },
      ],
    };
    const planningSeries: PlanningSeriesItem[] = [
      { id: 'series-1', name: 'Serie 1', shots: [{ id: 'shot-1', globalNumber: 7 }] },
    ];

    const mapped = mapShotMeasurements(response, planningSeries);

    expect(mapped).toEqual([
      {
        serieId: 'series-1',
        serieLabel: 'Serie 1',
        rows: [
          {
            disparo: 7,
            wcValues: [41.2],
            wpValues: [261.5],
            v0Values: [850.5],
            v0c: 850.5,
            pManomValues: [],
            pManomMean: null,
            pMaxCierre: [3200.5],
            pMaxIntermedio: [2800],
            pMaxCulote: [2500.75],
            pMaxOther: [2400.4],
          },
        ],
      },
    ]);
  });

  it('falls back to response order when planning data is unavailable', () => {
    const response: ShotMeasurementsResponse = {
      series: [
        {
          seriesId: 'series-1',
          shots: [{ shotId: 'shot-1', powderWeights: [], projectileWeights: [], velocities: [], piezoPressures: [] }],
        },
      ],
    };

    expect(mapShotMeasurements(response, [])).toEqual([
      {
        serieId: 'series-1',
        serieLabel: 'series-1',
        rows: [
          {
            disparo: 1,
            wcValues: [],
            wpValues: [],
            v0Values: [],
            v0c: null,
            pManomValues: [],
            pManomMean: null,
            pMaxCierre: [],
            pMaxIntermedio: [],
            pMaxCulote: [],
            pMaxOther: [],
          },
        ],
      },
    ]);
  });
});
