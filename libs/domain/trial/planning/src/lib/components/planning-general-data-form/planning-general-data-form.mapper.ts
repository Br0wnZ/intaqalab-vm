import type {
  RatingCriteria as RatingCriteriaModel,
  RatingCriteriaUnits,
  TrialPlanningInfo,
  UpsertTrialPlanningInfo,
} from '../../utils-models/trial-planing-info.model';
import type { PlanningGeneralData } from './planning-general-data-form.component';

export function mapFormDataToUpsertModel(
  formValue: PlanningGeneralData,
  specimens: UpsertTrialPlanningInfo['specimens'],
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
      maxEmissionDates: Number(formValue.maxEmissionDates ?? 0),
      percentageTechnicalUnits: Number(formValue.percentageTechnicalUnits ?? 0),
      percentageEndTrial: Number(formValue.percentageEndTrial ?? 0),
      daysSignReport: Number(formValue.daysSignReport ?? 0),
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
    maxEmissionDates: data.dateControl.maxEmissionDates ?? null,
    percentageTechnicalUnits: data.dateControl.percentageTechnicalUnits ?? null,
    percentageEndTrial: data.dateControl.percentageEndTrial ?? null,
    daysSignReport: data.dateControl.daysSignReport ?? null,
    hypochelometricReviewBefore: !!data.hypochelometricReviewBefore,
    hypochelometricReviewAfter: !!data.hypochelometricReviewAfter,
  };
}
