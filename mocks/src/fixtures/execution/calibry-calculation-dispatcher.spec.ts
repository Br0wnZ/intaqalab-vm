import { describe, expect, it } from 'vitest';

import { getCalibryCalculation, recalculateCalibryCalculation } from './calibry-calculation-dispatcher';

describe('Calibry calculation dispatcher', () => {
  it('returns the last recalculation for the requested trial', () => {
    const trialId = 'trial-calibry-dispatcher-test';
    const fallback = { status: 'PENDING' as const, calculatedAt: null, error: null };

    const beforeCalculation = getCalibryCalculation(trialId, fallback);
    const recalculated = recalculateCalibryCalculation(trialId);
    const afterCalculation = getCalibryCalculation(trialId, fallback);

    expect(beforeCalculation).toEqual(fallback);
    expect(recalculated).toMatchObject({ status: 'UP_TO_DATE', error: null });
    expect(recalculated.calculatedAt).toEqual(expect.any(String));
    expect(afterCalculation).toEqual(recalculated);
  });
});
