export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ReorderRequest {
  ids: string[];
}
