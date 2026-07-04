/**
 * qa-doctor.mjs — QA ツールキットの一元エントリポイント
 *
 *   pnpm qa:doctor
 *
 * やること:
 *   1. 認証状態（.auth/auth-state.json）の有無・中身・鮮度を診断して表示
 *   2. 直近の soak / first-load の結果があれば要約を表示
 *   3. 番号を選ぶだけで各ツールを起動（個別コマンドを覚える必要なし）
 *
 * 各ツールの詳細: docs/qa-toolkit-design.md / docs/auth-home-soak-HOWTO.md
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
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
function run(cmd, args) {
  return new Promise((resolve) => {
    console.log(`\n$ ${cmd} ${args.join(" ")}\n`);
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32", // Windows で pnpm 等の .cmd を解決するため
    });
    child.on("close", (code) => {
      console.log(`\n(終了コード: ${code})`);
      resolve(code ?? 1);
    });
  });
}

const node = (script, ...extra) => run(process.execPath, [path.join(ROOT, "scripts", script), ...extra]);

// ---------- 表示 ----------
function printStatus() {
  const auth = diagnoseAuth();
  console.log("\n================ QA ドクター ================");
  console.log(`対象サイト : ${BASE_URL}`);
  console.log(`ログイン状態: ${auth.label}`);
  if (auth.stale) {
    console.log("             ※ 保存から1週間以上経過。失効していたら [1] で再保存してください");
  }
  const soak = latestSoakSummary();
  const fl = latestFirstLoadSummary();
  if (soak) console.log(`直近ソーク : ${soak}`);
  if (fl) console.log(`直近初回計測: ${fl}`);
  console.log("=============================================");
  if (!auth.ok) {
    console.log("\n→ まだ X ログインが保存されていません。最初に [1] を実行してください。");
    console.log("  （ブラウザが開くので X ログインを 1 回完了するだけ。完了は自動検知されます）");
  }
  return auth;
}

const MENU = `
何をしますか？（番号を入力して Enter）
  [1] X ログインを保存/更新する            … ブラウザが開きます（1回だけの手動作業）
  [2] 保存済みログインが今も使えるか確認   … 約30秒・全自動
  [3] ホーム滞在ソーク（OOM/ちかちか検出） … 既定3分・全自動
  [4] 初回アクセス〜クラッシュの記録       … 既定3回反復・全自動
  [5] E2E スモークテスト一式               … 全自動
  [q] 終了
`;

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  for (;;) {
    const auth = printStatus();
    console.log(MENU);
    const ans = (await ask("> ")).trim().toLowerCase();

    if (ans === "q" || ans === "quit" || ans === "exit") break;
    if (ans === "1") {
      await node("save-auth-state.mjs");
    } else if (ans === "2") {
      await node("save-auth-state.mjs", "--verify");
    } else if (ans === "3" || ans === "4") {
      if (!auth.ok) {
        console.log("\n※ ログイン状態が未保存です。先に [1] を実行してください（ゲスト計測なら各コマンドに --allow-guest）。");
        continue;
      }
      if (ans === "3") await node("auth-home-soak.mjs");
      else await node("first-load-crash.mjs");
    } else if (ans === "5") {
      await run("pnpm", ["e2e"]);
    } else if (ans !== "") {
      console.log("1〜5 または q を入力してください。");
    }
  }

  rl.close();
  console.log("終了します。");
}

main().catch((err) => {
  console.error(`[qa-doctor] 実行エラー: ${err?.stack ?? err}`);
  process.exit(1);
});
