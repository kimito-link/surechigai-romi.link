#!/usr/bin/env node
/**
 * expo prebuild が生成した ios/Podfile に use_modular_headers! を挿入する。
 *
 * なぜ必要か（2026-08-06 実測）:
 * pod install が以下で落ちる。
 *   [!] The following Swift pods cannot yet be integrated as static libraries:
 *   The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and `RecaptchaInterop`,
 *   which do not define modules.
 * AppCheckCore は Swift pod だが、依存する GoogleUtilities / RecaptchaInterop が
 * modulemap を出さないため static library として統合できない。
 * CocoaPods 自身が「use_modular_headers! を全体に効かせよ」と案内しており、
 * これ1行で 108依存・123pods が通ることを ios-prebuild-probe.yml で実証済み。
 *
 * platform 行の直後に入れること（Expo の autolinking 定義より前に置く必要がある）。
 * prebuild は毎回 Podfile を作り直すので、この処理も毎回走らせる。
 */
import fs from "node:fs";

const PODFILE = "ios/Podfile";

if (!fs.existsSync(PODFILE)) {
  console.error(`::error::${PODFILE} が無い。expo prebuild が失敗している可能性がある。`);
  process.exit(1);
}

const original = fs.readFileSync(PODFILE, "utf8");

if (original.includes("use_modular_headers!")) {
  console.log("use_modular_headers! は既にある（何もしない）");
  process.exit(0);
}

const lines = original.split("\n");
let at = lines.findIndex((l) => /^\s*platform :ios/.test(l));
if (at < 0) {
  console.warn("platform :ios 行が見つからないので先頭に挿入する");
  at = -1;
}
lines.splice(at + 1, 0, "use_modular_headers!");
fs.writeFileSync(PODFILE, lines.join("\n"));

console.log(`inserted use_modular_headers! after line ${at + 1}`);
