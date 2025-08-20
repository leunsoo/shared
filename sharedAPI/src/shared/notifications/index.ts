export type { 
  INotificationHandler, 
  ILogger, 
  NotificationOptions, 
  NotificationType, 
  LogLevel, 
  LogEntry 
} from './interfaces';

export { ConsoleLogger } from './implementations/consoleLogger';
export { NoOpNotificationHandler } from './implementations/noOpNotificationHandler';
export { WebNotificationHandler } from './implementations/webNotificationHandler';

/**
 * 알림/로깅 팩토리
 */
export class NotificationFactory {
  /**
   * 환경에 따라 적절한 알림 핸들러를 생성
   */
  static createAutoNotificationHandler(): INotificationHandler {
    // 웹 환경
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const { WebNotificationHandler } = require('./implementations/webNotificationHandler');
      return new WebNotificationHandler();
    }
    
    // 기본값으로 NoOp 사용
    const { NoOpNotificationHandler } = require('./implementations/noOpNotificationHandler');
    return new NoOpNotificationHandler();
  }

  /**
   * 콘솔 로거 생성
   */
  static createConsoleLogger(minLevel: LogLevel = 'info', enabledInProduction = false): ILogger {
    const { ConsoleLogger } = require('./implementations/consoleLogger');
    return new ConsoleLogger(minLevel, enabledInProduction);
  }

  /**
   * 웹용 알림 핸들러 생성
   */
  static createWebNotificationHandler(): INotificationHandler {
    const { WebNotificationHandler } = require('./implementations/webNotificationHandler');
    return new WebNotificationHandler();
  }

  /**
   * No-Op 알림 핸들러 생성 (테스트용)
   */
  static createNoOpNotificationHandler(): INotificationHandler {
    const { NoOpNotificationHandler } = require('./implementations/noOpNotificationHandler');
    return new NoOpNotificationHandler();
  }
}