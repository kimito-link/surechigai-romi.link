/**
 * Phase 2: ログインUX改善
 * PR-3: waitingReturn状態とタイムアウト処理追加
 * 
 * このファイルはPhase 2実装ガイドに基づいて作成されています。
 * docs/phase2-implementation-guide.md を参照してください。
 */

import { useReducer, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";

/**
 * 認証UXの状態定義
 */
export type AuthUxState =
  | { name: "idle" }
  | { name: "confirm"; reason: "need_login" | "switch_account" }
  | { name: "redirecting" }
  | { name: "waitingReturn"; startedAt: number; timeoutMs: number }
  | { name: "success" }
  | { name: "showingWelcome" }
  | { name: "cancel"; kind: "timeout" | "user" }
  | { name: "error"; message?: string };

/**
 * 認証UXのアクション定義
 */
export type AuthUxAction =
  | { type: "TAP_LOGIN"; reason?: "need_login" | "switch_account" }
  | { type: "CONFIRM_YES" }
  | { type: "CONFIRM_NO" }
  | { type: "REDIRECTING_START" }
  | { type: "WAITING_RETURN_START"; startedAt: number; timeoutMs: number }
  | { type: "SUCCESS" }
  | { type: "SHOW_WELCOME" }
  | { type: "HIDE_WELCOME" }
  | { type: "CANCEL"; kind: "timeout" | "user" }
  | { type: "ERROR"; message?: string }
  | { type: "RETRY" }
  | { type: "BACK_WITHOUT_LOGIN" }
  | { type: "RESET" };

/**
 * FSM reducer（状態遷移ロジック）
 * 
 * PR-1では idle ↔ confirm のみ実装
 * 他の状態は後続PRで追加
 */
function authUxReducer(state: AuthUxState, action: AuthUxAction): AuthUxState {
  switch (action.type) {
    case "TAP_LOGIN":
      // idle → confirm（確認を挟む方針）
      if (state.name === "idle") {
        return {
          name: "confirm",
          reason: action.reason || "need_login",
        };
      }
      return state;

    case "CONFIRM_YES":
      // confirm → redirecting
      if (state.name === "confirm") {
        return { name: "redirecting" };
      }
      return state;

    case "CONFIRM_NO":
      // confirm → idle
      if (state.name === "confirm") {
        return { name: "idle" };
      }
      return state;

    case "RESET":
      // どの状態からでも idle に戻る
      return { name: "idle" };

    case "REDIRECTING_START":
      // idle/confirm → redirecting
      if (state.name === "idle" || state.name === "confirm") {
        return { name: "redirecting" };
      }
      return state;

    case "CANCEL":
      // キャンセルされたら idle に戻る
      return { name: "idle" };

    case "WAITING_RETURN_START":
      // redirecting → waitingReturn
      if (state.name === "redirecting") {
        return {
          name: "waitingReturn",
          startedAt: action.startedAt,
          timeoutMs: action.timeoutMs,
        };
      }
      return state;

    case "SUCCESS":
      // waitingReturn → showingWelcome
      if (state.name === "waitingReturn") {
        return { name: "showingWelcome" };
      }
      return state;

    case "SHOW_WELCOME":
      // success → showingWelcome
      if (state.name === "success") {
        return { name: "showingWelcome" };
      }
      return state;

    case "HIDE_WELCOME":
      // showingWelcome → idle
      if (state.name === "showingWelcome") {
        return { name: "idle" };
      }
      return state;

    case "ERROR":
      // waitingReturn → error
      if (state.name === "waitingReturn") {
        return {
          name: "error",
          message: action.message,
        };
      }
      return state;

    case "RETRY":
      // cancel/error → confirm
      if (state.name === "cancel" || state.name === "error") {
        return {
          name: "confirm",
          reason: "need_login",
        };
      }
      return state;

    case "BACK_WITHOUT_LOGIN":
      // cancel/error/success/showingWelcome → idle
      if (state.name === "cancel" || state.name === "error" || state.name === "success" || state.name === "showingWelcome") {
        return { name: "idle" };
      }
      return state;

    default:
      return state;
  }
}

/**
 * 認証UX状態管理フック
 * 
 * PR-7: Auth Context監視を追加してログイン成否を自動検知
 * 
 * @returns 状態と状態遷移関数
 */
export function useAuthUxMachine() {
  const [state, dispatch] = useReducer(authUxReducer, { name: "idle" });
  const { isAuthenticated, error: authError } = useAuth();
  const openLoginGuide = useLoginGuide();

  // Auth Context監視（PR-7: ログイン成否の自動検知）
  useEffect(() => {
    if (state.name !== "waitingReturn") return;

    // ログイン成功を検知
    if (isAuthenticated) {
      dispatch({ type: "SUCCESS" });
      return;
    }

    // エラーを検知（useAuthのerrorは将来拡張可能なため unknown として扱う）
    const err = authError as unknown;
    if (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      dispatch({ type: "ERROR", message: errorMessage });
      return;
    }
  }, [state, isAuthenticated, authError]);

  // タイムアウト処理（waitingReturn状態で30秒経過したらcancel）
  useEffect(() => {
    if (state.name !== "waitingReturn") return;

    const elapsed = Date.now() - state.startedAt;
    const remaining = state.timeoutMs - elapsed;

    if (remaining <= 0) {
      // すでにタイムアウト
      dispatch({ type: "CANCEL", kind: "timeout" });
      return;
    }

    // タイマー設定
    const timer = setTimeout(() => {
      dispatch({ type: "CANCEL", kind: "timeout" });
    }, remaining);

    return () => clearTimeout(timer);
  }, [state]);

  // ログインボタンタップ
  const tapLogin = useCallback(
    (reason?: "need_login" | "switch_account") => {
      dispatch({ type: "TAP_LOGIN", reason });
    },
    []
  );

  // 確認モーダルで「はい」
  const confirmYes = useCallback(async () => {
    dispatch({ type: "CONFIRM_YES" });
    try {
      openLoginGuide();
      // Web: window.location.href でページ遷移するので待機画面は不要
      // Native: 外部ブラウザが開くので、短いタイムアウトで待機
      if (Platform.OS !== "web") {
        dispatch({
          type: "WAITING_RETURN_START",
          startedAt: Date.now(),
          timeoutMs: 15000,
        });
      }
      // Webではそのまま（redirecting状態のまま画面遷移が発生する）
    } catch (error) {
      console.error("[useAuthUxMachine] login() error:", error);
      if (Platform.OS !== "web") {
        dispatch({
          type: "WAITING_RETURN_START",
          startedAt: Date.now(),
          timeoutMs: 15000,
        });
      }
    }
  }, [openLoginGuide]);

  // 確認モーダルで「いいえ」
  const confirmNo = useCallback(() => {
    dispatch({ type: "CONFIRM_NO" });
  }, []);

  // リセット（idle に戻る）
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // 成功（waitingReturn → success）
  const success = useCallback(() => {
    dispatch({ type: "SUCCESS" });
  }, []);

  // エラー（waitingReturn → error）
  const error = useCallback((message?: string) => {
    dispatch({ type: "ERROR", message });
  }, []);

  // リトライ（cancel/error → confirm）
  const retry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  // ログインせずに戻る（cancel/error/success/showingWelcome → idle）
  const backWithoutLogin = useCallback(() => {
    dispatch({ type: "BACK_WITHOUT_LOGIN" });
  }, []);

  // ウェルカムメッセージを表示（success → showingWelcome）
  const showWelcome = useCallback(() => {
    dispatch({ type: "SHOW_WELCOME" });
  }, []);

  // ウェルカムメッセージを非表示（showingWelcome → idle）
  const hideWelcome = useCallback(() => {
    dispatch({ type: "HIDE_WELCOME" });
  }, []);

  return {
    state,
    tapLogin,
    confirmYes,
    confirmNo,
    reset,
    success,
    error,
    retry,
    backWithoutLogin,
    showWelcome,
    hideWelcome,
  };
}
