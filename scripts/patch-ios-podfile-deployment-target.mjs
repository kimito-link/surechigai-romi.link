#!/usr/bin/env node
/**
 * expo prebuild が生成した ios/Podfile の post_install に、
 * 「各 pod の IPHONEOS_DEPLOYMENT_TARGET を下限まで引き上げる」処理を足す。
 *
 * なぜ必要か（2026-11-23 実測・PR #127）:
 * Xcode 27 は iOS の deployment target を 15.0 以上しか受け付けず、未満だと警告でなく【エラー】になる。
 *   Pods.xcodeproj: error: The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET'
 *   is set to 12.0, but the range of supported deployment target versions is 15.0 to 27.1.x.
 *   (in target 'GoogleUtilities-GoogleUtilities_Privacy' / 'RNCAsyncStorage-...' / 'RNSVG-...')
 * podspec 側が古い下限（12.0 / 12.4 / 13.4 など）を宣言している pod が残っているため。
 * アプリ本体は prebuild で 15.1 なので、pod も 15.1 未満のものだけ 15.1 に揃える
 * （15.1 以上を宣言している pod は触らない）。
 *
 * react_native_post_install の後に効かせたいので、post_install ブロックの end の直前に入れる。
 * prebuild は毎回 Podfile を作り直すので、この処理も毎回走らせる。
 */
import fs from "node:fs";

const PODFILE = "ios/Podfile";
const MIN = "15.1";
const MARK = "# [patch-ios-podfile-deployment-target]";

if (!fs.existsSync(PODFILE)) {
  console.error(`::error::${PODFILE} が無い。expo prebuild が失敗している可能性がある。`);
  process.exit(1);
}

const original = fs.readFileSync(PODFILE, "utf8");
if (original.includes(MARK)) {
  console.log("deployment target の引き上げは既にある（何もしない）");
  process.exit(0);
}

const lines = original.split("\n");
const start = lines.findIndex((l) => /^\s*post_install do \|installer\|/.test(l));
if (start < 0) {
  console.error("::error::Podfile に post_install do |installer| が無い。Expo のテンプレートが変わった可能性がある。");
  process.exit(1);
}
const indent = lines[start].match(/^\s*/)[0];
let end = -1;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i] === `${indent}end` || lines[i].trimEnd() === `${indent}end`) {
    end = i;
    break;
  }
}
if (end < 0) {
  console.error("::error::post_install ブロックの end が見つからない。");
  process.exit(1);
}

const body = `${indent}  `;
const snippet = [
  `${body}${MARK} Xcode 27 は deployment target ${MIN.split(".")[0]}.0 未満をエラーにする`,
  `${body}min_ios = Gem::Version.new('${MIN}')`,
  `${body}([installer.pods_project] + installer.pods_project.targets).each do |t|`,
  `${body}  t.build_configurations.each do |c|`,
  `${body}    v = c.build_settings['IPHONEOS_DEPLOYMENT_TARGET']`,
  `${body}    next if v.nil? || v.to_s.empty?`,
  `${body}    c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN}' if Gem::Version.new(v.to_s) < min_ios`,
  `${body}  end`,
  `${body}end`,
];
lines.splice(end, 0, ...snippet);
fs.writeFileSync(PODFILE, lines.join("\n"));
console.log(`inserted deployment target floor (${MIN}) before line ${end + 1}`);
