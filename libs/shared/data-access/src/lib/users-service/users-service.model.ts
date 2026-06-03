export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface UserListResponse {
  page: number;
  pageSize: number;
  totalElements: number;
  items: User[];
}

export interface UserQueryParams {
  page: number;
  pageSize: number;
}
