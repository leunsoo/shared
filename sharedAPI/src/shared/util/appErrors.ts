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

// 통합된 에러 타입 상수들 (errors.ts + 기존 ERROR_TYPES 통합)
export const ERROR_TYPES = {
  // 인증 관련
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED', // 기존 호환성
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // 사용자 관련
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // 데이터 관련
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',

  // HTTP 에러
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 서버 관련
  SERVER_ERROR: 'SERVER_ERROR',

  // 파일 관련
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // 네트워크 관련
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  REQUEST_ERROR: 'REQUEST_ERROR',

  // 토큰 관리
  TOKEN_STORAGE_ERROR: 'TOKEN_STORAGE_ERROR',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',

  // 비즈니스 로직
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

// 에러 메시지 매핑 (errors.ts에서 통합)
export const ERROR_MESSAGES: Record<string, string> = {
  // 인증 관련
  [ERROR_TYPES.AUTH_TOKEN_EXPIRED]: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_TYPES.AUTH_TOKEN_INVALID]: '401 에러 메시지를 넣어주세요.',
  [ERROR_TYPES.AUTH_PERMISSION_DENIED]: '권한이 없습니다.',
  [ERROR_TYPES.TOKEN_EXPIRED]: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_TYPES.INVALID_CREDENTIALS]: '유효하지 않은 인증 정보입니다.',
  [ERROR_TYPES.PERMISSION_DENIED]: '권한이 없습니다.',

  // 사용자 관련
  [ERROR_TYPES.USER_NOT_FOUND]: '존재하지 않는 사용자입니다.',
  [ERROR_TYPES.USER_ALREADY_EXISTS]: '이미 존재하는 사용자입니다.',

  // 데이터 관련
  [ERROR_TYPES.DATA_NOT_FOUND]: '요청하신 데이터를 찾을 수 없습니다.',
  [ERROR_TYPES.DATA_VALIDATION_FAILED]: '입력 정보가 올바르지 않습니다.',

  // HTTP 에러
  [ERROR_TYPES.BAD_REQUEST]: '잘못된 요청입니다.',
  [ERROR_TYPES.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ERROR_TYPES.FORBIDDEN]: '권한이 없습니다.',
  [ERROR_TYPES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ERROR_TYPES.CONFLICT]: '이미 존재하는 리소스입니다.',
  [ERROR_TYPES.VALIDATION_ERROR]: '입력 정보가 올바르지 않습니다.',
  [ERROR_TYPES.RATE_LIMIT]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_TYPES.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다.',
  [ERROR_TYPES.BAD_GATEWAY]: '서버 연결에 문제가 있습니다.',
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',

  // 서버 관련
  [ERROR_TYPES.SERVER_ERROR]: '서버 오류가 발생했습니다.',

  // 파일 관련
  [ERROR_TYPES.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',

  // 네트워크 관련
  [ERROR_TYPES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [ERROR_TYPES.TIMEOUT]: '요청 시간이 초과되었습니다.',
  [ERROR_TYPES.REQUEST_ERROR]: '요청 처리 중 오류가 발생했습니다.',

  // 토큰 관리
  [ERROR_TYPES.TOKEN_STORAGE_ERROR]: '인증 정보 저장 중 오류가 발생했습니다.',
  [ERROR_TYPES.TOKEN_NOT_FOUND]: '인증 정보가 없습니다.',
  [ERROR_TYPES.TOKEN_REFRESH_FAILED]: '인증 정보 갱신에 실패했습니다.',

  // 비즈니스 로직
  [ERROR_TYPES.BUSINESS_ERROR]: '처리 중 오류가 발생했습니다.',
  [ERROR_TYPES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
};

// HTTP 상태 코드를 에러 타입으로 매핑 (errors.ts에서 통합)
export const mapHttpStatusToErrorType = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    400: ERROR_TYPES.DATA_VALIDATION_FAILED,
    401: ERROR_TYPES.AUTH_TOKEN_INVALID,
    403: ERROR_TYPES.AUTH_PERMISSION_DENIED,
    404: ERROR_TYPES.DATA_NOT_FOUND,
    409: ERROR_TYPES.CONFLICT,
    413: ERROR_TYPES.FILE_TOO_LARGE,
    422: ERROR_TYPES.VALIDATION_ERROR,
    429: ERROR_TYPES.RATE_LIMIT,
    500: ERROR_TYPES.SERVER_ERROR,
    502: ERROR_TYPES.BAD_GATEWAY,
    503: ERROR_TYPES.SERVICE_UNAVAILABLE,
  };

  return statusMap[statusCode] || ERROR_TYPES.SERVER_ERROR;
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
  createAppError(ERROR_TYPES.NETWORK_ERROR, message, { retryable: true, silent: false });

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
  const retryableErrors = [ERROR_TYPES.NETWORK_ERROR, ERROR_TYPES.SERVER_ERROR];
  return retryableErrors.includes(error.code as any);
};
