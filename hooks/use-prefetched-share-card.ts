/**
 * 共有カード（/s/<id>）をシェアボタンより先に作っておくフック（2026-11-14）。
 *
 * 地図カードの描画とアップロードには 2〜6 秒かかる。以前はシェアを押してから作っていたので、
 * X の投稿画面が開くまで待たされ、開いた直後の下書きでもカードが出るのが遅かった。
 * チェックイン完了（やマイページを開いた時点）で先に作っておけば、押した瞬間に
 * 出来上がった /s/<id> で X を開ける。X が下書きで取りに来る画像は保存済みの静的 JPEG。
 *
 * - enabled が false→true になるたびに作り直す（チェックインのたびに新しい場所）
 * - 作ってから STALE_MS を過ぎたものは使わず、押した時点で作り直す
 * - 先回りが失敗していたら、押した時点でもう一度作る
 */
import { useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const STALE_MS = 10 * 60 * 1000;

type Prefetched<T> = { promise: Promise<T>; at: number };

export function usePrefetchedShareCard(enabled: boolean) {
  const mutation = trpc.ogp.createShareCard.useMutation();
  const mutateRef = useRef(mutation.mutateAsync);
  mutateRef.current = mutation.mutateAsync;
  type Result = Awaited<ReturnType<typeof mutation.mutateAsync>>;
  const cacheRef = useRef<Prefetched<Result> | null>(null);

  const start = useCallback((): Promise<Result> => {
    const promise = mutateRef.current();
    const entry = { promise, at: Date.now() };
    cacheRef.current = entry;
    // 失敗した先回りは捨てる（押した時点で作り直す）。未処理の reject も防ぐ。
    promise.catch(() => {
      if (cacheRef.current === entry) cacheRef.current = null;
    });
    return promise;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cacheRef.current = null;
      return;
    }
    void start().catch(() => undefined);
  }, [enabled, start]);

  /** シェアを押したときに呼ぶ。先回りで作ったカードがあればそれを、無ければ今作る。 */
  const take = useCallback((): Promise<Result> => {
    const cached = cacheRef.current;
    if (cached && Date.now() - cached.at < STALE_MS) return cached.promise;
    return start();
  }, [start]);

  return { take };
}
