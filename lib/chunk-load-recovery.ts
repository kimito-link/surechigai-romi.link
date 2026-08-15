/**
 * lib/chunk-load-recovery.ts
 *
 * 遅延読み込みチャンクの取得失敗から自動回復する。
 *
 * ★実際に起きたこと（2026-08-15・ユーザー実機）:
 *   集まりタブで「Loading module .../events-host-panel-....js」というエラー画面が出た。
 *   本番の現行ビルドではそのチャンクは 200 で配信されており、**コードは壊れていない**。
 *   端末に残っていた**古い親チャンク**が、既に存在しない古い子チャンク名を指していた。
 *
 *   Metro は子チャンクの参照先URLを親チャンクのファイル名ハッシュに含めないため、
 *   CDN の immutable キャッシュに「同名・別内容」の親が残ると、この状態が起こりうる
 *   （CLAUDE.md ディレクティブ4 の既知の地雷。2026-07-04 にも実障害）。
 *
 * ★なぜ「再試行」ボタンだけでは直らないか:
 *   再試行しても同じ古い親チャンクが同じ古い子チャンク名を取りに行くので、
 *   何度押しても同じエラーになる。**ページを読み込み直して親チャンクごと取り直す**
 *   必要がある。
 *
 * ★無限リロード防止:
 *   リロードしても直らない場合（本当にサーバー側にファイルが無い等）に
 *   延々と再読み込みし続けると、ユーザーは画面を見ることすらできなくなる。
 *   sessionStorage に印を付けて**1セッションにつき1回だけ**реリロードする。
 */

/** リロード済みの印。タブを閉じるまで保持される */
const RELOAD_FLAG_KEY = "surechigai.chunkReload.v1";

/**
 * このエラーが「チャンクの取得失敗」かどうか。
 *
 * Metro / webpack / Vite で文言が違うため、実際に観測された形を含めて広めに拾う。
 * 判定を誤ると無関係なエラーでリロードしてしまうので、
 * 「読み込みに関する語」と「JSファイルらしさ」の両方を見る。
 */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "";
  if (!message) return false;

  const loadingWords =
    /Loading (module|chunk|CSS chunk)|ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
  if (!loadingWords.test(message)) return false;

  return true;
}

/**
 * チャンク取得失敗なら一度だけページを再読み込みして回復を試みる。
 *
 * @returns リロードを実行したなら true（呼び出し側はエラー画面を出さずに待てばよい）
 */
export function tryRecoverFromChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false;
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return false;
  }

  try {
    // 既に一度リロードしている＝リロードでは直らない。無限ループにしない
    if (sessionStorage.getItem(RELOAD_FLAG_KEY)) return false;
    sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
  } catch {
    // sessionStorage が使えない環境ではリロードしない（無限ループを避ける）
    return false;
  }

  try {
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** 正常に描画できたときに呼ぶ。次にチャンク落ちした時のために印を消す */
export function clearChunkReloadFlag(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
  } catch {
    // noop
  }
}
