import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse } from './response';
import { getApiConfig } from '../config/apiConfig';
import { TokenManager, type Token } from './tokenManager';
import type { IStorage } from '../storage';
import { retryRequest } from '../util/retry';
import { isOk, wrapAsync, type Result, Ok, Err } from '../util/result';
import { ErrorProcessor } from '../util/errorProcessor';
import type { AppError } from '../util/appErrors';

// CustomAxiosInstance 인터페이스 유지 - ApiResponse<T> 타입 보장
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

/**
 * 통합된 API 클라이언트
 * 토큰 관리, 인터셉터, HTTP 메서드를 모두 포함
 */
export class ApiClient {
  private client: CustomAxiosInstance;
  private tokenManager: TokenManager;
  private interceptorsDisabled: boolean = false;
  private withdrawalAllowedEndpoints: string[] = ['/api/user/withdraw', '/api/auth/logout'];
  private onUnauthorizedCallback: (() => Promise<void>) | null = null;

  constructor(storage: IStorage) {
    this.tokenManager = new TokenManager(storage);

    const config = getApiConfig();
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout.default,
      headers: config.headers,
    }) as CustomAxiosInstance;

    this.setupInterceptors();
  }

  async initialize(): Promise<void> {
    const result = await this.tokenManager.initialize();

    // refresh token이 만료되어 토큰들이 정리된 경우 unauthorized 처리
    if (isOk(result) && result.data.refreshTokenExpired) {
      await this.handleUnauthorized();
    }
  }

  // 인터셉터 비활성화/활성화 (회원탈퇴 등에 사용)
  setInterceptorsDisabled(disabled: boolean): void {
    this.interceptorsDisabled = disabled;
  }

  // 탈퇴 중 허용된 엔드포인트 체크
  private isWithdrawalAllowedEndpoint(url?: string): boolean {
    if (!url) return false;
    return this.withdrawalAllowedEndpoints.some((endpoint) => url.includes(endpoint));
  }

  // 401 에러 시 호출될 콜백 설정
  setUnauthorizedCallback(callback: () => Promise<void>): void {
    this.onUnauthorizedCallback = callback;
  }

  // 권한 해제할 시 실행될 함수
  private async handleUnauthorized(): Promise<void> {
    if (this.interceptorsDisabled) {
      return;
    }

    await this.tokenManager.clearTokens();
    if (this.onUnauthorizedCallback) {
      await this.onUnauthorizedCallback();
    }
  }

  private setupInterceptors(): void {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 퍼블릭 엔드포인트가 아닌 경우 토큰 추가
        const isPublicEndpoint = '';
        //ex) /\/api\/(auth\/(signup|check-nickname|refresh|login))(\/.*)?$/.test(config.url || '');

        if (!isPublicEndpoint) {
          // 인터셉터가 비활성화된 경우 화이트리스트 체크
          if (this.interceptorsDisabled && !this.isWithdrawalAllowedEndpoint(config.url)) {
            return Promise.reject(new Error('Request blocked during withdrawal'));
          }

          // 토큰 만료 사전 체크 및 필요시 갱신
          if (this.tokenManager.isAccessTokenExpiringSoon()) {
            const refreshResult = await this.tokenManager.refreshTokensWithCallback(() => this.refreshToken());

            if (!isOk(refreshResult)) {
              await this.handleUnauthorized();
              return Promise.reject(new Error('Token refresh failed'));
            }
          }

          // 최신 토큰을 헤더에 추가
          const token = this.tokenManager.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (!token) {
            await this.handleUnauthorized();
            return Promise.reject(new Error('No access token'));
          }
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response.data, // ApiResponse<T> 반환
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // 토큰 만료 또는 인증 실패 - 하이브리드 방식 (사전 체크 + 실패 시 재시도)
        if (error.response?.status === 401 && originalRequest) {
          const typedRequest = originalRequest as InternalAxiosRequestConfig & { _retry?: boolean };

          // refresh API 호출은 별도 처리 ()
          const isRefreshRequest = originalRequest.url?.includes('/api/auth/refresh');

          //무한 루프 방지
          if (isRefreshRequest) {
            // refresh API 실패는 무조건 로그아웃이 맞음
            // refresh token이 만료되었다는 의미
            await this.handleUnauthorized();
            return Promise.reject(error);
          }

          //무한 루프 방지, 이미 재시도한 요청은 로그아웃 처리
          if (typedRequest._retry) {
            await this.handleUnauthorized();
            return Promise.reject(error);
          }

          // 재시도 플래그 설정
          typedRequest._retry = true;

          // 토큰 갱신 시도 (로컬/서버 시간 차이 대응)
          const refreshResult = await this.tokenManager.refreshTokensWithCallback(() => this.refreshToken());

          if (isOk(refreshResult)) {
            // 새 토큰으로 기존 요청 재시도
            const newToken = this.tokenManager.getAccessToken();
            if (newToken && typedRequest.headers) {
              typedRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(typedRequest);
          }

          // 토큰 갱신 실패 시 로그아웃
          await this.handleUnauthorized();
          return Promise.reject(error);
        }

        // 서버 에러 - 재시도 로직 적용
        if (error.response?.status && error.response.status >= 500 && error.response.status < 600) {
          const shouldRetry = await retryRequest(originalRequest, error);
          if (shouldRetry && originalRequest) {
            return this.client(originalRequest);
          }
        }

        // 에러는 그대로 throw (wrapApiCall에서 처리)
        return Promise.reject(error);
      }
    );
  }

  // API 호출을 감싸서 Result 패턴으로 변환, 중앙집중식 에러 처리
  private async wrapApiCall<T>(apiCall: () => Promise<ApiResponse<T>>): Promise<Result<T, AppError>> {
    const result = await wrapAsync(apiCall);

    if (isOk(result)) {
      if (result.data.status === 'SUCCESS') {
        return Ok(result.data.data); // 성공 데이터만 반환
      } else {
        // 비즈니스 에러를 중앙에서 처리 (HTTP 200이지만 success: 'ERROR')
        return Err(ErrorProcessor.processBusinessError(result.data as any));
      }
    } else {
      // HTTP/네트워크 에러는 이미 wrapAsync에서 ErrorProcessor로 처리됨
      return result; // 에러 그대로 반환
    }
  }

  private async refreshToken(): Promise<Result<Token, AppError>> {
    const result = await wrapAsync(() =>
      this.client.post('/api/auth/refresh', null, {
        headers: { 'X-Refresh-Token': this.tokenManager.getRefreshToken() } as any,
      })
    );

    if (isOk(result)) {
      if (result.data.status === 'SUCCESS') {
        return Ok(result.data.data as Token);
      } else {
        // 비즈니스 에러는 ErrorProcessor에서 처리
        return Err(ErrorProcessor.processBusinessError(result.data as any));
      }
    } else {
      // HTTP/네트워크 에러는 이미 wrapAsync에서 ErrorProcessor로 처리됨
      return result;
    }
  }

  // HTTP 메서드 + Result 패턴
  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<Result<T, AppError>> {
    return this.wrapApiCall(() => this.client.get<T>(url, config));
  }

  async post<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<Result<T, AppError>> {
    return this.wrapApiCall(() => this.client.post<T>(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<Result<T, AppError>> {
    return this.wrapApiCall(() => this.client.put<T>(url, data, config));
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<Result<T, AppError>> {
    return this.wrapApiCall(() => this.client.delete<T>(url, config));
  }

  // 토큰 관리 메서드들
  async setTokens(tokens: any): Promise<Result<void, AppError>> {
    return this.tokenManager.setTokens(tokens);
  }

  async clearTokens(): Promise<Result<void, AppError>> {
    return this.tokenManager.clearTokens();
  }

  hasValidTokens(): boolean {
    return this.tokenManager.hasValidTokens();
  }

  getAccessToken(): string | null {
    return this.tokenManager.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenManager.getRefreshToken();
  }
}
