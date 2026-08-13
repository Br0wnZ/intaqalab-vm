import type {
  RatingCriteria as RatingCriteriaModel,
  RatingCriteriaUnits,
  TrialPlanningInfo,
  UpsertTrialPlanningInfo,
} from '../../utils-models/trial-planing-info.model';
import type { PlanningGeneralData } from './planning-general-data-form.component';

export function mapFormDataToUpsertModel(
  formValue: PlanningGeneralData,
  specimens: {
    specimenId: string;
    batch: string;
  }[],
  showRatingCriteria: boolean,
  ratingCriteria: RatingCriteriaModel | undefined,
  ratingCriteriaUnits: RatingCriteriaUnits | undefined,
): UpsertTrialPlanningInfo {
  const basePayload: UpsertTrialPlanningInfo = {
    goal: formValue.goal,
    specimens: specimens ?? [],
    planningUserId: formValue.planningUser,
    observations: formValue.observations,
    requirements: formValue.requeriments,
    additionalInfo: formValue.additionalInfo,
    dateControl: {
      maxEmissionDates: Number(formValue.maxEmissionDates),
      percentageTechnicalUnits: Number(formValue.percentageTechnicalUnits),
      percentageEndTrial: Number(formValue.percentageEndTrial),
      daysSignReport: Number(formValue.daysSignReport),
    },
    hypochelometricReviewBefore: formValue.hypochelometricReviewBefore,
    hypochelometricReviewAfter: formValue.hypochelometricReviewAfter,
  };

  // Solo incluir ratingCriteria y ratingCriteriaUnits si el checkbox está habilitado
  if (showRatingCriteria) {
    basePayload.ratingCriteria = ratingCriteria;
    basePayload.ratingCriteriaUnits = ratingCriteriaUnits || {
      speedUnit: 'M_S',
      pressureUnit: 'BAR',
    };
  }

  return basePayload;
}

export function mapDataToFormModel(data: TrialPlanningInfo, defaultRequirrements: string): PlanningGeneralData {
  return {
    goal: data.goal,
    specimen: data.specimens.map((s) => ({
      specimenId: s.specimenId,
      batch: s.batch ?? '',
    })),
    planningUser: data.planningUser.id,
    observations: data.observations,
    requeriments: data.requirements || defaultRequirrements,
    additionalInfo: data.additionalInfo,
    maxEmissionDates: String(data.dateControl.maxEmissionDates),
    percentageTechnicalUnits: String(data.dateControl.percentageTechnicalUnits),
    percentageEndTrial: String(data.dateControl.percentageEndTrial),
    daysSignReport: String(data.dateControl.daysSignReport),
    hypochelometricReviewBefore: !!data.hypochelometricReviewBefore,
    hypochelometricReviewAfter: !!data.hypochelometricReviewAfter,
  };
}
