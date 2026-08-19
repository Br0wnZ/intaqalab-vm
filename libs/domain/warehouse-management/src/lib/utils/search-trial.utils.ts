import type { PaginatedApiResponse } from '@intaqalab/models';

export type SearchByTrialNumberResponse = PaginatedApiResponse<{ id: string; trialNumber: string }>;
export const PLANNED_TRIAL_PATTERN = /^\d{0,4}\/\d\d$/;
