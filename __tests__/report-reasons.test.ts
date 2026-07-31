import { describe, it, expect } from "vitest";
import {
  REPORT_REASONS,
  PLACE_NOTE_REPORT_REASONS,
  reportReasonLabel,
} from "@/modules/encounter/core/report-reasons";

describe("REPORT_REASONS", () => {
  it("既存の4種を維持している（消すと保存済みの通報が読めなくなる）", () => {
    for (const legacy of [
      "inappropriate_hitokoto",
      "spam",
      "harassment",
      "other",
    ]) {
      expect(REPORT_REASONS).toContain(legacy);
    }
  });

  it("場所メモ用の理由が追加されている", () => {
    expect(REPORT_REASONS).toContain("inappropriate_place_note");
  });

  it("重複がない", () => {
    expect(new Set(REPORT_REASONS).size).toBe(REPORT_REASONS.length);
  });
});

describe("PLACE_NOTE_REPORT_REASONS", () => {
  it("すべて REPORT_REASONS の部分集合である（zod で弾かれない）", () => {
    for (const reason of PLACE_NOTE_REPORT_REASONS) {
      expect(REPORT_REASONS).toContain(reason);
    }
  });

  it("ひとこと用の理由は含めない（文脈が違う）", () => {
    expect(PLACE_NOTE_REPORT_REASONS).not.toContain("inappropriate_hitokoto");
  });
});

describe("reportReasonLabel", () => {
  it("すべての理由にラベルがある", () => {
    for (const reason of REPORT_REASONS) {
      const label = reportReasonLabel(reason);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe(reason); // 生の値が出ていない
    }
  });

  it("未知の値は「その他」に寄せる（古いクライアント対策）", () => {
    expect(reportReasonLabel("unknown_future_reason")).toBe(
      reportReasonLabel("other"),
    );
  });
});
