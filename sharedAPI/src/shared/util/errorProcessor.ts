import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../api/response';
import { getNotificationHandlers } from '../config/notificationConfig';
import { type AppError, ERROR_TYPES, createAppError, createHttpError, createNetworkError } from './appErrors';

/**
 * 중앙집중식 에러 처리기
 * 모든 종류의 에러를 AppError로 변환하고 자동 사용자 알림 처리
 */
export class ErrorProcessor {
  /**
   * Axios 에러 (HTTP, 네트워크 에러)를 AppError로 변환
   */
  static processAxiosError(error: AxiosError): AppError {
    if (error.response) {
      // HTTP 에러 (서버가 응답했지만 에러 상태 코드)
      const statusCode = error.response.status;
      const responseData = error.response.data as any;

      // 서버에서 제공하는 메시지가 있으면 사용, 없으면 기본 메시지
      const message = responseData?.message || this.getDefaultHttpErrorMessage(statusCode);
      const serverCode = responseData?.error?.code;

      const appError = createHttpError(statusCode, message);
      if (serverCode) {
        appError.code = serverCode;
      }

      // 자동 사용자 알림
      this.showToUser(appError);

      return appError;
    } else if (error.request) {
      // 네트워크 에러 (서버 응답 없음)
      const appError = createNetworkError();
      this.showToUser(appError);
      return appError;
    } else {
      // 요청 설정 에러
      const appError = createAppError(ERROR_TYPES.REQUEST_ERROR, '요청 처리 중 오류가 발생했습니다', {
        retryable: false,
        silent: false,
      });
      this.showToUser(appError);
      return appError;
    }
  }

  /**
   * API 비즈니스 에러 (HTTP 200이지만 success: 'ERROR')를 AppError로 변환
   */
  static processBusinessError(apiResponse: ApiErrorResponse): AppError {
    const appError = createAppError(apiResponse.error?.code || ERROR_TYPES.BUSINESS_ERROR, apiResponse.message, {
      code: apiResponse.error?.code,
      retryable: false,
      silent: this.isSilentError(apiResponse.error?.code),
      statusCode: 200, // 비즈니스 에러는 HTTP 200으로 옴
    });

    // 자동 사용자 알림 (silent가 아닌 경우)
    this.showToUser(appError);

    return appError;
  }

  /**
   * 사용자에게 에러 표시 (토스트, 다이얼로그 등)
   */
  static showToUser(error: AppError): void {
    if (error.silent) {
      return; // silent 에러는 사용자에게 표시하지 않음
    }

    const { showError, showToast } = getNotificationHandlers();

    // 중요한 에러는 다이얼로그로, 일반 에러는 토스트로
    const criticalErrors = [
      ERROR_TYPES.INTERNAL_SERVER_ERROR,
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.PERMISSION_DENIED,
    ];

    if (criticalErrors.includes(error.type as any)) {
      if (showError) {
        showError(error.message);
      }
    } else {
      if (showToast) {
        showToast(error.message);
      }
    }

    // 로깅 (개발용)
    console.error('AppError:', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      timestamp: error.timestamp,
    });
  }

  /**
   * HTTP 상태 코드별 기본 에러 메시지
   */
  private static getDefaultHttpErrorMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: '잘못된 요청입니다',
      401: '로그인이 필요합니다',
      403: '권한이 없습니다',
      404: '요청한 리소스를 찾을 수 없습니다',
      409: '이미 존재하는 리소스입니다',
      422: '입력 정보가 올바르지 않습니다',
      429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
      500: '서버 오류가 발생했습니다',
      502: '서버 연결에 문제가 있습니다',
      503: '서비스를 일시적으로 사용할 수 없습니다',
    };

    return messages[statusCode] || '알 수 없는 오류가 발생했습니다';
  }

  /**
   * 사용자에게 표시하지 않을 에러인지 확인
   */
  private static isSilentError(errorCode?: string): boolean {
    if (!errorCode) return false;

    const silentErrors = [
      'AUTH_TOKEN_EXPIRED', // 자동으로 로그인 페이지로 이동
      'USER_NOT_FOUND', // 로그인 시 신규 사용자는 정상 플로우
      'TOKEN_STORAGE_ERROR', // 토큰 저장 에러
      'TOKEN_NOT_FOUND', // 토큰 없음
      'TOKEN_REFRESH_FAILED', // 토큰 갱신 실패
    ];

    return silentErrors.includes(errorCode);
  }
}
