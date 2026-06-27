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
