import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { ShotCameraOrientationResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface ShotCameraOrientationParams {
  fireTrialId: FireTrial['id'];
  cameraId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShotCameraOrientationService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotCameraOrientationParams = signal<ShotCameraOrientationParams | null>(null);

  readonly shotCameraOrientationResource = httpResource<ShotCameraOrientationResponse>(() => {
    const params = this.#getShotCameraOrientationParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'cameras', params.cameraId, 'orientation'),
      method: 'GET',
    };
  });

  getShotCameraOrientation(fireTrialId: FireTrial['id'], cameraId: number): void {
    this.#getShotCameraOrientationParams.set({ fireTrialId, cameraId });
  }
}
