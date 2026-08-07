#!/usr/bin/env node
// Poll App Store Connect for Apple Distribution certificate and provisioning
// profile expirations. Emit a structured report so a companion workflow step
// can auto-create GitHub Issues for certs/profiles expiring soon.
//
// Why: Apple Distribution certificates expire after 1 year. If you miss the
// rotation, the next iOS build fails with "No signing certificate found" and
// you have to rebuild + re-set GitHub Secrets in a hurry. Better to know 30
// days ahead of time.
//
// Reads:
//   env APPSTORE_CONNECT_KEY_ID
//   env APPSTORE_CONNECT_ISSUER_ID
//   env APPSTORE_CONNECT_API_KEY_P8_BASE64 (or _PATH or raw _P8)
//   env WARNING_DAYS (default: 30)
//
// Outputs (stdout) JSON:
//   {"timestamp":"...","warnings":[
//     {"kind":"certificate","id":"...","name":"...","expirationDate":"...","daysRemaining":N},
//     {"kind":"profile","id":"...","name":"...","expirationDate":"...","daysRemaining":N},
//   ]}
import fs from 'node:fs';
import { makeAscClient } from './lib/asc-api.mjs';

function resolvePrivateKey() {
  const direct = process.env.APPSTORE_CONNECT_API_KEY_P8;
  if (direct && direct.includes('BEGIN PRIVATE KEY')) return direct;
  const filePath = process.env.APPSTORE_CONNECT_API_KEY_P8_PATH;
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  const b64 = process.env.APPSTORE_CONNECT_API_KEY_P8_BASE64;
  if (b64) return Buffer.from(b64.trim(), 'base64').toString('utf8');
  throw new Error('Provide APPSTORE_CONNECT_API_KEY_P8_PATH, _BASE64, or _P8');
}

const WARNING_DAYS = Number(process.env.WARNING_DAYS || 30);

function daysUntil(iso) {
  const exp = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((exp - now) / 86_400_000);
}

(async () => {
  const keyId = process.env.APPSTORE_CONNECT_KEY_ID;
  const issuerId = process.env.APPSTORE_CONNECT_ISSUER_ID;
  if (!keyId || !issuerId) {
    throw new Error('Missing APPSTORE_CONNECT_KEY_ID / APPSTORE_CONNECT_ISSUER_ID');
  }
  const api = makeAscClient({ keyId, issuerId, privateKey: resolvePrivateKey() });

  // Distribution certificates
  const certs = await api(
    'GET',
    '/v1/certificates?filter[certificateType]=DISTRIBUTION&limit=50&fields[certificates]=name,displayName,expirationDate',
  );
  // Active provisioning profiles for app store distribution
  const profiles = await api(
    'GET',
    '/v1/profiles?filter[profileType]=IOS_APP_STORE&filter[profileState]=ACTIVE&limit=50&fields[profiles]=name,uuid,expirationDate',
  );

  const warnings = [];

  for (const c of certs.data || []) {
    const exp = c.attributes?.expirationDate;
    if (!exp) continue;
    const d = daysUntil(exp);
    if (d <= WARNING_DAYS) {
      warnings.push({
        kind: 'certificate',
        id: c.id,
        name: c.attributes?.displayName || c.attributes?.name || '(unnamed)',
        expirationDate: exp,
        daysRemaining: d,
      });
    }
  }

  for (const p of profiles.data || []) {
    const exp = p.attributes?.expirationDate;
    if (!exp) continue;
    const d = daysUntil(exp);
    if (d <= WARNING_DAYS) {
      warnings.push({
        kind: 'profile',
        id: p.id,
        name: p.attributes?.name || '(unnamed)',
        expirationDate: exp,
        daysRemaining: d,
      });
    }
  }

  process.stdout.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      warningDays: WARNING_DAYS,
      certificateCount: certs.data?.length || 0,
      profileCount: profiles.data?.length || 0,
      warnings,
    }) + '\n',
  );
})().catch((e) => {
  console.error(`apple-cert-expiry-check FATAL: ${e.message}`);
  process.exit(1);
});
