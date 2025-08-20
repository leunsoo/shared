import type { INotificationHandler, NotificationOptions, NotificationType } from '../interfaces';

/**
 * No-Operation 알림 핸들러
 * 알림을 표시하지 않는 구현체 (테스트나 서버 환경용)
 */
export class NoOpNotificationHandler implements INotificationHandler {
  show(options: NotificationOptions): void {
    // 아무 것도 하지 않음
  }

  showToast(message: string, type?: NotificationType): void {
    // 아무 것도 하지 않음
  }

  showConfirm(message: string, onConfirm: () => void, onCancel?: () => void): void {
    // 기본적으로 확인으로 처리
    onConfirm();
  }
}