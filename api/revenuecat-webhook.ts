/**
 * RevenueCat Webhook（Vercel Functions）。
 * 設計は docs/monetization-DESIGN.md D-2。
 *
 * 権利の書き込みはここだけ。クライアントの申告は一切信用しない
 * （購入したかどうかの真実はストア → RevenueCat → この webhook の経路のみ）。
 *
 * 認証: 共有シークレットを Authorization ヘッダで照合し、不一致は 401（fail-closed）。
 *   環境変数 REVENUECAT_WEBHOOK_SECRET が未設定なら常に 401 にする。
 *   「設定を忘れたら素通し」にすると誰でも権利を書けてしまうため、
 *   sponsor_config のフェイルオープン事故（地雷C）と同じ轍を踏まない。
 *
 * イベント対応:
 *   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE → active で upsert
 *   CANCELLATION → willRenew=false のみ（期間満了までは有効なので status は触らない）
 *   EXPIRATION    → status='expired'
 *   REFUND / 不正 → status='revoked'
 *
 * 冪等: userId 一意の upsert なので自然に冪等。イベントログ表は作らない。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

/** RevenueCat の app_user_id は "user_" + users.id で発行する（購入時に logIn で紐付け） */
const APP_USER_ID_PREFIX = "user_";

type RcEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "UNCANCELLATION"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "EXPIRATION"
  | "REFUND"
  | "SUBSCRIPTION_PAUSED"
  | "TRANSFER"
  | "TEST";

/** 権利をどう動かすか。null は「無視してよいイベント」 */
type Effect = "activate" | "expire" | "revoke" | "stop-renewal" | null;

export function effectForEvent(type: string): Effect {
  switch (type as RcEventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return "activate";
    case "CANCELLATION":
      return "stop-renewal";
    case "EXPIRATION":
    case "SUBSCRIPTION_PAUSED":
      return "expire";
    case "REFUND":
      return "revoke";
    default:
      // TEST / TRANSFER / 未知のイベントは権利を動かさない
      return null;
  }
}

/** "user_123" → 123。想定外の形なら null（＝権利を書かない） */
export function parseAppUserId(appUserId: unknown): number | null {
  if (typeof appUserId !== "string") return null;
  if (!appUserId.startsWith(APP_USER_ID_PREFIX)) return null;
  const raw = appUserId.slice(APP_USER_ID_PREFIX.length);
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** ミリ秒エポック → Date。無効なら null */
export function toDate(ms: unknown): Date | null {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // fail-closed: シークレット未設定なら誰も通さない
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const provided = req.headers.authorization;
  if (!secret || provided !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const event = (req.body as { event?: Record<string, unknown> } | undefined)?.event;
    if (!event || typeof event !== "object") {
      res.status(400).json({ error: "Malformed payload" });
      return;
    }

    const type = String(event.type ?? "");
    const effect = effectForEvent(type);
    if (!effect) {
      // 200 を返さないと RevenueCat がリトライし続けるため、無視でも 200
      res.status(200).json({ ok: true, ignored: type });
      return;
    }

    const appUserId = event.app_user_id;
    const userId = parseAppUserId(appUserId);
    if (userId == null) {
      // 匿名IDのままの購入など。権利は書けないが、リトライさせても直らないので 200
      console.warn("[revenuecat-webhook] unusable app_user_id:", appUserId);
      res.status(200).json({ ok: true, skipped: "unusable app_user_id" });
      return;
    }

    const { getDb } = await import("../server/db/connection.js");
    const db = await getDb();
    if (!db) {
      // ここは 503 でよい（RevenueCat のリトライで回復しうる）
      res.status(503).json({ error: "DB unavailable" });
      return;
    }

    const { upsertPremiumEntitlement, getPremiumEntitlement } = await import(
      "../modules/encounter/db/premium-queries.js"
    );

    const productId = String(event.product_id ?? "unknown");
    const platform = String(event.store ?? "unknown").toLowerCase();
    const rcAppUserId = String(appUserId);
    const expiration = toDate(event.expiration_at_ms);

    if (effect === "activate") {
      if (!expiration) {
        console.warn("[revenuecat-webhook] activate without expiration_at_ms", type);
        res.status(200).json({ ok: true, skipped: "no expiration" });
        return;
      }
      await upsertPremiumEntitlement(db, {
        userId,
        rcAppUserId,
        status: "active",
        productId,
        platform,
        currentPeriodEnd: expiration,
        willRenew: true,
      });
    } else {
      // 既存行を土台にする。行が無ければ何もしない（無料のままが安全側）
      const current = (await getPremiumEntitlement(db, userId).catch(() => null)) as {
        productId?: string;
        platform?: string;
        currentPeriodEnd?: Date;
        willRenew?: boolean;
      } | null;
      if (!current) {
        res.status(200).json({ ok: true, skipped: "no existing entitlement" });
        return;
      }

      const periodEnd = expiration ?? current.currentPeriodEnd ?? new Date();
      await upsertPremiumEntitlement(db, {
        userId,
        rcAppUserId,
        status:
          effect === "revoke" ? "revoked" : effect === "expire" ? "expired" : "active",
        productId: current.productId ?? productId,
        platform: current.platform ?? platform,
        currentPeriodEnd: periodEnd,
        // 解約は「更新しない」だけ。期間満了までは有効
        willRenew: effect === "stop-renewal" ? false : (current.willRenew ?? false),
      });
    }

    res.status(200).json({ ok: true, type, userId });
  } catch (err) {
    console.error("[api/revenuecat-webhook] Error:", err);
    res.status(500).json({ error: String(err) });
  }
}
