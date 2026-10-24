/**
 * X API の支出ガード（Pay-Per-Use 対応・2026-10）。
 *
 * ★背景: X API Pay-Per-Use は「返ってきたオブジェクト数」で課金される
 *   （user 読み取り $0.010 / post 読み取り $0.005）。2026-11-22 からは
 *   `expansions` で同梱されたオブジェクト（includes.users / includes.tweets）も
 *   通常単価で課金される。
 *   従来の推定（server/db/api-usage-db.ts）は「1リクエスト $0.01」固定で、
 *   `/2/users/:id/following?max_results=1000` のような一覧系（最大1000 user = 最大 $10）を
 *   1/1000 に過小評価していた。
 *
 * このファイルの責務は2つだけ（どちらも純粋関数 + 小さな状態で、テスト可能にしてある）:
 *   1. estimateXApiCallCostUsd: レスポンス本体から課金オブジェクト数を数えて推定額を出す
 *   2. createXProfileLookupGuard: プロフィール enrichment のループ（都道府県クリエイター一覧など）
 *      が同じユーザーを毎回取り直したり、一度に大量に叩いたりしないようにする
 *
 * 環境変数（すべて任意。未設定時は従来の挙動を壊さない既定値）:
 *   X_API_COST_PER_USER_READ_USD   既定 0.010
 *   X_API_COST_PER_POST_READ_USD   既定 0.005
 *   X_API_ENRICH_DISABLED          "true" で enrichment からの X API 呼び出しを止める（キルスイッチ）
 *   X_API_ENRICH_MAX_PER_HOUR      既定 100（インスタンスあたり・1時間の上限）
 *   X_API_ENRICH_RETRY_COOLDOWN_MS 既定 21600000（6時間。同じユーザー名を再取得しない間隔）
 */

const DEFAULT_USER_READ_USD = 0.01;
const DEFAULT_POST_READ_USD = 0.005;
const DEFAULT_ENRICH_MAX_PER_HOUR = 100;
const DEFAULT_RETRY_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type Env = Record<string, string | undefined>;

function readNonNegativeNumber(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export type XApiPricing = { userReadUsd: number; postReadUsd: number };

export function readXApiPricing(env: Env = process.env): XApiPricing {
  return {
    userReadUsd: readNonNegativeNumber(env.X_API_COST_PER_USER_READ_USD, DEFAULT_USER_READ_USD),
    postReadUsd: readNonNegativeNumber(env.X_API_COST_PER_POST_READ_USD, DEFAULT_POST_READ_USD),
  };
}

/** /2/tweets 系かどうか（data が post オブジェクトか）。それ以外は user とみなす。 */
function isPostEndpoint(endpoint: string): boolean {
  return /^\/2\/(tweets|users\/[^/]+\/(tweets|mentions|liked_tweets|timelines))/.test(endpoint);
}

function countItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return 1;
  return 0;
}

export type XApiCostEstimate = {
  userObjects: number;
  postObjects: number;
  costUsd: number;
};

/**
 * レスポンス本体から課金対象オブジェクト数と推定額を出す。
 *
 * - `data` が配列なら要素数、オブジェクトなら1（主オブジェクト）
 * - `includes.users` / `includes.tweets`（= expansions 由来）も数える
 * - OAuth トークン系（/2/oauth2/*）は課金対象外なので 0
 */
export function estimateXApiCallCostUsd(
  endpoint: string,
  body: unknown,
  pricing: XApiPricing = readXApiPricing(),
): XApiCostEstimate {
  if (endpoint.startsWith("/2/oauth2/")) {
    return { userObjects: 0, postObjects: 0, costUsd: 0 };
  }
  const obj = (body && typeof body === "object" ? body : {}) as {
    data?: unknown;
    includes?: { users?: unknown; tweets?: unknown };
  };
  const primary = countItems(obj.data);
  let userObjects = 0;
  let postObjects = 0;
  if (isPostEndpoint(endpoint)) postObjects += primary;
  else userObjects += primary;
  userObjects += countItems(obj.includes?.users);
  postObjects += countItems(obj.includes?.tweets);

  const costUsd = userObjects * pricing.userReadUsd + postObjects * pricing.postReadUsd;
  // 浮動小数の端数を丸める（DB の numeric に入れるため）
  return { userObjects, postObjects, costUsd: Math.round(costUsd * 10000) / 10000 };
}

export type XProfileLookupGuardOptions = {
  disabled: boolean;
  maxPerHour: number;
  retryCooldownMs: number;
  now?: () => number;
};

export function readXProfileLookupGuardOptions(env: Env = process.env): XProfileLookupGuardOptions {
  return {
    disabled: env.X_API_ENRICH_DISABLED === "true",
    maxPerHour: readNonNegativeNumber(env.X_API_ENRICH_MAX_PER_HOUR, DEFAULT_ENRICH_MAX_PER_HOUR),
    retryCooldownMs: readNonNegativeNumber(
      env.X_API_ENRICH_RETRY_COOLDOWN_MS,
      DEFAULT_RETRY_COOLDOWN_MS,
    ),
  };
}

export type XProfileLookupDecision =
  | { allowed: true }
  | { allowed: false; reason: "disabled" | "cooldown" | "hourly_cap" };

/**
 * プロフィール取得の許可判定。
 *
 * ★成功・失敗どちらでも「試した」時刻を記録し、cooldown 中は同じユーザー名を取り直さない。
 *   成功時は DB キャッシュ（7日）が効くので実害なし。失敗時（X 側に画像が無い・凍結など）は
 *   以前は一覧を開くたびに毎回課金されていた。
 * ★状態はインスタンスのメモリ内。サーバーレスでは完全ではないが、
 *   1リクエスト内のループや温まったインスタンスでの連続閲覧はこれで止まる。
 */
export function createXProfileLookupGuard(options: XProfileLookupGuardOptions) {
  const now = options.now ?? Date.now;
  const lastAttemptAt = new Map<string, number>();
  let windowStart = 0;
  let windowCount = 0;

  return {
    tryAcquire(username: string): XProfileLookupDecision {
      if (options.disabled) return { allowed: false, reason: "disabled" };
      const key = username.toLowerCase();
      const t = now();
      const last = lastAttemptAt.get(key);
      if (last != null && t - last < options.retryCooldownMs) {
        return { allowed: false, reason: "cooldown" };
      }
      if (t - windowStart >= HOUR_MS) {
        windowStart = t;
        windowCount = 0;
      }
      if (windowCount >= options.maxPerHour) {
        return { allowed: false, reason: "hourly_cap" };
      }
      windowCount += 1;
      lastAttemptAt.set(key, t);
      // メモリが際限なく増えないよう、古い記録を間引く
      if (lastAttemptAt.size > 5000) {
        for (const [k, v] of lastAttemptAt) {
          if (t - v >= options.retryCooldownMs) lastAttemptAt.delete(k);
        }
      }
      return { allowed: true };
    },
  };
}

let sharedGuard: ReturnType<typeof createXProfileLookupGuard> | null = null;

/** プロセス共有のガード（creator-profile-enricher から使う）。 */
export function getSharedXProfileLookupGuard() {
  if (!sharedGuard) sharedGuard = createXProfileLookupGuard(readXProfileLookupGuardOptions());
  return sharedGuard;
}

/** テスト用 */
export function resetSharedXProfileLookupGuard(): void {
  sharedGuard = null;
}
