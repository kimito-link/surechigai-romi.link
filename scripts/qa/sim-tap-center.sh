#!/bin/bash
# シミュレータ画面の指定位置をクリックする（macOS 専用）。
#
# なぜ必要か（2026-08-20・build 520 の Guideline 2.1(a) 却下）:
#   「はじめる」「Login with X」ボタンが反応しない、と審査で指摘された。
#   起動プローブは「起動して落ちない」ことしか見ておらず、
#   **押して動くか**を一度も確かめていなかった。
#
# 使い方: sim-tap-center.sh <縦位置の割合 0.0-1.0>
# 例:     sim-tap-center.sh 0.55   # 画面の上から 55% の位置を押す
#
# simctl には座標タップが無いので AppleScript でウィンドウを叩く。
# 失敗しても呼び出し側を止めない（exit 0）。
set -uo pipefail

RATIO="${1:-0.55}"

osascript -e 'tell application "Simulator" to activate' 2>/dev/null || true
sleep 1

osascript 2>/dev/null <<OSA || echo "::warning::simulator tap failed"
tell application "System Events"
  tell process "Simulator"
    set frontmost to true
    set {wx, wy} to position of window 1
    set {ww, wh} to size of window 1
    click at {wx + (ww / 2), wy + (wh * $RATIO)}
  end tell
end tell
OSA

exit 0
