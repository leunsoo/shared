import type { INotificationHandler, NotificationOptions, NotificationType } from '../interfaces';

/**
 * 웹 브라우저용 알림 핸들러
 * 실제 구현에서는 토스트 라이브러리(react-hot-toast, sonner 등)나 
 * 브라우저 내장 alert/confirm을 사용합니다
 */
export class WebNotificationHandler implements INotificationHandler {
  private toastContainer?: HTMLElement;

  constructor() {
    this.initializeToastContainer();
  }

  private initializeToastContainer(): void {
    if (typeof document === 'undefined') return;

    this.toastContainer = document.getElementById('toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  show(options: NotificationOptions): void {
    if (options.actions && options.actions.length > 0) {
      // 액션이 있는 경우 confirm 다이얼로그로 처리
      const result = confirm(`${options.title ? options.title + '\n' : ''}${options.message}`);
      if (result && options.actions[0]) {
        options.actions[0].action();
      }
    } else {
      // 단순 알림
      this.showToast(options.message, options.type);
    }
  }

  showToast(message: string, type: NotificationType = 'info'): void {
    if (typeof document === 'undefined' || !this.toastContainer) {
      // 브라우저 환경이 아니면 콘솔에 출력
      console.log(`Toast [${type}]: ${message}`);
      return;
    }

    const toast = document.createElement('div');
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };

    toast.style.cssText = `
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;

    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    // 3초 후 자동 제거
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);

    // CSS 애니메이션 추가 (한 번만)
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  showConfirm(message: string, onConfirm: () => void, onCancel?: () => void): void {
    const result = confirm(message);
    if (result) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  }
}