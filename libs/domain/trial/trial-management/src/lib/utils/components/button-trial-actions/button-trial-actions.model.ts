import type { Role } from '@intaqalab/core';
import type { HasStatus, TrialStatus } from '@intaqalab/models';

export type ButtonTrialActionsConfiguration<Option = string> = {
  roles?: Role[];
  status?: TrialStatus[];
  label: string;
  option: Option;
}[];

export type ButtonTrialActionsInput<Option = string> = {
  label: string;
  trial: HasStatus;
  list: ButtonTrialActionsConfiguration<Option>;
};
