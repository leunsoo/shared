import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import type { ApiResponse } from './response';
import { getApiConfig } from './apiConfig';
import { TokenManager } from '../tokenManager';

interface CustomAxiosInstance extends AxiosInstance {
  get<T = unknown, R = ApiResponse<T>, D = any>(
    url: string,
    config?: Partial<InternalAxiosRequestConfig<D>>
  ): Promise<R>;

  post<T = unknown, R = ApiResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig<D>
  ): Promise<R>;

  put<T = unknown, R = ApiResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig<D>
  ): Promise<R>;

  delete<T = unknown, R = ApiResponse<T>, D = any>(url: string, config?: InternalAxiosRequestConfig<D>): Promise<R>;
}

const apiClient: CustomAxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout.default,
  headers: API_CONFIG.headers,
}) as CustomAxiosInstance;

export const initializeApiClient = async (): Promise<void> => {
  TokenManager tokenManager = new TokenManager();

  // 저장된 토큰 초기화
  const initResult = await useTokenStore.getState().initializeTokens();

  const token = useTokenStore.getState().getAccessToken();
  applyTokenToClients(token);

  setupInterceptors(apiClient, handleUnauthorized);
  setupInterceptors(chatApiClient, handleUnauthorized);
  setupInterceptors(uploadClient, handleUnauthorized);
};

export { apiClient };
