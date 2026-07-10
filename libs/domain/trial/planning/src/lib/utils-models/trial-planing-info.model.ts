export type TrialPlanningInfo = {
  goal: string;
  specimens: Specimen[];
  planningUser: PlanningUser;
  hypochelometricReviewBefore?: boolean;
  hypochelometricReviewAfter?: boolean;
  observations: string;
  requirements: string;
  additionalInfo: string;
  dateControl: DateControl;
  stanagCriteria?: StanagCriterionRef[];
  ratingCriteriaUnits?: RatingCriteriaUnits;
  ratingCriteria?: RatingCriteria;
  /** Indica si la planificación cumple los requisitos para ser validada (pasar a PLANNED) */
  isValidable?: boolean;
  /** Motivos por los que la planificación no cumple los requisitos para ser validada */
  validationErrors?: string[];
};

type StanagCriterionRef = {
  id: string;
  name: string;
};

export type RatingCriteriaUnits = {
  speedUnit?: 'M_S' | 'KM_H' | string | null;
  pressureUnit?: 'BAR' | 'MPA' | 'KG_CM2' | string | null;
};

type RatingCriteriaRow = {
  useful1Min?: number | null;
  useful1Max?: number | null;
  uselessMin?: number | null;
  uselessMax?: number | null;
};

type RatingCriteriaRowInt = {
  useful1Min?: number | null;
  useful1Max?: number | null;
  uselessMin?: number | null;
  uselessMax?: number | null;
};

export type RatingCriteria = {
  v0c?: RatingCriteriaRow;
  v0cMean?: RatingCriteriaRow;
  v0cStdDev?: RatingCriteriaRow;
  p?: RatingCriteriaRow;
  pMean?: RatingCriteriaRow;
  projectile?: RatingCriteriaRowInt;
  fuse?: RatingCriteriaRowInt;
  primer?: RatingCriteriaRowInt;
};

type DateControl = {
  maxEmissionDates: number;
  percentageTechnicalUnits: number;
  percentageEndTrial: number;
  daysSignReport: number;
  // reportDeadlineDate: string;
};

type Specimen = {
  specimenId: string;
  batch?: string;
};

type PlanningUser = {
  id: string;
  name: string;
};

export type UpsertTrialPlanningInfo = {
  goal: string;
  specimens: { specimenId: string; batch: string }[];
  planningUserId: string;
  hypochelometricReviewBefore?: boolean;
  hypochelometricReviewAfter?: boolean;
  observations: string;
  requirements: string;
  additionalInfo: string;
  dateControl: DateControl;
  stanagCriteriaIds?: string[];
  ratingCriteriaUnits?: RatingCriteriaUnits;
  ratingCriteria?: RatingCriteria;
};
