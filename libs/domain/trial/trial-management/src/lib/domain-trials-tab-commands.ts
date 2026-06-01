import type { TabTopProcess } from '@intaqalab/core';

import { injectionTokenComponentCreateModifyShell } from './components/create-shell/feature-trial-create-shell.component';
import { injectionTokenTrialViewDocument } from './components/trial-docs-shell/trial-docs-shell.component';
import { injectionTokenTrialViewComponent } from './components/view-shell/feature-trial-view-shell.component';

const TopTabTrialList: TabTopProcess = {
  label: 'TAPS_TOP.TRIAL_LIST',
  data: null,
  loader: () =>
    import('./components/list/components/shell/feature-trial-list-shell.component').then(
      (m) => m.FeatureTrialListShellComponent,
    ),
  injector: null,
  route: '/trial/list',
};

const TopTabTrialViewFactory = (id: number | string): TabTopProcess => ({
  label: 'TAPS_TOP.TRIAL',
  data: {
    id,
  },
  loader: () =>
    import('./components/view-shell/feature-trial-view-shell.component').then((m) => m.FeatureTrialViewShellComponent),
  injector: injectionTokenTrialViewComponent,
  route: `/trial/view/${id}`,
});

const TopTabTrialCreate: TabTopProcess = {
  label: 'TAPS_TOP.TRIAL_NEW',
  data: {
    id: null,
  },
  loader: () =>
    import('./components/create-shell/feature-trial-create-shell.component').then(
      (m) => m.FeatureTrialCreateShellComponent,
    ),
  injector: injectionTokenComponentCreateModifyShell,
  route: '/trial/new',
};

const TopTabTrialDocumentsViewFactory = (id: number | string): TabTopProcess => ({
  label: 'TAPS_TOP.TRIAL_DOCUMENT',
  data: {
    id,
  },
  loader: () =>
    import('./components/trial-docs-shell/trial-docs-shell.component').then((m) => m.TrialDocsShellComponent),
  injector: injectionTokenTrialViewDocument,
  route: `/trial/document/${id}`,
});

export const DomainTrialsTabsCommands = {
  TopTabTrialCreate,
  TopTabTrialViewFactory,
  TopTabTrialList,
  TopTabTrialDocumentsViewFactory,
};
