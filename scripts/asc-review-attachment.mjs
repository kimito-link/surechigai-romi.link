#!/usr/bin/env node
// App Review 情報のメモと添付（実機の画面録画）だけを差し替える。ビルドは作らない。
//
// 2026-11-13: build 551 の却下で Apple は「実機録画を App Review 情報に添付」と
// 「2.1 の質問への回答」を求めた。提出スクリプト(appstore-submit.mjs)はメモを毎回
// 汎用文で上書きし、添付も扱わないため、審査待ちのまま中身だけ入れ直す口を分けた。
//
// 流れ:
//   1. 対象バージョン（package.json の version）の appStoreReviewDetail を探す
//   2. メモを store-assets/appstore/review-notes-en.txt で上書きし、録画を添付する
//   3. 審査待ち(WAITING_FOR_REVIEW)で編集を拒まれたら、提出を取り消して編集し、
//      同じビルドのまま出し直す（ビルドは作り直さない）
//
// env:
//   APPSTORE_CONNECT_KEY_ID / APPSTORE_CONNECT_ISSUER_ID / APPSTORE_CONNECT_API_KEY_P8_BASE64
//   REVIEW_ATTACHMENT_PATH  添付する動画のパス（任意。無ければメモだけ）
//   ALLOW_RESUBMIT          "true" のときだけ、取り消し→出し直しを許す
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeAscClient, findApp, findVersion, getReviewDetail, sleep } from './lib/asc-api.mjs';
import { loadAppConfig } from './lib/app-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const PLATFORM = 'IOS';
const BANNED = ['Android', 'Google Play', 'Play Store', 'Play Console'];

function privateKey() {
  const b64 = process.env.APPSTORE_CONNECT_API_KEY_P8_BASE64;
  if (b64) return Buffer.from(b64.trim(), 'base64').toString('utf8');
  if (process.env.APPSTORE_CONNECT_API_KEY_P8) return process.env.APPSTORE_CONNECT_API_KEY_P8;
  throw new Error('APPSTORE_CONNECT_API_KEY_P8_BASE64 が未設定です');
}

function readNotes() {
  const p = path.join(REPO, 'store-assets', 'appstore', 'review-notes-en.txt');
  const text = fs.readFileSync(p, 'utf8').trim();
  const hits = BANNED.filter((w) => text.includes(w));
  if (hits.length) throw new Error(`review notes に他社プラットフォーム名があります: ${hits.join(', ')}`);
  if (text.length > 4000) throw new Error(`review notes が ${text.length} 文字（上限 4000）`);
  return text;
}

async function openSubmissions(api, appId, states) {
  const r = await api(
    'GET',
    `/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=${PLATFORM}&filter[state]=${states}`,
  );
  return r.data || [];
}

async function patchNotes(api, detailId, notes) {
  await api('PATCH', `/v1/appStoreReviewDetails/${detailId}`, {
    data: { type: 'appStoreReviewDetails', id: detailId, attributes: { notes } },
  });
}

async function replaceAttachment(api, detailId, filePath) {
  const existing = await api('GET', `/v1/appStoreReviewDetails/${detailId}/appStoreReviewAttachments`);
  const buf = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  for (const a of existing.data || []) {
    if (a.attributes?.sourceFileChecksum === md5) {
      console.log(`  same attachment already present (id=${a.id}); skip upload`);
      return;
    }
  }
  console.log(`  reserve attachment ${fileName} (${buf.length} bytes)`);
  const created = await api('POST', '/v1/appStoreReviewAttachments', {
    data: {
      type: 'appStoreReviewAttachments',
      attributes: { fileName, fileSize: buf.length },
      relationships: {
        appStoreReviewDetail: { data: { type: 'appStoreReviewDetails', id: detailId } },
      },
    },
  });
  const att = created.data;
  for (const op of att.attributes.uploadOperations || []) {
    const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
    const res = await fetch(op.url, {
      method: op.method,
      headers,
      body: buf.subarray(op.offset, op.offset + op.length),
    });
    if (!res.ok) throw new Error(`upload part offset=${op.offset} -> ${res.status}`);
  }
  await api('PATCH', `/v1/appStoreReviewAttachments/${att.id}`, {
    data: {
      type: 'appStoreReviewAttachments',
      id: att.id,
      attributes: { uploaded: true, sourceFileChecksum: md5 },
    },
  });
  for (let i = 0; i < 40; i++) {
    const s = await api('GET', `/v1/appStoreReviewAttachments/${att.id}`);
    const state = s.data.attributes.assetDeliveryState?.state;
    console.log(`  attachment state=${state}`);
    if (state === 'COMPLETE') break;
    if (state === 'FAILED') throw new Error(`attachment failed: ${JSON.stringify(s.data.attributes.assetDeliveryState)}`);
    await sleep(15_000);
  }
  // 古い添付（以前の録画）は外す。新しい方が COMPLETE になってから。
  for (const a of existing.data || []) {
    console.log(`  delete old attachment id=${a.id} ${a.attributes?.fileName}`);
    await api('DELETE', `/v1/appStoreReviewAttachments/${a.id}`);
  }
}

async function apply(api, detailId, notes, attachmentPath) {
  console.log('  patch notes');
  await patchNotes(api, detailId, notes);
  if (attachmentPath) await replaceAttachment(api, detailId, attachmentPath);
}

async function resubmit(api, appId, versionId) {
  const created = await api('POST', '/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: PLATFORM },
      relationships: { app: { data: { type: 'apps', id: appId } } },
    },
  });
  const rsId = created.data.id;
  console.log(`  created reviewSubmission id=${rsId}`);
  for (let attempt = 1; ; attempt++) {
    try {
      await api('POST', '/v1/reviewSubmissionItems', {
        data: {
          type: 'reviewSubmissionItems',
          relationships: {
            reviewSubmission: { data: { type: 'reviewSubmissions', id: rsId } },
            appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
          },
        },
      });
      break;
    } catch (e) {
      const msg = String(e.message);
      const transient = msg.includes('ASSET_IN_POST_PROCESSING') || msg.includes('ENTITY_STATE_INVALID');
      if (!transient || attempt >= 40) throw e;
      console.log(`  still processing at Apple; wait 30s (${attempt}/40)`);
      await sleep(30_000);
    }
  }
  await api('PATCH', `/v1/reviewSubmissions/${rsId}`, {
    data: { type: 'reviewSubmissions', id: rsId, attributes: { submitted: true } },
  });
  const final = await api('GET', `/v1/reviewSubmissions/${rsId}`);
  console.log(`  final state=${final.data.attributes.state}`);
}

(async () => {
  const keyId = process.env.APPSTORE_CONNECT_KEY_ID;
  const issuerId = process.env.APPSTORE_CONNECT_ISSUER_ID;
  if (!keyId || !issuerId) throw new Error('APPSTORE_CONNECT_KEY_ID / ISSUER_ID が未設定です');
  const api = makeAscClient({ keyId, issuerId, privateKey: privateKey() });

  const bundleId = loadAppConfig().identity?.bundleId;
  const marketing = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version;
  const notes = readNotes();
  const attachmentPath = process.env.REVIEW_ATTACHMENT_PATH || '';
  if (attachmentPath && !fs.existsSync(attachmentPath)) throw new Error(`添付が見つかりません: ${attachmentPath}`);

  const app = await findApp(api, bundleId);
  if (!app) throw new Error(`app not found: ${bundleId}`);
  const version = await findVersion(api, app.id, PLATFORM, marketing);
  if (!version) throw new Error(`version ${marketing} not found`);
  console.log(`app=${app.id} version=${marketing} state=${version.appStoreState}`);
  if (version.appStoreState === 'IN_REVIEW') {
    throw new Error('審査中(IN_REVIEW)なので触りません。');
  }

  const detail = await getReviewDetail(api, version.id);
  if (!detail) throw new Error('appStoreReviewDetail がありません（一度も提出していない？）');

  try {
    await apply(api, detail.id, notes, attachmentPath);
    console.log('done (edited in place, submission untouched)');
    return;
  } catch (e) {
    console.log(`  edit in place failed: ${String(e.message).slice(0, 300)}`);
    if (process.env.ALLOW_RESUBMIT !== 'true') throw e;
  }

  const waiting = await openSubmissions(api, app.id, 'WAITING_FOR_REVIEW');
  if (!waiting.length) throw new Error('取り消せる審査待ちの提出がありません');
  for (const sub of waiting) {
    console.log(`  cancel reviewSubmission id=${sub.id}`);
    await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, {
      data: { type: 'reviewSubmissions', id: sub.id, attributes: { canceled: true } },
    });
  }
  for (let i = 0; i < 40; i++) {
    const still = await openSubmissions(api, app.id, 'WAITING_FOR_REVIEW,CANCELING');
    if (!still.length) break;
    console.log('  waiting for cancellation...');
    await sleep(15_000);
  }
  await apply(api, detail.id, notes, attachmentPath);
  await resubmit(api, app.id, version.id);
  console.log('done (cancelled, edited, resubmitted with the same build)');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
