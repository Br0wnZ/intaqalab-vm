import type { Request } from 'express';

import { getFixture, getPagination, paginate } from '../../utils';
import type { PaginatedApiResponse } from '../../utils.model';

type FireTrial = {
  id: string;
  centerId: string;
  trialNumber: string;
  status: string;
  statusReason: string;
  linkedTrial: LinkedTrial;
  associatedTrial: LinkedTrial;
  fireTrialType: FireTrialType;
  client: FireTrialType;
  clientReference: string;
  requestedDate: string;
  description: string;
  observations: string;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
};

type FireTrialType = {
  id: string;
  name: string;
};

type LinkedTrial = {
  id: string;
  trialNumber: string;
  description: string;
};

type TrialSearchFilters = {
  trialNumber?: string;
  fireTrialTypeId?: string;
  year?: number;
  clientId?: string;
  content?: string;
  searchTerm?: string;
  status?: string | string[];
};

export function trialsDispatch(req: Request): PaginatedApiResponse<FireTrial> {
  const trials = getFixture('fixtures/trials', 'trials-fixture.json');
  let statusFilter: string | string[] | undefined = req.query.status?.toString();
  if (statusFilter && typeof statusFilter === 'string' && statusFilter.includes(',')) {
    statusFilter = statusFilter.split(',').map((s) => s.trim());
  }
  const contentOrSearchTerm =
    req.query.content?.toString().toLowerCase() || req.query.searchTerm?.toString().toLowerCase();

  const filters: TrialSearchFilters = {
    year: req.query.year ? Number(req.query.year) : undefined,
    clientId: req.query.clientId?.toString(),
    content: contentOrSearchTerm,
    fireTrialTypeId: req.query.fireTrialTypeId?.toString(),
    trialNumber: req.query.trialNumber?.toString(),
    status: statusFilter,
  };

  const paginationParams = getPagination(req);

  console.log('Trials dispatcher - Query params:', req.query);
  console.log('Trials dispatcher - Filters:', filters);
  console.log('Trials dispatcher - Total trials before filter:', trials.length);

  const filtered = trials.filter(
    (trial: FireTrial) =>
      (!filters.year || new Date(trial.createdAt).getFullYear() === filters.year) &&
      (!filters.clientId || trial.client.id === filters.clientId) &&
      (!filters.content ||
        trial.trialNumber.toLowerCase().includes(filters.content) ||
        trial.description.toLowerCase().includes(filters.content)) &&
      (!filters.fireTrialTypeId || trial.fireTrialType.id === filters.fireTrialTypeId) &&
      (!filters.trialNumber || trial.trialNumber.toLowerCase().includes(filters.trialNumber.toLowerCase())) &&
      (!filters.status ||
        (Array.isArray(filters.status) ? filters.status.includes(trial.status) : trial.status === filters.status)),
  );

  return paginate(filtered, paginationParams);
}

export function trialsDispatchById(id: string) {
  const trials = getFixture('fixtures/trials', 'trials-fixture.json');
  const trial = trials.find((trial: FireTrial) => trial.id === id);
  return trial || null;
}
