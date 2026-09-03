#!/usr/bin/env bash
# Vercel 本番ビルド。Metro の古いトランスフォームキャッシュ（import.meta 変換前の
# @clerk/shared 等）を必ず破棄してからクリーンビルドする（--clear）。
set -euo pipefail

export EXPO_PUBLIC_BUILD_SHA="${VERCEL_GIT_COMMIT_SHA:-local}"

rm -rf node_modules/.cache dist .expo "${TMPDIR:-/tmp}"/metro-* /tmp/metro-* 2>/dev/null || true

# @clerk の import.meta を物理除去（postinstall が走らない場合の保険）。
node scripts/strip-import-meta.cjs || true

# ブランドアイコンを先に生成（expo export が web.favicon を参照）
python -m pip install --quiet Pillow && python scripts/sync-brand-icons.py

# ★react-native-css-interop の .cache/web.css を、実際に存在する全ての場所へ置く。
#
# ★なぜ決め打ちにしないか（2026-09-03・実損）:
#   nativewind 4.2.1 → 4.2.6 の更新で依存の解決先が変わり、
#   node_modules/nativewind/node_modules/react-native-css-interop/ (0.2.6) が
#   入れ子で入った（トップレベルには 0.2.1 が残る＝二重）。
#   Metro は入れ子側を参照するのに、ここはトップレベルにしか生成しておらず
#   Vercel のビルドが落ちた:
#     Error: Failed to get the SHA-1 for: .../nativewind/node_modules/react-native-css-interop/.cache/web.css
#   ★パスを1つ書き換えるだけだと、次に解決先が戻ったときに同じ形で壊れる。
#   実在するものを全部埋めるので、どちらに解決されても通る。
CSS_OUT=""
for d in node_modules/react-native-css-interop node_modules/nativewind/node_modules/react-native-css-interop; do
  if [ -d "$d" ]; then
    mkdir -p "$d/.cache"
    CSS_OUT="$CSS_OUT $d/.cache/web.css"
  fi
done
if [ -z "$CSS_OUT" ]; then
  # ★見つからないのに黙って進むと、原因の分からないビルド失敗になる。
  echo "ERROR: react-native-css-interop が見つかりません（nativewind の依存構造が変わった可能性）" >&2
  exit 1
fi
FIRST_OUT=$(echo $CSS_OUT | awk '{print $1}')
npx tailwindcss -i ./global.css -o "$FIRST_OUT"
for out in $CSS_OUT; do
  [ "$out" = "$FIRST_OUT" ] || cp "$FIRST_OUT" "$out"
done

pnpm build
npx expo export -p web --clear

# entry スクリプトに版数クエリを付け、古い immutable キャッシュを確実に破棄する。
node scripts/bust-entry-cache.cjs || true

# Service Worker の CACHE_VERSION を commitSha で埋め込む。
node scripts/inject-sw-version.cjs || true

# expo export 後に public の favicon 等で dist を上書き + HTML に ?v= 付与
node scripts/sync-brand-to-dist.cjs

# LP（public/lp）を dist に同期 — surechigai-romi.link/lp/ で静的配信
if [ -d public/lp ]; then
  mkdir -p dist/lp
  cp -a public/lp/. dist/lp/
fi
