/**
 * ★iOS build 521 却下（"Buttons were unresponsive"）の再発を防ぐ。
 *
 * @clerk/expo の startOAuthFlow は Clerk 未ロード時に**例外を投げず**
 * `{ createdSessionId: "", signIn, signUp, setActive: undefined }` を返す。
 * 呼び出し側が `if (result.createdSessionId && result.setActive)` で受けていたため
 * 空文字は素通りし、try は正常終了し、catch の Alert も出なかった。
 * ＝ ★ブラウザも開かず、エラーも出ず、本当に何も起きない。
 *
 * ★520 の修正（useUser().isLoaded 側の窓）では直らなかった。
 *   startOAuthFlow が見るのは useSignIn()/useSignUp() の isLoaded で別の信号。
 *
 * 未ロード時の戻り値は node_modules/@clerk/react/dist/legacy.js:57-59 を実読して確認:
 *   if (!client) return { isLoaded: false, signIn: undefined, setActive: undefined };
 */
import { describe, expect, it } from "vitest";
import {
  isSilentOAuthNoop,
  OAUTH_NOT_READY_MESSAGE,
} from "../lib/auth/oauth-result";

describe("OAuth が無言で戻ってきたのを見分ける", () => {
  it("★Clerk 未ロードの署名(空セッション + setActive無し)を捕まえる", () => {
    // これが 521 で審査員が踏んだ実際の戻り値。
    expect(
      isSilentOAuthNoop({
        createdSessionId: "",
        setActive: undefined,
      }),
    ).toBe(true);
  });

  it("成功（セッションあり）は無言扱いにしない", () => {
    expect(
      isSilentOAuthNoop({
        createdSessionId: "sess_123",
        setActive: () => {},
      }),
    ).toBe(false);
  });

  it("★利用者が自分で中断した場合はエラーにしない（誤検知しない）", () => {
    // ブラウザは開いたが承認せず戻った場合、Clerk はロード済みなので
    // setActive は生きている。ここをエラーにすると
    // 「キャンセルしただけなのに毎回エラーが出る」うるさいUIになる。
    expect(
      isSilentOAuthNoop({
        createdSessionId: "",
        setActive: () => {},
      }),
    ).toBe(false);
  });

  it("null / undefined も無言扱い（開始できていない）", () => {
    expect(isSilentOAuthNoop(null)).toBe(true);
    expect(isSilentOAuthNoop(undefined)).toBe(true);
  });

  it("利用者に見せる文言が空でなく、次の行動を示している", () => {
    expect(OAUTH_NOT_READY_MESSAGE.length).toBeGreaterThan(10);
    // 「何をすればいいか」が書かれていること（無言の失敗に戻さない）
    expect(OAUTH_NOT_READY_MESSAGE).toMatch(/もう一度|再度|お試し/);
  });
});

describe("呼び出し側が握り潰していないこと", () => {
  it("clerk-auth-bridge が isSilentOAuthNoop で throw している", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.join(process.cwd(), "components/providers/clerk-auth-bridge.tsx"),
      "utf8",
    );
    // ★grep で書いているが、これは「配線されているか」の確認。
    //   判定ロジック自体は上の純関数テストで守っている。
    expect(src).toContain("isSilentOAuthNoop(result)");
    expect(src).toContain("throw new Error(OAUTH_NOT_READY_MESSAGE)");
  });
});
