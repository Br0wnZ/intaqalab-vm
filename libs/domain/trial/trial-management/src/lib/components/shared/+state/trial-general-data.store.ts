import { httpResource } from '@angular/common/http';
import { effect, inject, signal } from '@angular/core';
import type { FireTrial } from '@intaqalab/models';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { DataTrialCreateModifyService } from '../../../services/data-trial-create-modify-service';
import type { TrialCreateModifyForm } from '../components/form/trial-create.model';
import { mapTrialDetailsToState } from './state-helper';

type TrialGeneralDataState = {
  trialId: string | null;
  trial: TrialCreateModifyForm | null;
  isLoading: boolean;
};

const initialState: TrialGeneralDataState = {
  trialId: null,
  trial: null,
  isLoading: false,
};

export const TrialGeneralDataStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const dataService = inject(DataTrialCreateModifyService);
    const trialIdSignal = signal<{ id: string } | null>(null);
    const trialResource = httpResource<FireTrial>(() => {
      const value = trialIdSignal();
      if (!value) return undefined;
      return {
        url: `${dataService.url}/${value.id}`,
        method: 'GET',
      };
    });

    effect(() => {
      const trialDetails: FireTrial = trialResource.value() as FireTrial;
      if (trialDetails) {
        const trial = mapTrialDetailsToState(trialDetails);
        patchState(store, { trial });
      }
    });

    return {
      setTrialId(id: string) {
        patchState(store, { trialId: id });
        trialIdSignal.set({ id });
      },
    };
  }),
);
