export type TrajectographyRadarOrientationData = {
  pieceX: number | null;
  pieceXUnit: string | null;
  pieceY: number | null;
  pieceYUnit: string | null;
  pieceZ: number | null;
  pieceZUnit: string | null;
  plannedImpactDistance: number | null;
  plannedImpactDistanceUnit: string | null;
  theoreticalInitialVelocity: number | null;
  theoreticalInitialVelocityUnit: string | null;
  theoreticalFlightTime: number | null;
  theoreticalFlightTimeUnit: string | null;
  fuseGraduation: number | null;
  fuseGraduationUnit: string | null;
  shootingAngle: number | null;
  shootingAngleUnit: string | null;
  nominalProjectileWeight: number | null;
  nominalProjectileWeightUnit: string | null;
};

export type TrajectographyRadarOrientationShot = {
  shotId: string;
  orientationData: TrajectographyRadarOrientationData;
};

export type TrajectographyRadarOrientationSeries = {
  seriesId: string;
  sameForAllShots: boolean;
  shots: TrajectographyRadarOrientationShot[];
};

export type TrajectographyRadarOrientationResponse = {
  sameForAllSeries: boolean;
  series: TrajectographyRadarOrientationSeries[];
};
