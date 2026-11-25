import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { CalibryCalculation } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

@Service()
export class CalibryCalculationService {
  readonly #http = inject(HttpClient);
  readonly #executionUrl = injectExecutionEndpoint();

  recalculateCalibryCalculation(fireTrialId: FireTrial['id']): Promise<CalibryCalculation> {
    return firstValueFrom(
      this.#http.post<CalibryCalculation>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'calibry-calculation'),
        null,
      ),
    );
  }
}
