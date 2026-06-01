import { DomainTrialsTabsCommands as Commands } from './lib/domain-trials-tab-commands';
import { routes } from './lib/domain-trials.routes';

export default routes;
export const DomainTrialsTabsCommands = Commands;

export { TrialTableSelectorModalService } from './lib/trial-table-selector/trial-table-selector-modal.service';
export { TrialTableSelectorModalShellComponent } from './lib/trial-table-selector/components/shell/trial-table-selector-modal-shell.component';

export { TrialScheduleService } from './lib/trial-scheduler/trial-schedule.service';
export { TrialSchedulerModalShellComponent } from './lib/trial-scheduler/components/shell/trial-scheduler-modal-shell.component';

export { TrialPersmissionsService } from './lib/permissions/trial-persmissions.service';
export { TrialGeneralDataStore } from '../src/lib/components/shared/+state/trial-general-data.store';

export { TrialTransitionsService } from './lib/services/trial-transitions.service';
export { TrialTypeService } from './lib/services/trial-type.service';
