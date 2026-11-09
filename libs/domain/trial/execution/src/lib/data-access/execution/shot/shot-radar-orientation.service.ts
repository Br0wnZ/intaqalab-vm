import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { TrajectographyRadarOrientationResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface RadarOrientationParams {
  fireTrialId: FireTrial['id'];
  radarId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ShotRadarOrientationService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getRadarTrayectographyOrientationParams = signal<RadarOrientationParams | null>(null);

  readonly radarTrayectographyOrientationResource = httpResource<TrajectographyRadarOrientationResponse>(() => {
    const params = this.#getRadarTrayectographyOrientationParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'trajectography-radar', 'orientation'),
      method: 'GET',
    };
  });

  getRadarTrayectographyOrientation(fireTrialId: FireTrial['id'], radarId: string | null): void {
    this.#getRadarTrayectographyOrientationParams.set({ fireTrialId, radarId });
  }
}
