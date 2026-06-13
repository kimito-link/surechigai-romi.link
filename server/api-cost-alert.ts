/**
 * API Cost Alert Handler
 *
 * コスト上限に達した際のアラート送信とAPI停止処理
 * - notifyOwner: Manus Notification Service (Forge) に送信。info@best-trust.biz などに届けるには Forge 側で配信先を設定してください。
 * - COST_ALERT_WEBHOOK_URL: 任意。設定するとアラート内容を POST し、Zapier/Make 等でメール転送（例: info@best-trust.biz）できます。
 */

import * as apiUsageDb from "./db/api-usage-db";
import { notifyOwner } from "./_core/notification";

// アラート送信済みフラグ（メモリ内、サーバー再起動でリセット）
const alertSentFlags = new Map<string, boolean>();

const COST_ALERT_WEBHOOK_URL = process.env.COST_ALERT_WEBHOOK_URL ?? "";

/**
 * コストアラートを Webhook に送信（COST_ALERT_WEBHOOK_URL が設定されている場合）
 * ペイロード: { title, content, alertEmail, exceeded, currentCost, limit }
 */
async function sendCostAlertWebhook(payload: {
  title: string;
  content: string;
  alertEmail: string | null;
  exceeded: boolean;
  currentCost: number;
  limit: number;
}): Promise<void> {
  if (!COST_ALERT_WEBHOOK_URL) return;
  try {
    const res = await fetch(COST_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[Cost Alert] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[Cost Alert] Webhook error:", e);
  }
}

/**
 * コスト上限アラートをチェックし、必要に応じて送信
 */
export async function checkAndSendCostAlert(): Promise<void> {
  try {
    const costLimit = await apiUsageDb.checkCostLimit();
    const settings = await apiUsageDb.getCostSettings();

    if (!costLimit.shouldAlert) {
      return;
    }

    const alertKey = `cost_alert_${new Date().toISOString().slice(0, 7)}`; // 月ごとに1回のみ

    // 既にアラートを送信済みの場合はスキップ
    if (alertSentFlags.get(alertKey)) {
      return;
    }

    const currentMonth = await apiUsageDb.getCurrentMonthStats();
    const message = costLimit.exceeded
      ? `⚠️ X APIコスト上限を超過しました

現在のコスト: $${costLimit.currentCost.toFixed(2)}
設定上限: $${costLimit.limit.toFixed(2)}
今月の使用量: ${currentMonth.usage} 件
無料枠残り: ${currentMonth.freeTierRemaining} 件

${costLimit.shouldStop ? "API呼び出しは自動停止されています。" : "API呼び出しは継続中です。"}

管理画面で設定を確認してください: /admin/api-usage`
      : `⚠️ X APIコスト上限に近づいています

現在のコスト: $${costLimit.currentCost.toFixed(2)}
アラート閾値: $${costLimit.limit.toFixed(2)}
今月の使用量: ${currentMonth.usage} 件
無料枠残り: ${currentMonth.freeTierRemaining} 件

管理画面で設定を確認してください: /admin/api-usage`;

    const title = costLimit.exceeded
      ? "X APIコスト上限超過アラート"
      : "X APIコスト上限警告";

    // 1) Manus Notification Service（Forge）に送信。配信先は Forge 側で設定（例: info@best-trust.biz）
    try {
      await notifyOwner({ title, content: message });
    } catch (e) {
      console.warn("[Cost Alert] notifyOwner failed:", e);
    }

    // 2) 任意: Webhook に送信（Zapier/Make 等で info@best-trust.biz にメール転送可能）
    await sendCostAlertWebhook({
      title,
      content: message,
      alertEmail: settings?.alertEmail ?? null,
      exceeded: costLimit.exceeded,
      currentCost: costLimit.currentCost,
      limit: costLimit.limit,
    });

    // アラート送信済みフラグを設定
    alertSentFlags.set(alertKey, true);

    console.log("[Cost Alert] Alert sent:", {
      exceeded: costLimit.exceeded,
      currentCost: costLimit.currentCost,
      limit: costLimit.limit,
      alertEmail: settings?.alertEmail ?? undefined,
    });
  } catch (error) {
    console.error("[Cost Alert] Failed to check and send alert:", error);
  }
}

/**
 * アラートフラグをリセット（テスト用）
 */
export function resetAlertFlags(): void {
  alertSentFlags.clear();
}
