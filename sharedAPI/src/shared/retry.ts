import type { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getApiConfig } from './config';
import { ErrorCheckers } from './errorHandler';

interface RetryState {
  attempt: number;
  maxAttempts: number;
  delay: number;
}

const retryStates = new Map<string, RetryState>();

export const retryRequest = async (
  config: InternalAxiosRequestConfig | undefined,
  error: AxiosError
): Promise<boolean> => {
  if (!config) return false;

  // 요청 ID 생성 (URL + Method 조합)
  const requestId = `${config.method?.toUpperCase()}_${config.url}`;
  const apiConfig = getApiConfig();

  // 현재 재시도 상태 가져오기 또는 초기화
  let retryState = retryStates.get(requestId);
  if (!retryState) {
    retryState = {
      attempt: 0,
      maxAttempts: apiConfig.retryAttempts,
      delay: apiConfig.retryDelay,
    };
  }

  // 최대 재시도 횟수 확인
  if (retryState.attempt >= retryState.maxAttempts) {
    retryStates.delete(requestId);
    return false;
  }

  // 재시도 가능한 에러인지 확인
  const processedError = {
    code: error.response?.status
      ? require('./errors').mapHttpStatusToErrorCode(error.response.status)
      : require('./errors').ErrorCodes.NETWORK_ERROR,
    type: error.response ? ('response_error' as const) : ('network_error' as const),
    statusCode: error.response?.status,
    message: error.message,
  };

  if (!ErrorCheckers.isRetryableError(processedError)) {
    retryStates.delete(requestId);
    return false;
  }

  // 재시도 대기 exponentialBackoff + jitter
  const delayTime = retryState.delay * Math.pow(2, retryState.attempt) * (1 + Math.random() * 0.3);

  await new Promise((resolve) => setTimeout(resolve, delayTime));

  retryState.attempt += 1;
  retryStates.set(requestId, retryState);

  console.log(`요청 재시도 (${retryState.attempt}/${retryState.maxAttempts}): ${requestId}`);

  return true;
};
