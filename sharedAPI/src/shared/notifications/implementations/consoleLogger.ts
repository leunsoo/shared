import type { ILogger, LogLevel, LogEntry } from '../interfaces';

/**
 * 콘솔 기반 로거 구현체
 */
export class ConsoleLogger implements ILogger {
  private minLevel: LogLevel;
  private enabledInProduction: boolean;

  constructor(minLevel: LogLevel = 'info', enabledInProduction = false) {
    this.minLevel = minLevel;
    this.enabledInProduction = enabledInProduction;
  }

  private shouldLog(level: LogLevel): boolean {
    // 프로덕션 환경에서 로깅이 비활성화된 경우
    if (!this.enabledInProduction && this.isProduction()) {
      return false;
    }

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.minLevel];
  }

  private isProduction(): boolean {
    // 다양한 환경에서의 프로덕션 감지
    return (
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
      (typeof window !== 'undefined' && (window as any).__PRODUCTION__) ||
      false
    );
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    
    const formatted = this.formatMessage('debug', message, context);
    console.debug(formatted);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    
    const formatted = this.formatMessage('info', message, context);
    console.info(formatted);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;
    
    const formatted = this.formatMessage('error', message, context, error);
    console.error(formatted);
    
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}