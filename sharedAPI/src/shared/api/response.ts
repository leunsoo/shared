export interface ApiSuccessResponse<T = unknown> {
  status: 'SUCCESS';
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  status: 'ERROR';
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
