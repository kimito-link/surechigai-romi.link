/**
 * ★Guideline 4.8: ログイン手段は「同じ画面に並んでいる」必要がある。
 *
 * ■ 実害（iOS build 524・2026-08-23 却下）
 *   "The app uses a third-party login service, but does not appear to offer as an
 *    equivalent login option another login service..."
 *   審査端末 iPhone 17 Pro Max。名指しされたのはメニュー画面。
 *
 * ■ ★真因は「未実装」ではなく「並んでいない」
 *   Sign in with Apple は**実装済み**だった
 *   （components/organisms/clerk-sign-in.tsx が X と Apple を縦に並べている）。
 *   ★問題は、その画面へ行く経路が app/sign-in.tsx の1本しか無かったこと。
 *
 *   実測（2026-08-24）:
 *     ClerkSignIn を描く画面      … 1
 *     useLoginGuide を使う画面    … 11  ★すべて X へ直行していた
 *
 *   useLoginGuide は login() を provider 省略で呼ぶため既定の "x" になり、
 *   ★Apple を選ぶ隙が構造的に無かった。
 *
 * ■ ★この形のテストにした理由
 *   ボタン名で探すと文言変更で壊れる。
 *   ★見たいのは「両方が同じ画面に出ているか」なので、
 *   **ログイン導線が X へ直行していないこと**を構造で固定する。
 *   （kimitolink-linktree の LinkAccountsNotice.test.tsx が同じ理由で
 *     ボタン名アサートから文字列アサートへ方針変更している）
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

/**
 * ★コメントを剥がす。
 *
 * 剥がさないと「login() を直に呼ばない」と**説明したコメント自体**が
 * 違反として拾われる（実際にこのテストを書いた直後に踏んだ）。
 * ★このリポで今日3回目の「コメント非剥離」。弱い印は両方向に壊れる。
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
    .join("\n");
}

describe("ログイン画面は X と Apple を両方見せる", () => {
  it("★ClerkSignIn に Apple の導線がある", () => {
    const src = read("components/organisms/clerk-sign-in.tsx");
    expect(src).toContain("Apple");
    // provider を明示して呼んでいること（既定の "x" 任せにしない）
    expect(src).toMatch(/login\([^)]*"apple"\)/);
  });

  it("★ログイン誘導が X へ直行しない（4.8 却下の真因）", () => {
    const src = read("hooks/use-login-guide.ts");

    // ★auto=x を付けると着地後に X が自動クリックされ、Apple を選べない。
    //   ＝ 却下された状態に戻る。
    expect(src).not.toContain("buildSignInAutoXHref");

    // ★login() を直に呼ぶと provider 既定の "x" に直行する。
    expect(src).not.toMatch(/void\s+login\(/);

    // 選べる画面（/sign-in）へ送っていること
    expect(src).toMatch(/buildSignInHref|buildSignInSwitchHref/);
  });

  it("Apple は既定で有効（フラグ未設定を無効と読まない）", () => {
    const src = read("lib/auth-providers.ts");
    // ★=== "true" にすると未設定で無効になり、
    //   「実態は使えるのに案内だけ X だけ」に戻る（2026-07-31 の実測が根拠）。
    expect(src).toContain('!== "false"');
  });
});

describe("★ログイン導線が1箇所に集まっている（11画面を1本で守れる根拠）", () => {
  it("ログインを促す画面は useLoginGuide を通す（各画面で login() を直に呼ばない）", () => {
    // ★なぜこれを固定するか（build 524 の教訓）:
    //   却下の真因は「Apple が未実装」ではなく「★画面ごとに導線がバラバラで、
    //   /sign-in へ行く画面が1つ、X へ直行する画面が11あった」こと。
    //   ★1箇所（useLoginGuide）に集約されている限り、そこを直せば全画面が直る。
    //   逆に各画面が login() を直に呼び始めると、また「片方だけ足し忘れた画面」ができる。
    //
    //   ★このテストは実際に2件見つけた（2026-08-27）:
    //     components/photo-import/photo-import-screen.tsx
    //     app/premium.tsx
    //   どちらも `onPress={() => void login()}` で X へ直行していた。
    const offenders: string[] = [];
    let scanned = 0;

    const walk = (dir: string) => {
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) {
          if (e.name.startsWith(".") || e.name === "node_modules") continue;
          walk(rel);
          continue;
        }
        if (!/\.tsx?$/.test(e.name)) continue;
        // 認証の実体と、集約点そのものは対象外。
        if (rel.includes("clerk-auth-bridge") || rel.includes("use-login-guide")) continue;
        // ClerkSignIn は provider を明示して呼ぶのが正しい姿（両方並べる画面）。
        if (rel.includes("clerk-sign-in")) continue;

        scanned += 1;
        const src = stripComments(read(rel));
        // ★provider 省略の login( ... ) 呼び出し = 既定の "x" に直行する形
        if (/\blogin\(\s*(?:undefined|returnTo|[^,)]*)\s*\)/.test(src) && /useAuth\(\)/.test(src)) {
          offenders.push(rel);
        }
      }
    };
    for (const d of ["components", "app"]) walk(d);

    // ★0件で緑にしない: 走査できていることを件数で示す
    //   （このリポは「0件だった」と「一度も測っていない」を区別する）
    expect(scanned).toBeGreaterThan(50);
    expect(
      offenders,
      `provider 省略で login() を直に呼ぶ画面: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
