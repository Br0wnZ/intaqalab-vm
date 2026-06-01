import type { EventLogUser } from './user.model';

export interface EventLogDocumentsFilters {
  type: string[];
  dateStart: Date | '';
  dateEnd: Date | '';
  action: string[];
  user: string[];
  hardwareId: string;
}

export interface EventLogDocumentsSearch {
  type?: string;
  dateStart?: string;
  dateEnd?: string;
  action?: string;
  userId?: string;
  hardwareId?: string;
}

export interface EventLogDocumentsResponse {
  title: string;
  type: EventLogDocumentType;
  date: string;
  user: EventLogUser;
  hardwareId: string;
  accessCount: number;
  action: 'add' | 'view' | 'modify' | 'link' | 'delete';
}

export interface EventLogDocumentType {
  id: string;
  name: string;
}
