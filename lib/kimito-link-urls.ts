/** kimito.link 公開プロフィール（例: https://kimito.link/streamerfunch/） */
const APP_ORIGIN = "https://surechigai.kimito.link";

export function buildKimitoPublicProfileUrl(username: string): string {
  const clean = username.replace(/^@/, "").trim();
  return `https://kimito.link/${encodeURIComponent(clean)}/`;
}

/** すれ違ひ通信の共有地図（例: https://surechigai.kimito.link/u/abc123） */
export function buildSurechigaiShareUrl(shareSlug: string): string {
  return `${APP_ORIGIN}/u/${shareSlug}`;
}

/** 表示用に kimito.link のパスだけ返す（例: kimito.link/streamerfunch/） */
export function formatKimitoLinkLabel(username: string): string {
  const clean = username.replace(/^@/, "").trim();
  return `kimito.link/${clean}/`;
}

/* ───────────────────────────────────────────────────────────────────────────
 * kimito.link ハブへの利用サマリ送信
 *
 * 「1ログインで全サービス」の共通アカウント基盤で、各サービスの利用状況を
 * kimito.link のダッシュボードに横断表示する（＝パスポートカード）ための送信。
 *
 * ★本人の Clerk セッションで、本人の名前空間だけを書く設計。
 *   受け口: kimitolink-linktree/app/api/hub/summary/route.ts
 *   契約:   kimitolink-linktree/docs/KIMITO-LINK-HUB-STRATEGY-DESIGN.md
 * ─────────────────────────────────────────────────────────────────────────── */

/** ハブの受け口。★本番固定（このリポの外部URLは全て本番ハードコードの作法）。 */
const HUB_SUMMARY_URL = "https://kimito.link/api/hub/summary";

/** このサービスの名前空間。kimito.link 側 app.config.json の hubKey と一致させる。 */
const HUB_APP_KEY = "surechigai";

/**
 * ★短くする理由は lib/ogp/warm-og-image.ts:40-47 と同じ。
 *   未解決の Promise が残ると呼び出し元のレスポンスが遅延しうる（2026-07-31 実機障害）。
 *   サマリ送信は「次回のチェックインで上書きされる」ので、粘る価値がない。
 */
const HUB_SEND_TIMEOUT_MS = 5_000;

/** 前回送った内容（重複送信を避ける）。消えても実害は「次回も送る」だけ。 */
const HUB_LAST_SENT_KEY = "surechigai:hub-last-sent";

const HUB_LABEL = "すれ違い";
const HUB_LABEL2 = "都道府県";

export type HubSummaryInput = {
  /** すれ違った人数（累計）。★確定値のみ。楽観的更新の値を渡さないこと */
  encounterPartnerCount: number | undefined;
  /** 訪問した都道府県数 */
  visitedPrefectureCount: number | undefined;
  /** 最終記録時刻 */
  latestRecordedAt: Date | string | null | undefined;
};

/**
 * ★受け口の sanitize で「黙って捨てられる」値を、送る前に弾く。
 *
 * なぜ要るか（kimito.link 側 lib/hub-metadata.ts:151 の実装）:
 *   送った項目が**全部**濾されると `?? {}` で**既存サマリが空で上書き消去**され、
 *   しかも `{ok:true}` が返る。＝ 200 を見ても「保存された」とは限らない。
 *
 * 受け口の制約（実装で確認済み）:
 *   count : 数値のみ・負値は捨てる・小数は切り捨て
 *   label : 1〜40文字・★半角スペースと制御文字を1つでも含むと捨てる
 *   ISO   : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ に前方一致すること
 */
function isSendableCount(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

function isSendableLabel(v: string): boolean {
  if (v.length < 1 || v.length > 40) return false;
  for (let i = 0; i < v.length; i += 1) {
    const code = v.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return false;
  }
  return true;
}

function toIsoOrNull(v: Date | string | null | undefined): string | null {
  const s = v instanceof Date ? v.toISOString() : typeof v === "string" ? v : null;
  if (!s) return null;
  // 受け口が通す形でなければ載せない（載せても黙って捨てられるだけ）。
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) ? s : null;
}

/**
 * 利用サマリを kimito.link のハブへ送る（best-effort）。
 *
 * ★本線を止めない: 例外を外に出さない。呼ぶ側は await しないこと。
 * ★未ログイン・値が取れないときは**何もしない**（送らない）。
 *
 * ★特に「値が取れないとき 0 を送らない」のが重要。
 *   受け口は 0 を有効値として保存するため、「測れなかった」が「0人」として
 *   記録され、二度と区別できなくなる（__tests__/usage-snapshot.test.ts と同じ罠）。
 *
 * @param input マイページのサマリ（★invalidate 後の確定値）
 * @param getToken Clerk セッショントークンの取得関数（lib/auth-token.ts の getAuthToken）
 */
export async function sendHubSummary(
  input: HubSummaryInput,
  getToken: () => Promise<string | null>,
): Promise<void> {
  try {
    // ★測れていない値は送らない（0 で埋めない）。
    if (!isSendableCount(input.encounterPartnerCount)) return;
    if (!isSendableCount(input.visitedPrefectureCount)) return;
    // ラベルは定数なので、ここで落ちたら実装のバグ。黙って壊れた値を送らない。
    if (!isSendableLabel(HUB_LABEL) || !isSendableLabel(HUB_LABEL2)) return;

    const count = Math.floor(input.encounterPartnerCount);
    const count2 = Math.floor(input.visitedPrefectureCount);
    const lastActiveAt = toIsoOrNull(input.latestRecordedAt);

    // ★同じ内容を続けて送らない（受け口は毎回 Clerk API を2回叩くため）。
    const fingerprint = `${count}/${count2}/${lastActiveAt ?? ""}`;
    if (readLastSent() === fingerprint) return;

    const token = await getToken();
    if (!token) return; // 未ログイン。何もしない。

    const summary: Record<string, unknown> = {
      count,
      label: HUB_LABEL,
      count2,
      label2: HUB_LABEL2,
    };
    if (lastActiveAt) summary.lastActiveAt = lastActiveAt;

    const res = await fetch(HUB_SUMMARY_URL, {
      method: "POST",
      // ★Cookie は送らない。受け口は credentials を許可していないため、
      //   付けると CORS が壊れる（kimito.link/lib/hub-cors.ts の設計）。
      //   ★独自ヘッダも足さないこと（許可は Authorization と Content-Type のみ）。
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appKey: HUB_APP_KEY, summary }),
      signal: AbortSignal.timeout(HUB_SEND_TIMEOUT_MS),
    });

    // ★リトライしない。失敗しても次のチェックインで上書きされる。
    if (res.ok) writeLastSent(fingerprint);
  } catch {
    // noop — ハブへの記録はおまけ。本業（チェックイン）を巻き添えにしない。
  }
}

function readLastSent(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(HUB_LAST_SENT_KEY);
  } catch {
    return null; // プライベートモード等で読めないことがある。送る側に倒す。
  }
}

function writeLastSent(value: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(HUB_LAST_SENT_KEY, value);
  } catch {
    // noop — 控えられなくても実害は「次回も送る」だけ。
  }
}
