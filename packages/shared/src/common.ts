/**
 * Paginated list response wrapper.
 * Matches the API convention: { items, total, page, perPage }
 * from plans/01_App/03_api_design.md.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Error response shape matching NestJS default format.
 * Returned on 4xx/5xx responses.
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
