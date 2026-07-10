export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface PlanningUser {
  id: string;
  username: string;
  lastName: string;
  firstName: string;
}

export type PlanningUsersResponse = PlanningUser[];

export interface PlanningUsersQueryParams {
  limit: number;
  search?: string;
}
