import type { LinesOfShot } from '@intaqalab/models';

export interface LinesOfShotViewState {
  list: LinesOfShot[];
  current: string | null;
}
