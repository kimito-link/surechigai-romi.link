import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database queries
const mockChallenges = [
  {
    id: 1,
    title: "ワンマンライブ動員100人チャレンジ",
    description: "一緒に目標達成しよう！",
    venue: "渋谷CLUB QUATTRO",
    eventDate: new Date("2025-02-15"),
    hostName: "君斗りんく",
    hostUsername: "kimitolink",
    hostProfileImage: "https://example.com/profile.jpg",
    hostFollowersCount: 5000,
    goalType: "attendance",
    goalValue: 100,
    goalUnit: "人",
    currentValue: 45,
    eventType: "solo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: "フォロワー1万人チャレンジ",
    description: "フォローお願いします！",
    venue: null,
    eventDate: new Date("2025-03-01"),
    hostName: "テストユーザー",
    hostUsername: "testuser",
    hostProfileImage: null,
    hostFollowersCount: 8000,
    goalType: "followers",
    goalValue: 10000,
    goalUnit: "人",
    currentValue: 8500,
    eventType: "solo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockParticipations = [
  {
    id: 1,
    challengeId: 1,
    userId: 1,
    displayName: "ファンA",
    username: "fan_a",
    profileImage: null,
    message: "応援してます！",
    companionCount: 2,
    contribution: 3,
    prefecture: "東京都",
    isAnonymous: false,
    createdAt: new Date(),
  },
  {
    id: 2,
    challengeId: 1,
    userId: null,
    displayName: "匿名ファン",
    username: null,
    profileImage: null,
    message: "頑張って！",
    companionCount: 0,
    contribution: 1,
    prefecture: "大阪府",
    isAnonymous: true,
    createdAt: new Date(),
  },
];

describe("Challenge Data Structure", () => {
  it("should have correct goal type values", () => {
    const validGoalTypes = ["attendance", "followers", "viewers", "points", "custom"];
    
    mockChallenges.forEach((challenge) => {
      expect(validGoalTypes).toContain(challenge.goalType);
    });
  });

  it("should calculate progress correctly", () => {
    mockChallenges.forEach((challenge) => {
      const progress = (challenge.currentValue / challenge.goalValue) * 100;
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  it("should have valid event types", () => {
    const validEventTypes = ["solo", "group"];
    
    mockChallenges.forEach((challenge) => {
      expect(validEventTypes).toContain(challenge.eventType);
    });
  });

  it("should have required fields", () => {
    mockChallenges.forEach((challenge) => {
      expect(challenge.id).toBeDefined();
      expect(challenge.title).toBeDefined();
      expect(challenge.eventDate).toBeDefined();
      expect(challenge.hostName).toBeDefined();
      expect(challenge.goalType).toBeDefined();
      expect(challenge.goalValue).toBeGreaterThan(0);
    });
  });
});

describe("Participation Data Structure", () => {
  it("should calculate contribution correctly", () => {
    mockParticipations.forEach((participation) => {
      // contribution = 1 (self) + companionCount
      const expectedContribution = 1 + participation.companionCount;
      expect(participation.contribution).toBe(expectedContribution);
    });
  });

  it("should have valid prefecture values", () => {
    const validPrefectures = [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
      "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
      "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
      "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
      "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
      "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ];
    
    mockParticipations.forEach((participation) => {
      if (participation.prefecture) {
        expect(validPrefectures).toContain(participation.prefecture);
      }
    });
  });

  it("should handle anonymous participations", () => {
    const anonymousParticipation = mockParticipations.find((p) => p.isAnonymous);
    expect(anonymousParticipation).toBeDefined();
    expect(anonymousParticipation?.userId).toBeNull();
  });
});

describe("Region Grouping", () => {
  const regionGroups = [
    { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
    { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
    { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
    { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
    { name: "中国・四国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"] },
    { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
  ];

  it("should cover all 47 prefectures", () => {
    const allPrefectures = regionGroups.flatMap((r) => r.prefectures);
    expect(allPrefectures.length).toBe(47);
  });

  it("should group participations by region correctly", () => {
    const regionCounts: Record<string, number> = {};
    
    mockParticipations.forEach((p) => {
      if (p.prefecture) {
        const region = regionGroups.find((r) => r.prefectures.includes(p.prefecture!));
        if (region) {
          regionCounts[region.name] = (regionCounts[region.name] || 0) + p.contribution;
        }
      }
    });

    // 東京都 -> 関東 (3人)
    expect(regionCounts["関東"]).toBe(3);
    // 大阪府 -> 近畿 (1人)
    expect(regionCounts["近畿"]).toBe(1);
  });
});

describe("Goal Type Configuration", () => {
  const goalTypeConfig: Record<string, { label: string; icon: string; unit: string }> = {
    attendance: { label: "動員", icon: "people", unit: "人" },
    followers: { label: "フォロワー", icon: "person-add", unit: "人" },
    viewers: { label: "同時視聴", icon: "visibility", unit: "人" },
    points: { label: "ポイント", icon: "star", unit: "pt" },
    custom: { label: "カスタム", icon: "flag", unit: "" },
  };

  it("should have configuration for all goal types", () => {
    const expectedTypes = ["attendance", "followers", "viewers", "points", "custom"];
    
    expectedTypes.forEach((type) => {
      expect(goalTypeConfig[type]).toBeDefined();
      expect(goalTypeConfig[type].label).toBeDefined();
      expect(goalTypeConfig[type].icon).toBeDefined();
    });
  });

  it("should return correct unit for each goal type", () => {
    expect(goalTypeConfig.attendance.unit).toBe("人");
    expect(goalTypeConfig.followers.unit).toBe("人");
    expect(goalTypeConfig.viewers.unit).toBe("人");
    expect(goalTypeConfig.points.unit).toBe("pt");
    expect(goalTypeConfig.custom.unit).toBe("");
  });
});

describe("Contribution Ranking", () => {
  it("should sort participations by contribution descending", () => {
    const sorted = [...mockParticipations].sort(
      (a, b) => b.contribution - a.contribution
    );
    
    expect(sorted[0].contribution).toBeGreaterThanOrEqual(sorted[1].contribution);
  });

  it("should calculate total contribution correctly", () => {
    const totalContribution = mockParticipations.reduce(
      (sum, p) => sum + p.contribution,
      0
    );
    
    // 3 + 1 = 4
    expect(totalContribution).toBe(4);
  });
});
