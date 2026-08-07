#!/usr/bin/env node
// 審査提出前ゲート: App Store の審査員に渡すデモアカウントが「実際に使える状態か」を
// 提出前に確認する。死んだ/凍結されたデモ垢を出すと §2.1 で即 reject + 24-48h 無駄。
//
// kimito.link は X 専用ログイン（Clerk 経由）＝パスワードでのプログラム的サインインは
// できない。よってここで検証するのは「審査員が入る経路の入口」＝Clerk 上にデモユーザーが
// 存在し、banned/locked でないこと。これが満たせないと審査員は何をしても入れない。
//
// 判定方針（WF コメント準拠）:
//   - definitive bad-credential / デモ垢が存在しない・banned・locked  → fail closed (exit 1)
//   - transient（ネットワーク/5xx/レート制限）・設定不足（env 欠落） → warn 継続 (exit 0)
//
// 必要 env:
//   CLERK_SECRET_KEY          Clerk Backend API キー（sk_...）。CI の Secret から渡る。
//   IOS_REVIEW_DEMO_USERNAME  審査員に渡すデモアカウントのユーザー名（@なし）。
//   IOS_REVIEW_DEMO_PASSWORD  併設認証（SIWA 等）がある場合のパスワード。X 専用では未使用でよい。
//
// Usage:
//   node scripts/app/verify-reviewer-account.mjs
//   node scripts/app/verify-reviewer-account.mjs --allow-missing   # env 欠落でも exit 0（既定動作と同じ・明示用）

const CLERK_API_BASE = 'https://api.clerk.com/v1';

const args = process.argv.slice(2);
// 既定で「設定不足は warn 継続」なのでこのフラグは明示用。将来 strict 化する余地のため残す。
const _allowMissing = args.includes('--allow-missing');

const secretKey = process.env.CLERK_SECRET_KEY;
const username = (process.env.IOS_REVIEW_DEMO_USERNAME || '').replace(/^@/, '').trim();

function warnContinue(msg) {
  console.warn(`[verify-reviewer] ⚠ ${msg}`);
  console.warn('[verify-reviewer] 設定不足/一時的エラーのため警告のみで継続します（fail closed しない）。');
  process.exit(0);
}

function failClosed(msg) {
  console.error(`[verify-reviewer] ✗ ${msg}`);
  console.error('[verify-reviewer] デモアカウントが審査で使えない可能性が高いため提出を止めます（§2.1 即 reject 回避）。');
  process.exit(1);
}

// --- 設定不足は warn 継続（fail closed しない）---
if (!secretKey) {
  warnContinue('CLERK_SECRET_KEY が未設定。Clerk 上のデモ垢確認をスキップ。');
}
if (!username) {
  warnContinue('IOS_REVIEW_DEMO_USERNAME が未設定。デモ垢確認をスキップ。');
}

const url = `${CLERK_API_BASE}/users?username=${encodeURIComponent(username)}&limit=1`;

let res;
try {
  res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });
} catch (err) {
  // ネットワーク到達不可は transient 扱い。
  warnContinue(`Clerk API への接続に失敗（transient）: ${String(err?.message || err).slice(0, 120)}`);
}

// 401/403 = シークレットキー不正 = definitive。提出前に必ず気づきたいので fail closed。
if (res.status === 401 || res.status === 403) {
  failClosed(`Clerk API 認証に失敗（HTTP ${res.status}）。CLERK_SECRET_KEY が不正/失効の可能性。`);
}
// 429/5xx = transient。
if (res.status === 429 || res.status >= 500) {
  warnContinue(`Clerk API が一時的エラー（HTTP ${res.status}）。後で再実行を。`);
}
if (!res.ok) {
  // それ以外の 4xx（400 など）はリクエスト不備の可能性＝設定を疑うが、提出を止めるほど断定はできない。
  warnContinue(`Clerk API が予期しない応答（HTTP ${res.status}）。レスポンスを確認のこと。`);
}

let users;
try {
  users = await res.json();
} catch (err) {
  warnContinue(`Clerk API 応答の JSON 解析に失敗（transient）: ${String(err?.message || err).slice(0, 120)}`);
}

// Backend API の users 一覧はユーザーオブジェクトの配列。
const list = Array.isArray(users) ? users : Array.isArray(users?.data) ? users.data : [];
const user = list.find(
  (u) => String(u?.username || '').toLowerCase() === username.toLowerCase(),
) || list[0];

if (!user) {
  // 存在しない＝審査員が辿り着けない。definitive。
  failClosed(`デモアカウント @${username} が Clerk に存在しません。審査員がログインできません。`);
}

if (user.banned === true) {
  failClosed(`デモアカウント @${username} は banned（凍結）状態です。審査員がログインできません。`);
}
if (user.locked === true) {
  failClosed(`デモアカウント @${username} は locked（ロック）状態です。審査員がログインできません。`);
}

console.log(`[verify-reviewer] ✓ デモアカウント @${username} は Clerk に存在し banned/locked ではありません。`);
console.log('[verify-reviewer] 注: X 専用ログインのため実 OAuth は審査員が手動で行います。SIWA 併設経路が保険。');
process.exit(0);
