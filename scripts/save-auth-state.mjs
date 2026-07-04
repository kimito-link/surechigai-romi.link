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
 *   - 待機中は証跡（URL変遷 timeline.ndjson / 30秒毎スクリーンショット / console error）を
 *     qa-results/auth-save/<timestamp>/ に常時収集。タイムアウト時は最終スクショ +
 *     DOM (page.html) + 詰まりどころの推定を残す（2026-07-04 の「5分間 未検知のまま
 *     何も分からず失敗」事故の再発防止。docs/qa-doctor-no-confirm-design.md）
 *   - タイムアウトは「アイドルベース」: 期限が来ても直近1分にユーザーの入力・画面遷移が
 *     あれば 2 分ずつ自動延長（絶対上限 15 分）。2要素認証で手間取っても打ち切らない
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
// ログイン待機中の証跡出力先（.gitignore 済みの qa-results/ 配下）。
// スクリーンショットに X のユーザー名等が写り得るためコミット禁止（パスワードはマスク表示）。
const EVIDENCE_ROOT = path.join(ROOT, "qa-results", "auth-save");
// アイドル延長: 期限到達時、直近この時間内に操作があれば延長する
const IDLE_GRACE_MS = 60_000;
const EXTEND_STEP_MS = 120_000;
const ABS_CAP_MS = 15 * 60_000; // 延長込みの絶対上限

const extraHTTPHeaders = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  extraHTTPHeaders["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const fmtSec = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** メインスレッド閉塞や応答しないページで evaluate/screenshot が永久に返らないのを防ぐ */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);
}

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

// ---------- タイムアウト時の詰まりどころ推定 ----------
// 「タイムアウトしました」で終わらせず、最後の画面から原因の仮説を出す。
// あくまでヒューリスティクス（推定）であり、確定診断ではない。
async function diagnoseStuck(page) {
  let url = "";
  try {
    url = page.url();
  } catch {}
  let host = "";
  try {
    host = new URL(url).host;
  } catch {}
  const bodyText = await withTimeout(
    page.evaluate(() => (document.body?.innerText ?? "").slice(0, 3000)),
    3_000,
  ).catch(() => "");

  const hits = [];
  if (host.includes("x.com") || host.includes("twitter.com")) {
    if (/認証コード|確認コード|verification code|authentication code/i.test(bodyText))
      hits.push("X の2要素認証（認証コード入力）で停止していた可能性");
    if (/パスワード|password/i.test(bodyText))
      hits.push("X のパスワード入力画面で停止していた可能性");
    if (/問題が発生|やり直|Something went wrong|try again|制限|suspicious/i.test(bodyText))
      hits.push("X 側にエラー/制限が表示されていた可能性（時間を置いて再実行を推奨）");
    if (hits.length === 0)
      hits.push("X の認可画面に到達したが操作が完了しなかった（放置・見落としの可能性）");
  } else if (host === APP_HOST && url.includes("/sign-in")) {
    hits.push(
      url.includes("auto=x")
        ? "sign-in から X へ進んでいない = 1タップ自動導線が空振りした可能性（pnpm qa:doctor --only=one-tap で導線を検査）"
        : "sign-in 画面のまま = 「X でログイン」が押されていない可能性",
    );
  } else if (host.includes("clerk")) {
    hits.push("Clerk のコールバック処理で停止（ネットワーク/Clerk 側障害の可能性。再実行を推奨）");
  } else if (!url || url === "about:blank") {
    hits.push("ページ自体が開けていない（ネットワーク断・DNS 失敗の可能性）");
  } else {
    hits.push(`想定外のページ (${host}) に居た。スクリーンショットと page.html を確認`);
  }
  return { url, host, hits, bodyTextSample: bodyText.slice(0, 400) };
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
    // 検証成功時は最新 cookie で保存し直す（鮮度リフレッシュ）。
    // Clerk はページロード時にセッション cookie をローテーションするため、
    // verify 成功のたびに再保存すれば mtime も cookie も新しくなり、
    // qa-doctor の stale 判定（mtime 7日）と実際の有効性が一致し続ける。
    const refresh = () =>
      context
        .storageState({ path: AUTH_STATE_PATH })
        .then(() => log("[verify] 認証状態を最新の cookie で再保存しました（鮮度更新）"))
        .catch(() => {});
    if (user) {
      log(`[verify] OK: ログイン済みユーザーとして復元できました（@${user.username ?? user.id}）`);
      await refresh();
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
      await refresh();
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

  // ---- 証跡収集の準備（first-load-crash.mjs と同じ ndjson 即時フラッシュ方式）----
  // タイムアウトしても「何が起きていたか」を後から追えるように、待機中の
  // URL 変遷・console error・スクリーンショットを常時ディスクへ残す。
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const EVIDENCE_DIR = path.join(EVIDENCE_ROOT, stamp);
  const SHOT_DIR = path.join(EVIDENCE_DIR, "shots");
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const evidenceT0 = Date.now();
  const evidence = (type, data = {}) => {
    try {
      fs.appendFileSync(
        path.join(EVIDENCE_DIR, "timeline.ndjson"),
        JSON.stringify({ atSec: Math.round((Date.now() - evidenceT0) / 1000), type, ...data }) + "\n",
      );
    } catch {}
  };
  console.log(`証跡ログ   : ${EVIDENCE_DIR}`);
  console.log("（タイムアウトしても原因究明できるよう、URL変遷とスクリーンショットを自動収集します）\n");

  const browser = await chromium.launch({
    headless: HEADLESS_SELF_TEST,
    args: ["--window-size=1200,900", "--window-position=80,40"],
  });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 800 },
    extraHTTPHeaders,
  });

  // ユーザーの操作（キー入力・クリック）の最終時刻を全ページで記録する。
  // タイムアウト時の「放置されていたのか、操作中だったのか」の判別と、
  // アイドルベースのタイムアウト延長に使う（x.com 上でも init script は注入される）。
  await context
    .addInitScript(`(() => {
      const a = { lastInputAt: 0 };
      Object.defineProperty(window, "__romiActivity", { value: a, configurable: true });
      const mark = () => { a.lastInputAt = Date.now(); };
      window.addEventListener("keydown", mark, true);
      window.addEventListener("pointerdown", mark, true);
    })();`)
    .catch(() => {});

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

  // 証跡リスナー（判定には使わない・読み取り専用。判定は cookie ベースのまま）
  context.on("page", (p) => evidence("popup-opened", { url: p.url() }));
  page.on("console", (msg) => {
    if (msg.type() === "error") evidence("console-error", { text: msg.text().slice(0, 300) });
  });
  page.on("pageerror", (err) => evidence("pageerror", { message: String(err).slice(0, 300) }));
  page.on("crash", () => evidence("page-crash"));

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
  let deadline = startedAt + TIMEOUT_MIN * 60_000;
  let lastDesc = "";
  let descSince = Date.now();
  let stuckHintShown = false;
  let lastUrl = "";
  let lastUrlChangeAt = Date.now();
  let lastShotAt = 0;
  let detected = false;
  let timedOut = false;

  const safeUrl = () => {
    try {
      return page.url();
    } catch {
      return "";
    }
  };
  const readLastInputAt = () =>
    withTimeout(
      page.evaluate(() => /** @type {any} */ (window).__romiActivity?.lastInputAt ?? 0),
      2_000,
    ).catch(() => 0);
  const writeSummary = (result, extra = {}) => {
    try {
      fs.writeFileSync(
        path.join(EVIDENCE_DIR, "summary.json"),
        JSON.stringify(
          {
            result,
            baseUrl: BASE_URL,
            elapsedSec: Math.round((Date.now() - startedAt) / 1000),
            lastUrl,
            ...extra,
          },
          null,
          2,
        ),
      );
    } catch {}
  };

  while (true) {
    if (browserClosed) {
      writeSummary("aborted-browser-closed");
      console.error(
        "\n[NG] ログイン完了前にブラウザが閉じられました。何も保存していません。\n" +
          `     ここまでの証跡: ${EVIDENCE_DIR}\n` +
          "     もう一度 pnpm e2e:auth-save を実行し、ログイン完了までブラウザを開いたままにしてください。",
      );
      return 1;
    }

    const clerk = await readClerkCookies(context);
    if (clerk.loggedIn) {
      detected = true;
      const t = Math.round((Date.now() - startedAt) / 1000);
      console.log(`\n[検知] +${fmtSec(t)} ログイン完了を検知しました（__client_uat=${clerk.uatValue}）`);
      evidence("login-detected", { uat: clerk.uatValue });
      break;
    }

    const nowMs = Date.now();

    // ---- アイドルベースのタイムアウト（期限が来ても操作中なら自動延長） ----
    if (nowMs >= deadline) {
      const lastInputAt = await readLastInputAt();
      const recentActivity =
        Math.max(lastInputAt, lastUrlChangeAt) > nowMs - IDLE_GRACE_MS;
      if (recentActivity && nowMs - startedAt + EXTEND_STEP_MS <= ABS_CAP_MS) {
        deadline = nowMs + EXTEND_STEP_MS;
        console.log(
          `[延長] 直近1分以内に操作/画面遷移を検知したため、締切を${EXTEND_STEP_MS / 60_000}分延長します` +
            `（開始からの上限 ${ABS_CAP_MS / 60_000} 分）`,
        );
        evidence("deadline-extended", { totalElapsedSec: Math.round((nowMs - startedAt) / 1000) });
      } else {
        timedOut = true;
        break;
      }
    }

    const elapsed = Math.round((nowMs - startedAt) / 1000);
    const remain = Math.round((deadline - nowMs) / 1000);
    const url = safeUrl();
    if (url && url !== lastUrl) {
      lastUrl = url;
      lastUrlChangeAt = nowMs;
      evidence("navigated", { url: url.slice(0, 300) });
    }
    const desc = describeLocation(url);
    console.log(`[HB] +${fmtSec(elapsed)} (残り ${fmtSec(remain)}) | 現在: ${desc} | ログイン: 未検知`);
    evidence("heartbeat", { desc, uat: clerk.uatValue, cookieCount: clerk.cookieCount });

    // ---- 停滞ヒント: 同じ画面に90秒以上とどまっていたら一度だけ案内 ----
    if (desc !== lastDesc) {
      lastDesc = desc;
      descSince = nowMs;
      stuckHintShown = false;
    } else if (!stuckHintShown && nowMs - descSince >= 90_000) {
      stuckHintShown = true;
      console.log(
        "[ヒント] 同じ画面に90秒以上とどまっています。\n" +
          "         - 2要素認証や CAPTCHA に時間がかかっている場合: そのまま続けてください（操作を検知すると締切を自動延長します）\n" +
          "         - エラーが出て先に進めない場合: ブラウザを閉じてください（すぐ中断し、証跡を残します）",
      );
      evidence("stuck-hint-shown", { desc });
    }

    // ---- 30秒毎のスクリーンショット（x.com の画面も撮れる。証跡のみに使用） ----
    if (nowMs - lastShotAt >= 30_000) {
      lastShotAt = nowMs;
      await withTimeout(
        page.screenshot({ path: path.join(SHOT_DIR, `t${elapsed}s.png`) }),
        3_000,
      ).catch(() => {});
    }

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
    // ---- タイムアウト証跡の収集と詰まりどころ推定 ----
    await withTimeout(page.screenshot({ path: path.join(EVIDENCE_DIR, "final.png") }), 5_000).catch(
      () => {},
    );
    const html = await withTimeout(page.content(), 5_000).catch(() => null);
    if (html) {
      try {
        fs.writeFileSync(path.join(EVIDENCE_DIR, "page.html"), html);
      } catch {}
    }
    const diag = await diagnoseStuck(page);
    const lastInputAt = await readLastInputAt();
    const idleSec = lastInputAt ? Math.round((Date.now() - lastInputAt) / 1000) : null;
    writeSummary("timeout", { diagnosis: diag, lastInputIdleSec: idleSec });

    console.error(
      `\n[NG] ${timedOut ? "制限時間内に" : ""}ログイン完了を検知できませんでした。何も保存していません。`,
    );
    console.error(`     最後にいた画面: ${describeLocation(diag.url)}`);
    for (const h of diag.hits) console.error(`     推定される詰まりどころ: ${h}`);
    if (idleSec != null && idleSec > 120) {
      console.error(`     （最後のキー入力/クリックから約${Math.round(idleSec / 60)}分経過 = 放置の可能性が高い）`);
    } else if (lastInputAt === 0) {
      console.error("     （ブラウザ内での操作を一度も検知していません = 開いたまま放置された可能性）");
    }
    console.error(
      `     証跡（スクリーンショット・URL変遷・DOM）: ${EVIDENCE_DIR}\n` +
        "     再実行: pnpm e2e:auth-save（操作中は締切が自動延長されるので、時間指定は通常不要です）",
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
    writeSummary("saved-but-verify-failed");
    console.error("\n[NG] 保存はされましたが、保存済み状態での再ログイン確認に失敗しました。");
    return 1;
  }

  writeSummary("saved-and-verified");
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
