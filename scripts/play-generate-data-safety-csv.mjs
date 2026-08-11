#!/usr/bin/env node
// Generate the Google Play Data Safety CSV deterministically from a
// declarative answer-spec, so the manual Play Console UI step (open form,
// fill ~50 questions, export CSV) is eliminated.
//
// Why this works:
//   - Google's Data Safety form has a stable machine-readable template
//     of 217 PSL_* question IDs (783 rows including MULTI_CHOICE expansions).
//   - The template is reproduced verbatim in
//     scripts/lib/play-data-safety-template.json, extracted from the public
//     `fastlane-plugin-google_data_safety` Ruby helper which mirrors Google's
//     "Download a sample CSV" Play Console export.
//   - This script merges that template with partner-app-specific answers
//     declared below in ANSWERS, and writes
//     store-assets/play/data-safety.csv.
//   - scripts/play-fill-data-safety.mjs already POSTs that file to
//     POST /androidpublisher/v3/applications/{packageName}/dataSafety
//     so the only remaining manual step is granting the Service Account
//     "Manage store presence" / CAN_MANAGE_PUBLIC_LISTING in Play Console
//     UI (a one-time 3-minute action — see _docs/play-final-setup-checklist.md §1).
//
// To regenerate after Google ships new PSL_* questions (~every 6 months
// per public observations of the form's schema):
//   1. Re-fetch the Ruby helper from
//      https://raw.githubusercontent.com/owenbean400/fastlane-plugin-google_data_safety/main/lib/fastlane/plugin/google_data_safety/helper/prompt_create_data_safety_csv_helper.rb
//   2. Extract `doubleArrTemplate = [...]`, replace `nil` with `null`,
//      JSON-parse, save to scripts/lib/play-data-safety-template.json.
//   3. Run `node scripts/play-generate-data-safety-csv.mjs` to re-emit
//      store-assets/play/data-safety.csv.
//   4. Diff the output to spot newly-added questions and answer them in
//      ANSWERS below.
//
// Source: docs/play-console-manual-checklist.md §2 — the answer spec
// already exists in human-readable form; this script just translates it
// to PSL_* identifiers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(REPO, 'scripts', 'lib', 'play-data-safety-template.json');
const OUT_PATH = path.join(REPO, 'store-assets', 'play', 'data-safety.csv');

// ----------------------------------------------------------------------------
// ANSWERS — partner-app data safety declarations, sourced from
// _docs/play-console-manual-checklist.md §2.
//
// Key format:
//   - "QID"             → Response value applied to every template row where
//                         column 0 == QID (any responseId)
//   - "QID:RID"         → Response value applied only to the specific
//                         (questionId, responseId) pair
//
// Values:
//   - "TRUE" / "FALSE"  for boolean / multi-choice / single-choice
//   - free-form string  for URL fields and SPECIFY fields
//
// Rows not listed here keep their template default (typically empty),
// which Play Console treats as:
//   OPTIONAL       → unanswered, fine
//   MAYBE_REQUIRED → unanswered, only flagged if a parent answer triggered it
//   REQUIRED       → flagged "needs attention" on import
//
// All REQUIRED top-level questions ARE covered below. Per-data-type
// USER_CONTROL questions are also covered. If Play Console flags
// anything else as "needs attention" on import, fill it in the UI and
// re-export.
// ----------------------------------------------------------------------------

// ★ ここから下は「君斗りんくのすれ違ひ通信」の実態に合わせた申告。
//   法的申告なので、コードを実測して確認した事実だけを書く。推測で埋めない。
//
//   このアプリが他と決定的に違う点:
//     - **正確な位置情報を永続保存する**（drizzle/schema/encounter.ts の
//       lat/lng/accuracyM。「消さない」のは設計方針＝あとで場所をたどるため）
//     - 電話番号・住所・決済情報は**一切集めていない**（スキーマに列が無い）
//     - ログインは X / Apple の OAuth のみ（自前のパスワードを持たない）
//     - 広告SDK・課金SDKは未導入（package.json に 0 件）
//
//   encounter.ts の `address` 列はユーザーの住所ではなく、訪問地点の
//   逆ジオコーディング結果。個人の住所として申告してはいけない。
const URL_ACCOUNT_DELETE = 'https://surechigai.kimito.link/deletion';
const URL_DATA_DELETE_REQUEST = 'https://surechigai.kimito.link/deletion';

const ANSWERS = {
  // === Top-level meta ===
  'PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA': 'TRUE',
  'PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT': 'TRUE',
  'PSL_SUPPORT_DATA_DELETION_BY_USER:DATA_DELETION_YES': 'TRUE',
  'PSL_SUPPORT_DATA_DELETION_BY_USER:DATA_DELETION_NO': 'FALSE',
  'PSL_SUPPORT_DATA_DELETION_BY_USER:DATA_DELETION_NO_AUTO_DELETED': 'FALSE',
  'PSL_DATA_DELETION_URL': URL_DATA_DELETE_REQUEST,
  'PSL_ACCOUNT_DELETION_URL': URL_ACCOUNT_DELETE,
  'PSL_DATA_COLLECTION_COMPLIES_FAMILY_POLICY': 'FALSE',
  'PSL_INDEPENDENTLY_VALIDATED': 'FALSE',

  // === アカウント作成方法 ===
  // X(Twitter) / Apple の OAuth のみ。自前のパスワードは持たない。
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_USER_ID_PASSWORD': 'FALSE',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_OAUTH': 'TRUE',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_USER_ID_OTHER_AUTH': 'FALSE',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_USER_ID_PASSWORD_OTHER_AUTH': 'FALSE',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_OTHER': 'FALSE',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS:PSL_ACM_NONE': 'FALSE',
  // NOTE: PSL_HAS_OUTSIDE_APP_ACCOUNTS intentionally NOT answered. Google's
  // dataSafety API returns 400 "You cannot answer PSL_HAS_OUTSIDE_APP_ACCOUNTS"
  // — it's a conditionally-gated question that is not applicable to our
  // Clerk-only account model. Leaving it blank is correct.

  // === 個人情報 — 名前・メール・アカウント情報のみ ===
  // users テーブルに name / email はあるが、phone と住所の列は無い（実測）。
  'PSL_DATA_TYPES_PERSONAL:PSL_NAME': 'TRUE',
  'PSL_DATA_TYPES_PERSONAL:PSL_EMAIL': 'TRUE',
  'PSL_DATA_TYPES_PERSONAL:PSL_PHONE': 'FALSE',
  'PSL_DATA_TYPES_PERSONAL:PSL_ADDRESS': 'FALSE',
  'PSL_DATA_TYPES_PERSONAL:PSL_USER_ACCOUNT': 'TRUE',
  'PSL_DATA_TYPES_PERSONAL:PSL_RACE_ETHNICITY': 'FALSE',
  'PSL_DATA_TYPES_PERSONAL:PSL_POLITICAL_RELIGIOUS': 'FALSE',
  'PSL_DATA_TYPES_PERSONAL:PSL_SEXUAL_ORIENTATION_GENDER_IDENTITY': 'FALSE',
  'PSL_DATA_TYPES_PERSONAL:PSL_OTHER_PERSONAL': 'FALSE',

  // === 位置情報 — このアプリの中核。正確な座標を永続保存する ===
  'PSL_DATA_TYPES_LOCATION:PSL_PRECISE_LOCATION': 'TRUE',
  'PSL_DATA_TYPES_LOCATION:PSL_APPROX_LOCATION': 'TRUE',

  // === 金融情報 — 一切集めない（課金SDK未導入・決済列なし） ===
  'PSL_DATA_TYPES_FINANCIAL:PSL_CREDIT_DEBIT_BANK_ACCOUNT_NUMBER': 'FALSE',
  'PSL_DATA_TYPES_FINANCIAL:PSL_PURCHASE_HISTORY': 'FALSE',
  'PSL_DATA_TYPES_FINANCIAL:PSL_CREDIT_SCORE': 'FALSE',
  'PSL_DATA_TYPES_FINANCIAL:PSL_OTHER': 'FALSE',

  // === アプリ内アクティビティ — 場所メモ・一言（ユーザー生成コンテンツ） ===
  'PSL_DATA_TYPES_APP_ACTIVITY:PSL_USER_GENERATED_CONTENT': 'TRUE',
  'PSL_DATA_TYPES_APP_ACTIVITY:PSL_IN_APP_SEARCH_HISTORY': 'FALSE',
  'PSL_DATA_TYPES_APP_ACTIVITY:PSL_USER_INTERACTION': 'FALSE',
  'PSL_DATA_TYPES_APP_ACTIVITY:PSL_APPS_ON_DEVICE': 'FALSE',
  'PSL_DATA_TYPES_APP_ACTIVITY:PSL_OTHER_APP_ACTIVITY': 'FALSE',

  // === Per-data-type collection/sharing/purpose ===
  // Pattern: for each TRUE data type above, declare collection/sharing,
  // user control (required vs optional), and purposes. We keep purposes
  // minimal and accurate — over-declaring is just noise on the Play
  // listing privacy card.

  // PSL_NAME — collected, required, account/app functionality
  'PSL_DATA_USAGE_RESPONSES:PSL_NAME:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  // EPHEMERAL (MAYBE_REQUIRED): data is persisted server-side, not ephemeral → FALSE.
  // Required for every collected data type; Google 400s "Response missing" otherwise.
  'PSL_DATA_USAGE_RESPONSES:PSL_NAME:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_REQUIRED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_COLLECTION_PURPOSE:PSL_ACCOUNT_MANAGEMENT': 'TRUE',

  // PSL_EMAIL — 収集のみ・必須。第三者へは提供しない
  'PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_REQUIRED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_COLLECTION_PURPOSE:PSL_ACCOUNT_MANAGEMENT': 'TRUE',

  // PSL_USER_ACCOUNT — X のハンドル等。公開範囲の設定に応じて他ユーザーに見える
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_ACCOUNT:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_ACCOUNT:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_ACCOUNT:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_REQUIRED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_ACCOUNT:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_ACCOUNT:DATA_USAGE_COLLECTION_PURPOSE:PSL_ACCOUNT_MANAGEMENT': 'TRUE',

  // PSL_PRECISE_LOCATION — アプリの中核。永続保存する（48h削除は廃止済み）
  'PSL_DATA_USAGE_RESPONSES:PSL_PRECISE_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_PRECISE_LOCATION:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_PRECISE_LOCATION:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_REQUIRED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_PRECISE_LOCATION:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',

  // PSL_APPROX_LOCATION — 市区町村粒度。すれ違いマッチングと図鑑に使う
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_REQUIRED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',

  // PSL_USER_GENERATED_CONTENT — 場所メモ・一言。任意入力
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_GENERATED_CONTENT:PSL_DATA_USAGE_COLLECTION_AND_SHARING:PSL_DATA_USAGE_ONLY_COLLECTED': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_GENERATED_CONTENT:PSL_DATA_USAGE_EPHEMERAL': 'FALSE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_GENERATED_CONTENT:DATA_USAGE_USER_CONTROL:PSL_DATA_USAGE_USER_CONTROL_OPTIONAL': 'TRUE',
  'PSL_DATA_USAGE_RESPONSES:PSL_USER_GENERATED_CONTENT:DATA_USAGE_COLLECTION_PURPOSE:PSL_APP_FUNCTIONALITY': 'TRUE',
};

// ----------------------------------------------------------------------------
// CSV emission
// ----------------------------------------------------------------------------

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function lookupAnswer(row) {
  const [qid, rid] = row;
  if (rid) {
    const composite = `${qid}:${rid}`;
    if (composite in ANSWERS) return ANSWERS[composite];
  }
  if (qid in ANSWERS) return ANSWERS[qid];
  return null;
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Template missing: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const header = template[0];
  const rows = template.slice(1);

  let filled = 0;
  let blank = 0;
  const csvLines = [header.map(csvEscape).join(',')];
  const singleChoiceTrue = new Map();

  for (const row of rows) {
    const answer = lookupAnswer(row);
    const output = [...row];
    if (answer !== null) {
      output[2] = answer;
      filled += 1;
    } else {
      output[2] = '';
      blank += 1;
    }
    if (output[3] === 'SINGLE_CHOICE' && output[2] === 'TRUE') {
      const selected = singleChoiceTrue.get(output[0]) || [];
      selected.push(output[1] || '(no response id)');
      singleChoiceTrue.set(output[0], selected);
    }
    csvLines.push(output.map(csvEscape).join(','));
  }

  const invalidSingleChoice = [...singleChoiceTrue.entries()].filter(([, selected]) => selected.length > 1);
  if (invalidSingleChoice.length > 0) {
    console.error('Invalid Data Safety answer spec: multiple TRUE responses for SINGLE_CHOICE question(s):');
    for (const [qid, selected] of invalidSingleChoice) {
      console.error(`  - ${qid}: ${selected.join(', ')}`);
    }
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, csvLines.join('\n') + '\n');
  const size = fs.statSync(OUT_PATH).size;

  console.log(`Wrote ${path.relative(REPO, OUT_PATH)}`);
  console.log(`  template rows: ${rows.length}`);
  console.log(`  answered:      ${filled}`);
  console.log(`  blank:         ${blank}`);
  console.log(`  bytes:         ${size}`);

  // Answer keys that weren't matched to any template row = dead config
  // entries pointing at PSL_* IDs that don't exist. The intended answer is
  // silently never applied (REQUIRED questions stay blank → Play flags
  // "needs attention" or the dataSafety API 400s). Fail-closed:
  // _docs/pre-submission-compliance-checklist.md の CI 構成案は
  // 「Data Safety CSV生成の整合（orphan key 0）」を PR ゲート必須としている。
  const seenComposites = new Set();
  for (const row of rows) {
    seenComposites.add(row[0]);
    if (row[1]) seenComposites.add(`${row[0]}:${row[1]}`);
  }
  const orphanKeys = Object.keys(ANSWERS).filter((k) => !seenComposites.has(k));
  if (orphanKeys.length > 0) {
    console.error(`  FAIL: ${orphanKeys.length} ANSWER keys did not match any template row:`);
    for (const k of orphanKeys) console.error(`    - ${k}`);
    console.error('  テンプレ更新(ヘッダのコメント参照)か ANSWERS の typo を疑うこと。orphan key 0 が提出前提。');
    process.exit(1);
  }
}

main();
