import { describe, expect, it } from "vitest";
import { resolveShellState } from "../apps/web/lib/shell-state";

describe("resolveShellState", () => {
  it("Clerk 未確定の間はサーバーの判定に従う（ログイン済み）", () => {
    expect(
      resolveShellState({ serverSignedIn: true, clientLoaded: false, clientSignedIn: undefined }),
    ).toBe("signed-in");
  });

  it("Clerk 未確定の間はサーバーの判定に従う（ゲスト）", () => {
    expect(
      resolveShellState({ serverSignedIn: false, clientLoaded: false, clientSignedIn: undefined }),
    ).toBe("guest");
  });

  it("確定後はクライアントを正とする（サーバー=ログイン済み／クライアント=未ログイン → ゲスト）", () => {
    expect(
      resolveShellState({ serverSignedIn: true, clientLoaded: true, clientSignedIn: false }),
    ).toBe("guest");
  });

  it("確定後はクライアントを正とする（サーバー=ゲスト／クライアント=ログイン済み → ログイン済み）", () => {
    expect(
      resolveShellState({ serverSignedIn: false, clientLoaded: true, clientSignedIn: true }),
    ).toBe("signed-in");
  });

  it("確定済みでも isSignedIn が undefined なら、ログイン済みとは扱わない", () => {
    expect(
      resolveShellState({ serverSignedIn: true, clientLoaded: true, clientSignedIn: undefined }),
    ).toBe("guest");
  });
});
