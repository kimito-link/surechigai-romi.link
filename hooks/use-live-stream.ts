/**
 * hooks/use-live-stream.ts
 *
 * 足あとの場所で「いま配信中のライブ映像」を1本取る。
 *
 * ★位置情報を新しく取らない: 保存済みの prefecture / municipality 文字列だけを使う
 *   （電池を消耗しないという要件はここにも適用する。use-pref-weather と同じ）。
 *
 * ★取れなければ何も出さない（fail-silent）。エラー表示もスケルトンも出さない。
 *   呼び出し側は従来どおり「検索結果ページを開くボタン」を出すので、
 *   **失敗しても導線は消えない**。ここが取れたときだけ体験が良くなる。
 */
import { useEffect, useState } from "react";
import type { PickedLiveStream } from "@/lib/live-camera/live-stream-pick";

/** 同じ場所を続けて開いたときに再取得しないための簡易キャッシュ */
const cache = new Map<string, PickedLiveStream | null>();

export function useLiveStream(
  prefecture: string | null | undefined,
  municipality?: string | null,
): { stream: PickedLiveStream | null; isLoading: boolean } {
  const [stream, setStream] = useState<PickedLiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!prefecture && !municipality) {
      setStream(null);
      return;
    }

    const key = `${prefecture ?? ""}/${municipality ?? ""}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      setStream(cached);
      return;
    }

    // 画面から離れた後に setState しないためのフラグ
    let alive = true;
    setIsLoading(true);

    const params = new URLSearchParams();
    if (prefecture) params.set("pref", prefecture);
    if (municipality) params.set("municipality", municipality);

    void (async () => {
      try {
        const res = await fetch(`/api/live-stream?${params.toString()}`);
        const data = (await res.json()) as
          | { ok: true; stream: PickedLiveStream }
          | { ok: false };

        const next = data.ok ? data.stream : null;
        cache.set(key, next);
        if (alive) setStream(next);
      } catch {
        // 取れなければ出さないだけ（ユーザーにエラーを見せない）
        if (alive) setStream(null);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [prefecture, municipality]);

  return { stream, isLoading };
}

/**
 * ボタンに出す文言を決める。
 *
 * 直行できるときは**配信タイトルを見せる**。押す前に中身が分かるので、
 * 無関係な配信を掴んだ場合に押さずに済む（直行させる以上、中身を隠さない）。
 * タイトルが長すぎるとボタンが崩れるので詰める。
 */
export function formatLiveStreamLabel(stream: PickedLiveStream | null): string {
  if (!stream) return "ライブ配信を探す";

  const title = stream.title.trim();
  if (!title) return "ライブ配信を見る";

  return title.length > 24 ? `${title.slice(0, 24)}…` : title;
}
