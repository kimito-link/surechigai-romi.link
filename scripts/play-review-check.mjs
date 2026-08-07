#!/usr/bin/env node
// Read-only-ish Google Play production readiness check.
// Opens a temporary edit, reads track/listing/image state, deletes the edit,
// then emits JSON for the scheduled workflow to create/update a GitHub issue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadServiceAccount, makePlayClient } from './lib/play-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const APP_CONFIG = JSON.parse(fs.readFileSync(path.join(REPO, 'app.config.json'), 'utf8'));

// 移植時の変更(2026-08-08): donor は最後に 'com.reversehack.partner'(別アプリ)を
// ハードコード fallback していた。app.config.json が優先されるので実害は出ていなかったが、
// 設定漏れ時に他社アプリの Play を黙って叩きに行くため fail-closed にする。
const PACKAGE = process.env.PLAY_PACKAGE_NAME || APP_CONFIG.stores?.playPackageName;
if (!PACKAGE) {
  console.error('[play-review-check] PLAY_PACKAGE_NAME も app.config.json stores.playPackageName も未設定です。');
  process.exit(1);
}
const TRACK = process.env.PLAY_TRACK || 'production';
const LOCALE = process.env.PLAY_LISTING_LOCALE || 'ja-JP';
const DATA_SAFETY_FILE = process.env.PLAY_DATA_SAFETY_CSV_PATH || path.join(REPO, 'store-assets', 'play', 'data-safety.csv');

function hasDataSafetyInput() {
  return Boolean(
    process.env.PLAY_DATA_SAFETY_CSV ||
      process.env.GOOGLE_PLAY_DATA_SAFETY_CSV ||
      process.env.PLAY_DATA_SAFETY_CSV_BASE64 ||
      process.env.GOOGLE_PLAY_DATA_SAFETY_CSV_BASE64 ||
      fs.existsSync(DATA_SAFETY_FILE),
  );
}

async function readOrNull(label, fn, warnings) {
  try {
    return await fn();
  } catch (e) {
    warnings.push(`${label}: ${String(e.message || e).slice(0, 300)}`);
    return null;
  }
}

function latestRelease(track) {
  const releases = track?.releases || [];
  return releases[0] || null;
}

(async () => {
  const warnings = [];
  const blockers = [];
  const sa = loadServiceAccount();
  const api = makePlayClient(sa, PACKAGE);

  const edit = await api('POST', '/edits', {});
  let track = null;
  let listing = null;
  const imageCounts = {};

  try {
    track = await readOrNull(`track:${TRACK}`, () => api('GET', `/edits/${edit.id}/tracks/${TRACK}`), warnings);
    listing = await readOrNull(`listing:${LOCALE}`, () => api('GET', `/edits/${edit.id}/listings/${LOCALE}`), warnings);
    for (const imageType of ['icon', 'featureGraphic', 'phoneScreenshots']) {
      const result = await readOrNull(
        `images:${imageType}`,
        () => api('GET', `/edits/${edit.id}/listings/${LOCALE}/${imageType}`),
        warnings,
      );
      imageCounts[imageType] = result?.images?.length || 0;
    }
  } finally {
    await api('DELETE', `/edits/${edit.id}`).catch(() => {});
  }

  const release = latestRelease(track);
  if (!track) blockers.push(`Cannot read ${TRACK} track via Android Publisher API.`);
  if (track && !release) blockers.push(`${TRACK} track has no release.`);
  if (release && release.status !== 'completed') {
    blockers.push(`${TRACK} latest release status is ${release.status}; expected completed for review submission.`);
  }
  const listingMissing = !listing?.title || !listing?.shortDescription || !listing?.fullDescription;
  const graphicsMissing =
    (imageCounts.icon || 0) < 1 ||
    (imageCounts.featureGraphic || 0) < 1 ||
    (imageCounts.phoneScreenshots || 0) < 2;

  if (listingMissing) {
    blockers.push(`${LOCALE} store listing is missing title, shortDescription, or fullDescription.`);
  }
  if ((imageCounts.icon || 0) < 1) blockers.push('Play listing icon is missing.');
  if ((imageCounts.featureGraphic || 0) < 1) blockers.push('Play feature graphic is missing.');
  if ((imageCounts.phoneScreenshots || 0) < 2) blockers.push('Play phone screenshots are fewer than 2.');
  if (listingMissing || graphicsMissing) {
    warnings.push(
      'If android-play-release reached a metadata validate/commit 403, grant the service account Manage store presence / CAN_MANAGE_PUBLIC_LISTING for listing text and graphics.',
    );
  }
  if (!hasDataSafetyInput()) {
    blockers.push('Data Safety CSV input is not configured; set GOOGLE_PLAY_DATA_SAFETY_CSV_BASE64 or commit store-assets/play/data-safety.csv.');
  }

  const report = {
    packageName: PACKAGE,
    track: TRACK,
    locale: LOCALE,
    release: release
      ? {
          name: release.name || null,
          status: release.status || null,
          versionCodes: release.versionCodes || [],
          userFraction: release.userFraction ?? null,
        }
      : null,
    listing: listing
      ? {
          title: listing.title || null,
          shortDescriptionLength: listing.shortDescription?.length || 0,
          fullDescriptionLength: listing.fullDescription?.length || 0,
        }
      : null,
    imageCounts,
    dataSafetyInputConfigured: hasDataSafetyInput(),
    blockers,
    warnings,
    timestamp: new Date().toISOString(),
  };

  process.stdout.write(`${JSON.stringify(report)}\n`);
})().catch((e) => {
  console.error(`play-review-check FATAL: ${e.message}`);
  process.exit(1);
});
