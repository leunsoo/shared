import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";

import { type ApiResponse } from "./response";
import { getApiConfig } from "./apiConfig";
import { TokenStorage } from "./tokenStorage";
import { isTokenExpired } from "./jwt";
import { reissueToken } from "./reissueApi";

/**
 * 간소화된 API 클라이언트 (웹용)
 * - ApiResponse<T> 타입 보장
 * - TanStack Query와 함께 사용
 * - Access 토큰 기반 인증 (Authorization 헤더)
 * - Refresh 토큰은 HTTP Only 쿠키 (reissue 시에만 사용)
 */
export class ApiClient {
  private client: AxiosInstance;
  private onUnauthorizedCallback: (() => void) | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    const config = getApiConfig();
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout.default,
      headers: config.headers,
      // withCredentials 제거 - 일반 요청에는 쿠키 포함 안 함
    });

    this.setupInterceptors();
  }

  /**
   * 401 에러 시 호출될 콜백 설정 (로그아웃 등)
   */
  setUnauthorizedCallback(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  /**
   * 인터셉터 설정
   */
  private setupInterceptors(): void {
    // 요청 인터셉터: Authorization 헤더에 Access 토큰 추가
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 토큰 가져오기
        let token = TokenStorage.getAccessToken();

        // 토큰이 있고 만료된 경우 자동 갱신
        if (token && isTokenExpired(token) && !this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const { accessToken } = await reissueToken();
            TokenStorage.setAccessToken(accessToken);
            token = accessToken;
          } catch (error) {
            console.error(
              "Token refresh failed in request interceptor:",
              error
            );
            // 갱신 실패 시 기존 토큰으로 시도 (401 에러로 이어질 것)
          } finally {
            this.isRefreshing = false;
          }
        }

        // Authorization 헤더 추가
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터: ApiResponse 타입 보장 및 401 처리
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // response.data가 ApiResponse<T> 형태임을 보장
        return response.data;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // 401 에러 처리 - Access 토큰 만료 또는 무효
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // reissue 호출하여 토큰 갱신
            const { accessToken } = await reissueToken();
            TokenStorage.setAccessToken(accessToken);

            // 새 토큰으로 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (reissueError) {
            // reissue 실패 (refresh 토큰 만료) → 로그아웃
            console.error("Token reissue failed:", reissueError);
            this.handleUnauthorized();
            return Promise.reject(error);
          }
        }

        // reissue 요청에서 400 에러 → refresh 토큰 만료 → 로그아웃
        if (
          error.config?.url?.includes("/auth/reissue") &&
          error.response?.status === 400
        ) {
          console.error("Refresh token expired");
          this.handleUnauthorized();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 인증 실패 처리
   */
  private handleUnauthorized(): void {
    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    }
  }

  /**
   * HTTP GET - ApiResponse<T> 반환
   * 인터셉터에서 이미 response.data를 반환하므로 그대로 사용
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.client.get<ApiResponse<T>>(url, config) as any;
  }

  /**
   * HTTP POST - ApiResponse<T> 반환
   */
  async post<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.client.post<ApiResponse<T>>(url, data, config) as any;
  }

  /**
   * HTTP PUT - ApiResponse<T> 반환
   */
  async put<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.client.put<ApiResponse<T>>(url, data, config) as any;
  }

  /**
   * HTTP PATCH - ApiResponse<T> 반환
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.client.patch<ApiResponse<T>>(url, data, config) as any;
  }

  /**
   * HTTP DELETE - ApiResponse<T> 반환
   */
  async delete<T>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.client.delete<ApiResponse<T>>(url, config) as any;
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();
