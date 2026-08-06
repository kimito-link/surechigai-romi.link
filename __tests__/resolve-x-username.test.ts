/**
 * X ハンドル解決と「X をつなげる」救済導線の判定を固定する。
 *
 * 背景（2026-08-05・Sign in with Apple を主導線にしたことで現実に踏む経路）:
 * 公開ページ /u/<slug> と OGP のハンドル表示は X のアカウント情報に依存する。
 * Apple だけで入ったユーザーは X 連携が無いため公開ページを作れないまま詰む。
 * このとき「X 連携があるか」を provider の素朴な数え方で判定すると、
 * 壊れた連携を「あり」と誤判定して、詰んでいる本人から救済導線が消える。
 *
 * 同じ症状は kimitolink-linktree で実機再現済み（1つ目のアカウントでは公開ページが作れ、
 * 2つ目の別 X アカウントでは案内どおり何度ログインし直しても直らない）。
 */
import { describe, it, expect } from "vitest";
import {
  isXProvider,
  needsXLinkRescue,
  resolveXUsername,
} from "@/lib/resolve-x-username";

describe("isXProvider", () => {
  it("Clerk の表記ゆれを吸収する", () => {
    for (const p of ["x", "twitter", "oauth_x", "oauth_twitter", "OAuth_X"]) {
      expect(isXProvider(p), p).toBe(true);
    }
  });

  it("別プロバイダを誤検知しない", () => {
    for (const p of ["oauth_apple", "apple", "google", "oauth_google", "oauth_xero", null, ""]) {
      expect(isXProvider(p), String(p)).toBe(false);
    }
  });
});

describe("resolveXUsername", () => {
  it("X 連携のハンドルを採用する", () => {
    expect(
      resolveXUsername({
        externalAccounts: [{ provider: "oauth_x", username: "streamerfunch" }],
      }),
    ).toBe("streamerfunch");
  });

  it("Appleのみのユーザーでは null（Apple を X 扱いしない）", () => {
    expect(
      resolveXUsername({
        externalAccounts: [{ provider: "oauth_apple", username: "relay" }],
      }),
    ).toBeNull();
  });

  it("アカウント切り替え後は externalAccounts 側に追従する", () => {
    // clerkUser.username は初回サインアップ時のまま残ることがある
    expect(
      resolveXUsername({
        username: "old_handle",
        externalAccounts: [{ provider: "oauth_x", username: "new_handle" }],
      }),
    ).toBe("new_handle");
  });

  it("壊れた（未検証）X 連携は採用しない", () => {
    expect(
      resolveXUsername({
        externalAccounts: [
          { provider: "oauth_x", username: "broken", verification: { status: "unverified" } },
        ],
      }),
    ).toBeNull();
  });

  it("@ 付き・URL 形式でも正規化する", () => {
    expect(resolveXUsername({ username: "@streamerfunch" })).toBe("streamerfunch");
    expect(resolveXUsername({ username: "https://x.com/streamerfunch" })).toBe("streamerfunch");
  });

  it("表示名のような不正値は採用しない", () => {
    expect(resolveXUsername({ username: "君斗りんく@クリエイター応援" })).toBeNull();
    expect(resolveXUsername({ username: "too_long_handle_over_15" })).toBeNull();
  });
});

describe("needsXLinkRescue（救済導線の出し分け）", () => {
  it("Appleのみのユーザーには救済導線を出す", () => {
    expect(
      needsXLinkRescue({ externalAccounts: [{ provider: "oauth_apple", username: "relay" }] }),
    ).toBe(true);
  });

  it("X 連携済みなら出さない", () => {
    expect(
      needsXLinkRescue({ externalAccounts: [{ provider: "oauth_x", username: "streamerfunch" }] }),
    ).toBe(false);
  });

  it("壊れたX連携しか無い人にも出す（ここを誤ると詰んだ本人から導線が消える）", () => {
    expect(
      needsXLinkRescue({
        externalAccounts: [
          { provider: "oauth_x", username: "broken", verification: { status: "unverified" } },
        ],
      }),
    ).toBe(true);
  });
});
