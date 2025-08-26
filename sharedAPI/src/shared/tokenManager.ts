import type { IStorage } from './storage';
import { wrapAsync, Result, isOk, isErr, Ok, Err } from './result';

interface TokenError {
  type: 'STORAGE_ERROR' | 'NOT_FOUND' | 'REFRESH_FAILED';
  message: string;
}
export interface Token {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ACCESS_TOKEN_EXPIRES_AT: 'accessTokenExpiresAt',
  REFRESH_TOKEN_EXPIRES_AT: 'refreshTokenExpiresAt',
} as const;

export class TokenManager {
  private storage: IStorage;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpiresAt: string | null = null;
  private refreshTokenExpiresAt: string | null = null;
  private refreshPromise: Promise<Result<boolean, TokenError>> | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async initialize(): Promise<Result<void, TokenError>> {
    return wrapAsync(
      async () => {
        const [access, refresh, accessExpiry, refreshExpiry] = await Promise.all([
          this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
          this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT),
        ]);

        this.accessToken = access;
        this.refreshToken = refresh;
        this.accessTokenExpiresAt = accessExpiry;
        this.refreshTokenExpiresAt = refreshExpiry;
      },
      (error) => ({
        type: 'STORAGE_ERROR' as const,
        message: `토큰 초기화 실패: ${error}`,
      })
    );
  }

  async setTokens(tokens: Token): Promise<Result<void, TokenError>> {
    return wrapAsync(
      async () => {
        await Promise.all([
          this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
          this.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
          this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, tokens.accessTokenExpiresAt),
          this.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT, tokens.refreshTokenExpiresAt),
        ]);

        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
        this.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
      },
      (error) => ({
        type: 'STORAGE_ERROR' as const,
        message: `토큰 저장 실패: ${error}`,
      })
    );
  }

  async clearTokens(): Promise<Result<void, TokenError>> {
    return wrapAsync(
      async () => {
        await Promise.all([
          this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
          this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT),
        ]);

        this.accessToken = null;
        this.refreshToken = null;
        this.accessTokenExpiresAt = null;
        this.refreshTokenExpiresAt = null;
        this.refreshPromise = null;
      },
      (error) => ({
        type: 'STORAGE_ERROR' as const,
        message: `토큰 삭제 실패: ${error}`,
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasValidTokens(): boolean {
    return this.accessToken !== null && this.refreshToken !== null;
  }

  isAccessTokenExpiringSoon(minutesBeforeExpiry = 10): boolean {
    if (!this.accessTokenExpiresAt) return false;

    try {
      const expiryDate = new Date(this.accessTokenExpiresAt);
      const now = new Date();
      const thresholdTime = new Date(expiryDate.getTime() - minutesBeforeExpiry * 60 * 1000);
      return now >= thresholdTime;
    } catch {
      return false;
    }
  }

  // 토큰 갱신 로직은 외부에서 주입받도록 함
  async refreshTokensWithCallback(
    refreshCallback: () => Promise<Result<Token, TokenError>>
  ): Promise<Result<boolean, TokenError>> {
    // 이미 갱신 중이면 기존 Promise 반환
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      return Err({ type: 'NOT_FOUND', message: 'Refresh token이 없습니다' });
    }

    this.refreshPromise = (async (): Promise<Result<boolean, TokenError>> => {
      try {
        const result = await refreshCallback();

        if (isOk(result)) {
          const setResult = await this.setTokens(result.data);
          return isOk(setResult) ? Ok(true) : Err(setResult.error);
        } else {
          await this.clearTokens();
          return Err(result.error);
        }
      } catch (error) {
        await this.clearTokens();
        return Err({ type: 'REFRESH_FAILED', message: `토큰 갱신 중 오류: ${error}` });
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
