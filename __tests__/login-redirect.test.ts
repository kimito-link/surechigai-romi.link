/**
 * Login Redirect Tests
 * ログイン後のリダイレクト機能のテスト
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Login Redirect Functionality", () => {
  describe("useAuth Hook", () => {
    it("should have returnUrl parameter in login function", () => {
      // useAuthのlogin関数がreturnUrlパラメータを受け取ることを確認
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      expect(useAuthContent).toContain("returnUrl?: string");
      expect(useAuthContent).toContain("const login = useCallback");
    });

    it("should save returnUrl to localStorage on web", () => {
      // Web版でlocalStorageにreturnUrlを保存することを確認（Clerk移行後）
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      expect(useAuthContent).toContain("localStorage.setItem(\"auth_return_url\"");
      expect(useAuthContent).toContain("returnUrl");
    });

    it("should save returnUrl to AsyncStorage on native", () => {
      // ネイティブ版でAsyncStorageにreturnUrlを保存することを確認
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      expect(useAuthContent).toContain("AsyncStorage.setItem(\"auth_return_url\"");
      expect(useAuthContent).toContain("import AsyncStorage from");
    });
  });

  describe("Login Modal Integration", () => {
    it("should have login prop in UserInfoSection", () => {
      // UserInfoSectionがlogin propを受け取ることを確認
      const userInfoSectionPath = join(__dirname, "../features/event-detail/components/form-inputs/UserInfoSection.tsx");
      const userInfoSectionContent = readFileSync(userInfoSectionPath, "utf-8");
      expect(userInfoSectionContent).toContain("login: () => void");
      expect(userInfoSectionContent).toContain("handleConfirmLogin");
    });
  });

  describe("OAuth Callback", () => {
    it("should have twitter-callback route", () => {
      // twitter-callbackルートが存在することを確認
      const twitterCallbackPath = join(__dirname, "../app/oauth/twitter-callback.tsx");
      const twitterCallbackContent = readFileSync(twitterCallbackPath, "utf-8");
      expect(twitterCallbackContent).toContain("export default function");
    });
  });

  describe("Return URL Handling", () => {
    it("should use auth_return_url key consistently", () => {
      // auth_return_urlキーを一貫して使用していることを確認
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      
      // Web版
      expect(useAuthContent).toContain("localStorage.setItem(\"auth_return_url\"");
      
      // ネイティブ版
      expect(useAuthContent).toContain("AsyncStorage.setItem(\"auth_return_url\"");
    });
  });
});
