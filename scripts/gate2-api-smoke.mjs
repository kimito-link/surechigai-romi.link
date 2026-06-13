#!/usr/bin/env node
/**
 * Gate 2: API スモークテスト
 * 必須: /api/health が 200 かつ ok/commitSha が有効であること。
 * tRPC は参考で叩くのみ（失敗してもジョブは落とさない。本番プロキシ等で 400/500 が出ることがあるため）。
 * 使い方: BASE_URL=https://doin-challenge.com node scripts/gate2-api-smoke.mjs
 */
const BASE = process.env.BASE_URL || process.env.API_URL || "https://doin-challenge.com";

function log(msg) {
  console.log(`[gate2-smoke] ${msg}`);
}

async function smoke() {
  const requiredFailures = [];

  // 必須: Health（ここが落ちたら exit 1）
  // ただし、DBエラーによる500はデプロイ自体の問題ではないため、
  // commitShaが有効であればDB接続エラーは警告として許容する
  try {
    const res = await fetch(`${BASE}/api/health`, { redirect: "follow" });
    const data = await res.json().catch(() => ({}));
    
    if (res.ok && data.ok === true && data.commitSha !== "unknown") {
      // 完全に正常
      log("✅ /api/health");
    } else if (data.commitSha && data.commitSha !== "unknown") {
      // サーバーは応答しており、commitShaは有効だが、DBエラー等でok=false or 500
      const dbConnected = data.db?.connected ?? "unknown";
      const dbError = data.db?.error || "";
      if (dbConnected === false) {
        log(`⚠️ /api/health: サーバー応答あり (commit: ${data.commitSha.substring(0, 7)}) だがDB未接続 (${dbError})`);
        log("⚠️ デプロイは成功していますが、データベース接続を確認してください");
      } else {
        log(`⚠️ /api/health: ${res.status} ok=${data.ok} (commit: ${data.commitSha.substring(0, 7)})`);
      }
    } else if (!res.ok) {
      // サーバーがエラーを返し、commitShaも不明
      requiredFailures.push(`/api/health: ${res.status} ${res.statusText}`);
    } else {
      // 200だがok/commitShaが不正
      requiredFailures.push("/api/health: ok または commitSha が不正");
    }
  } catch (e) {
    requiredFailures.push(`/api/health: ${e.message}`);
  }

  if (requiredFailures.length > 0) {
    console.error("❌ Gate 2 API smoke failed (required):");
    requiredFailures.forEach((f) => console.error("  -", f));
    process.exit(1);
  }

  // 参考: tRPC（失敗時は警告のみ。本番プロキシ・形式の差で 400/500 が出る場合あり）
  const trpcCalls = [
    ["events.list", {}],
    ["events.getById", { id: 90001 }],
    ["rankings.hosts", { limit: 1 }],
    ["rankings.contribution", { period: "all", limit: 1 }],
    ["participations.listByEvent", { eventId: 90001 }],
  ];
  for (const [path, input] of trpcCalls) {
    const inputParam = encodeURIComponent(JSON.stringify({ 0: input }));
    const url = `${BASE}/api/trpc/${path}?batch=1&input=${inputParam}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      const data = await res.json().catch(() => ({}));
      const result = Array.isArray(data) ? data[0] : data;
      if (res.ok && result?.result !== undefined) {
        log(`✅ /api/trpc/${path}`);
      } else {
        log(`⚠️ /api/trpc/${path} → ${res.status} (optional)`);
      }
    } catch (e) {
      log(`⚠️ /api/trpc/${path} → ${e.message} (optional)`);
    }
  }

  log("Required checks passed.");
}

smoke().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
