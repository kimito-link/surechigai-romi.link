/**
 * Checkbox コンポーネントのテスト
 * 
 * 注意: React Nativeコンポーネントのテストは手動確認を推奨
 * このテストファイルは型チェックと基本構造の確認用
 */

import { describe, it, expect } from "vitest";
import { Checkbox, type CheckboxProps } from "../checkbox";

describe("Checkbox Component", () => {
  describe("型定義", () => {
    it("should have correct props interface", () => {
      const props: CheckboxProps = {
        checked: false,
        onChange: () => {},
        label: "テストラベル",
      };
      
      expect(props.checked).toBe(false);
      expect(props.label).toBe("テストラベル");
    });

    it("should support optional props", () => {
      const props: CheckboxProps = {
        checked: true,
        onChange: () => {},
        label: "テストラベル",
        description: "説明文",
        size: "sm",
        disabled: false,
      };
      
      expect(props.description).toBe("説明文");
      expect(props.size).toBe("sm");
      expect(props.disabled).toBe(false);
    });
  });

  describe("エクスポート", () => {
    it("should export Checkbox component", () => {
      expect(Checkbox).toBeDefined();
      expect(typeof Checkbox).toBe("function");
    });

    it("should export CheckboxProps type", () => {
      // 型チェックのみ
      const _props: CheckboxProps = {
        checked: false,
        onChange: () => {},
        label: "test",
      };
      expect(_props).toBeDefined();
    });
  });
});
