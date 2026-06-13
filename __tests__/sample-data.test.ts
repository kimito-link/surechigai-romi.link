import { describe, it, expect, vi } from "vitest";

describe("Sample Data Generation", () => {
  describe("Sample Challenges Data", () => {
    const sampleChallenges = [
      {
        hostName: "りんく",
        hostUsername: "kimitolink",
        title: "生誕祭ライブ 動員100人達成チャレンジ",
        goalType: "attendance",
        goalValue: 100,
        eventType: "solo",
      },
      {
        hostName: "アイドルファンチ",
        hostUsername: "idolfunch",
        title: "グループライブ フォロワー1万人チャレンジ",
        goalType: "followers",
        goalValue: 10000,
        eventType: "group",
      },
      {
        hostName: "こん太",
        hostUsername: "konta_idol",
        title: "ソロライブ 50人動員チャレンジ",
        goalType: "attendance",
        goalValue: 50,
        eventType: "solo",
      },
      {
        hostName: "たぬ姉",
        hostUsername: "tanunee_idol",
        title: "配信ライブ 同時視聴500人チャレンジ",
        goalType: "viewers",
        goalValue: 500,
        eventType: "solo",
      },
      {
        hostName: "リンク",
        hostUsername: "link_official",
        title: "ワンマンライブ 200人動員チャレンジ",
        goalType: "attendance",
        goalValue: 200,
        eventType: "solo",
      },
      {
        hostName: "アイドルユニットA",
        hostUsername: "idol_unit_a",
        title: "グループライブ 300人動員チャレンジ",
        goalType: "attendance",
        goalValue: 300,
        eventType: "group",
      },
    ];

    it("should have 6 sample challenges defined", () => {
      expect(sampleChallenges.length).toBe(6);
    });

    it("should have valid hostName for each challenge", () => {
      sampleChallenges.forEach((challenge) => {
        expect(challenge.hostName).toBeDefined();
        expect(challenge.hostName.length).toBeGreaterThan(0);
      });
    });

    it("should have valid hostUsername for each challenge", () => {
      sampleChallenges.forEach((challenge) => {
        expect(challenge.hostUsername).toBeDefined();
        expect(challenge.hostUsername.length).toBeGreaterThan(0);
      });
    });

    it("should have valid title for each challenge", () => {
      sampleChallenges.forEach((challenge) => {
        expect(challenge.title).toBeDefined();
        expect(challenge.title.length).toBeGreaterThan(0);
      });
    });

    it("should have valid goalType for each challenge", () => {
      const validGoalTypes = ["attendance", "followers", "viewers", "points", "custom"];
      sampleChallenges.forEach((challenge) => {
        expect(validGoalTypes).toContain(challenge.goalType);
      });
    });

    it("should have positive goalValue for each challenge", () => {
      sampleChallenges.forEach((challenge) => {
        expect(challenge.goalValue).toBeGreaterThan(0);
      });
    });

    it("should have valid eventType for each challenge", () => {
      const validEventTypes = ["solo", "group"];
      sampleChallenges.forEach((challenge) => {
        expect(validEventTypes).toContain(challenge.eventType);
      });
    });

    it("should include both solo and group event types", () => {
      const soloCount = sampleChallenges.filter((c) => c.eventType === "solo").length;
      const groupCount = sampleChallenges.filter((c) => c.eventType === "group").length;
      expect(soloCount).toBeGreaterThan(0);
      expect(groupCount).toBeGreaterThan(0);
    });

    it("should include multiple goal types", () => {
      const goalTypes = new Set(sampleChallenges.map((c) => c.goalType));
      expect(goalTypes.size).toBeGreaterThan(1);
    });
  });

  describe("Sample Usernames for Cleanup", () => {
    const sampleUsernames = ["kimitolink", "idolfunch", "konta_idol", "tanunee_idol", "link_official", "idol_unit_a"];

    it("should have 6 sample usernames for cleanup", () => {
      expect(sampleUsernames.length).toBe(6);
    });

    it("should have unique usernames", () => {
      const uniqueUsernames = new Set(sampleUsernames);
      expect(uniqueUsernames.size).toBe(sampleUsernames.length);
    });
  });
});
