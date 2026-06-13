/**
 * 複数アカウント管理用のReactフック
 */

import { useState, useEffect, useCallback } from "react";
import {
  SavedAccount,
  getSavedAccounts,
  saveAccount,
  removeAccount,
  getCurrentAccountId,
  setCurrentAccount,
} from "@/lib/account-manager";

export function useAccounts() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // アカウント一覧を読み込み
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [savedAccounts, currentId] = await Promise.all([
        getSavedAccounts(),
        getCurrentAccountId(),
      ]);
      setAccounts(savedAccounts);
      setCurrentAccountId(currentId);
    } catch (error) {
      console.error("[useAccounts] Failed to load accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // アカウントを保存
  const addAccount = useCallback(
    async (account: Omit<SavedAccount, "lastUsed">) => {
      await saveAccount(account);
      await loadAccounts();
    },
    [loadAccounts]
  );

  // アカウントを削除
  const deleteAccount = useCallback(
    async (accountId: string) => {
      await removeAccount(accountId);
      await loadAccounts();
    },
    [loadAccounts]
  );

  // アカウントを切り替え
  const switchAccount = useCallback(
    async (accountId: string) => {
      await setCurrentAccount(accountId);
      setCurrentAccountId(accountId);
    },
    []
  );

  // 現在のアカウント以外のアカウント
  const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

  // 現在のアカウント
  const currentAccount = accounts.find((a) => a.id === currentAccountId) || null;

  return {
    accounts,
    currentAccount,
    currentAccountId,
    otherAccounts,
    isLoading,
    addAccount,
    deleteAccount,
    switchAccount,
    refreshAccounts: loadAccounts,
  };
}
