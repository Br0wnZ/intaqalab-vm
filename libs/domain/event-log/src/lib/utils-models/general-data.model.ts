import type { EventLogUser } from './user.model';

export interface EventLogGeneralDataFilters {
  dateStart: Date | '';
  dateEnd: Date | '';
  action: string[];
  user: string[];
  hardwareId: string;
  value: string;
}

export interface EventLogGeneralDataSearch {
  dateStart?: string;
  dateEnd?: string;
  action?: string;
  userId?: string;
  hardwareId?: string;
  value?: string;
}

export interface EventLogGeneralDataResponse {
  date: string;
  action: 'create' | 'edit';
  user: EventLogUser;
  hardwareId: string;
  value: string;
}
