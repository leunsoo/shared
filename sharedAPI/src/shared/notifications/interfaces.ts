/**
 * 플랫폼 독립적인 알림 시스템 인터페이스
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // ms, -1이면 수동 닫기
  actions?: Array<{
    text: string;
    action: () => void;
  }>;
}

export interface INotificationHandler {
  /**
   * 알림을 표시합니다
   */
  show(options: NotificationOptions): void;

  /**
   * 토스트 메시지를 표시합니다 (간단한 알림)
   */
  showToast(message: string, type?: NotificationType): void;

  /**
   * 확인 다이얼로그를 표시합니다
   */
  showConfirm(message: string, onConfirm: () => void, onCancel?: () => void): void;
}

/**
 * 로깅 레벨
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

export interface ILogger {
  /**
   * 디버그 로그
   */
  debug(message: string, context?: Record<string, any>): void;

  /**
   * 정보 로그
   */
  info(message: string, context?: Record<string, any>): void;

  /**
   * 경고 로그
   */
  warn(message: string, context?: Record<string, any>): void;

  /**
   * 에러 로그
   */
  error(message: string, error?: Error, context?: Record<string, any>): void;
}