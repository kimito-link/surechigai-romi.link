#!/usr/bin/env bash
set -euo pipefail

# Gate 1: 本番が「そのコミット」になったことを照合。ズレたら即失敗。
# usage: verify-deploy.sh <url> <expected_sha>

URL="${1:?usage: verify-deploy.sh <url> <expected_sha>}"
EXPECTED_SHA="${2:?usage: verify-deploy.sh <url> <expected_sha>}"

echo "🔍 Checking: $URL/api/health"
echo "📌 Expected commitSha: $EXPECTED_SHA"

RESP="$(curl -fsSL "$URL/api/health" || echo "{}")"
echo "📥 Health check response:"
echo "$RESP" | jq '.' || echo "$RESP"

ACTUAL_SHA="$(echo "$RESP" | jq -r '.commitSha // .commitsha // .gitSha // "unknown"')"
OK="$(echo "$RESP" | jq -r '.ok // false')"

echo "📊 Actual commitSha: $ACTUAL_SHA"
echo "📊 Health ok: $OK"

if [ "$ACTUAL_SHA" = "unknown" ]; then
  echo "❌ commitSha is unknown. Health endpoint is not returning version info."
  echo "Full response: $RESP"
  exit 1
fi

if [ "$OK" != "true" ]; then
  echo "⚠️ Health check returned ok=false. Deployment may still be in progress."
  exit 1
fi

if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "❌ Deploy mismatch! expected=$EXPECTED_SHA actual=$ACTUAL_SHA"
  exit 1
fi

echo "✅ Deploy verified. commitSha=$ACTUAL_SHA"
