import { describe, expect, it } from "vitest";
import {
  buildQueryUrl,
  isAuthCookieName,
  pickAuthCookies,
  TRPC_ENDPOINT,
  unwrapTrpcResult,
} from "../apps/web/lib/trpc-server";

/**
 * Next.js のサーバー側から tRPC を呼ぶ部分の契約。
 *
 * ★ここで守るもの:
 *   - 認証に要る cookie だけを外へ出す（関係ない cookie を漏らさない）
 *   - サーバーが返したエラーを握りつぶさない（空配列にして「0件」に見せない）
 */

describe("転送する cookie を絞る", () => {
  it("Clerk の認証 cookie は通す", () => {
    expect(isAuthCookieName("__session")).toBe(true);
    expect(isAuthCookieName("__client_uat")).toBe(true);
    expect(isAuthCookieName("__client_uat_abc123")).toBe(true);
    expect(isAuthCookieName("__clerk_db_jwt")).toBe(true);
  });

  it("★それ以外は通さない（関係ない cookie を外へ出さない）", () => {
    expect(isAuthCookieName("sg_shell_bounce")).toBe(false);
    expect(isAuthCookieName("_ga")).toBe(false);
    expect(isAuthCookieName("romiLiteHome")).toBe(false);
    // 名前が似ているだけのものも通さない。
    expect(isAuthCookieName("my__session")).toBe(false);
    expect(isAuthCookieName("not__clerk")).toBe(false);
  });

  it("混ざった cookie から認証分だけを取り出す", () => {
    const header = "_ga=GA1.1; __client_uat=1760000000; theme=dark; __session=abc";
    expect(pickAuthCookies(header)).toBe("__client_uat=1760000000; __session=abc");
  });

  it("接尾辞付きも落とさない（2026-09-29 実損と同じ形）", () => {
    const header = "__client_uat_xyz=0; __client_uat=1760000000";
    const picked = pickAuthCookies(header);
    expect(picked).toContain("__client_uat_xyz=0");
    expect(picked).toContain("__client_uat=1760000000");
  });

  it("読めないときは空（未ログインとして扱われる）", () => {
    expect(pickAuthCookies("")).toBe("");
    expect(pickAuthCookies(null)).toBe("");
    expect(pickAuthCookies(undefined)).toBe("");
    expect(pickAuthCookies(";;;")).toBe("");
    expect(pickAuthCookies("=value")).toBe("");
  });

  it("値に = が含まれていても壊れない（JWT など）", () => {
    const header = "__session=eyJhbGc=.eyJzdWI=.sig";
    expect(pickAuthCookies(header)).toBe("__session=eyJhbGc=.eyJzdWI=.sig");
  });
});

describe("呼び出す URL の組み立て", () => {
  it("入力が無ければクエリを付けない", () => {
    expect(buildQueryUrl("https://example.com", "encounter.list")).toBe(
      `https://example.com${TRPC_ENDPOINT}/encounter.list`,
    );
  });

  it("入力は JSON にして input= に載せる", () => {
    const url = buildQueryUrl("https://example.com", "zukan.myTrail", {
      limit: 1,
    });
    expect(url).toBe(
      `https://example.com${TRPC_ENDPOINT}/zukan.myTrail?input=${encodeURIComponent('{"limit":1}')}`,
    );
  });

  it("末尾スラッシュが重なっても URL が壊れない", () => {
    expect(buildQueryUrl("https://example.com/", "settings.get")).toBe(
      `https://example.com${TRPC_ENDPOINT}/settings.get`,
    );
  });
});

describe("応答の読み取り", () => {
  it("素の形を読める", () => {
    expect(unwrapTrpcResult<number[]>({ result: { data: [1, 2] } })).toEqual([
      1, 2,
    ]);
  });

  it("superjson 形式（{json:...}）も読める", () => {
    expect(
      unwrapTrpcResult<{ a: number }>({ result: { data: { json: { a: 1 } } } }),
    ).toEqual({ a: 1 });
  });

  it("★サーバーのエラーを握りつぶさない", () => {
    // 「取れなかった」を「0件だった」として描くと、画面は正常に見えるのに中身が空になる。
    expect(() =>
      unwrapTrpcResult({ error: { message: "UNAUTHORIZED" } }),
    ).toThrow(/UNAUTHORIZED/);
    expect(() =>
      unwrapTrpcResult({ error: { json: { message: "NOT_FOUND" } } }),
    ).toThrow(/NOT_FOUND/);
  });

  it("★形が違えば throw する（undefined を返さない）", () => {
    expect(() => unwrapTrpcResult({})).toThrow();
    expect(() => unwrapTrpcResult(null)).toThrow();
    expect(() => unwrapTrpcResult("文字列")).toThrow();
    expect(() => unwrapTrpcResult({ result: {} })).toThrow();
  });

  it("中身が null や空配列でも、それは正常な応答として返す", () => {
    // 「0件」と「読めなかった」は別物。前者は throw しない。
    expect(unwrapTrpcResult({ result: { data: [] } })).toEqual([]);
    expect(unwrapTrpcResult({ result: { data: null } })).toBeNull();
  });
});
