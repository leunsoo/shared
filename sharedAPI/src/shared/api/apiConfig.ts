import type { AxiosRequestConfig } from 'axios';

interface TimeoutConfig {
  default: number;
}

interface RetryConfig {
  maxAttempts: number;
  delay: number;
  exponentialBackoff: boolean;
}

interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
}

interface PaginationConfig {
  defaultLimit: number;
  maxLimit: number;
}

interface ErrorConfig {
  showToast: boolean;
  logToConsole: boolean;
}

interface ApiConfig {
  baseURL: string;
  timeout: TimeoutConfig;
  retry: RetryConfig;
  headers: AxiosRequestConfig['headers']; // 이렇게
  upload: UploadConfig;
  pagination: PaginationConfig;
  errors: ErrorConfig;
}

export const API_CONFIG: ApiConfig = {
  baseURL: '',

  timeout: {
    default: 10000, // 10초
  },

  retry: {
    maxAttempts: 3, // 최대 재시도 횟수
    delay: 1000, // 재시도 간격 (밀리초)
    exponentialBackoff: true, // 지수적 백오프 사용 여부
  },

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-App-Version': '1.0.0',
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  errors: {
    showToast: true,
    logToConsole: true,
  },
};
