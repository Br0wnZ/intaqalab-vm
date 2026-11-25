export type CalibryCalculationStatus = 'NO_DATA' | 'PENDING' | 'CALCULATING' | 'UP_TO_DATE' | 'ERROR';

export interface CalibryCalculation {
  status: CalibryCalculationStatus;
  calculatedAt: string | null;
  error: { code: string; message: string } | null;
}

const calculationsByTrial = new Map<string, CalibryCalculation>();

export function getCalibryCalculation(fireTrialId: string, fallback: CalibryCalculation): CalibryCalculation {
  const calculation = calculationsByTrial.get(fireTrialId) ?? fallback;
  return structuredClone(calculation);
}

export function recalculateCalibryCalculation(fireTrialId: string): CalibryCalculation {
  const calculation: CalibryCalculation = {
    status: 'UP_TO_DATE',
    calculatedAt: new Date().toISOString(),
    error: null,
  };
  calculationsByTrial.set(fireTrialId, calculation);
  return structuredClone(calculation);
}
