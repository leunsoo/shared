import axios, { type AxiosInstance } from "axios";
import { getApiConfig } from "./apiConfig";
import type { ApiResponse } from "./response";

/**
 * Reissue API Response 타입
 */
export interface ReissueResponse {
  accessToken: string;
  expiresIn: number; // 초 단위 (예: 900 = 15분)
}

/**
 * Reissue API Request 타입
 */
interface ReissueRequest {
  web: boolean;
}

/**
 * Reissue 전용 Axios 인스턴스
 * withCredentials: true로 설정하여 refresh 토큰 쿠키 자동 포함
 */
class ReissueApiClient {
  private client: AxiosInstance;

  constructor() {
    const config = getApiConfig();

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout.default,
      headers: config.headers,
      withCredentials: true, // refresh 토큰 쿠키 포함
    });
  }

  /**
   * Access 토큰 재발급 요청
   * @returns 새로운 access 토큰과 만료 시간
   * @throws 400 에러 (refresh 토큰 만료) 또는 네트워크 에러
   */
  async reissue(): Promise<ReissueResponse> {
    try {
      const requestBody: ReissueRequest = {
        web: true,
      };

      const response = await this.client.post<ApiResponse<ReissueResponse>>(
        "/auth/reissue",
        requestBody
      );

      if (response.data.status === "SUCCESS" && response.data.data) {
        return response.data.data;
      }

      throw new Error("Invalid reissue response format");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          // Refresh 토큰 만료
          throw new Error("Refresh token expired");
        }
      }

      console.error("Token reissue failed:", error);
      throw new Error("Failed to reissue token");
    }
  }
}

// 싱글톤 인스턴스
const reissueApiClient = new ReissueApiClient();

/**
 * Access 토큰 재발급 함수
 * @returns 새로운 access 토큰과 만료 시간
 */
export const reissueToken = (): Promise<ReissueResponse> => {
  return reissueApiClient.reissue();
};
