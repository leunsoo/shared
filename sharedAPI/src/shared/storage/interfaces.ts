/**
 * 플랫폼 독립적인 Storage 인터페이스
 * 다양한 플랫폼(React Native, Web, Node.js)에서 사용할 수 있도록 추상화
 */

export interface IStorage {
  /**
   * 값을 저장합니다
   * @param key 저장할 키
   * @param value 저장할 값
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * 값을 조회합니다
   * @param key 조회할 키
   * @returns 값 또는 null
   */
  getItem(key: string): Promise<string | null>;

  /**
   * 값을 삭제합니다
   * @param key 삭제할 키
   */
  removeItem(key: string): Promise<void>;

  /**
   * 모든 키를 반환합니다
   */
  getAllKeys(): Promise<string[]>;

  /**
   * 모든 저장된 데이터를 삭제합니다
   */
  clear(): Promise<void>;
}

/**
 * Storage 에러 타입
 */
export interface StorageError {
  type: 'STORAGE_UNAVAILABLE' | 'OPERATION_FAILED' | 'QUOTA_EXCEEDED';
  message: string;
  originalError?: unknown;
}

/**
 * Storage 작업 결과 타입
 */
export type StorageResult<T = void> = Promise<{
  success: true;
  data: T;
} | {
  success: false;
  error: StorageError;
}>;