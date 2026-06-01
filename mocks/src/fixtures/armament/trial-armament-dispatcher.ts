import type { Request } from 'express';

import { getFixture } from '../../utils';

interface TrialArmamentResponse {
  series: SeriesArmamentData[];
}

interface SeriesArmamentData {
  seriesId: string;
  seriesName: string;
  shots: ShotArmamentData[];
}

interface ShotArmamentData {
  shotId: string;
  armament?: ArmamentData;
}

interface ArmamentData {
  weaponName?: string;
  weaponExternalId?: string;
  tubeName?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
}

interface ArmamentBulkUpdateRequest {
  shots: ShotArmamentUpdateRequest[];
}

interface ShotArmamentUpdateRequest {
  shotId: string;
  weaponExternalId?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  lifeUsefulPercentage?: number;
  observations?: string;
}

const trialArmamentStore: Map<string, TrialArmamentResponse> = new Map();

const defaultFixture = getFixture<TrialArmamentResponse>('fixtures/armament', 'trial-armament-fixture.json');

export function getArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;

  const storedData = trialArmamentStore.get(fireTrialId);
  if (storedData) {
    return storedData;
  }

  const clonedFixture = JSON.parse(JSON.stringify(defaultFixture)) as TrialArmamentResponse;
  trialArmamentStore.set(fireTrialId, clonedFixture);
  return clonedFixture;
}

export function updateArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;
  const body = req.body as ArmamentBulkUpdateRequest;

  let currentData = trialArmamentStore.get(fireTrialId);
  if (!currentData) {
    currentData = JSON.parse(JSON.stringify(defaultFixture)) as TrialArmamentResponse;
  }

  for (const shotUpdate of body.shots) {
    for (const series of currentData.series) {
      const shot = series.shots.find((s) => s.shotId === shotUpdate.shotId);
      if (shot) {
        if (!shot.armament) {
          shot.armament = {};
        }

        if (shotUpdate.weaponExternalId) {
          shot.armament.weaponExternalId = shotUpdate.weaponExternalId;
          shot.armament.weaponName = `Weapon ${shotUpdate.weaponExternalId.substring(0, 8)}`;
        }

        if (shotUpdate.tubeExternalId) {
          shot.armament.tubeExternalId = shotUpdate.tubeExternalId;
          shot.armament.tubeName = `Tube ${shotUpdate.tubeExternalId.substring(0, 8)}`;
        }

        if (shotUpdate.isInstrumented !== undefined) {
          shot.armament.isInstrumented = shotUpdate.isInstrumented;
        }

        if (shotUpdate.lifeUsefulPercentage !== undefined) {
          shot.armament.tubeLifePercentage = shotUpdate.lifeUsefulPercentage;
        }

        if (shotUpdate.observations !== undefined) {
          shot.armament.observations = shotUpdate.observations;
        }

        break;
      }
    }
  }

  trialArmamentStore.set(fireTrialId, currentData);
  return currentData;
}
