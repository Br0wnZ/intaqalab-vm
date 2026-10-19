import type { SpeedUnitEnum } from '@intaqalab/models';

export interface PropellantChargeAdjustmentQuery {
  shotIds: string[];
  nominalSpeed: number;
  nominalSpeedUnit?: SpeedUnitEnum;
}

export interface PropellantChargeAdjustmentPoint {
  shotId: string;
  powderWeight: number;
  powderWeightUnit: 'G';
  velocity: number;
  velocityUnit: SpeedUnitEnum;
}

export interface PropellantChargeAdjustmentRegression {
  slope: number;
  intercept: number;
  rSquared?: number | null;
}

export interface PropellantChargeAdjustmentResponse {
  points: PropellantChargeAdjustmentPoint[];
  regression?: PropellantChargeAdjustmentRegression | null;
  powderWeightAtNominalSpeed?: number | null;
  adjustedPowderWeight?: number | null;
}

export interface PropellantChargeAdjustmentConfiguration {
  configurationId: string;
  name: string;
  shotIds: string[];
  nominalSpeed: number;
  nominalSpeedUnit?: SpeedUnitEnum;
}

export interface VelocityUniformityQuery {
  configurationId: string;
  shotIds: string[];
}

export interface VelocityUniformityPoint {
  shotId: string;
  powderWeight: number | null;
  velocity: number;
}

export interface VelocityUniformityResponse {
  points: VelocityUniformityPoint[];
  nominalSpeed: number;
  velocityUnit: SpeedUnitEnum;
  meanVelocity?: number | null;
  minimumVelocity?: number | null;
  maximumVelocity?: number | null;
  standardDeviation?: number | null;
  slope?: number | null;
  intercept?: number | null;
  adjustedPowderWeight?: number | null;
  powderWeightAtNominalSpeed?: number | null;
  powderWeightUnit: 'G';
}
