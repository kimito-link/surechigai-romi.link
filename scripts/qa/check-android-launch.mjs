#!/usr/bin/env node
/**
 * scripts/qa/check-android-launch.mjs
 *
 * ★Android 実機の「起動の見た目」が連続しているかを、画面録画から機械で判定する。
 *   OS の起動画面 → ブートベール → 待機画面 → ヒーロー の間で、アイコンの大きさ・位置が飛んだり、
 *   アイコンが消えたりしていないか（＝「ちかちか」）。判定ロジックは scripts/lib/launch-frames.mjs。
 *
 * ■ なぜ要るか（2026-10-12）
 *   OS の起動画面のアイコン（幅55.4%・縦中心49.9%）とベールのアイコン（44%・約45%）が食い違い、
 *   切り替わりで飛んでいた。目視では何ミリ秒か分からず、直したかどうかも判定できなかったので、
 *   実機の録画をフレームごとに測る手順（手作業）を、繰り返し使える検査にした。
 *   値の正本は theme/tokens/boot.ts の BOOT。OS の起動画面は機種・OS・Chrome の更新で変わりうるので、
 *   ★数か月ごと／起動画面を触ったあと／新しい機種で、これを実行して一致を確かめる。
 *
 * ■ 使い方
 *   node scripts/qa/check-android-launch.mjs                       # 実機（adb）で3回撮って判定
 *   node scripts/qa/check-android-launch.mjs --runs 5 --pwa org.chromium.webapk.xxxx
 *   node scripts/qa/check-android-launch.mjs --video a.mp4 b.mp4   # 既存の録画を判定（実機不要）
 *   --max-gap-ms 100   アイコンが消えたままの許容時間（既定 100ms。超えたら赤、以下は注意）
 *   --out <dir>        録画を残す場所（既定: OS の一時フォルダ）
 *
 * ■ 前提（満たせないときは「測れなかった」＝終了コード 2。偽の緑にしない）
 *   adb / ffmpeg / ffprobe が PATH にある ／ 端末が USB デバッグで接続済み ／
 *   ホーム画面に追加済みの PWA（WebAPK）がある（Chrome →「ホーム画面に追加」→「インストール」）
 *   ★撮影中（約12秒×回数）は端末を触らない（他のアプリの画面が写ると「消えた」と誤判定する）。
 *   ★Chrome を毎回止める（コールドスタート）。通知が出ると画面が変わるので、通知は切っておくと安定する。
 *
 * ■ 終了コード（3値）: 0=合格 / 1=測れた上での赤 / 2=測れなかった
 *
 * ■ 限界
 *   ・1つの端末（機種）の結果。他の機種では OS の起動画面の大きさが違いうる
 *   ・色の好み・大きさの好みは判定しない（OS の起動画面との「一致」だけ）
 *   ・起動のたびに揺れる（Chrome の状態や通信で）。1回の赤で断定せず、--runs を増やして頻度を見る
 *   ・ヒーローまでの時間は判定しない（Chrome のコールドスタートが支配的でアプリ側では動かせない。docs/symptoms.md SG-09）
 *   ・CI には載せない（実機が要る）。pnpm check の合否にも入れていない
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { analyzeLaunch, summarizeFrame, DEFAULT_THRESHOLDS } from "../lib/launch-frames.mjs";

const EXIT = { PASS: 0, FAIL: 1, INCONCLUSIVE: 2 };
const FRAME_WIDTH = 270; // 解析用に縮小する幅（速度のため。外接矩形は割合で見る）

function parseArgs(argv) {
  const a = { runs: 3, pwa: null, videos: [], out: null, maxGapMs: DEFAULT_THRESHOLDS.maxGapMs };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--runs") a.runs = Number(argv[++i]);
    else if (k === "--pwa") a.pwa = argv[++i];
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--max-gap-ms") a.maxGapMs = Number(argv[++i]);
    else if (k === "--video") {
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) a.videos.push(argv[++i]);
    } else if (k === "--help" || k === "-h") a.help = true;
    else throw new Error(`知らない引数: ${k}`);
  }
  return a;
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function has(cmd, args) {
  try {
    run(cmd, args);
    return true;
  } catch {
    return false;
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 録画 → フレームごとの要約（時刻つき） */
function summarizeVideo(file) {
  const dims = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file])
    .trim()
    .split(",")
    .map(Number);
  const [W, H] = dims;
  if (!W || !H) throw new Error(`録画の大きさが読めない: ${file}`);
  const h = Math.max(2, Math.round(((FRAME_WIDTH * H) / W) / 2) * 2);
  const pts = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pts_time", "-of", "csv=p=0", file])
    .trim()
    .split(/\r?\n/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const raw = execFileSync(
    "ffmpeg",
    ["-loglevel", "error", "-i", file, "-vsync", "0", "-vf", `scale=${FRAME_WIDTH}:${h}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 1024 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  const frameBytes = FRAME_WIDTH * h * 3;
  const n = Math.min(Math.floor(raw.length / frameBytes), pts.length);
  const frames = [];
  for (let i = 0; i < n; i++) {
    const data = raw.subarray(i * frameBytes, (i + 1) * frameBytes);
    frames.push({ t: pts[i], ...summarizeFrame({ data, width: FRAME_WIDTH, height: h }) });
  }
  return frames;
}

function describe(res) {
  const s = res.stats;
  const ref = s.reference ? `OSの起動画面 幅${s.reference.wPct.toFixed(1)}%・縦中心${s.reference.cyPct.toFixed(1)}%` : "基準なし";
  const timing = s.heroAtSec != null ? `（起動画面 ${s.splashAtSec.toFixed(1)}s → ヒーロー ${s.heroAtSec.toFixed(1)}s）` : "";
  return `${ref} ${timing}`;
}

async function recordOnDevice(pkg, outDir, index) {
  const remote = `/sdcard/launch-check-${index}.mp4`;
  const local = join(outDir, `launch-${index}.mp4`);
  run("adb", ["shell", "input", "keyevent", "KEYCODE_HOME"]);
  run("adb", ["shell", "am", "force-stop", pkg]);
  run("adb", ["shell", "am", "force-stop", "com.android.chrome"]); // コールドスタートにする
  await sleep(2000);
  const rec = spawn("adb", ["shell", "screenrecord", "--time-limit", "12", "--bit-rate", "6000000", remote], { stdio: "ignore" });
  const recDone = new Promise((r) => rec.on("exit", r));
  await sleep(1500); // 録画が始まってから起動する（起動の最初のコマを逃さない）
  run("adb", ["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"]);
  await recDone;
  run("adb", ["pull", remote, local]);
  run("adb", ["shell", "rm", remote]);
  return local;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("使い方はファイル先頭のコメントを参照");
    return EXIT.PASS;
  }

  if (!has("ffmpeg", ["-version"]) || !has("ffprobe", ["-version"])) {
    console.error("🟡 測れなかった: ffmpeg / ffprobe が PATH に無い（録画をフレームに割れない）");
    return EXIT.INCONCLUSIVE;
  }

  let files = args.videos.map((f) => resolve(f));
  if (files.length === 0) {
    if (!has("adb", ["version"])) {
      console.error("🟡 測れなかった: adb が PATH に無い");
      return EXIT.INCONCLUSIVE;
    }
    const devices = run("adb", ["devices"]).split(/\r?\n/).slice(1).filter((l) => /\tdevice$/.test(l));
    if (devices.length !== 1) {
      console.error(`🟡 測れなかった: 接続された端末が ${devices.length} 台（1台だけ接続して、USBデバッグを許可してください）`);
      return EXIT.INCONCLUSIVE;
    }
    let pkg = args.pwa;
    if (!pkg) {
      const pkgs = run("adb", ["shell", "pm", "list", "packages"])
        .split(/\r?\n/)
        .map((l) => l.replace(/^package:/, "").trim())
        .filter((p) => p.startsWith("org.chromium.webapk."));
      if (pkgs.length !== 1) {
        console.error(
          pkgs.length === 0
            ? "🟡 測れなかった: ホーム画面に追加した PWA（WebAPK）が端末に無い。Chrome で開いて「ホーム画面に追加」→「インストール」してください"
            : `🟡 測れなかった: WebAPK が ${pkgs.length} 個ある。--pwa <パッケージ名> で指定してください:\n  ${pkgs.join("\n  ")}`,
        );
        return EXIT.INCONCLUSIVE;
      }
      pkg = pkgs[0];
    }
    const outDir = args.out ? resolve(args.out) : mkdtempSync(join(tmpdir(), "launch-check-"));
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    console.log(`端末 ${devices[0].split("\t")[0]} / PWA ${pkg} / ${args.runs} 回（撮影中は端末を触らないでください）`);
    files = [];
    for (let i = 1; i <= args.runs; i++) {
      process.stdout.write(`  録画 ${i}/${args.runs} ...`);
      files.push(await recordOnDevice(pkg, outDir, i));
      console.log(" 済");
    }
    console.log(`録画の保存先: ${outDir}`);
  }

  let pass = 0;
  let fail = 0;
  let inconclusive = 0;
  files.forEach((file, idx) => {
    const res = analyzeLaunch(summarizeVideo(file), { maxGapMs: args.maxGapMs });
    const mark = res.verdict === "pass" ? "✅" : res.verdict === "fail" ? "🔴" : "🟡";
    console.log(`${mark} #${idx + 1} ${res.verdict}  ${describe(res)}`);
    for (const r of res.reasons) console.log(`     - ${r}`);
    for (const w of res.warnings) console.log(`     ⚠ ${w}`);
    if (res.verdict === "pass") pass++;
    else if (res.verdict === "fail") fail++;
    else inconclusive++;
  });

  console.log(`\n結果: 合格 ${pass} / 赤 ${fail} / 測れなかった ${inconclusive}（全 ${files.length} 回）`);
  console.log(
    "★この検査が判定しないこと: 色・大きさの好み／ヒーローまでの時間／他の機種。1回の赤で断定せず、回数を増やして頻度を見る。",
  );
  if (fail > 0) return EXIT.FAIL;
  if (pass === 0 || pass < Math.ceil(files.length / 2)) return EXIT.INCONCLUSIVE;
  return EXIT.PASS;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`🟡 測れなかった（実行エラー）: ${err?.message ?? err}`);
    process.exit(EXIT.INCONCLUSIVE);
  },
);
