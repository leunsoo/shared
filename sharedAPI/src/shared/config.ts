/**
 * 간단한 API 설정
 * 필요한 설정만 최소한으로 포함
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface NotificationHandlers {
  showError?: (message: string) => void;
  showToast?: (message: string) => void;
  logError?: (message: string, error?: any) => void;
}

let currentConfig: ApiConfig = {
  baseURL: '',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};

let notificationHandlers: NotificationHandlers = {
  showError: (message) => console.error('Error:', message),
  showToast: (message) => console.log('Toast:', message),
  logError: (message, error) => console.error(message, error),
};

export const setApiConfig = (config: Partial<ApiConfig>) => {
  currentConfig = { ...currentConfig, ...config };
};

export const getApiConfig = (): ApiConfig => currentConfig;

export const setNotificationHandlers = (handlers: Partial<NotificationHandlers>) => {
  notificationHandlers = { ...notificationHandlers, ...handlers };
};

export const getNotificationHandlers = () => notificationHandlers;
