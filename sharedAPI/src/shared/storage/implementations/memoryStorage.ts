import type { IStorage } from '../interfaces';

/**
 * 메모리 기반 Storage 구현체 (테스트 또는 Node.js 환경용)
 * 프로세스가 종료되면 데이터가 사라집니다
 */
export class MemoryStorage implements IStorage {
  private data: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}