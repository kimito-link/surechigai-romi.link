#!/usr/bin/env bash
# Vercel 本番ビルド。Metro の古いトランスフォームキャッシュ（import.meta 変換前の
# @clerk/shared 等）を必ず破棄してからクリーンビルドする（--clear）。
set -euo pipefail

rm -rf node_modules/.cache dist .expo "${TMPDIR:-/tmp}"/metro-* /tmp/metro-* 2>/dev/null || true

# @clerk の import.meta を物理除去（postinstall が走らない場合の保険）。
node scripts/strip-import-meta.cjs || true

mkdir -p node_modules/react-native-css-interop/.cache
npx tailwindcss -i ./global.css -o ./node_modules/react-native-css-interop/.cache/web.css

pnpm build
npx expo export -p web --clear

# entry スクリプトに版数クエリを付け、古い immutable キャッシュを確実に破棄する。
node scripts/bust-entry-cache.cjs || true

# Service Worker の CACHE_VERSION を commitSha で埋め込む。
node scripts/inject-sw-version.cjs || true

# LP（public/lp）を dist に同期 — surechigai-romi.link/lp/ で静的配信
python scripts/sync-brand-icons.py || true
if [ -d public/lp ]; then
  mkdir -p dist/lp
  cp -a public/lp/. dist/lp/
fi
