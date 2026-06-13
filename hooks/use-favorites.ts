import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@favorites_challenges";

/**
 * お気に入りチャレンジを管理するカスタムフック
 * AsyncStorageを使用してローカルに保存
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期読み込み
  useEffect(() => {
    loadFavorites();
  }, []);

  // お気に入りを読み込み
  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // お気に入りを保存
  const saveFavorites = async (newFavorites: number[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  };

  // お気に入りに追加
  const addFavorite = useCallback(async (challengeId: number) => {
    setFavorites((prev) => {
      if (prev.includes(challengeId)) return prev;
      const newFavorites = [...prev, challengeId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // お気に入りから削除
  const removeFavorite = useCallback(async (challengeId: number) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter((id) => id !== challengeId);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // お気に入りをトグル
  const toggleFavorite = useCallback(async (challengeId: number) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(challengeId);
      const newFavorites = isFavorite
        ? prev.filter((id) => id !== challengeId)
        : [...prev, challengeId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // お気に入りかどうかを確認
  const isFavorite = useCallback(
    (challengeId: number) => favorites.includes(challengeId),
    [favorites]
  );

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
