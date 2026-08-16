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
});
