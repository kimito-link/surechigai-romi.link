/**
 * API使用量日次レポート
 * 
 * 毎日のAPI使用量とコストを集計し、メール通知を送信
 */

import * as apiUsageDb from "./db/api-usage-db.js";
import { notifyOwner } from "./_core/notification.js";

const COST_ALERT_WEBHOOK_URL = process.env.COST_ALERT_WEBHOOK_URL ?? "";

/**
 * Webhookにレポートを送信
 */
async function sendDailyReportWebhook(payload: {
  title: string;
  content: string;
}): Promise<void> {
  if (!COST_ALERT_WEBHOOK_URL) return;
  try {
    const res = await fetch(COST_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        type: "daily_report",
        date: new Date().toISOString().split("T")[0],
      }),
    });
    if (!res.ok) {
      console.warn("[Daily Report] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[Daily Report] Webhook error:", e);
  }
}

/**
 * 日次レポートを生成・送信
 */
export async function sendDailyReport(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayMonth = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}`;
    const yesterdayDateStr = yesterday.toISOString().split("T")[0];
    
    // データベース接続確認（apiUsageDb経由で使用）

    // 今月の累計統計
    const monthlyStats = await apiUsageDb.getCurrentMonthStats();
    
    // エンドポイント別の使用量トップ5
    const endpointCosts = await apiUsageDb.getUsageByEndpoint(yesterdayMonth, 5);
    
    // 注: より正確な日次集計が必要な場合は、createdAtでフィルタリングする必要があります
    // 現在は今月の累計を表示（日次集計は将来の改善項目）

    const reportContent = `📊 X API 日次レポート（${yesterdayDateStr}）

【今月の累計】
使用量: ${monthlyStats.usage} 件
コスト: $${monthlyStats.cost.toFixed(4)}
無料枠残り: ${monthlyStats.freeTierRemaining} 件

【エンドポイント別使用量トップ5】
${endpointCosts.length > 0
  ? endpointCosts
      .map(
        (item, index) =>
          `${index + 1}. ${item.endpoint}\n   リクエスト: ${item.count} 件 | コスト: $${item.cost.toFixed(4)}`
      )
      .join("\n")
  : "データなし"}

管理画面: /admin/api-usage`;

    const title = `X API 日次レポート - ${yesterdayDateStr}`;

    // 1) Manus Notification Service（Forge）に送信
    try {
      await notifyOwner({ title, content: reportContent });
    } catch (e) {
      console.warn("[Daily Report] notifyOwner failed:", e);
    }

    // 2) 任意: Webhook に送信
    await sendDailyReportWebhook({
      title,
      content: reportContent,
    });

    console.log("[Daily Report] Daily report sent:", {
      date: yesterdayDateStr,
      monthlyUsage: monthlyStats.usage,
      monthlyCost: monthlyStats.cost,
    });
  } catch (error) {
    console.error("[Daily Report] Failed to send daily report:", error);
  }
}

/**
 * 日次レポートを手動実行（テスト用）
 */
export async function testDailyReport(): Promise<void> {
  console.log("[Daily Report] Testing daily report...");
  await sendDailyReport();
}
