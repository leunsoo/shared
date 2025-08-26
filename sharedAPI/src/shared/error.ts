/**
 * 간단한 에러 처리 유틸리티
 */

/**
 * 재시도 지연 시간 계산 (지수 백오프)
 */
export const calculateRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // 최대 30초
};

/**
 * 에러가 재시도 가능한지 확인
 */
export const canRetry = (currentAttempt: number, maxAttempts: number = 5): boolean => {
  return currentAttempt < maxAttempts;
};
