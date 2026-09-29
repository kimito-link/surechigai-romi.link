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
});
