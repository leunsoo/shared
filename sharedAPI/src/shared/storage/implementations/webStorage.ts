import type { IStorage } from '../interfaces';

/**
 * Web 브라우저 환경을 위한 Storage 구현체 (localStorage 기반)
 */
export class WebStorage implements IStorage {
  private storage: Storage;

  constructor(useSessionStorage = false) {
    if (typeof window === 'undefined') {
      throw new Error('WebStorage is only available in browser environment');
    }
    
    this.storage = useSessionStorage ? window.sessionStorage : window.localStorage;
    
    if (!this.storage) {
      throw new Error('Storage is not available in this browser');
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      throw new Error(`Failed to set item ${key}: ${error}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      throw new Error(`Failed to get item ${key}: ${error}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      throw new Error(`Failed to remove item ${key}: ${error}`);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      throw new Error(`Failed to get all keys: ${error}`);
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      throw new Error(`Failed to clear storage: ${error}`);
    }
  }
}