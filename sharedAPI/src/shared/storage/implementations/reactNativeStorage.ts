import type { IStorage } from '../interfaces';

/**
 * React Native 환경을 위한 Storage 구현체 
 * 실제로는 expo-secure-store나 AsyncStorage를 래핑하는 어댑터입니다
 */
export class ReactNativeStorage implements IStorage {
  private secureStore: any;

  constructor(secureStore: any) {
    if (!secureStore) {
      throw new Error('SecureStore instance is required for ReactNativeStorage');
    }
    this.secureStore = secureStore;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.secureStore.setItemAsync(key, value);
    } catch (error) {
      throw new Error(`Failed to set item ${key}: ${error}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.secureStore.getItemAsync(key);
    } catch (error) {
      throw new Error(`Failed to get item ${key}: ${error}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.secureStore.deleteItemAsync(key);
    } catch (error) {
      throw new Error(`Failed to remove item ${key}: ${error}`);
    }
  }

  async getAllKeys(): Promise<string[]> {
    // expo-secure-store는 getAllKeys를 지원하지 않으므로
    // 필요한 경우 별도로 키 목록을 관리해야 합니다
    throw new Error('getAllKeys is not supported in ReactNativeStorage');
  }

  async clear(): Promise<void> {
    // expo-secure-store는 clear를 지원하지 않으므로
    // 필요한 경우 개별적으로 키를 삭제해야 합니다
    throw new Error('clear is not supported in ReactNativeStorage');
  }
}