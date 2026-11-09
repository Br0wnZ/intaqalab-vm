import { describe, expect, it } from 'vitest';

import type { TrialOverpressureInfoRequest } from '../../models/trial-overpressure-info.models';
import { getTrialOverpressureInfo, isTrialOverpressureInfoRequest, setTrialOverpressureInfo } from './execution-store';

describe('Trial overpressure info mock', () => {
  const centerId = 'center-001';
  const firstTrialId = 'e2e1c7e2-1b2a-4c3d-8e1f-1a2b3c4d5e6f';
  const secondTrialId = 'f3f2c8f3-2c3b-5d4e-9f2a-2b3c4d5e6f7a';
  const body: TrialOverpressureInfoRequest = {
    maximumPressure: 300.123456789,
    minimumPressure: 0,
    referencePressure: 233.971234567,
    pressureUnit: 'MPA',
  };

  it('persists by trial, computes target and warns about unavailable Calibry', () => {
    const secondTrial = setTrialOverpressureInfo(centerId, secondTrialId, { ...body, maximumPressure: 400 });
    const saved = setTrialOverpressureInfo(centerId, firstTrialId, body);
    expect(saved.overpressureInfo.targetPressure).toBe(150.0617283945);
    expect(saved.overpressureInfo.safetyPressure).toBeNull();
    expect(saved.warnings[0]?.code).toBe('SAFETY_PRESSURE_UNAVAILABLE');
    expect(getTrialOverpressureInfo(centerId, firstTrialId)).toEqual(saved);
    expect(getTrialOverpressureInfo(centerId, secondTrialId)).toEqual(secondTrial);
    expect(() => getTrialOverpressureInfo('other-center', firstTrialId)).toThrow('TRIAL_NOT_FOUND');
  });

  it('returns not found for missing configuration or unknown trial', () => {
    expect(() => getTrialOverpressureInfo(centerId, 'a4a3d9a4-3d4c-6e5f-0a3b-3c4d5e6f7a8b')).toThrow(
      'OVERPRESSURE_INFO_NOT_FOUND',
    );
    expect(() => setTrialOverpressureInfo(centerId, 'missing-trial', body)).toThrow('TRIAL_NOT_FOUND');
  });

  it('replaces configuration idempotently and protects stored data from mutation', () => {
    const first = setTrialOverpressureInfo(centerId, firstTrialId, body);
    expect(setTrialOverpressureInfo(centerId, firstTrialId, body)).toEqual(first);
    first.overpressureInfo.maximumPressure = 999;
    expect(getTrialOverpressureInfo(centerId, firstTrialId).overpressureInfo.maximumPressure).toBe(300.123456789);
  });

  it.each([null, -1, Infinity, NaN, '3,46'])('rejects invalid pressure %s', (value) => {
    expect(isTrialOverpressureInfoRequest({ ...body, maximumPressure: value })).toBe(false);
  });

  it('rejects missing fields, extra derived fields, invalid units and inverted limits', () => {
    expect(isTrialOverpressureInfoRequest({ maximumPressure: 1 })).toBe(false);
    expect(isTrialOverpressureInfoRequest({ ...body, targetPressure: 5 })).toBe(false);
    expect(isTrialOverpressureInfoRequest({ ...body, pressureUnit: 'psi' })).toBe(false);
    expect(isTrialOverpressureInfoRequest({ ...body, pressureUnit: ['MPA'] })).toBe(false);
    expect(isTrialOverpressureInfoRequest({ ...body, minimumPressure: 500 })).toBe(false);
    expect(isTrialOverpressureInfoRequest({ ...body, maximumPressure: 0 })).toBe(true);
  });
});
