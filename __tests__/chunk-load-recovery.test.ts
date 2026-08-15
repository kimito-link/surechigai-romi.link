/**
 * チャンク取得失敗からの自動回復を守る。
 *
 * ★実際に起きた症状（2026-08-15・ユーザー実機のスクリーンショット）:
 *   集まりタブで「Loading module https://.../events-host-panel-....js」のエラー画面。
 *   現行ビルドのチャンクは 200 で配信されていたので**コードは壊れていない**。
 *   端末に残った古い親チャンクが、既に無い古い子チャンク名を取りに行っていた。
 *
 * ★「再試行」ボタンでは直らない:
 *   同じ古い親チャンクが同じ古い子を取りに行くので何度押しても同じ。
 *   ページごと読み込み直して親チャンクを取り直す必要がある。
 *
 * ★ただし無限リロードは絶対に作らない:
 *   リロードしても直らないケース（本当にファイルが無い等）で延々と再読み込みすると
 *   ユーザーは画面すら見られなくなる。1セッション1回に制限する。
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  isChunkLoadError,
  tryRecoverFromChunkError,
  clearChunkReloadFlag,
} from "@/lib/chunk-load-recovery";

const store = new Map<string, string>();
const reload = vi.fn();

beforeEach(() => {
  store.clear();
  reload.mockClear();

  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal("window", { location: { reload } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isChunkLoadError（チャンク落ちの判定）", () => {
  it("実機で観測されたメッセージを検出する", () => {
    // スクリーンショットに出ていた実際の文言
    const real = new Error(
      "Loading module https://surechigai.kimito.link/_expo/static/js/web/events-host-panel-165ce236.js failed",
    );

    expect(isChunkLoadError(real)).toBe(true);
  });

  it("他のバンドラの文言も拾う", () => {
    expect(isChunkLoadError(new Error("ChunkLoadError: Loading chunk 42 failed"))).toBe(true);
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module: /x.js")),
    ).toBe(true);
  });

  it("無関係なエラーでは true にしない（誤ってリロードしない）", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(new Error("useToast must be used within a ToastProvider"))).toBe(
      false,
    );
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe("tryRecoverFromChunkError（自動回復）", () => {
  it("チャンク落ちなら1回だけリロードする", () => {
    const err = new Error("Loading module https://example.com/a-1.js failed");

    expect(tryRecoverFromChunkError(err)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("2回目はリロードしない（無限ループを作らない）", () => {
    const err = new Error("Loading module https://example.com/a-1.js failed");

    tryRecoverFromChunkError(err);
    reload.mockClear();

    // リロードしても直らなかった場合。ここで再びリロードすると画面を見られなくなる
    expect(tryRecoverFromChunkError(err)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("チャンク落ち以外ではリロードしない", () => {
    expect(tryRecoverFromChunkError(new Error("何か別のエラー"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("正常描画で印を消すと、次のチャンク落ちで再びリロードできる", () => {
    const err = new Error("Loading module https://example.com/a-1.js failed");

    tryRecoverFromChunkError(err);
    clearChunkReloadFlag();
    reload.mockClear();

    expect(tryRecoverFromChunkError(err)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("sessionStorage が使えない環境ではリロードしない（無限ループ防止）", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    });

    const err = new Error("Loading module https://example.com/a-1.js failed");

    expect(tryRecoverFromChunkError(err)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
