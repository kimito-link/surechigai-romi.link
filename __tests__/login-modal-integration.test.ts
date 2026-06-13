/**
 * Login Modal Integration Tests
 * ログイン機能の統合テスト
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Login Modal Integration", () => {
  describe("LoginModal Component", () => {
    it("should exist in the project", () => {
      // LoginModalファイルが存在することを確認
      const loginModalPath = join(__dirname, "../components/common/LoginModal.tsx");
      const loginModalContent = readFileSync(loginModalPath, "utf-8");
      expect(loginModalContent).toContain("export function LoginModal");
      expect(loginModalContent).toContain("visible: boolean");
      expect(loginModalContent).toContain("onConfirm: () => void");
      expect(loginModalContent).toContain("onCancel: () => void");
    });

    it("should have correct UI elements", () => {
      // LoginModalのUI要素を確認
      const loginModalPath = join(__dirname, "../components/common/LoginModal.tsx");
      const loginModalContent = readFileSync(loginModalPath, "utf-8");
      expect(loginModalContent).toContain("Xでログインしますか？");
      expect(loginModalContent).toContain("Xでログイン");
      expect(loginModalContent).toContain("やめておく");
    });
  });

  describe("UserInfoSection Integration", () => {
    it("should integrate LoginModal", () => {
      // UserInfoSectionがLoginModalをimportしていることを確認
      const userInfoSectionPath = join(__dirname, "../features/event-detail/components/form-inputs/UserInfoSection.tsx");
      const userInfoSectionContent = readFileSync(userInfoSectionPath, "utf-8");
      expect(userInfoSectionContent).toContain("import { LoginModal } from");
      expect(userInfoSectionContent).toContain("useState");
      expect(userInfoSectionContent).toContain("showLoginModal");
      expect(userInfoSectionContent).toContain("<LoginModal");
    });

    it("should have login button handler", () => {
      // UserInfoSectionにログインボタンのハンドラーがあることを確認
      const userInfoSectionPath = join(__dirname, "../features/event-detail/components/form-inputs/UserInfoSection.tsx");
      const userInfoSectionContent = readFileSync(userInfoSectionPath, "utf-8");
      expect(userInfoSectionContent).toContain("handleLoginClick");
      expect(userInfoSectionContent).toContain("handleConfirmLogin");
      expect(userInfoSectionContent).toContain("handleCancelLogin");
    });
  });

  describe("Login Flow", () => {
    it("should have useAuth hook", () => {
      // useAuthフックが存在することを確認
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      expect(useAuthContent).toContain("export function useAuth");
      expect(useAuthContent).toContain("const login = useCallback");
    });

    it("should have redirect logic in useAuth", () => {
      // useAuthのlogin関数がreturnUrlを受け取ることを確認
      const useAuthPath = join(__dirname, "../hooks/use-auth.ts");
      const useAuthContent = readFileSync(useAuthPath, "utf-8");
      expect(useAuthContent).toContain("returnUrl?: string");
      expect(useAuthContent).toContain("auth_return_url");
    });
  });

  describe("Login UI Consistency", () => {
    it("should use LoginModal in event detail screen", () => {
      // イベント詳細画面でLoginModalを使用していることを確認
      const userInfoSectionPath = join(__dirname, "../features/event-detail/components/form-inputs/UserInfoSection.tsx");
      const userInfoSectionContent = readFileSync(userInfoSectionPath, "utf-8");
      expect(userInfoSectionContent).toContain("<LoginModal");
    });

    it("should use useAuthUxMachine in app header", () => {
      // アプリヘッダーでuseAuthUxMachineを使用していることを確認
      const appHeaderPath = join(__dirname, "../components/organisms/app-header.tsx");
      const appHeaderContent = readFileSync(appHeaderPath, "utf-8");
      expect(appHeaderContent).toContain("useAuthUxMachine");
    });
  });
});
