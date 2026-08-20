/**
 * ライブ配信の直行が取れないときに「今より悪くならない」ことを守る。
 *
 * 背景: 直行方式は YouTube Data API に依存する。キー未設定・無料枠超過(1日100回)・
 * 通信断・該当なし、と失敗経路が多い。**失敗しても導線が消えてはいけない**。
 * 従来の検索リンクへ必ず落ちることを固定する。
 *
 * ★ここで守りたい失敗:
 *   1. 直行が取れないと「ライブ配信」ボタンごと消える（今より悪化）
 *   2. 直行が取れたのに国交省の一覧ページ（ダムの図）が併存して迷わせる
 *   3. 直行が取れないのに国交省リンクまで隠してしまい、その県で導線が全滅する
 *
 * 実装（place-context-bar.tsx / footprint-sheet.tsx）と同じ式をここに置く。
 * JSX の中の判断はテストで守れないので、式そのものを固定する
 * （resolve-place-context.ts を切り出したのと同じ理由）。
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
}));

import {
  liveCameraLinkFor,
  youtubeLiveSearchUrl,
} from "@/lib/live-camera/live-camera-links";
import { formatLiveStreamLabel } from "@/hooks/use-live-stream";
import type { PickedLiveStream } from "@/lib/live-camera/live-stream-pick";

/** 画面が実際に開くURLと、国交省リンクを出すかの判断（実装と同じ式）。 */
function resolveLiveUi(
  prefecture: string | null,
  municipality: string | null,
  stream: PickedLiveStream | null,
) {
  const youtubeUrl = youtubeLiveSearchUrl(municipality ?? prefecture ?? null);
  return {
    liveUrl: stream?.url ?? youtubeUrl,
    cameraLink: stream ? null : liveCameraLinkFor(prefecture),
    label: formatLiveStreamLabel(stream),
  };
}

const STREAM: PickedLiveStream = {
  videoId: "xyz789",
  title: "諏訪湖 茅野ライブカメラ",
  channelTitle: "茅野市観光協会",
  url: "https://www.youtube.com/watch?v=xyz789",
};

describe("直行が取れたとき", () => {
  it("映像へ直行する（検索結果ページを開かない）", () => {
    const ui = resolveLiveUi("長野県", "茅野市", STREAM);

    expect(ui.liveUrl).toBe("https://www.youtube.com/watch?v=xyz789");
    expect(ui.liveUrl).not.toContain("/results");
  });

  it("国交省の一覧ページは隠す（映像に直行できるなら上位互換）", () => {
    // 長野県は国交省リンクがある県。直行が取れたら出さない。
    expect(liveCameraLinkFor("長野県")).not.toBeNull();
    expect(resolveLiveUi("長野県", "茅野市", STREAM).cameraLink).toBeNull();
  });

  it("配信名をボタンに出す（押す前に中身が分かる）", () => {
    expect(resolveLiveUi("長野県", "茅野市", STREAM).label).toContain("諏訪湖");
  });

  it("長い配信名は詰める（ボタンを崩さない）", () => {
    const long = { ...STREAM, title: "あ".repeat(80) };
    const label = resolveLiveUi("長野県", "茅野市", long).label;

    expect(label.length).toBeLessThanOrEqual(25);
    expect(label.endsWith("…")).toBe(true);
  });
});

describe("直行が取れないとき（キー未設定・枠超過・該当なし）", () => {
  it("従来の検索リンクへ落ちる＝導線は消えない", () => {
    // これが最重要。キーが無い状態で本番に出しても、今と同じ動作になる。
    const ui = resolveLiveUi("長野県", "茅野市", null);

    expect(ui.liveUrl).not.toBeNull();
    expect(ui.liveUrl!).toContain("youtube.com/results");
  });

  it("従来のボタン文言に戻る", () => {
    expect(resolveLiveUi("長野県", "茅野市", null).label).toBe("ライブ配信を探す");
  });

  it("国交省リンクは残す（その県で唯一の手段を奪わない）", () => {
    expect(resolveLiveUi("長野県", "茅野市", null).cameraLink).not.toBeNull();
  });

  it("国交省が未対応の県でも検索リンクは出る（穴を作らない）", () => {
    // 北海道は http のみで国交省リンクを載せていない
    const ui = resolveLiveUi("北海道", "札幌市", null);

    expect(ui.cameraLink).toBeNull();
    expect(ui.liveUrl).not.toBeNull();
  });
});

describe("場所が無いとき", () => {
  it("何も出さない（空のボタンを作らない）", () => {
    const ui = resolveLiveUi(null, null, null);

    expect(ui.liveUrl).toBeNull();
    expect(ui.cameraLink).toBeNull();
  });
});
