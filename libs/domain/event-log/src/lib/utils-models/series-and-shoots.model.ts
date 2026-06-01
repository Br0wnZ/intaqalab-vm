import type { EventLogUser } from './user.model';

export interface EventLogSeriesAndShootsFilters {
  dateStart: Date | '';
  dateEnd: Date | '';
  action: string[];
  user: string[];
  hardwareId: string;
  element: string[];
  visibleNumber: string;
  internalId: string;
}

export interface EventLogSeriesAndShootsSearch {
  dateStart?: string;
  dateEnd?: string;
  action?: string;
  userId?: string;
  hardwareId?: string;
  element?: string;
  visibleNumber?: string;
  internalId?: string;
}

export interface EventLogSeriesAndShootsResponse {
  date: string;
  action: 'create' | 'edit';
  user: EventLogUser;
  hardwareId: string;
  element: 'serie' | 'shoot';
  visibleNumber: string;
  internalId: string;
}
