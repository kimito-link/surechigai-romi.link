/**
 * 複数アカウント管理
 * AsyncStorageを使用して複数のTwitterアカウントを保存・切り替え
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// 保存するアカウント情報の型
export interface SavedAccount {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  lastUsed: number; // タイムスタンプ
}

const ACCOUNTS_KEY = "@douin_saved_accounts";
const CURRENT_ACCOUNT_KEY = "@douin_current_account";
const MAX_ACCOUNTS = 5; // 最大保存アカウント数

/**
 * 保存されているアカウント一覧を取得
 */
export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!data) return [];
    const accounts = JSON.parse(data) as SavedAccount[];
    // 最終使用日時でソート（新しい順）
    return accounts.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error("[AccountManager] Failed to get saved accounts:", error);
    return [];
  }
}

/**
 * アカウントを保存（既存の場合は更新）
 */
export async function saveAccount(account: Omit<SavedAccount, "lastUsed">): Promise<void> {
  try {
    const accounts = await getSavedAccounts();
    
    // 既存のアカウントを検索
    const existingIndex = accounts.findIndex((a) => a.id === account.id);
    
    const newAccount: SavedAccount = {
      ...account,
      lastUsed: Date.now(),
    };
    
    if (existingIndex >= 0) {
      // 既存のアカウントを更新
      accounts[existingIndex] = newAccount;
    } else {
      // 新しいアカウントを追加
      accounts.unshift(newAccount);
      
      // 最大数を超えた場合は古いアカウントを削除
      if (accounts.length > MAX_ACCOUNTS) {
        accounts.pop();
      }
    }
    
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    await AsyncStorage.setItem(CURRENT_ACCOUNT_KEY, account.id);
    
    console.log("[AccountManager] Account saved:", account.username);
  } catch (error) {
    console.error("[AccountManager] Failed to save account:", error);
  }
}

/**
 * 現在のアカウントIDを取得
 */
export async function getCurrentAccountId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_ACCOUNT_KEY);
  } catch (error) {
    console.error("[AccountManager] Failed to get current account:", error);
    return null;
  }
}

/**
 * 現在のアカウントを設定
 */
export async function setCurrentAccount(accountId: string): Promise<void> {
  try {
    const accounts = await getSavedAccounts();
    const account = accounts.find((a) => a.id === accountId);
    
    if (account) {
      // 最終使用日時を更新
      account.lastUsed = Date.now();
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      await AsyncStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
      console.log("[AccountManager] Current account set:", account.username);
    }
  } catch (error) {
    console.error("[AccountManager] Failed to set current account:", error);
  }
}

/**
 * アカウントを削除
 */
export async function removeAccount(accountId: string): Promise<void> {
  try {
    const accounts = await getSavedAccounts();
    const filteredAccounts = accounts.filter((a) => a.id !== accountId);
    
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
    
    // 削除したアカウントが現在のアカウントだった場合はクリア
    const currentId = await getCurrentAccountId();
    if (currentId === accountId) {
      await AsyncStorage.removeItem(CURRENT_ACCOUNT_KEY);
    }
    
    console.log("[AccountManager] Account removed:", accountId);
  } catch (error) {
    console.error("[AccountManager] Failed to remove account:", error);
  }
}

/**
 * 全アカウントをクリア
 */
export async function clearAllAccounts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACCOUNTS_KEY);
    await AsyncStorage.removeItem(CURRENT_ACCOUNT_KEY);
    console.log("[AccountManager] All accounts cleared");
  } catch (error) {
    console.error("[AccountManager] Failed to clear accounts:", error);
  }
}

/**
 * 最近使用したアカウントの履歴を取得（最大limit件）
 */
export async function getRecentAccounts(limit: number = 3): Promise<SavedAccount[]> {
  try {
    const accounts = await getSavedAccounts();
    // 既に最終使用日時でソート済みなので、先頭limit件を返す
    return accounts.slice(0, limit);
  } catch (error) {
    console.error("[AccountManager] Failed to get recent accounts:", error);
    return [];
  }
}

/**
 * アカウントの最終使用日時をフォーマットして取得
 */
export function formatLastUsed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return "たった今";
  } else if (minutes < 60) {
    return `${minutes}分前`;
  } else if (hours < 24) {
    return `${hours}時間前`;
  } else if (days < 7) {
    return `${days}日前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}
