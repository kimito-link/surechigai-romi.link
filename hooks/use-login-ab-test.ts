/**
 * A/Bテスト用のデータ管理フック
 * 
 * ログインメッセージの表示回数とログイン成功率を記録
 */

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOGIN_MESSAGES, type LoginMessage } from "@/constants/login-messages";

const AB_TEST_STORAGE_KEY = "@login_ab_test_data";

export interface ABTestData {
  messageId: string;
  impressions: number; // 表示回数
  conversions: number; // ログイン成功回数
}

export interface ABTestState {
  data: Record<string, ABTestData>;
  selectedMessage: LoginMessage | null;
}

/**
 * A/Bテスト用のデータ管理フック
 */
export function useLoginABTest() {
  const [state, setState] = useState<ABTestState>({
    data: {},
    selectedMessage: null,
  });

  // 初期化: ストレージからデータを読み込む
  useEffect(() => {
    loadABTestData();
  }, []);

  /**
   * ストレージからA/Bテストデータを読み込む
   */
  async function loadABTestData() {
    try {
      const stored = await AsyncStorage.getItem(AB_TEST_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setState((prev) => ({ ...prev, data }));
      } else {
        // 初回: すべてのメッセージIDを初期化
        const initialData: Record<string, ABTestData> = {};
        LOGIN_MESSAGES.forEach((msg) => {
          initialData[msg.id] = {
            messageId: msg.id,
            impressions: 0,
            conversions: 0,
          };
        });
        setState((prev) => ({ ...prev, data: initialData }));
        await AsyncStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error("Failed to load AB test data:", error);
    }
  }

  /**
   * A/Bテストデータをストレージに保存
   */
  async function saveABTestData(data: Record<string, ABTestData>) {
    try {
      await AsyncStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save AB test data:", error);
    }
  }

  /**
   * 役割に基づいてメッセージを選択し、表示回数を記録
   * りんくが主役のため約70%でりんく、残りでこん太・たぬ姉を役割に応じて表示
   */
  function selectMessage(): LoginMessage {
    const rinkuMessages = LOGIN_MESSAGES.filter((msg) => msg.role === "main");
    const communityMessages = LOGIN_MESSAGES.filter((msg) => msg.role === "community");
    const planningMessages = LOGIN_MESSAGES.filter((msg) => msg.role === "planning");

    const roll = Math.random();
    let selectedMessage: LoginMessage;
    if (roll < 0.7 && rinkuMessages.length > 0) {
      selectedMessage =
        rinkuMessages[Math.floor(Math.random() * rinkuMessages.length)];
    } else if (roll < 0.85 && communityMessages.length > 0) {
      selectedMessage =
        communityMessages[
          Math.floor(Math.random() * communityMessages.length)
        ];
    } else if (planningMessages.length > 0) {
      selectedMessage =
        planningMessages[
          Math.floor(Math.random() * planningMessages.length)
        ];
    } else {
      selectedMessage =
        LOGIN_MESSAGES[Math.floor(Math.random() * LOGIN_MESSAGES.length)];
    }

    // 表示回数をインクリメント
    const newData = { ...state.data };
    if (!newData[selectedMessage.id]) {
      newData[selectedMessage.id] = {
        messageId: selectedMessage.id,
        impressions: 0,
        conversions: 0,
      };
    }
    newData[selectedMessage.id].impressions += 1;

    setState({ data: newData, selectedMessage });
    saveABTestData(newData);

    return selectedMessage;
  }

  /**
   * ログイン成功時にコンバージョンを記録
   */
  function recordConversion() {
    if (!state.selectedMessage) return;

    const newData = { ...state.data };
    const messageId = state.selectedMessage.id;
    if (newData[messageId]) {
      newData[messageId].conversions += 1;
    }

    setState((prev) => ({ ...prev, data: newData }));
    saveABTestData(newData);
  }

  /**
   * A/Bテストデータをリセット（開発用）
   */
  async function resetABTestData() {
    const initialData: Record<string, ABTestData> = {};
    LOGIN_MESSAGES.forEach((msg) => {
      initialData[msg.id] = {
        messageId: msg.id,
        impressions: 0,
        conversions: 0,
      };
    });
    setState({ data: initialData, selectedMessage: null });
    await saveABTestData(initialData);
  }

  /**
   * コンバージョン率を計算
   */
  function getConversionRate(messageId: string): number {
    const data = state.data[messageId];
    if (!data || data.impressions === 0) return 0;
    return (data.conversions / data.impressions) * 100;
  }

  return {
    abTestData: state.data,
    selectedMessage: state.selectedMessage,
    selectMessage,
    recordConversion,
    resetABTestData,
    getConversionRate,
  };
}
