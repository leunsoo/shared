/**
 * localStorage 기반 토큰 저장소
 * Access 토큰을 localStorage에 저장/조회/삭제
 * apiClient, authStore에서만 이를 호출한다.
 */

const ACCESS_TOKEN_KEY = "accessToken";

export const TokenStorage = {
  /**
   * Access 토큰 저장
   * @param token - JWT access 토큰
   */
  setAccessToken: (token: string): void => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error("Failed to save access token:", error);
    }
  },

  /**
   * Access 토큰 조회
   * @returns 저장된 토큰 또는 null
   */
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  },

  /**
   * Access 토큰 삭제
   */
  clearAccessToken: (): void => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to clear access token:", error);
    }
  },

  /**
   * 모든 토큰 데이터 삭제 (로그아웃 시 사용)
   */
  clearAll: (): void => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to clear all tokens:", error);
    }
  },
};
