import { describe, it, expect } from "vitest";
import { isSafeEventUrl } from "@/modules/event/core/safe-url";

describe("isSafeEventUrl", () => {
  // ★2026-09-06 に発見: 入口の検証は z.string().url() だけで、
  //   これは javascript: / data: を通していた（zod 4.5.4 で実測）。
  //   集まりは誰でも作れて onlineUrl は他人に表示されるため実害があった。
  it("危険なスキームを弾く", () => {
    expect(isSafeEventUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeEventUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
    expect(isSafeEventUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeEventUrl("file:///etc/passwd")).toBe(false);
  });

  it("http は弾く（https のみ）", () => {
    expect(isSafeEventUrl("http://example.com/room")).toBe(false);
  });

  // ★会議URLは列挙できないので、ドメインでは絞らない。
  //   許可ドメイン方式にすると Zoom も Meet も無言で開けなくなる。
  it("実在する会議サービスのURLは通す", () => {
    expect(isSafeEventUrl("https://zoom.us/j/1234567890")).toBe(true);
    expect(isSafeEventUrl("https://meet.google.com/abc-defg-hij")).toBe(true);
    expect(isSafeEventUrl("https://teams.microsoft.com/l/meetup-join/x")).toBe(
      true,
    );
    expect(isSafeEventUrl("https://whereby.com/my-room")).toBe(true);
  });

  it("URLとして壊れているものを弾く", () => {
    expect(isSafeEventUrl("not a url")).toBe(false);
    expect(isSafeEventUrl("")).toBe(false);
  });
});
