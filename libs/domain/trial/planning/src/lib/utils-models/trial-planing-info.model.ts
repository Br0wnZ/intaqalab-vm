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
  ratingCriteria?: RatingCriteria;
};

type StanagCriterionRef = {
  id: string;
  name: string;
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

type RatingCriteria = {
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
  ratingCriteria?: RatingCriteria;
};
