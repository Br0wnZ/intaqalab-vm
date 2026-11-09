export type ExecutionTechnicalProfile =
  'VELOCITIES' | 'PRESSURES' | 'VIDEO' | 'TRAJECTOGRAPHY' | 'MUNITIONS' | 'ARMAMENT';

export type SeriesReadinessRequest = {
  isReady: boolean;
  observations?: string;
};

export type SeriesReadinessItem = {
  seriesId: string;
  isReady: boolean;
  observations?: string;
};

export type ProfileReadinessItem = {
  profile: ExecutionTechnicalProfile;
  seriesReadiness: SeriesReadinessItem[];
};

export type ProfilesReadinessResponse = {
  profilesReadiness: ProfileReadinessItem[];
};

export type ProfileReadinessRequest = {
  seriesReadiness: SeriesReadinessItem[];
};

export type ProfileReadinessSaveFailure = {
  profile: ExecutionTechnicalProfile;
  seriesId: string;
  error: unknown;
};

export type ProfileReadinessSaveResult = {
  updatedSeries: SeriesReadinessItem[];
  failures: ProfileReadinessSaveFailure[];
};

export type JltReadinessRequest = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
};

export type JltReadinessItem = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
};

export type ProfileReadinessFlag = {
  isReady: boolean;
  observations?: string | null;
};

export type TechnicalUnitsReadinessItem = {
  velocities?: ProfileReadinessFlag;
  pressures?: ProfileReadinessFlag;
  video?: ProfileReadinessFlag;
  trajectography?: ProfileReadinessFlag;
  munitions?: ProfileReadinessFlag;
  armament?: ProfileReadinessFlag;
};

export type JltPreparationData = {
  jltReadiness?: JltReadinessItem;
  technicalUnitsReadiness?: TechnicalUnitsReadinessItem;
  seriesIsReadyForExecution: boolean;
};

export type JltPreparationResponse = JltPreparationData | { series: Array<JltPreparationData & { seriesId: string }> };
