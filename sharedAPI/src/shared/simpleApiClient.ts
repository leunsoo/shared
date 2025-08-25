import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from './api/response';
import type { IStorage } from './storage';
import { TokenManager } from './tokenManager';
import { wrapApiCall } from './apiWrapper';
import { getApiConfig, getNotificationHandlers } from './config';
import { isOk } from './result';

/**
 * 간단한 API 클라이언트
 * 플랫폼 독립적이고 필요한 기능만 포함
 */
export class SimpleApiClient {
  private client: AxiosInstance;
  private tokenManager: TokenManager;

  constructor(storage: IStorage) {
    this.tokenManager = new TokenManager(storage);

    const config = getApiConfig();
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  async initialize() {
    await this.tokenManager.initialize();
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 퍼블릭 엔드포인트 체크
        const isPublicEndpoint = /\/api\/auth\/(signup|login|refresh)/.test(config.url || '');

        if (!isPublicEndpoint) {
          // 토큰 만료 체크 및 갱신
          if (this.tokenManager.isAccessTokenExpiringSoon()) {
            const refreshResult = await this.tokenManager.refreshTokensWithCallback(() => this.refreshToken());

            if (!isOk(refreshResult)) {
              const { showError } = getNotificationHandlers();
              if (showError) {
                showError('로그인이 필요합니다.');
              }
              throw new Error('Token refresh failed');
            }
          }

          // 토큰 추가
          const token = this.tokenManager.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.tokenManager.clearTokens();
          const { showError } = getNotificationHandlers();
          if (showError) {
            showError('로그인이 만료되었습니다.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    return wrapApiCall(() =>
      this.client.post('/api/auth/refresh', null, {
        headers: { 'X-Refresh-Token': this.tokenManager.getAccessToken() },
      })
    );
  }

  // HTTP 메서드들
  async get<T>(url: string, config?: InternalAxiosRequestConfig) {
    return wrapApiCall<T>(() => this.client.get(url, config));
  }

  async post<T>(url: string, data?: any, config?: InternalAxiosRequestConfig) {
    return wrapApiCall<T>(() => this.client.post(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: InternalAxiosRequestConfig) {
    return wrapApiCall<T>(() => this.client.put(url, data, config));
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig) {
    return wrapApiCall<T>(() => this.client.delete(url, config));
  }

  // 토큰 관리 메서드들
  async setTokens(tokens: any) {
    return this.tokenManager.setTokens(tokens);
  }

  async clearTokens() {
    return this.tokenManager.clearTokens();
  }

  hasValidTokens(): boolean {
    return this.tokenManager.hasValidTokens();
  }
}
