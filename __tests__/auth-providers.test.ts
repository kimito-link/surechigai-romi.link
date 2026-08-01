/**
 * ログインプロバイダの出し分けを固定するテスト。
 *
 * 背景: Clerk 側で oauth_apple は有効で Web の <SignIn /> は
 * Apple/Google/X の3ボタンを実際に描画しているのに、
 * フラグ未設定を「無効」と扱っていたため文言だけ「X だけで」と案内していた。
 * 既定値を取り違えると「実態と案内が食い違う」状態に戻るため、既定を固定する。
 */
import { afterEach, describe, expect, it } from "vitest";
import { authProvidersHeadline, isAppleLoginEnabled } from "@/lib/auth-providers";

const KEY = "EXPO_PUBLIC_SIWA_ENABLED";
const original = process.env[KEY];

afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
});

describe("isAppleLoginEnabled", () => {
  it("未設定なら有効（Clerk 側が Apple を出しているのが実態）", () => {
    delete process.env[KEY];
    expect(isAppleLoginEnabled()).toBe(true);
  });

  it('"false" のときだけ無効にできる', () => {
    process.env[KEY] = "false";
    expect(isAppleLoginEnabled()).toBe(false);
  });

  it('"true" は当然有効', () => {
    process.env[KEY] = "true";
    expect(isAppleLoginEnabled()).toBe(true);
  });
});

describe("authProvidersHeadline", () => {
  it("Apple 有効時は X 単独と言い切らない", () => {
    delete process.env[KEY];
    for (const variant of ["sign-in", "sign-up"] as const) {
      const headline = authProvidersHeadline(variant);
      expect(headline).toContain("Apple");
      expect(headline).not.toContain("X だけで");
    }
  });

  it("Apple 無効時は X だけと案内する", () => {
    process.env[KEY] = "false";
    expect(authProvidersHeadline("sign-in")).toBe("X だけで安全ログイン・パスワード不要");
    expect(authProvidersHeadline("sign-up")).toBe("X だけで無料ではじめる・パスワード不要");
  });
});
