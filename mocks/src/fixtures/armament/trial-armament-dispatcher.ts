import type { Request } from 'express';
import { randomUUID } from 'node:crypto';

import { getFixture } from '../../utils';
import { getAcceptedChanges, resolveRevision } from '../trial-planning/planning-revision';
import { projectArmament } from '../trial-planning/planning-revision-projectors';

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
  id: string;
  weaponType?: string;
  weaponName?: string;
  /** integer según Swagger */
  weaponExternalId?: number;
  tubeName?: string;
  /** integer según Swagger */
  tubeExternalId?: number;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
}

interface ArmamentBulkUpdateRequest {
  shots: ShotArmamentUpdateRequest[];
}

interface ShotArmamentUpdateRequest {
  shotId: string;
  weaponType?: string;
  /** integer según Swagger */
  weaponExternalId?: number;
  /** integer según Swagger */
  tubeExternalId?: number;
  isInstrumented?: boolean;
  lifeUsefulPercentage?: number;
  observations?: string;
}

const trialArmamentStore: Map<string, TrialArmamentResponse> = new Map();

const defaultFixture = getFixture<TrialArmamentResponse>('fixtures/armament', 'trial-armament-fixture.json');

export function getArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;

  const baseline = getBaselineArmament(fireTrialId);
  if (resolveRevision(req) === 'baseline') {
    return baseline;
  }
  return projectArmament(baseline, getAcceptedChanges(fireTrialId, 'ARMAMENT'));
}

function getBaselineArmament(fireTrialId: string): TrialArmamentResponse {
  const storedData = trialArmamentStore.get(fireTrialId);
  if (storedData) {
    return storedData;
  }

  const clonedFixture = structuredClone(defaultFixture);
  trialArmamentStore.set(fireTrialId, clonedFixture);
  return clonedFixture;
}

export function updateArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;
  const body = req.body as ArmamentBulkUpdateRequest;

  let currentData = trialArmamentStore.get(fireTrialId);
  if (!currentData) {
    currentData = structuredClone(defaultFixture);
  }

  for (const shotUpdate of body.shots) {
    for (const series of currentData.series) {
      const shot = series.shots.find((s) => s.shotId === shotUpdate.shotId);
      if (shot) {
        if (!shot.armament) {
          shot.armament = { id: randomUUID() };
        }

        if (shotUpdate.weaponType !== undefined) {
          shot.armament.weaponType = shotUpdate.weaponType;
        }

        if (shotUpdate.weaponExternalId) {
          shot.armament.weaponExternalId = shotUpdate.weaponExternalId;
          shot.armament.weaponName = `Weapon ${shotUpdate.weaponExternalId}`;
        }

        if (shotUpdate.tubeExternalId) {
          shot.armament.tubeExternalId = shotUpdate.tubeExternalId;
          shot.armament.tubeName = `Tube ${shotUpdate.tubeExternalId}`;
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
