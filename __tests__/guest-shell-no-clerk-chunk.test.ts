/**
 * ゲストWebシェルでは Clerk chunk を読まないことを守る。
 *
 * ★2026-08-17 に必要になった理由:
 * `useAuthProviderComponents()` を無条件に呼んでいたため、**未ログインのゲストでも
 * clerk-root-provider chunk 762KB を取得**していた（実測: ゲストのトップページで
 * 読まれるJS 2126KB のうち最大がこれ）。ゲストシェルは ClerkRootProvider を
 * 描画しないので chunk も不要。TBT 1,780ms の主因（Script Evaluation 2,127ms）に効く。
 *
 * ★同時に守るべき安全性:
 * ログインできなくなっては本末転倒なので、「Clerk を読む条件」も併せて固定する。
 *   - /sign-in はゲストシェルにしない（Clerk が要る）
 *   - ログイン済みヒントがあればゲストシェルにしない（Clerk が要る）
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const LAYOUT = readFileSync(resolve(ROOT, "app/_layout.tsx"), "utf8");
const ROUTES = readFileSync(resolve(ROOT, "lib/clerk-public-routes.ts"), "utf8");
const HTML_ROOT = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");

describe("ゲストWebシェルと Clerk chunk", () => {
  it("認証プロバイダの読み込みが条件付きになっている", () => {
    // 引数なしで呼ぶと無条件ロードに戻る
    expect(LAYOUT).not.toMatch(/useAuthProviderComponents\(\s*\)/);
    expect(LAYOUT).toMatch(/useAuthProviderComponents\(\s*!useGuestWebShell\s*\)/);
  });

  it("フック側が enabled を見て早期 return している", () => {
    const start = LAYOUT.indexOf("function useAuthProviderComponents");
    const body = LAYOUT.slice(start, start + 700);
    expect(body).toMatch(/if\s*\(!enabled\)\s*return/);
    // 依存配列に enabled が入っていないと、ログイン遷移時に読み直されない
    expect(body).toMatch(/\[\s*enabled\s*\]/);
  });

  it("/sign-in はゲストシェルにしない（Clerk が必要）", () => {
    expect(ROUTES).toMatch(/path\.startsWith\("\/sign-in"\)\s*\)\s*return false/);
  });

  it("ログイン済みヒントがあればゲストシェルにしない（Clerk が必要）", () => {
    const start = ROUTES.indexOf("export function shouldUseGuestWebShell");
    const body = ROUTES.slice(start, start + 500);
    expect(body).toMatch(/hasClerkSessionHint\(\)\s*\)\s*return false/);
  });

  /**
   * ★2026-09-29追加: hasClerkSessionHint() と +html.tsx のインラインスクリプトは
   * 「.kimito.link 共有 Clerk cookie __client_uat を見ているか」という同じ条件を
   * 別々の場所（TypeScript関数／静的レンダリング用の独立JS文字列）に持つ。
   * 片方だけ直してもう片方を直し忘れると、他のkimito-link系サービスでログイン済みの
   * ユーザーが surechigai だけゲスト扱いされる不整合が再発する（設計書
   * DESIGN-kimito-family-prepaint-auth-mode-2026-09-29.md が実際に指摘した実損）。
   * 両者が同じ cookie 名を参照することだけを機械的に固定する（ロジックの完全一致までは見ない）。
   */
  it("clerk-public-routes.ts と +html.tsx が同じ __client_uat cookie を参照する", () => {
    expect(ROUTES).toMatch(/__client_uat/);
    expect(HTML_ROOT).toMatch(/__client_uat/);
  });

  it("hasClerkSessionHint() が __client_uat を localStorage チェックより先に見る", () => {
    const start = ROUTES.indexOf("export function hasClerkSessionHint");
    const body = ROUTES.slice(start, start + 400);
    const uatIdx = body.indexOf("hasLiveClerkUatCookie");
    const localStorageIdx = body.indexOf("localStorage.getItem");
    expect(uatIdx).toBeGreaterThan(-1);
    expect(localStorageIdx).toBeGreaterThan(-1);
    expect(uatIdx).toBeLessThan(localStorageIdx);
  });

  /**
   * ★2026-09-29実損（本番で実際に踏んだ）: Clerk は `__client_uat_<suffix>` と
   * `__client_uat`（接尾辞無し）を併置することがある。前者が先に出現し値が'0'だと、
   * String#match（最初の1件のみ）ベースの実装では後者の実際の値を見ずに
   * ゲスト誤判定していた（本番URLで実測して発覚）。matchAll/exec-loopで
   * 全件を見て、いずれか1つでも'0'以外ならログイン済みと判定することを固定する。
   * clerk-public-routes.ts と +html.tsx 両方が対象。
   */
  it("hasLiveClerkUatCookie 相当のロジックが matchAll/exec-loop で全件を見る（1件目の '0' で確定しない）", () => {
    const start = ROUTES.indexOf("function hasLiveClerkUatCookie");
    const body = ROUTES.slice(start, start + 500);
    // .match( 単体（グローバルフラグ無し・1件のみ返す）だけで完結していないこと
    const usesMatchAll = /matchAll/.test(body);
    const usesGlobalExecLoop = /\/g\)/.test(body) && /exec\(/.test(body);
    expect(usesMatchAll || usesGlobalExecLoop).toBe(true);
  });

  it("+html.tsx の __client_uat 判定も1件のみの match() で完結していない（グローバル走査）", () => {
    const scriptStart = HTML_ROOT.indexOf("__client_uat");
    const scriptEnd = HTML_ROOT.indexOf("data-auth-boot", scriptStart);
    const scriptBody = HTML_ROOT.slice(scriptStart, scriptEnd);
    const usesGlobalExecLoop = /\/g/.test(scriptBody) && /exec\(/.test(scriptBody);
    const usesMatchAll = /matchAll/.test(scriptBody);
    expect(usesGlobalExecLoop || usesMatchAll).toBe(true);
  });

  it("実際の判定ロジック: 接尾辞付きcookieが'0'でも、接尾辞無しが'0'以外ならログイン済みと判定する", () => {
    // clerk-public-routes.ts の hasLiveClerkUatCookie と同じロジックをここで再現し、
    // 本番で実際に発生したcookieの並び（接尾辞付きが先・値0、接尾辞無しが後・値あり）で検証する。
    function hasLiveClerkUatCookie(cookieString: string): boolean {
      const matches = cookieString.matchAll(/(?:^|;\s*)__client_uat[^=]*=([^;]*)/g);
      for (const m of matches) {
        if (m[1] && m[1] !== "0") return true;
      }
      return false;
    }
    // 本番で実測した並び: __client_uat_ZGVu8CMk=0; __client_uat=1234567890
    expect(hasLiveClerkUatCookie("__client_uat_ZGVu8CMk=0; __client_uat=1234567890")).toBe(true);
    // 両方0ならゲスト
    expect(hasLiveClerkUatCookie("__client_uat_ZGVu8CMk=0; __client_uat=0")).toBe(false);
    // cookie自体が無ければゲスト
    expect(hasLiveClerkUatCookie("")).toBe(false);
  });
});
