/**
 * qa-doctor.mjs — QA ツールキットの一元エントリポイント（全自動）
 *
 *   pnpm qa:doctor
 *
 * メニュー選択は一切ない。実行するだけで:
 *   1. 認証状態（.auth/auth-state.json）を自動診断
 *   2. 無効/失効/空なら X ログイン画面を自動で開き、完了を自動検知するまで待つ
 *      （ここだけは X 本人にしかできない操作なので人手が必要。それ以外は無人）
 *   3. ログインが有効になったら、そのまま続けて soak → first-load を自動実行
 *   4. 最後に結果をまとめて表示
 *
 * フルフローの先頭では、ログイン不要の「1タップXログイン導線チェック」
 * （tests/e2e/login-one-tap-x.spec.ts をゲストで実行）も自動で走る。
 *
 * 個別に実行したいときのために --skip-login /
 * --only=save|verify|one-tap|soak|first-load|e2e
 * のフラグも用意している（省略時は上記のフルフローを実行）。
 *
 * 各ツールの詳細: docs/qa-toolkit-design.md / docs/auth-home-soak-HOWTO.md
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTH_STATE_PATH = path.join(ROOT, ".auth", "auth-state.json");
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://surechigai.kimito.link";

// ---------- 認証状態の診断 ----------
function diagnoseAuth() {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    return { status: "missing", label: "未保存（ファイルなし）", ok: false };
  }
  let saved;
  try {
    saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8"));
  } catch {
    return { status: "invalid", label: "壊れています（JSON 不正）", ok: false };
  }
  const cookies = Array.isArray(saved.cookies) ? saved.cookies : [];
  const uat = cookies.find((c) => c.name?.startsWith("__client_uat"));
  if (cookies.length === 0 || !uat || uat.value === "0") {
    return {
      status: "empty",
      label: "空（ログイン未完了のまま保存された残骸）",
      ok: false,
    };
  }
  const mtime = fs.statSync(AUTH_STATE_PATH).mtime;
  const ageDays = (Date.now() - mtime.getTime()) / 86_400_000;
  const session = cookies.find((c) => c.name?.startsWith("__session"));
  let expiresNote = "";
  if (session?.expires && session.expires > 0) {
    const daysLeft = (session.expires * 1000 - Date.now()) / 86_400_000;
    expiresNote =
      daysLeft <= 0
        ? " / セッション cookie 期限切れの可能性"
        : ` / cookie 期限まで約${Math.floor(daysLeft)}日`;
  }
  return {
    status: "ok",
    label: `保存済み（${mtime.toLocaleString("ja-JP")} 保存 / 約${ageDays.toFixed(1)}日前${expiresNote}）`,
    ok: true,
    stale: ageDays > 7,
  };
}

// ---------- 直近結果の要約 ----------
function latestDir(base) {
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .map((d) => path.join(base, d))
    .filter((p) => fs.statSync(p).isDirectory())
    .sort();
  return dirs[dirs.length - 1] ?? null;
}

function latestSoakSummary() {
  const dir = latestDir(path.join(ROOT, "soak-results"));
  if (!dir) return null;
  try {
    const s = JSON.parse(fs.readFileSync(path.join(dir, "summary.json"), "utf8"));
    return `${path.basename(dir)}: 判定=${s.verdict} (auth=${s.authState}, ${s.minutes}分)`;
  } catch {
    return null;
  }
}

function latestFirstLoadSummary() {
  const dir = latestDir(path.join(ROOT, "qa-results", "first-load"));
  if (!dir) return null;
  try {
    const a = JSON.parse(fs.readFileSync(path.join(dir, "aggregate.json"), "utf8"));
    return `${path.basename(dir)}: クラッシュ ${a.crashCount}/${a.iterations}, 白画面 ${a.whiteScreenCount}/${a.iterations}`;
  } catch {
    return null;
  }
}

// ---------- 子プロセス実行 ----------
// Windows の shell:true は cmd 文字列をそのまま cmd.exe に渡すため、
// スペースを含むパス（例: "C:\Program Files\nodejs\node.exe"）は
// 引用符で囲まないと "C:\Program" だけが実行ファイル名として解釈されて壊れる。
// cmd・args とも、スペースを含み得るものはダブルクォートで囲む
// （Node公式ドキュメント記載の shell:true + Windows の既知の罠）。
const quoteWin = (s) => (/[\s]/.test(s) ? `"${s}"` : s);

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve) => {
    console.log(`\n$ ${cmd} ${args.join(" ")}\n`);
    const isWin = process.platform === "win32";
    const child = spawn(
      isWin ? quoteWin(cmd) : cmd,
      isWin ? args.map(quoteWin) : args,
      {
        cwd: ROOT,
        stdio: "inherit",
        shell: isWin, // Windows で pnpm 等の .cmd を解決するため
        windowsVerbatimArguments: isWin,
        env: { ...process.env, ...extraEnv },
      },
    );
    child.on("close", (code) => {
      console.log(`\n(終了コード: ${code})`);
      resolve(code ?? 1);
    });
  });
}

const node = (script, ...extra) => run(process.execPath, [path.join(ROOT, "scripts", script), ...extra]);

// 1タップXログイン導線チェック（tests/e2e/login-one-tap-x.spec.ts）。
// ゲスト（storageState なし）で走るのでログイン保存は不要。
// playwright.config.ts の既定 baseURL は localhost なので、
// qa-doctor の対象サイト（既定: 本番）を必ず env で引き継ぐ。
const oneTapCheck = () =>
  run("pnpm", ["exec", "playwright", "test", "--project=one-tap-x"], {
    PLAYWRIGHT_BASE_URL: BASE_URL,
  });

// ---------- 表示 ----------
function printStatus(auth) {
  console.log("\n================ QA ドクター（全自動） ================");
  console.log(`対象サイト : ${BASE_URL}`);
  console.log(`ログイン状態: ${auth.label}`);
  if (auth.stale) {
    console.log("             ※ 保存から1週間以上経過。念のため再ログインで更新します");
  }
  const soak = latestSoakSummary();
  const fl = latestFirstLoadSummary();
  if (soak) console.log(`直近ソーク : ${soak}`);
  if (fl) console.log(`直近初回計測: ${fl}`);
  console.log("=========================================================");
}

// ---------- 引数 ----------
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const argVal = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const SKIP_LOGIN = hasFlag("skip-login");
const ONLY = argVal("only"); // "save" | "verify" | "one-tap" | "soak" | "first-load" | "e2e"

async function main() {
  let auth = diagnoseAuth();
  printStatus(auth);

  // ---------- ONLY 指定時は該当ステップだけ実行して終了 ----------
  if (ONLY) {
    const map = {
      save: () => node("save-auth-state.mjs"),
      verify: () => node("save-auth-state.mjs", "--verify"),
      "one-tap": oneTapCheck,
      soak: () => node("auth-home-soak.mjs"),
      "first-load": () => node("first-load-crash.mjs"),
      e2e: () => run("pnpm", ["e2e"]),
    };
    const fn = map[ONLY];
    if (!fn) {
      console.error(`[qa-doctor] 不明な --only=${ONLY}（save|verify|one-tap|soak|first-load|e2e）`);
      process.exit(2);
    }
    process.exit(await fn());
  }

  // ---------- フルフロー: 1タップ導線 → ログイン確保 → soak → first-load ----------
  // 1タップ導線チェックはゲスト前提（storageState なし）なので、
  // ログイン確保より前に置く。ログインに失敗しても導線の判定だけは残る。
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[1/3] 1タップXログイン導線チェック（ゲスト・約1分）を実行します…");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const oneTapCode = await oneTapCheck();
  if (oneTapCode !== 0) {
    console.error(
      "\n[qa-doctor] ⚠ 1タップ導線が壊れている可能性があります" +
        "（auto=x 着地で X ボタンへ自動 click が届いていない）。\n" +
        "            tests/e2e/login-one-tap-x.spec.ts の失敗内容を確認してください。",
    );
  }

  if (!auth.ok && !SKIP_LOGIN) {
    console.log("\n→ X ログインが必要です。ブラウザを自動で開きます。");
    console.log("  ここだけは本人にしかできない操作です。それ以外はこのまま自動で進みます。\n");
    const code = await node("save-auth-state.mjs");
    if (code !== 0) {
      console.error("\n[qa-doctor] ログイン保存に失敗したため、以降の検証はスキップします。");
      console.error("            もう一度 `pnpm qa:doctor` を実行してください。");
      process.exit(code);
    }
    auth = diagnoseAuth();
  } else if (!auth.ok && SKIP_LOGIN) {
    console.log("\n※ --skip-login が指定されているため、ログイン未保存のままゲスト計測に進みます。");
  } else if (auth.stale) {
    console.log("\n→ 保存済みログインが1週間以上経過しています。有効性を確認します…");
    const verifyCode = await node("save-auth-state.mjs", "--verify");
    if (verifyCode !== 0) {
      console.log("→ 失効していたため、再ログインします。");
      const code = await node("save-auth-state.mjs");
      if (code !== 0) {
        console.error("\n[qa-doctor] 再ログインに失敗しました。もう一度 `pnpm qa:doctor` を実行してください。");
        process.exit(code);
      }
      auth = diagnoseAuth();
    }
  } else {
    console.log("\n→ 有効なログインが保存済みです。そのまま検証に進みます。");
  }

  const guestArgs = auth.ok ? [] : ["--allow-guest"];

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[2/3] ホーム滞在ソーク（OOM/ちかちか検出・約3分）を実行します…");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const soakCode = await node("auth-home-soak.mjs", ...guestArgs);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[3/3] 初回アクセス〜クラッシュの記録を実行します…");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const firstLoadCode = await node("first-load-crash.mjs", ...guestArgs);

  console.log("\n================== 全体結果 ==================");
  const soak = latestSoakSummary();
  const fl = latestFirstLoadSummary();
  console.log(`1タップ導線: ${oneTapCode === 0 ? "OK（auto=x で自動 click 発火）" : "NG（要調査: --only=one-tap で再実行）"}`);
  console.log(`ソーク     : ${soak ?? "(結果なし)"}`);
  console.log(`初回ロード : ${fl ?? "(結果なし)"}`);
  console.log("================================================\n");
  console.log("個別に実行したい場合:");
  console.log("  pnpm qa:doctor --only=save        # ログイン保存のみ");
  console.log("  pnpm qa:doctor --only=verify       # ログイン生存確認のみ");
  console.log("  pnpm qa:doctor --only=one-tap      # 1タップ導線チェックのみ");
  console.log("  pnpm qa:doctor --only=soak         # ソークのみ");
  console.log("  pnpm qa:doctor --only=first-load   # 初回ロード計測のみ");
  console.log("  pnpm qa:doctor --only=e2e          # E2E スモークのみ");

  process.exit(oneTapCode !== 0 || soakCode !== 0 || firstLoadCode !== 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`[qa-doctor] 実行エラー: ${err?.stack ?? err}`);
  process.exit(1);
});
