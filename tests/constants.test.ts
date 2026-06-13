import { describe, it, expect } from "vitest";
import {
  regionGroups,
  prefectures,
  normalizePrefecture,
  getRegionByPrefecture,
  getRegionByName,
  countByRegion,
  countByPrefecture,
} from "../constants/prefectures";
import {
  goalTypeConfig,
  getGoalTypeConfig,
  getGoalTypeLabel,
  getGoalTypeUnit,
  getGoalTypeIcon,
} from "../constants/goal-types";
import {
  eventTypeBadge,
  getEventTypeBadge,
  getEventTypeLabel,
  getEventTypeColor,
} from "../constants/event-types";

describe("prefectures constants", () => {
  it("should have 6 region groups", () => {
    expect(regionGroups).toHaveLength(6);
  });

  it("should have 47 prefectures", () => {
    expect(prefectures).toHaveLength(47);
  });

  it("should include all major prefectures", () => {
    expect(prefectures).toContain("東京都");
    expect(prefectures).toContain("大阪府");
    expect(prefectures).toContain("北海道");
    expect(prefectures).toContain("沖縄県");
  });

  describe("normalizePrefecture", () => {
    it("should return prefecture for exact match", () => {
      expect(normalizePrefecture("東京都")).toBe("東京都");
      expect(normalizePrefecture("大阪府")).toBe("大阪府");
    });

    it("should return null for invalid input", () => {
      expect(normalizePrefecture("invalid")).toBeNull();
    });
  });

  describe("getRegionByPrefecture", () => {
    it("should return correct region for Tokyo", () => {
      const region = getRegionByPrefecture("東京都");
      expect(region?.name).toBe("関東");
    });

    it("should return correct region for Osaka", () => {
      const region = getRegionByPrefecture("大阪府");
      expect(region?.name).toBe("近畿");
    });

    it("should return null for invalid prefecture", () => {
      expect(getRegionByPrefecture("invalid")).toBeNull();
    });
  });

  describe("getRegionByName", () => {
    it("should return correct region by name", () => {
      const region = getRegionByName("関東");
      expect(region?.prefectures).toContain("東京都");
    });

    it("should return null for invalid name", () => {
      expect(getRegionByName("invalid")).toBeNull();
    });
  });

  describe("countByRegion", () => {
    it("should count participations by region", () => {
      const participations = [
        { prefecture: "東京都", contribution: 2 },
        { prefecture: "神奈川県", contribution: 1 },
        { prefecture: "大阪府", contribution: 3 },
      ];
      const counts = countByRegion(participations);
      expect(counts["関東"]).toBe(3);
      expect(counts["近畿"]).toBe(3);
    });

    it("should handle empty participations", () => {
      const counts = countByRegion([]);
      expect(counts["関東"]).toBe(0);
    });
  });

  describe("countByPrefecture", () => {
    it("should count participations by prefecture", () => {
      const participations = [
        { prefecture: "東京都", contribution: 2 },
        { prefecture: "東京都", contribution: 1 },
        { prefecture: "大阪府", contribution: 3 },
      ];
      const counts = countByPrefecture(participations);
      expect(counts["東京都"]).toBe(3);
      expect(counts["大阪府"]).toBe(3);
    });
  });
});

describe("goal-types constants", () => {
  it("should have 5 goal types", () => {
    expect(Object.keys(goalTypeConfig)).toHaveLength(5);
  });

  it("should include attendance type", () => {
    expect(goalTypeConfig.attendance).toBeDefined();
    expect(goalTypeConfig.attendance.label).toBe("動員");
    expect(goalTypeConfig.attendance.unit).toBe("人");
  });

  describe("getGoalTypeConfig", () => {
    it("should return config for valid type", () => {
      const config = getGoalTypeConfig("attendance");
      expect(config.label).toBe("動員");
    });

    it("should return default for null/undefined", () => {
      expect(getGoalTypeConfig(null).label).toBe("動員");
      expect(getGoalTypeConfig(undefined).label).toBe("動員");
    });
  });

  describe("getGoalTypeLabel", () => {
    it("should return label for valid type", () => {
      expect(getGoalTypeLabel("followers")).toBe("フォロワー");
    });
  });

  describe("getGoalTypeUnit", () => {
    it("should return unit for valid type", () => {
      expect(getGoalTypeUnit("points")).toBe("pt");
    });
  });

  describe("getGoalTypeIcon", () => {
    it("should return icon for valid type", () => {
      expect(getGoalTypeIcon("viewers")).toBe("visibility");
    });
  });
});

describe("event-types constants", () => {
  it("should have 2 event types", () => {
    expect(Object.keys(eventTypeBadge)).toHaveLength(2);
  });

  it("should include solo and group types", () => {
    expect(eventTypeBadge.solo).toBeDefined();
    expect(eventTypeBadge.group).toBeDefined();
  });

  describe("getEventTypeBadge", () => {
    it("should return badge for valid type", () => {
      const badge = getEventTypeBadge("solo");
      expect(badge.label).toBe("ソロ");
    });

    it("should return default for null/undefined", () => {
      expect(getEventTypeBadge(null).label).toBe("ソロ");
      expect(getEventTypeBadge(undefined).label).toBe("ソロ");
    });
  });

  describe("getEventTypeLabel", () => {
    it("should return label for valid type", () => {
      expect(getEventTypeLabel("group")).toBe("グループ");
    });
  });

  describe("getEventTypeColor", () => {
    it("should return color for valid type", () => {
      expect(getEventTypeColor("solo")).toBe("#EC4899");
      expect(getEventTypeColor("group")).toBe("#8B5CF6");
    });
  });
});
