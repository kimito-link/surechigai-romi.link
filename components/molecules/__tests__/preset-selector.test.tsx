/**
 * PresetSelector コンポーネントのテスト
 */

import { describe, it, expect } from "vitest";
import { CHALLENGE_PRESETS, getPresetById, getPresetsByGoalType } from "@/constants/challenge-presets";

describe("Challenge Presets", () => {
  describe("CHALLENGE_PRESETS", () => {
    it("should have at least 5 presets", () => {
      expect(CHALLENGE_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it("should have unique IDs", () => {
      const ids = CHALLENGE_PRESETS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required fields for each preset", () => {
      CHALLENGE_PRESETS.forEach(preset => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.icon).toBeDefined();
        expect(preset.goalType).toBeDefined();
        expect(preset.goalValue).toBeGreaterThan(0);
        expect(preset.goalUnit).toBeDefined();
        expect(preset.eventType).toBeDefined();
      });
    });

    it("should have valid goal types", () => {
      const validGoalTypes = ["attendance", "followers", "viewers", "points", "custom"];
      CHALLENGE_PRESETS.forEach(preset => {
        expect(validGoalTypes).toContain(preset.goalType);
      });
    });

    it("should have valid event types", () => {
      const validEventTypes = ["solo", "group"];
      CHALLENGE_PRESETS.forEach(preset => {
        expect(validEventTypes).toContain(preset.eventType);
      });
    });
  });

  describe("getPresetById", () => {
    it("should return preset for valid ID", () => {
      const preset = getPresetById("live_small");
      expect(preset).toBeDefined();
      expect(preset?.name).toBe("小規模ライブ");
    });

    it("should return undefined for invalid ID", () => {
      const preset = getPresetById("invalid_id");
      expect(preset).toBeUndefined();
    });
  });

  describe("getPresetsByGoalType", () => {
    it("should return presets for attendance goal type", () => {
      const presets = getPresetsByGoalType("attendance");
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach(preset => {
        expect(preset.goalType).toBe("attendance");
      });
    });

    it("should return presets for viewers goal type", () => {
      const presets = getPresetsByGoalType("viewers");
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach(preset => {
        expect(preset.goalType).toBe("viewers");
      });
    });

    it("should return empty array for non-existent goal type", () => {
      const presets = getPresetsByGoalType("non_existent");
      expect(presets.length).toBe(0);
    });
  });

  describe("Preset content validation", () => {
    it("should have live_small preset with correct values", () => {
      const preset = getPresetById("live_small");
      expect(preset).toBeDefined();
      expect(preset?.goalType).toBe("attendance");
      expect(preset?.goalValue).toBe(50);
      expect(preset?.eventType).toBe("solo");
      expect(preset?.suggestedTicketPresale).toBeDefined();
    });

    it("should have streaming preset with viewers goal", () => {
      const preset = getPresetById("streaming");
      expect(preset).toBeDefined();
      expect(preset?.goalType).toBe("viewers");
      expect(preset?.goalValue).toBe(100);
    });

    it("should have group_event preset with group event type", () => {
      const preset = getPresetById("group_event");
      expect(preset).toBeDefined();
      expect(preset?.eventType).toBe("group");
    });

    it("should have custom preset", () => {
      const preset = getPresetById("custom");
      expect(preset).toBeDefined();
      expect(preset?.goalType).toBe("custom");
    });
  });
});
