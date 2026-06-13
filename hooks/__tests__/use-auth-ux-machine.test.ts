/**
 * Phase 2: ログインUX改善
 * PR-3: useAuthUxMachine のユニットテスト
 * 
 * FSMの状態遷移をテスト（idle → confirm → redirecting → waitingReturn）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthUxMachine } from "../use-auth-ux-machine";

// react-native をモック
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

// useAuth をモック
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    user: null,
    isAuthenticated: false,
  }),
}));

describe("useAuthUxMachine (PR-3: idle → confirm → redirecting → waitingReturn)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態は idle", () => {
    const { result } = renderHook(() => useAuthUxMachine());
    expect(result.current.state.name).toBe("idle");
  });

  it("tapLogin で idle → confirm に遷移", () => {
    const { result } = renderHook(() => useAuthUxMachine());

    act(() => {
      result.current.tapLogin();
    });

    expect(result.current.state.name).toBe("confirm");
    if (result.current.state.name === "confirm") {
      expect(result.current.state.reason).toBe("need_login");
    }
  });

  it("tapLogin(reason) で理由を指定できる", () => {
    const { result } = renderHook(() => useAuthUxMachine());

    act(() => {
      result.current.tapLogin("switch_account");
    });

    expect(result.current.state.name).toBe("confirm");
    if (result.current.state.name === "confirm") {
      expect(result.current.state.reason).toBe("switch_account");
    }
  });

  it("confirmNo で confirm → idle に遷移", () => {
    const { result } = renderHook(() => useAuthUxMachine());

    // idle → confirm
    act(() => {
      result.current.tapLogin();
    });
    expect(result.current.state.name).toBe("confirm");

    // confirm → idle
    act(() => {
      result.current.confirmNo();
    });
    expect(result.current.state.name).toBe("idle");
  });

  it("Web: confirmYes で confirm → redirecting に遷移（waitingReturnはスキップ）", async () => {
    const { result } = renderHook(() => useAuthUxMachine());

    // idle → confirm
    act(() => {
      result.current.tapLogin();
    });
    expect(result.current.state.name).toBe("confirm");

    // confirmYes → redirecting（Web版はwaitingReturnに遷移しない）
    await act(async () => {
      await result.current.confirmYes();
    });
    expect(result.current.state.name).toBe("redirecting");
  });

  it("reset で任意の状態から idle に戻る", () => {
    const { result } = renderHook(() => useAuthUxMachine());

    // idle → confirm
    act(() => {
      result.current.tapLogin();
    });
    expect(result.current.state.name).toBe("confirm");

    // reset → idle
    act(() => {
      result.current.reset();
    });
    expect(result.current.state.name).toBe("idle");
  });

  it("idle 状態で confirmNo を呼んでも状態変化なし", () => {
    const { result } = renderHook(() => useAuthUxMachine());

    expect(result.current.state.name).toBe("idle");

    act(() => {
      result.current.confirmNo();
    });

    expect(result.current.state.name).toBe("idle"); // 変化なし
  });

  it("idle 状態で confirmYes を呼んでも状態変化なし", async () => {
    const { result } = renderHook(() => useAuthUxMachine());

    expect(result.current.state.name).toBe("idle");

    await act(async () => {
      await result.current.confirmYes();
    });

    expect(result.current.state.name).toBe("idle"); // 変化なし
  });
});
