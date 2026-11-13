/**
 * iOS/Android: ログインが終わったら /sign-in に留まらず元の画面へ戻る（2026-11-13 実機 554 で発覚）。
 * ゲストのヘッダーのログインボタンは、ネイティブでは Link（=<Text>）ではなく Pressable で描き、
 * 文字を中央にそろえる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "..", rel), "utf8");

describe("ネイティブのログイン後の遷移", () => {
  const src = read("app/sign-in.tsx");
  it("別のユーザーでログインし終えたら redirect_url（無ければホーム）へ replace する", () => {
    expect(src).toContain("navigateReplace.withUrl(normalizePostAuthRedirect(");
    expect(src).toMatch(/userKey && userKey !== initialUserKey\.current/);
    expect(src).toMatch(/Platform\.OS === "web" \|\| userKey === undefined/);
  });
});

describe("ゲストのヘッダーのログインボタン（ネイティブ）", () => {
  const src = read("components/post/guest-home-shell-header.tsx");
  it("ネイティブは Pressable で描く（Link は <Text> になり文字が上に寄る）", () => {
    expect(src).toMatch(/Platform\.OS === "web" \? \(\s*<Link/);
    expect(src).toMatch(/<Pressable\s+onPress=\{\(\) => openLoginGuide/);
  });
});
