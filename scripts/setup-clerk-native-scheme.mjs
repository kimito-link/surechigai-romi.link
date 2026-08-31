#!/usr/bin/env node
/**
 * setup-clerk-native-scheme.mjs
 *   ネイティブ OAuth の戻り先（カスタムスキーム）が Clerk 側に登録されているかを見る／登録する。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（iOS build 533 却下・2026-08-29）
 *
 *   審査コメント: "the login methods provided in the app both do not function as it displays an error"
 *
 *   コード側は c199ac87a で直した（戻り先を https からカスタムスキームへ）。
 *   ★しかしそのコミット自身が「Clerk への登録が必要（コードだけでは直らない）」と
 *   書き残していた。**登録が無いと、コードが正しくても同じ却下に戻る。**
 *
 *   ★そして「人間が Dashboard で登録する」だけにすると、次に誰かが必ず忘れる。
 *   実際このリポは「修正はしたのに届いていない」で 2 回却下されている（529・533）。
 *   ⟹ 機械で確かめられる形にして、提出前に自動で止める。
 *
 * ■ ★この検査が判定しないこと
 *   ・登録されている値が**実機で本当に効くか**は見ない（許可リストに在るかだけ）。
 *   ・X / Apple の SSO が有効かは見ない（別の設定）。
 *   ・Dashboard の「Native applications」欄と allowed_origins が別管理の可能性がある。
 *     ★その場合ここが緑でも却下されうる。実機で1度は確かめること。
 *
 * 使い方:
 *   node scripts/setup-clerk-native-scheme.mjs --check   # 登録されているか見るだけ
 *   node scripts/setup-clerk-native-scheme.mjs --apply   # 追記する（既存値は消さない）
 *   node scripts/setup-clerk-native-scheme.mjs --selftest
 *
 * 終了コード（instrument-core の3値規約）:
 *   0 = 登録済み / 1 = 未登録 / ★2 = 測れなかった（鍵が無い・通信できない）
 * ───────────────────────────────────────────────────────────────────────────
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EXIT, computeExitCode, formatProbeReport, runSelfTest } from "./lib/instrument-core.mjs";

// ★fileURLToPath を使う。自前で URL を切ると日本語パスが %E3%83%87... のまま残り、
//   ENOENT になる（このリポのパスは「デスクトップ」を含むので実際に踏んだ）。
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** ★登録すべき値は lib/auth/native-redirect.ts の正本と同じ形で組む（二重管理しない）。 */
function expectedRedirectUrl() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "app.config.json"), "utf8"));
  const src = fs.readFileSync(path.join(ROOT, "lib", "auth", "native-redirect.ts"), "utf8");
  const m = src.match(/NATIVE_OAUTH_CALLBACK_PATH\s*=\s*"([^"]+)"/);
  if (!m) return null;
  return `${cfg.identity.iosScheme}://${m[1]}`;
}

/**
 * ★純粋な判定（fs にも通信にも触らない＝テストできる）。
 *
 * @param {string|null} expected 登録すべき戻り先
 * @param {string[]|null} origins Clerk から読んだ許可リスト（読めなければ null）
 * @param {{ hasKey: boolean }} context
 */
export function judgeNativeSchemeRegistered(expected, origins, context) {
  if (!context.hasKey) {
    return [{
      probe: "ネイティブ戻り先の登録",
      verdict: "inconclusive",
      detail: "CLERK_SECRET_KEY が無いため確認できません（★未登録ではなく、見ていません）",
      howToFix: ".env.local に CLERK_SECRET_KEY を置くか、CI では Secrets から渡してください",
    }];
  }
  if (!expected) {
    return [{
      probe: "ネイティブ戻り先の登録",
      verdict: "inconclusive",
      detail: "登録すべき値を組み立てられませんでした（app.config.json / native-redirect.ts を読めない）",
      howToFix: "identity.iosScheme と NATIVE_OAUTH_CALLBACK_PATH が読めるか確認してください",
    }];
  }
  if (origins === null) {
    return [{
      probe: "ネイティブ戻り先の登録",
      verdict: "inconclusive",
      detail: "Clerk から許可リストを取得できませんでした（★未登録ではなく、見ていません）",
      howToFix: "鍵の権限と通信を確認してください",
    }];
  }

  if (origins.includes(expected)) {
    return [{
      probe: "ネイティブ戻り先の登録",
      verdict: "pass",
      evidence: { 登録値: expected, 許可リスト件数: origins.length },
    }];
  }

  return [{
    probe: "ネイティブ戻り先の登録",
    verdict: "fail",
    evidence: { 必要な値: expected, 許可リスト件数: origins.length },
    detail: `ネイティブ OAuth の戻り先 ${expected} が Clerk に登録されていません`,
    howToFix:
      "node scripts/setup-clerk-native-scheme.mjs --apply で追記するか、" +
      "Clerk Dashboard の Native applications / allowed origins に登録してください。" +
      "★これが無いと OAuth から戻ってもセッションが作られず、iOS 533 と同じ却下に戻ります",
  }];
}

// ── selftest（★毒→赤） ──────────────────────────────────────────────────
if (process.argv.includes("--selftest")) {
  const URL_OK = "surechigai://oauth-native-callback";
  const cases = [
    {
      name: "毒1: 鍵が無い（★測れなかった。未登録と混ぜない）",
      poison: () => {}, restore: () => {},
      isRed: () => computeExitCode(judgeNativeSchemeRegistered(URL_OK, null, { hasKey: false })) === EXIT.INCONCLUSIVE,
    },
    {
      name: "毒2: 許可リストを取れない（★測れなかった。緑にしない）",
      poison: () => {}, restore: () => {},
      isRed: () => computeExitCode(judgeNativeSchemeRegistered(URL_OK, null, { hasKey: true })) === EXIT.INCONCLUSIVE,
    },
    {
      name: "毒3: ★許可リストが空＝未登録なら赤（533 の再発）",
      poison: () => {}, restore: () => {},
      isRed: () => computeExitCode(judgeNativeSchemeRegistered(URL_OK, [], { hasKey: true })) === EXIT.FAIL,
    },
    {
      name: "毒4: ★似た値（スラッシュ3本）では緑にしない",
      poison: () => {}, restore: () => {},
      isRed: () =>
        computeExitCode(
          judgeNativeSchemeRegistered(URL_OK, ["surechigai:///oauth-native-callback"], { hasKey: true })
        ) === EXIT.FAIL,
    },
    {
      name: "毒なし: 登録されていれば緑",
      poison: () => {}, restore: () => {},
      isRed: () =>
        computeExitCode(
          judgeNativeSchemeRegistered(URL_OK, ["https://example.com", URL_OK], { hasKey: true })
        ) === EXIT.PASS,
    },
  ];

  const { ok, fails } = runSelfTest(cases);
  if (!ok) {
    console.error("[clerk-native-scheme] 🔴 selftest 失敗:");
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log(`[clerk-native-scheme] ✅ selftest 合格（${cases.length}件: 未登録は赤・測れないは緑にしない）`);
  process.exit(EXIT.PASS);
}

// ── 実行 ────────────────────────────────────────────────────────────────
function readSecretKey() {
  if (process.env.CLERK_SECRET_KEY) return process.env.CLERK_SECRET_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const m = env.match(/^CLERK_SECRET_KEY=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const key = readSecretKey();
const expected = expectedRedirectUrl();
const apply = process.argv.includes("--apply");

let origins = null;
if (key) {
  try {
    const res = await fetch("https://api.clerk.com/v1/instance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const json = await res.json();
      // ★null は「未設定」＝空リストとして扱う（読めなかった null とは区別する）。
      origins = Array.isArray(json.allowed_origins) ? json.allowed_origins : [];
    }
  } catch {
    origins = null;
  }
}

if (apply && key && expected && origins !== null && !origins.includes(expected)) {
  const next = [...origins, expected];
  const res = await fetch("https://api.clerk.com/v1/instance", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ allowed_origins: next }),
  });
  if (res.ok) {
    console.log(`[clerk-native-scheme] ▶ 追記しました: ${expected}`);
    origins = next;
  } else {
    console.error(`[clerk-native-scheme] ★追記に失敗しました（HTTP ${res.status}）: ${await res.text()}`);
  }
}

const results = judgeNativeSchemeRegistered(expected, origins, { hasKey: Boolean(key) });
console.log(formatProbeReport(results, { title: "clerk-native-scheme" }));
process.exit(computeExitCode(results));
