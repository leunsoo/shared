import type { AxiosRequestConfig } from 'axios';

interface TimeoutConfig {
  default: number;
}

interface RetryConfig {
  maxAttempts: number;
  delay: number;
  // exponentialBackoff: boolean;
}

interface ErrorConfig {
  showToast: boolean;
  logToConsole: boolean;
}

interface ApiConfig {
  baseURL: string;
  timeout: TimeoutConfig;
  retry: RetryConfig;
  headers: AxiosRequestConfig['headers'];
  errors: ErrorConfig;
}

const currentConfig: ApiConfig = {
  baseURL: '',

  timeout: {
    default: 10000, // 10초
  },

  retry: {
    maxAttempts: 3, // 최대 재시도 횟수
    delay: 1000, // 재시도 간격 (밀리초)
    // exponentialBackoff: true, // 지수적 백오프 사용 여부
  },

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  errors: {
    showToast: true,
    logToConsole: true,
  },
};

export const getApiConfig = (): Readonly<ApiConfig> => ({ ...currentConfig });
