/**
 * 알림 시스템 설정
 * 에러/성공 알림, 토스트, 로깅 등을 담당
 */

export interface NotificationHandlers {
  showError?: (message: string) => void;        // 중요한 에러 (다이얼로그)
  showToast?: (message: string) => void;        // 일반 알림 (토스트)
  logError?: (message: string, error?: any) => void; // 에러 로깅
}

// 전역 알림 핸들러 상태
let notificationHandlers: NotificationHandlers = {
  // 기본값: 콘솔 출력 (개발 환경용)
  showError: (message) => console.error('Error:', message),
  showToast: (message) => console.log('Toast:', message),
  logError: (message, error) => console.error(message, error),
};

/**
 * 알림 핸들러 설정
 * 앱 초기화 시 실제 UI 컴포넌트와 연결
 */
export const setNotificationHandlers = (handlers: Partial<NotificationHandlers>) => {
  notificationHandlers = { ...notificationHandlers, ...handlers };
};

/**
 * 현재 설정된 알림 핸들러 반환
 */
export const getNotificationHandlers = (): NotificationHandlers => notificationHandlers;