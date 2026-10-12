import { describe, expect, it } from "vitest";
import {
  decideGuestHome,
  LEGACY_SHELL_QUERY,
} from "../apps/web/lib/guest-home-gate";

/**
 * トップ `/` のゲート判定。
 *
 * ★このテストが守っているもの:
 *   `/` はゲスト専用ルートではない。旧 app/(tabs)/index.tsx はログイン済みに
 *   タブシェル（投稿一覧・レーダー）を出している。ゲートが壊れると、ログイン済みの人の
 *   ホーム画面がゲストのヒーローに置き換わる。
 */

const guest = { cookieHeader: "", returnedFromShell: false };

describe("decideGuestHome", () => {
  it("cookie が無ければゲストを出す", () => {
    expect(decideGuestHome(guest).kind).toBe("render-guest");
    expect(
      decideGuestHome({ cookieHeader: null, returnedFromShell: false }).kind,
    ).toBe("render-guest");
    expect(
      decideGuestHome({ cookieHeader: undefined, returnedFromShell: false })
        .kind,
    ).toBe("render-guest");
  });

  it("__client_uat=0 はゲスト（0 はログアウト状態を表す）", () => {
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat=0",
        returnedFromShell: false,
      }).kind,
    ).toBe("render-guest");
  });

  it("__client_uat が 0 以外ならログイン済みとして旧シェルへ返す", () => {
    const decision = decideGuestHome({
      cookieHeader: "__client_uat=1760000000",
      returnedFromShell: false,
    });
    expect(decision.kind).toBe("bounce-to-legacy-shell");
    if (decision.kind === "bounce-to-legacy-shell") {
      expect(decision.href).toBe(`/?${LEGACY_SHELL_QUERY}`);
    }
  });

  it("★接尾辞付きが先に並んでいてもログイン済みを取りこぼさない（2026-09-29 実損）", () => {
    // Clerk は __client_uat_<suffix> を接尾辞無しと併置することがある。
    // .match() は最初の1件しか見ないので、先頭の 0 を見てゲストと誤判定していた。
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat_abc=0; __client_uat=1760000000",
        returnedFromShell: false,
      }).kind,
    ).toBe("bounce-to-legacy-shell");
  });

  it("接尾辞を渡したときは自分の cookie だけを見る（姉妹サービスで誤爆しない）", () => {
    // 自分（suffix=mine）はログアウト、姉妹サービス（suffix=other）はログイン中。
    const header = "__client_uat_mine=0; __client_uat_other=1760000000";
    expect(
      decideGuestHome({
        cookieHeader: header,
        cookieSuffix: "mine",
        returnedFromShell: false,
      }).kind,
    ).toBe("render-guest");
    // 接尾辞を渡さなければ従来判定になり、姉妹サービスの方を拾ってしまう。
    expect(
      decideGuestHome({ cookieHeader: header, returnedFromShell: false }).kind,
    ).toBe("bounce-to-legacy-shell");
  });

  it("接尾辞を渡したとき、自分がログイン中なら返す", () => {
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat_mine=1760000000; __client_uat_other=0",
        cookieSuffix: "mine",
        returnedFromShell: false,
      }).kind,
    ).toBe("bounce-to-legacy-shell");
  });

  it("接尾辞に正規表現の記号が入っていても壊れない（base64url の - _ など）", () => {
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat_a-b_c=1760000000",
        cookieSuffix: "a-b_c",
        returnedFromShell: false,
      }).kind,
    ).toBe("bounce-to-legacy-shell");
  });

  it("★直前に返していたらもう返さない（往復をここで止める）", () => {
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat=1760000000",
        returnedFromShell: true,
      }).kind,
    ).toBe("render-guest");
  });

  it("★読めない cookie はゲストを出す（fail-open）", () => {
    // 永久に往復するより、ゲスト画面を一度見せる方が害が小さい。
    expect(
      decideGuestHome({
        cookieHeader: "__client_uat=",
        returnedFromShell: false,
      }).kind,
    ).toBe("render-guest");
    expect(
      decideGuestHome({
        cookieHeader: "garbage;;;===",
        returnedFromShell: false,
      }).kind,
    ).toBe("render-guest");
  });

  it("他の cookie に紛れていても正しく読む", () => {
    expect(
      decideGuestHome({
        cookieHeader: "foo=bar; __client_uat=1760000000; baz=qux",
        returnedFromShell: false,
      }).kind,
    ).toBe("bounce-to-legacy-shell");
  });

  it("名前が似ているだけの cookie を誤って拾わない", () => {
    expect(
      decideGuestHome({
        cookieHeader: "my__client_uat=1760000000",
        returnedFromShell: false,
      }).kind,
    ).toBe("render-guest");
  });
});
