import { describe, expect, it } from "vitest";
import {
  isValidEventOnlineUrl,
  validateEventCreateForm,
} from "@/modules/event/core/create-form-validation";

describe("isValidEventOnlineUrl", () => {
  it("accepts https URLs", () => {
    expect(isValidEventOnlineUrl("https://youtube.com/live/abc")).toBe(true);
  });

  it("rejects empty and non-URL strings", () => {
    expect(isValidEventOnlineUrl("")).toBe(false);
    expect(isValidEventOnlineUrl("not-a-url")).toBe(false);
  });
});

describe("validateEventCreateForm", () => {
  it("requires title", () => {
    expect(
      validateEventCreateForm({
        title: "",
        isOnline: true,
        onlineUrl: "https://example.com",
        prefecture: "",
        isUnlisted: false,
        accessCode: "",
      }),
    ).toMatch(/タイトル/);
  });

  it("requires online URL when online", () => {
    expect(
      validateEventCreateForm({
        title: "テスト",
        isOnline: true,
        onlineUrl: "",
        prefecture: "",
        isUnlisted: false,
        accessCode: "",
      }),
    ).toMatch(/URL/);
  });

  it("requires valid prefecture when offline", () => {
    expect(
      validateEventCreateForm({
        title: "テスト",
        isOnline: false,
        onlineUrl: "",
        prefecture: "",
        isUnlisted: false,
        accessCode: "",
      }),
    ).toMatch(/都道府県/);
  });

  it("requires access code when unlisted", () => {
    expect(
      validateEventCreateForm({
        title: "テスト",
        isOnline: true,
        onlineUrl: "https://example.com",
        prefecture: "",
        isUnlisted: true,
        accessCode: "",
      }),
    ).toMatch(/合言葉/);
  });

  it("passes valid online public event", () => {
    expect(
      validateEventCreateForm({
        title: "凸待ち",
        isOnline: true,
        onlineUrl: "https://youtube.com/watch?v=1",
        prefecture: "",
        isUnlisted: false,
        accessCode: "",
      }),
    ).toBeNull();
  });

  it("passes valid offline unlisted event", () => {
    expect(
      validateEventCreateForm({
        title: "オフ会",
        isOnline: false,
        onlineUrl: "",
        prefecture: "東京都",
        isUnlisted: true,
        accessCode: "secret",
      }),
    ).toBeNull();
  });
});
