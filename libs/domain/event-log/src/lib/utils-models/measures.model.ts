import type { EventLogUser } from './user.model';

export interface EventLogMeasuresFilters {
  dateStart: Date | string;
  dateEnd: Date | string;
  action: string[];
  user: string[];
  hardwareId: string;
  instrument: string[];
  value: string;
  measure: string[];
  shoot: string;
  serie: string[];
}

export interface EventLogMeasuresSearch {
  dateStart?: string;
  dateEnd?: string;
  action?: string;
  user?: string;
  hardwareId?: string;
  instrument?: string;
  value?: string;
  measure?: string;
  shoot?: string;
  serie?: string;
}

export interface EventLogMeasuresResponse {
  date: string;
  action: 'create' | 'edit';
  user: EventLogUser;
  hardwareId: string;
  instrument: string;
  value: string;
  measure: string;
  shoot: string;
  serie: string;
}
