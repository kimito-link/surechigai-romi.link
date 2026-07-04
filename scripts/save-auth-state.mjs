/**
 * save-auth-state.mjs — X ログインを 1 回だけ手動で行い、認証状態を保存する対話ツール
 *
 * 旧 tests/e2e/save-auth-state.spec.ts の置き換え。旧実装の事故:
 *   1. ログイン判定が「ゲスト文言の非表示」依存 → ロード中でも消えて見える = 偽陽性で即 pass
 *   2. 判定修正後も localStorage の「clerk を含むキー」判定は未ログインでも
 *      telemetry キー等で真になり得る
 *   3. /map に飛ばすだけでログイン導線が見えず、ユーザーが何をすべきか分からない
 *   4. ログイン前に storageState を保存 → 空の .auth/auth-state.json が生成され、
 *      それが存在するせいで下流（trail-auth / soak / first-load）がゲストのまま走る
 *
 * 本実装の原則:
 *   - 保存は「ログイン検知に成功した後」だけ。空ファイルは構造的に作れない
 *   - ログイン判定は Clerk のセッション cookie（__client_uat ≠ "0"）。
 *     ゲストは常に __client_uat=0 なので偽陽性が出ない
 *   - /sign-in に直行し、画面内バナー + ターミナル両方で「今どこにいて何をすべきか」を
 *     5 秒毎にリアルタイム表示
 *   - 保存後、別のヘッドレスブラウザで保存済み状態を読み込み「本当にログイン済みで
 *     開けるか」まで検証してから成功を宣言
 *
 * 使い方:
 *   pnpm e2e:auth-save                              # 既定: 本番URL
 *   node scripts/save-auth-state.mjs --base-url=http://localhost:8081
 *   node scripts/save-auth-state.mjs --verify       # 保存済み状態の動作確認のみ（ブラウザ非表示）
 */

import { chromium } from "playwright";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  return fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const BASE_URL = (
  arg("base-url", null) ??
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.E2E_BASE_URL ??
  "https://surechigai.kimito.link"
).replace(/\/$/, "");
const APP_HOST = new URL(BASE_URL).host;
const TIMEOUT_MIN = Number(arg("timeout-min", "5"));
const VERIFY_ONLY = hasFlag("verify");
// 自己テスト用（CI やハーネスがコードパスを無人検証するときだけ使う。通常は不要）
const HEADLESS_SELF_TEST = process.env.ROMI_AUTH_SAVE_HEADLESS === "1";

const AUTH_STATE_PATH = path.join(ROOT, ".auth", "auth-state.json");

const extraHTTPHeaders = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  extraHTTPHeaders["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const fmtSec = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

function phase(n, title) {
  console.log(`\n━━━ [${n}/4] ${title} ${"━".repeat(Math.max(4, 40 - title.length * 2))}`);
}

// ---------- ログイン判定（cookie ベース・偽陽性なし） ----------
// Clerk は本番/開発とも、サインイン完了後にアプリドメインへ
//   __client_uat=<unix秒>（未ログインは "0"）と __session*=<JWT> を置く。
// 「__client_uat が 0 以外」をログインの正とする。ゲスト・ロード中では絶対に立たない。
async function readClerkCookies(context) {
  const cookies = await context.cookies().catch(() => []);
  const uat = cookies.find((c) => c.name.startsWith("__client_uat"));
  const session = cookies.find((c) => c.name.startsWith("__session"));
  return {
    cookieCount: cookies.length,
    uatValue: uat?.value ?? null,
    loggedIn: Boolean(uat && uat.value && uat.value !== "0"),
    hasSessionJwt: Boolean(session),
  };
}

function describeLocation(url) {
  if (!url) return "不明";
  try {
    const u = new URL(url);
    const host = u.host;
    if (host.includes("x.com") || host.includes("twitter.com"))
      return "X の認可画面（ログイン情報を入力 →「アプリにアクセスを許可」まで進んでください）";
    if (host.includes("clerk")) return "Clerk の認証処理中（そのままお待ちください）";
    if (host === APP_HOST) {
      if (u.pathname.startsWith("/sign-in")) {
        // auto=x 付きなら AutoAdvanceToX が X ボタンを自動 click するはず。
        // 8〜9秒たっても X の画面に進まない場合は自動導線が空振りしている（要調査）。
        return u.searchParams.get("auto") === "x"
          ? "アプリのログイン画面（1タップ自動導線が動作中… 進まなければ手動で「X でログイン」を押してください）"
          : "アプリのログイン画面（「X でログイン」ボタンを押してください）";
      }
      if (u.pathname.includes("sso-callback")) return "認証コールバック処理中（自動で進みます）";
      return `アプリ画面 (${u.pathname})`;
    }
    return `外部ページ (${host})`;
  } catch {
    return url.slice(0, 80);
  }
}

// ---------- 保存済み状態の実地検証 ----------
// 保存した storageState を新しいヘッドレスブラウザに読み込み、/map で
// Clerk がユーザーを復元できるかを確認する（=「保存できた」ではなく「使える」の検証）。
async function verifySavedState({ log = console.log } = {}) {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    console.error(`[verify] 認証状態ファイルがありません: ${AUTH_STATE_PATH}`);
    console.error("[verify] まず pnpm e2e:auth-save でログインを保存してください。");
    return false;
  }
  let saved;
  try {
    saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8"));
  } catch {
    console.error(`[verify] JSON として読めません: ${AUTH_STATE_PATH}`);
    return false;
  }
  const cookieCount = Array.isArray(saved.cookies) ? saved.cookies.length : 0;
  if (cookieCount === 0) {
    console.error("[verify] 保存内容が空です（cookies 0件）。ログインが保存されていません。");
    return false;
  }
  const uat = saved.cookies.find((c) => c.name?.startsWith("__client_uat"));
  if (!uat || uat.value === "0") {
    console.error("[verify] Clerk のログイン cookie (__client_uat) がありません。ゲスト状態の保存です。");
    return false;
  }

  log(`[verify] 保存済み状態を読み込み、ヘッドレスブラウザで ${BASE_URL}/map を開いて確認します…`);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
      extraHTTPHeaders,
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/map`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // Clerk がセッションからユーザーを復元するまで最大 45 秒ポーリング
    const deadline = Date.now() + 45_000;
    let user = null;
    while (Date.now() < deadline && !user) {
      user = await page
        .evaluate(() => {
          const u = /** @type {any} */ (window).Clerk?.user;
          return u ? { id: u.id, username: u.username ?? u.firstName ?? null } : null;
        })
        .catch(() => null);
      if (!user) await page.waitForTimeout(2_000);
    }
    if (user) {
      log(`[verify] OK: ログイン済みユーザーとして復元できました（@${user.username ?? user.id}）`);
      return true;
    }
    // フォールバック: ログイン後 UI の文言
    const uiHint = await page
      .getByText(/最近の移動履歴|まだ正確な足あとがありません/)
      .first()
      .isVisible()
      .catch(() => false);
    if (uiHint) {
      log("[verify] OK: ログイン後 UI（移動履歴セクション）を確認できました");
      return true;
    }
    console.error(
      "[verify] NG: 保存済み状態で開いてもログイン状態を確認できませんでした。\n" +
        "         セッション失効の可能性があります。pnpm e2e:auth-save で再保存してください。",
    );
    await page
      .screenshot({ path: path.join(ROOT, ".auth", "verify-failed.png") })
      .catch(() => {});
    console.error(`         スクリーンショット: ${path.join(ROOT, ".auth", "verify-failed.png")}`);
    return false;
  } finally {
    await browser.close().catch(() => {});
  }
}

// ---------- メイン: 手動ログイン → 検知 → 保存 → 検証 ----------
async function saveFlow() {
  phase(1, "準備");
  console.log(`対象サイト : ${BASE_URL}`);
  console.log(`保存先     : ${AUTH_STATE_PATH}`);
  console.log(`制限時間   : ${TIMEOUT_MIN} 分（ログイン完了は自動検知します）`);
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const st = fs.statSync(AUTH_STATE_PATH);
    console.log(
      `既存ファイル: あり（${st.size} bytes / ${st.mtime.toLocaleString("ja-JP")}）→ 成功時のみ上書きします`,
    );
  }

  phase(2, "ブラウザ起動 → X ログイン（あなたの操作）");
  console.log("これからブラウザが開きます。手順:");
  console.log("  1. ログイン画面の「X でログイン」ボタンを押す");
  console.log("  2. X のユーザー名/パスワードを入力（2要素認証があればそれも）");
  console.log("  3. 「アプリにアクセスを許可」を押してアプリに戻るまで待つ");
  console.log("完了はこのターミナルが自動で検知します。ブラウザは自分で閉じないでください。\n");

  const browser = await chromium.launch({
    headless: HEADLESS_SELF_TEST,
    args: ["--window-size=1200,900", "--window-position=80,40"],
  });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 800 },
    extraHTTPHeaders,
  });

  // アプリのページ上部に常時バナーを出す（x.com 等の外部ドメインには出さない）。
  // 表示に失敗しても保存フロー自体には影響しない。
  await context
    .addInitScript(
      `(() => {
        if (location.host !== ${JSON.stringify(APP_HOST)}) return;
        const mount = () => {
          try {
            if (document.getElementById("romi-auth-save-banner")) return;
            const el = document.createElement("div");
            el.id = "romi-auth-save-banner";
            el.textContent = "認証保存モード: X ログインを完了してください（完了は自動検知されます。ブラウザは閉じないで）";
            el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;" +
              "background:#b45309;color:#fff;font:13px/1.4 sans-serif;padding:8px 12px;" +
              "text-align:center;pointer-events:none;";
            document.body.appendChild(el);
          } catch {}
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", mount, { once: true });
        else mount();
      })();`,
    )
    .catch(() => {});

  const page = await context.newPage();

  let browserClosed = false;
  browser.on("disconnected", () => {
    browserClosed = true;
  });

  // 実際のユーザー導線（ゲスト画面の「Xで1タップではじめる」CTA）と同じ
  // auto=x 付き URL でアクセスする。これを付けないと AutoAdvanceToX
  // （lib/clerk-route.ts の SIGN_IN_AUTO_X_HREF）が発動せず、1タップ導線を
  // 検証したいのに素の2タップ画面を開いてしまう（2026-07-04 に実際に発生した事故）。
  const signInUrl = `${BASE_URL}/sign-in?redirect_url=${encodeURIComponent("/map")}&auto=x`;
  console.log(`ログイン画面を開いています: ${signInUrl}`);
  console.log("（実際のユーザー導線と同じ auto=x 付き = 1タップ自動導線が動く想定です）");
  await page.goto(signInUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.bringToFront().catch(() => {});
  console.log("ブラウザを開きました（別ウィンドウの裏に隠れている場合は前面に出してください）。\n");

  phase(3, "ログイン完了の自動検知");
  const startedAt = Date.now();
  const deadline = startedAt + TIMEOUT_MIN * 60_000;
  let lastDesc = "";
  let detected = false;

  while (Date.now() < deadline) {
    if (browserClosed) {
      console.error(
        "\n[NG] ログイン完了前にブラウザが閉じられました。何も保存していません。\n" +
          "     もう一度 pnpm e2e:auth-save を実行し、ログイン完了までブラウザを開いたままにしてください。",
      );
      return 1;
    }

    const clerk = await readClerkCookies(context);
    if (clerk.loggedIn) {
      detected = true;
      const t = Math.round((Date.now() - startedAt) / 1000);
      console.log(`\n[検知] +${fmtSec(t)} ログイン完了を検知しました（__client_uat=${clerk.uatValue}）`);
      break;
    }

    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const remain = Math.round((deadline - Date.now()) / 1000);
    const url = page.url();
    const desc = describeLocation(url);
    console.log(`[HB] +${fmtSec(elapsed)} (残り ${fmtSec(remain)}) | 現在: ${desc} | ログイン: 未検知`);
    if (desc !== lastDesc) lastDesc = desc;

    // アプリ画面にいるならバナーの文言も更新（失敗は無視）
    await page
      .evaluate((msg) => {
        const el = document.getElementById("romi-auth-save-banner");
        if (el) el.textContent = msg;
      }, `認証保存モード: ログイン完了を自動検知中… 経過 ${fmtSec(elapsed)}（ブラウザは閉じないで）`)
      .catch(() => {});

    await new Promise((r) => setTimeout(r, 5_000));
  }

  if (!detected) {
    console.error(
      `\n[NG] ${TIMEOUT_MIN} 分以内にログイン完了を検知できませんでした。何も保存していません。\n` +
        "     時間が足りない場合: node scripts/save-auth-state.mjs --timeout-min=10\n" +
        "     ログイン自体が失敗する場合: ブラウザに出ているエラーを教えてください。",
    );
    await browser.close().catch(() => {});
    return 1;
  }

  phase(4, "保存と実地検証");
  // コールバック直後は localStorage への書き込みが続いているので少し待つ
  console.log("セッションの安定を待っています（5秒）…");
  await page.waitForTimeout(5_000);

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close().catch(() => {});

  const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8"));
  const cookieCount = Array.isArray(saved.cookies) ? saved.cookies.length : 0;
  const originCount = Array.isArray(saved.origins) ? saved.origins.length : 0;
  console.log(`保存しました: cookies ${cookieCount} 件 / origins ${originCount} 件`);
  if (cookieCount === 0) {
    // 検知後にここへ来ることは論理上ないが、万一のガード
    console.error("[NG] 保存内容が空でした。保存ファイルを削除します。");
    fs.rmSync(AUTH_STATE_PATH, { force: true });
    return 1;
  }

  const ok = await verifySavedState();
  if (!ok) {
    console.error("\n[NG] 保存はされましたが、保存済み状態での再ログイン確認に失敗しました。");
    return 1;
  }

  console.log("\n===== 成功 =====");
  console.log(`認証状態を保存し、別ブラウザでログイン済みとして開けることまで確認しました。`);
  console.log(`ファイル: ${AUTH_STATE_PATH}`);
  console.log("次にできること:");
  console.log("  pnpm qa:doctor        # QA メニュー（推奨）");
  console.log("  pnpm soak:auth-home   # 認証済みホームの滞在計測（OOM 検出）");
  console.log("  pnpm qa:first-load    # 初回アクセス〜クラッシュの記録");
  console.log("  pnpm e2e              # 認証込み E2E スモーク");
  console.log("================\n");
  return 0;
}

async function main() {
  if (VERIFY_ONLY) {
    console.log("━━━ 保存済み認証状態の動作確認（--verify） ━━━");
    const ok = await verifySavedState();
    return ok ? 0 : 1;
  }
  return saveFlow();
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[auth-save] 実行エラー: ${err?.stack ?? err}`);
    process.exit(1);
  });
