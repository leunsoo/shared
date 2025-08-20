export type { IStorage, StorageError, StorageResult } from './interfaces';
export { WebStorage } from './implementations/webStorage';
export { MemoryStorage } from './implementations/memoryStorage';
export { ReactNativeStorage } from './implementations/reactNativeStorage';

/**
 * Storage Factory
 * 환경에 따라 적절한 Storage 구현체를 생성합니다
 */
export class StorageFactory {
  /**
   * 자동으로 환경을 감지하여 적절한 Storage를 반환
   */
  static createAutoStorage(): IStorage {
    // Node.js 환경
    if (typeof window === 'undefined' && typeof global !== 'undefined') {
      const { MemoryStorage } = require('./implementations/memoryStorage');
      return new MemoryStorage();
    }
    
    // Web 환경
    if (typeof window !== 'undefined' && window.localStorage) {
      const { WebStorage } = require('./implementations/webStorage');
      return new WebStorage();
    }
    
    // 기본값으로 MemoryStorage 사용
    const { MemoryStorage } = require('./implementations/memoryStorage');
    return new MemoryStorage();
  }

  /**
   * 웹용 Storage 생성
   */
  static createWebStorage(useSessionStorage = false): IStorage {
    const { WebStorage } = require('./implementations/webStorage');
    return new WebStorage(useSessionStorage);
  }

  /**
   * 메모리용 Storage 생성
   */
  static createMemoryStorage(): IStorage {
    const { MemoryStorage } = require('./implementations/memoryStorage');
    return new MemoryStorage();
  }

  /**
   * React Native용 Storage 생성
   */
  static createReactNativeStorage(secureStore: any): IStorage {
    const { ReactNativeStorage } = require('./implementations/reactNativeStorage');
    return new ReactNativeStorage(secureStore);
  }
}