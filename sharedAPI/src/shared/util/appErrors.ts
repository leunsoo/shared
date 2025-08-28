// Result 패턴용 단순한 에러 인터페이스
export interface AppError {
  type: string; // 'USER_NOT_FOUND', 'NETWORK_ERROR', 'TOKEN_EXPIRED' 등
  message: string; // 사용자 친화적 메시지
  retryable?: boolean; // 재시도 가능 여부
  silent?: boolean; // 사용자에게 표시하지 않을지 여부
  statusCode?: number; // HTTP 상태 코드 (있는 경우)
  code?: string; // 서버에서 제공하는 에러 코드
  timestamp?: string; // 에러 발생 시간
}

// 에러 타입 상수
export const ERROR_TYPES = {
  // ============================================ 400대 에러 ============================================
  BAD_REQUEST: 'BAD_REQUEST', // 400
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  FORBIDDEN: 'FORBIDDEN', // 403
  NOT_FOUND: 'NOT_FOUND', // 404
  CONFLICT: 'CONFLICT', // 409
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY', // 422
  TOO_MANY_REQUEST: 'TOO_MANY_REQUEST', // 429

  // ============================================ 500대 에러 ============================================
  INTERNER_SERVER_ERROR: 'INTERNER_SERVER_ERROR', // 500
  BAD_GATEWAY: 'BAD_GATEWAY', // 502
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE', // 503
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT', // 504

  // ============================================ 커스텀 에러 ============================================
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // 토큰 관리
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',

  //비즈니스 로직 관련 에러
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

// 에러 메시지 매핑 (errors.ts에서 통합)
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_TYPES.BAD_REQUEST]: '400 에러 메시지를 입력해주세요',
  [ERROR_TYPES.UNAUTHORIZED]: '401 에러 메시지를 입력해주세요',
  [ERROR_TYPES.FORBIDDEN]: '403 에러 메시지를 입력해주세요',
  [ERROR_TYPES.NOT_FOUND]: '404 에러 메시지를 입력해주세요',
  [ERROR_TYPES.CONFLICT]: '409 에러 메시지를 입력해주세요',
  [ERROR_TYPES.UNPROCESSABLE_ENTITY]: '422 에러 메시지를 입력해주세요',
  [ERROR_TYPES.TOO_MANY_REQUEST]: '429 에러 메시지를 입력해주세요',
  [ERROR_TYPES.INTERNER_SERVER_ERROR]: '500 에러 메시지를 입력해주세요',
  [ERROR_TYPES.BAD_GATEWAY]: '502 에러 메시지를 입력해주세요',
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: '503 에러 메시지를 입력해주세요',
  [ERROR_TYPES.GATEWAY_TIMEOUT]: '504 에러 메시지를 입력해주세요',

  [ERROR_TYPES.USER_NOT_FOUND]: 'USER_NOT_FOUND 에러 메시지를 입력해주세요',
  [ERROR_TYPES.TOKEN_NOT_FOUND]: 'TOKEN_NOT_FOUND 에러 메시지를 입력해주세요',
  [ERROR_TYPES.TOKEN_REFRESH_FAILED]: 'TOKEN_REFRESH_FAILED 에러 메시지를 입력해주세요',
  [ERROR_TYPES.BUSINESS_ERROR]: 'BUSINESS_ERROR 에러 메시지를 입력해주세요',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'UNKNOWN_ERROR 에러 메시지를 입력해주세요',
};

// HTTP 상태 코드를 에러 타입으로 매핑 (errors.ts에서 통합)
export const mapHttpStatusToErrorType = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    400: ERROR_TYPES.BAD_REQUEST,
    401: ERROR_TYPES.UNAUTHORIZED,
    403: ERROR_TYPES.FORBIDDEN,
    404: ERROR_TYPES.NOT_FOUND,
    409: ERROR_TYPES.CONFLICT,
    422: ERROR_TYPES.UNPROCESSABLE_ENTITY,
    429: ERROR_TYPES.TOO_MANY_REQUEST,
    500: ERROR_TYPES.INTERNER_SERVER_ERROR,
    502: ERROR_TYPES.BAD_GATEWAY,
    503: ERROR_TYPES.SERVICE_UNAVAILABLE,
    504: ERROR_TYPES.GATEWAY_TIMEOUT,
  };

  return statusMap[statusCode] || ERROR_TYPES.INTERNER_SERVER_ERROR;
};

// 편리한 에러 생성 헬퍼 함수
export const createAppError = (type: string, message: string, options: Partial<AppError> = {}): AppError => ({
  type,
  message,
  timestamp: new Date().toISOString(),
  ...options,
});

// 자주 사용되는 에러들을 위한 특화 헬퍼들
export const createAuthError = (type: string, message: string, retryable = false): AppError =>
  createAppError(type, message, { retryable, silent: false });

export const createNetworkError = (message = '네트워크 연결을 확인해주세요'): AppError =>
  createAppError(ERROR_TYPES.INTERNER_SERVER_ERROR, message, { retryable: true, silent: false });

export const createHttpError = (statusCode: number, message?: string): AppError => {
  const errorType = mapHttpStatusToErrorType(statusCode);
  const errorMessage = message || ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];

  return createAppError(errorType, errorMessage, {
    statusCode,
    retryable: statusCode >= 500 || statusCode === 429,
    silent: false,
  });
};

// 재시도 가능한 에러인지 확인하는 헬퍼 함수 (ErrorCheckers 대체)
export const isRetryableError = (error: { code: string; type: string }): boolean => {
  const retryableErrors = [ERROR_TYPES.INTERNER_SERVER_ERROR];
  return retryableErrors.includes(error.code as any);
};
