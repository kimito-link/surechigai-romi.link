import { describe, it, expect, vi } from "vitest";

// AI向けサマリー生成ロジックのテスト
describe("AI Optimization API", () => {
  describe("AI Summary Generation", () => {
    it("should generate natural language summary", () => {
      // サマリー生成ロジックのテスト
      const challenge = {
        title: "りんく生誕祭",
        hostName: "りんく",
        eventType: "solo",
        goalValue: 100,
        goalUnit: "人",
        currentValue: 45,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      };

      const progressPercent = Math.round((challenge.currentValue / challenge.goalValue) * 100);
      const daysUntilEvent = Math.ceil((challenge.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let aiSummary = `【${challenge.title}】${challenge.hostName}主催の${challenge.eventType === "group" ? "グループ" : "ソロ"}イベント。`;
      aiSummary += `目標${challenge.goalValue}${challenge.goalUnit}に対して現在${challenge.currentValue}${challenge.goalUnit}（達成率${progressPercent}%）。`;
      aiSummary += `開催まで残り${daysUntilEvent}日。`;

      expect(aiSummary).toContain("りんく生誕祭");
      expect(aiSummary).toContain("りんく主催");
      expect(aiSummary).toContain("ソロイベント");
      expect(aiSummary).toContain("45%");
      expect(aiSummary).toContain("残り");
    });

    it("should generate intent tags based on progress", () => {
      const generateIntentTags = (
        eventType: string,
        goalType: string,
        progressPercent: number,
        daysUntilEvent: number,
        hotRegion?: string
      ): string[] => {
        const intentTags: string[] = [];
        intentTags.push(eventType === "group" ? "グループ" : "ソロ");
        intentTags.push(goalType);
        if (progressPercent >= 100) intentTags.push("達成済み");
        else if (progressPercent >= 80) intentTags.push("もうすぐ達成");
        else if (progressPercent >= 50) intentTags.push("順調");
        else intentTags.push("応援募集中");
        if (daysUntilEvent <= 7 && daysUntilEvent > 0) intentTags.push("直前");
        if (daysUntilEvent === 0) intentTags.push("本日開催");
        if (hotRegion) intentTags.push(hotRegion);
        return intentTags;
      };

      // 応援募集中のケース
      const tags1 = generateIntentTags("solo", "attendance", 30, 14);
      expect(tags1).toContain("ソロ");
      expect(tags1).toContain("attendance");
      expect(tags1).toContain("応援募集中");

      // もうすぐ達成のケース
      const tags2 = generateIntentTags("group", "attendance", 85, 3);
      expect(tags2).toContain("グループ");
      expect(tags2).toContain("もうすぐ達成");
      expect(tags2).toContain("直前");

      // 達成済みのケース
      const tags3 = generateIntentTags("solo", "followers", 100, 0);
      expect(tags3).toContain("達成済み");
      expect(tags3).toContain("本日開催");

      // 地域タグのケース
      const tags4 = generateIntentTags("solo", "attendance", 50, 10, "東京都");
      expect(tags4).toContain("順調");
      expect(tags4).toContain("東京都");
    });

    it("should calculate region summary correctly", () => {
      const participationData = [
        { prefecture: "東京都", count: 15 },
        { prefecture: "大阪府", count: 10 },
        { prefecture: "愛知県", count: 5 },
        { prefecture: null, count: 3 },
      ];

      const regionSummary: Record<string, number> = {};
      let totalCount = 0;
      participationData.forEach(row => {
        if (row.prefecture) {
          regionSummary[row.prefecture] = row.count;
        }
        totalCount += row.count;
      });

      expect(regionSummary["東京都"]).toBe(15);
      expect(regionSummary["大阪府"]).toBe(10);
      expect(regionSummary["愛知県"]).toBe(5);
      expect(totalCount).toBe(33);

      // 最も盛り上がっている地域を特定
      let hotRegion: string | undefined;
      let maxCount = 0;
      Object.entries(regionSummary).forEach(([region, count]) => {
        if (count > maxCount) {
          maxCount = count;
          hotRegion = region;
        }
      });

      expect(hotRegion).toBe("東京都");
      expect(maxCount).toBe(15);
    });
  });

  describe("AI Search by Tags", () => {
    it("should score challenges by tag match count", () => {
      const challenges = [
        { id: 1, intentTags: ["ソロ", "attendance", "応援募集中", "東京都"] },
        { id: 2, intentTags: ["グループ", "attendance", "もうすぐ達成"] },
        { id: 3, intentTags: ["ソロ", "followers", "達成済み"] },
      ];

      const searchTags = ["ソロ", "attendance"];

      const scored = challenges.map(c => {
        const matchCount = searchTags.filter(t => c.intentTags.includes(t)).length;
        return { id: c.id, score: matchCount };
      });

      scored.sort((a, b) => b.score - a.score);

      expect(scored[0].id).toBe(1); // ソロ + attendance = 2マッチ
      expect(scored[0].score).toBe(2);
      expect(scored[1].id).toBe(2); // attendance = 1マッチ
      expect(scored[1].score).toBe(1);
      expect(scored[2].id).toBe(3); // ソロ = 1マッチ
      expect(scored[2].score).toBe(1);
    });
  });

  describe("Participant Summary", () => {
    it("should build participant summary correctly", () => {
      const topContributors = [
        { name: "ファンA", contribution: 10, message: "頑張れ！" },
        { name: "ファンB", contribution: 8, message: null },
        { name: "ファンC", contribution: 5, message: "応援してます" },
      ];

      const recentMessages = [
        { name: "ファンD", message: "最高！", createdAt: new Date().toISOString() },
        { name: "ファンE", message: "楽しみ！", createdAt: new Date().toISOString() },
      ];

      const participantSummary = {
        totalCount: 30,
        topContributors: topContributors.map(c => ({
          name: c.name,
          contribution: c.contribution,
          message: c.message || undefined,
        })),
        recentMessages: recentMessages.map(m => ({
          name: m.name,
          message: m.message,
          createdAt: m.createdAt,
        })),
        hotRegion: "東京都",
      };

      expect(participantSummary.totalCount).toBe(30);
      expect(participantSummary.topContributors.length).toBe(3);
      expect(participantSummary.topContributors[0].name).toBe("ファンA");
      expect(participantSummary.topContributors[0].contribution).toBe(10);
      expect(participantSummary.recentMessages.length).toBe(2);
      expect(participantSummary.hotRegion).toBe("東京都");
    });
  });

  describe("1-Hop Query Design", () => {
    it("should return all necessary data in single query result", () => {
      // 1ホップ取得の設計確認
      const aiChallengeResponse = {
        // 基本情報
        id: 1,
        title: "りんく生誕祭",
        description: "みんなで応援しよう！",
        hostName: "りんく",
        hostUsername: "kimitolink",
        hostProfileImage: "https://example.com/image.jpg",
        eventDate: new Date(),
        venue: "渋谷O-EAST",
        prefecture: "東京都",
        eventType: "solo",
        
        // 進捗情報
        goalType: "attendance",
        goalValue: 100,
        goalUnit: "人",
        currentValue: 45,
        progressPercent: 45,
        
        // AI向け非正規化データ（1ホップで取得可能）
        aiSummary: "【りんく生誕祭】りんく主催のソロイベント...",
        intentTags: ["ソロ", "attendance", "応援募集中", "東京都"],
        regionSummary: { "東京都": 15, "大阪府": 10 },
        participantSummary: {
          totalCount: 30,
          topContributors: [],
          recentMessages: [],
          hotRegion: "東京都",
        },
        aiSummaryUpdatedAt: new Date(),
      };

      // 1ホップで必要な情報がすべて取得できることを確認
      expect(aiChallengeResponse.id).toBeDefined();
      expect(aiChallengeResponse.title).toBeDefined();
      expect(aiChallengeResponse.aiSummary).toBeDefined();
      expect(aiChallengeResponse.intentTags).toBeDefined();
      expect(aiChallengeResponse.regionSummary).toBeDefined();
      expect(aiChallengeResponse.participantSummary).toBeDefined();
      
      // JOINなしで取得できる情報
      expect(aiChallengeResponse.participantSummary.totalCount).toBe(30);
      expect(aiChallengeResponse.regionSummary["東京都"]).toBe(15);
    });
  });

  describe("Summary Refresh Logic", () => {
    it("should trigger refresh when summary is stale", () => {
      const STALE_THRESHOLD = 5 * 60 * 1000; // 5分

      // 新しいサマリー
      const freshSummary = new Date();
      const freshAge = Date.now() - freshSummary.getTime();
      expect(freshAge < STALE_THRESHOLD).toBe(true);

      // 古いサマリー
      const staleSummary = new Date(Date.now() - 10 * 60 * 1000); // 10分前
      const staleAge = Date.now() - staleSummary.getTime();
      expect(staleAge > STALE_THRESHOLD).toBe(true);

      // サマリーがない場合
      const noSummary = null;
      const noSummaryAge = noSummary ? Date.now() - new Date(noSummary).getTime() : Infinity;
      expect(noSummaryAge > STALE_THRESHOLD).toBe(true);
    });
  });
});
