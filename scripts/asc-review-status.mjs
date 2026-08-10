#!/usr/bin/env node
// App Store Connect の「今どの状態か」を人が読める形で出す。
//
// asc-review-check.mjs との違い:
//   check  = 却下4状態(REJECTED/METADATA_REJECTED/DEVELOPER_REJECTED/INVALID_BINARY)
//            だけを拾って Issue を立てる「異常検知」
//   status = 全バージョンの appStoreState をそのまま出す「現況確認」
//
// check が "No rejected versions found" を返しても、それは
// 「却下されていない」であって「審査を通った」ではない。
// 審査中(WAITING_FOR_REVIEW / IN_REVIEW)と承認済み(READY_FOR_SALE 等)を
// 区別するにはこちらを使う。
//
// Reads:
//   env APPSTORE_CONNECT_KEY_ID
//   env APPSTORE_CONNECT_ISSUER_ID
//   env APPSTORE_CONNECT_API_KEY_P8_BASE64 (or _PATH or raw _P8)
//   env APP_BUNDLE_ID (省略時は app.config.json の identity.bundleId)
//
// Exit codes:
//   0 = 取得成功（状態が何であれ）
//   非0 = api/auth エラー
import fs from 'node:fs';
import { makeAscClient, findApp, listVersions } from './lib/asc-api.mjs';
import { loadAppConfig } from './lib/app-config.mjs';

const APP_CONFIG = loadAppConfig();
const BUNDLE_ID = process.env.APP_BUNDLE_ID || APP_CONFIG.identity.bundleId;

// 状態の意味を日本語で添える（審査は用語が紛らわしく、
// PREPARE_FOR_SUBMISSION を「提出済み」と誤読する事故が起きやすい）
const STATE_MEANING = {
  PREPARE_FOR_SUBMISSION: '未提出（下書き。提出ボタンを押していない）',
  READY_FOR_REVIEW: '未提出（提出可能だが、まだ審査待ち行列にいない）',
  WAITING_FOR_REVIEW: '審査待ち（提出済み・レビュアー未着手）',
  IN_REVIEW: '審査中（レビュアーが見ている）',
  PENDING_DEVELOPER_RELEASE: '審査通過（あとは自分でリリースを押すだけ）',
  PENDING_APPLE_RELEASE: '審査通過（Apple のリリース待ち）',
  PROCESSING_FOR_APP_STORE: '審査通過（配信処理中）',
  READY_FOR_SALE: '配信中（公開済み）',
  REJECTED: '却下（機能・コンテンツ）',
  METADATA_REJECTED: '却下（ストア掲載情報）',
  DEVELOPER_REJECTED: '取り下げ（開発者本人）',
  INVALID_BINARY: 'バイナリ検証エラー',
  DEVELOPER_REMOVED_FROM_SALE: '販売停止（開発者が取り下げ）',
  REPLACED_WITH_NEW_VERSION: '新バージョンに置き換え済み',
};

// 「審査に出ている最中か」の判定に使う集合
const IN_FLIGHT = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW']);
const PASSED = new Set([
  'PENDING_DEVELOPER_RELEASE',
  'PENDING_APPLE_RELEASE',
  'PROCESSING_FOR_APP_STORE',
  'READY_FOR_SALE',
]);

function resolvePrivateKey() {
  const direct = process.env.APPSTORE_CONNECT_API_KEY_P8;
  if (direct && direct.includes('BEGIN PRIVATE KEY')) return direct;
  const filePath = process.env.APPSTORE_CONNECT_API_KEY_P8_PATH;
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  const b64 = process.env.APPSTORE_CONNECT_API_KEY_P8_BASE64;
  if (b64) {
    return Buffer.from(b64.trim(), 'base64').toString('utf8');
  }
  throw new Error('Provide APPSTORE_CONNECT_API_KEY_P8_PATH, _BASE64, or _P8');
}

(async () => {
  const keyId = process.env.APPSTORE_CONNECT_KEY_ID;
  const issuerId = process.env.APPSTORE_CONNECT_ISSUER_ID;
  if (!keyId || !issuerId) {
    throw new Error('APPSTORE_CONNECT_KEY_ID / APPSTORE_CONNECT_ISSUER_ID is required');
  }

  const api = makeAscClient({ keyId, issuerId, privateKey: resolvePrivateKey() });
  const app = await findApp(api, BUNDLE_ID);
  if (!app) {
    throw new Error(`App not found for bundleId=${BUNDLE_ID}`);
  }

  const appId = app.id;
  const versions = await listVersions(api, appId, 20);

  console.log(`App: ${app.attributes?.name || '(no name)'}`);
  console.log(`Bundle ID: ${BUNDLE_ID}`);
  console.log(`App ID: ${appId}`);
  console.log('');

  if (versions.length === 0) {
    console.log('バージョンが1つもありません。');
    return;
  }

  console.log('--- バージョン一覧 ---');
  for (const v of versions) {
    const meaning = STATE_MEANING[v.appStoreState] || '(未知の状態)';
    console.log(`${v.platform} ${v.versionString}: ${v.appStoreState}`);
    console.log(`  → ${meaning}`);
    console.log(`  version id: ${v.id}`);
  }
  console.log('');

  // 結論を1行で。CI ログを grep する時はこの行だけ見ればいい
  const inFlight = versions.filter((v) => IN_FLIGHT.has(v.appStoreState));
  const passed = versions.filter((v) => PASSED.has(v.appStoreState));

  if (passed.length > 0) {
    const v = passed[0];
    console.log(`VERDICT: PASSED ${v.platform} ${v.versionString} (${v.appStoreState})`);
  } else if (inFlight.length > 0) {
    const v = inFlight[0];
    console.log(`VERDICT: IN_FLIGHT ${v.platform} ${v.versionString} (${v.appStoreState})`);
  } else {
    const v = versions[0];
    console.log(`VERDICT: NOT_SUBMITTED ${v.platform} ${v.versionString} (${v.appStoreState})`);
  }
})().catch((err) => {
  console.error(`asc-review-status failed: ${err.message}`);
  process.exit(1);
});
