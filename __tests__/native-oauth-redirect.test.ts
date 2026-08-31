/**
 * ★iOS build 533 却下（Guideline 2.1(a)・2026-08-29）の再発防止。
 *
 *   審査コメント:
 *     "the login methods provided in the app both do not function as it displays an error"
 *   審査端末: iPhone 17 Pro Max / iPad Air 11-inch (M3)
 *
 * ■ ★真因
 *   ネイティブ OAuth の戻り先に **https URL** を渡していた:
 *     const redirectUrl = `${getApiBaseUrl()}/oauth/twitter-callback`;
 *   ネイティブでは getApiBaseUrl() が本番URLを返すため
 *   `https://surechigai.kimito.link/oauth/twitter-callback` になっていた。
 *
 *   iOS の ASWebAuthenticationSession は callbackURLScheme に
 *   ★**カスタムスキームしか一致させない**（Expo 公式が明記）。
 *   ⟹ ブラウザが開いたまま戻らず、閉じると createdSessionId:"" になり、
 *     isSilentOAuthNoop のガードが Alert を出す ＝「displays an error」。
 *
 * ■ ★X と Apple の「両方」が落ちた理由
 *   両者は redirectUrl を共有している（分岐するのは strategy だけ）。
 *   ★1つの設定ミスで両方同時に壊れる。
 *
 * ■ ★このテストが守る不変条件
 *   ネイティブの戻り先が **http(s) でない**こと。
 *   ★「Clerk のガードを消す」方向では直さない。ガードは
 *   「無反応」を「見えるエラー」に変える役目で、正しく働いている（520/521 の教訓）。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import appConfig from "@/app.config.json";
import {
  formatNativeRedirectUrl,
  getNativeOAuthRedirectUrl,
  isValidNativeRedirectUrl,
  NATIVE_OAUTH_CALLBACK_PATH,
} from "@/lib/auth/native-redirect";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("★ネイティブ OAuth の戻り先（533 却下の再発防止）", () => {
  it("https の戻り先を誤りと判定する", () => {
    // ★却下時に実際に渡っていた値
    expect(isValidNativeRedirectUrl("https://surechigai.kimito.link/oauth/twitter-callback")).toBe(
      false,
    );
    expect(isValidNativeRedirectUrl("http://localhost:8081/oauth/twitter-callback")).toBe(false);
  });

  it("カスタムスキームの戻り先を正しいと判定する", () => {
    expect(isValidNativeRedirectUrl("surechigai://oauth-native-callback")).toBe(true);
  });

  it("空文字は誤りとする（0件で緑にしない）", () => {
    expect(isValidNativeRedirectUrl("")).toBe(false);
  });

  it("★clerk-auth-bridge が https を組み立てていない", () => {
    const src = read("components/providers/clerk-auth-bridge.tsx");

    // ★却下時の形。これが戻ったら赤にする。
    expect(src).not.toMatch(/redirectUrl\s*=\s*`\$\{getApiBaseUrl\(\)\}/);

    // カスタムスキームを作るヘルパーを通していること
    expect(src).toMatch(/buildNativeOAuthRedirectUrl\(\)/);
  });

  it("★戻り先パスが Clerk Dashboard 登録値と揃っている", () => {
    // ★ここを変えたら Clerk Dashboard の Native applications も変える必要がある。
    //   片方だけ変えるとセッションが作られず、また「押しても入れない」に戻る。
    expect(NATIVE_OAUTH_CALLBACK_PATH).toBe("oauth-native-callback");
  });

  it("★戻り先はスラッシュ2本（登録値そのものを固定する）", () => {
    // ★expo-linking の createURL は isTripleSlashed 既定 false、
    //   スタンドアロンでは hostUri が空 ⟹ `scheme://path`（スラッシュ2本）。
    expect(formatNativeRedirectUrl("surechigai", "oauth-native-callback"))
      .toBe("surechigai://oauth-native-callback");

    // ★スラッシュ3本を明示的に否定する。
    //   本数が違うと戻り先が一致せず、ブラウザが開いたまま返らない＝533 と同じ却下に戻る。
    expect(formatNativeRedirectUrl("surechigai", "oauth-native-callback"))
      .not.toContain(":///");
  });

  it("★実際に使う戻り先が app.config.json の scheme から作られている", () => {
    // ★ハードコードしていたら、scheme を変えたときに気づけない。
    const scheme = (appConfig as { identity: { iosScheme: string } }).identity.iosScheme;
    expect(getNativeOAuthRedirectUrl()).toBe(`${scheme}://${NATIVE_OAUTH_CALLBACK_PATH}`);

    // ★この値をそのまま Clerk の許可リストへ登録する（人が読んで写す欄）。
    expect(getNativeOAuthRedirectUrl()).toBe("surechigai://oauth-native-callback");

    // ★http(s) でないこと（533 の真因そのもの）
    expect(isValidNativeRedirectUrl(getNativeOAuthRedirectUrl())).toBe(true);
  });

  it("★無反応→見えるエラーのガードを消していない（520/521 の教訓）", () => {
    const src = read("components/providers/clerk-auth-bridge.tsx");
    // ★このガードは正しく働いている。redirectUrl を直しても残す。
    expect(src).toMatch(/isSilentOAuthNoop\(result\)/);
    expect(src).toMatch(/throw new Error\(OAUTH_NOT_READY_MESSAGE\)/);
  });
});
