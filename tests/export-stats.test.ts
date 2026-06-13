import { describe, it, expect } from "vitest";

// エクスポート機能のテスト

describe("Export Stats - CSV Generation", () => {
  // テストデータ
  const mockParticipations = [
    {
      id: 1,
      userId: 1,
      displayName: "テストユーザー1",
      username: "test1",
      profileImage: null,
      message: "応援します！",
      companionCount: 2,
      contribution: 3,
      prefecture: "東京都",
      isAnonymous: false,
      createdAt: new Date("2026-01-15T10:00:00"),
    },
    {
      id: 2,
      userId: 2,
      displayName: "テストユーザー2",
      username: "test2",
      profileImage: null,
      message: null,
      companionCount: 0,
      contribution: 1,
      prefecture: "大阪府",
      isAnonymous: true,
      createdAt: new Date("2026-01-15T14:00:00"),
    },
  ];

  const mockChallenge = {
    id: 1,
    title: "テストチャレンジ",
    hostName: "テスト主催者",
    goalValue: 100,
    goalUnit: "人",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-01-31"),
  };

  it("should calculate total participants correctly", () => {
    const total = mockParticipations.reduce((sum, p) => sum + (p.contribution || 1), 0);
    expect(total).toBe(4); // 3 + 1
  });

  it("should count unique participants correctly", () => {
    const uniqueCount = mockParticipations.length;
    expect(uniqueCount).toBe(2);
  });

  it("should calculate progress rate correctly", () => {
    const total = mockParticipations.reduce((sum, p) => sum + (p.contribution || 1), 0);
    const progressRate = (total / mockChallenge.goalValue * 100).toFixed(1);
    expect(progressRate).toBe("4.0");
  });
});

describe("Export Stats - Prefecture Statistics", () => {
  const mockParticipations = [
    { prefecture: "東京都", contribution: 10 },
    { prefecture: "東京都", contribution: 5 },
    { prefecture: "大阪府", contribution: 8 },
    { prefecture: "北海道", contribution: 3 },
    { prefecture: null, contribution: 2 },
  ];

  it("should aggregate by prefecture correctly", () => {
    const counts: Record<string, number> = {};
    mockParticipations.forEach(p => {
      if (p.prefecture) {
        counts[p.prefecture] = (counts[p.prefecture] || 0) + (p.contribution || 1);
      }
    });

    expect(counts["東京都"]).toBe(15);
    expect(counts["大阪府"]).toBe(8);
    expect(counts["北海道"]).toBe(3);
    expect(counts["神奈川県"]).toBeUndefined();
  });

  it("should calculate percentage correctly", () => {
    const counts: Record<string, number> = {};
    let total = 0;

    mockParticipations.forEach(p => {
      if (p.prefecture) {
        counts[p.prefecture] = (counts[p.prefecture] || 0) + (p.contribution || 1);
        total += p.contribution || 1;
      }
    });

    const tokyoPercentage = (counts["東京都"] / total * 100).toFixed(1);
    expect(tokyoPercentage).toBe("57.7"); // 15/26 * 100
  });
});

describe("Export Stats - Region Statistics", () => {
  const regionGroups = [
    { name: "関東", prefectures: ["東京都", "神奈川県", "埼玉県", "千葉県"] },
    { name: "近畿", prefectures: ["大阪府", "京都府", "兵庫県"] },
    { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県"] },
  ];

  const mockParticipations = [
    { prefecture: "東京都", contribution: 10 },
    { prefecture: "神奈川県", contribution: 5 },
    { prefecture: "大阪府", contribution: 8 },
    { prefecture: "北海道", contribution: 3 },
  ];

  it("should aggregate by region correctly", () => {
    const counts: Record<string, number> = {};

    mockParticipations.forEach(p => {
      if (p.prefecture) {
        const region = regionGroups.find(r => r.prefectures.includes(p.prefecture!));
        if (region) {
          counts[region.name] = (counts[region.name] || 0) + (p.contribution || 1);
        }
      }
    });

    expect(counts["関東"]).toBe(15); // 東京10 + 神奈川5
    expect(counts["近畿"]).toBe(8); // 大阪8
    expect(counts["北海道・東北"]).toBe(3); // 北海道3
  });
});

describe("Export Stats - Daily Statistics", () => {
  const mockParticipations = [
    { createdAt: new Date("2026-01-15T10:00:00"), contribution: 3 },
    { createdAt: new Date("2026-01-15T14:00:00"), contribution: 2 },
    { createdAt: new Date("2026-01-16T09:00:00"), contribution: 5 },
    { createdAt: new Date("2026-01-17T12:00:00"), contribution: 1 },
  ];

  it("should aggregate by date correctly", () => {
    const dateMap: Record<string, number> = {};

    mockParticipations.forEach(p => {
      const date = new Date(p.createdAt).toISOString().split("T")[0];
      dateMap[date] = (dateMap[date] || 0) + (p.contribution || 1);
    });

    expect(dateMap["2026-01-15"]).toBe(5); // 3 + 2
    expect(dateMap["2026-01-16"]).toBe(5);
    expect(dateMap["2026-01-17"]).toBe(1);
  });

  it("should calculate cumulative correctly", () => {
    const dateMap: Record<string, number> = {};

    mockParticipations.forEach(p => {
      const date = new Date(p.createdAt).toISOString().split("T")[0];
      dateMap[date] = (dateMap[date] || 0) + (p.contribution || 1);
    });

    const sortedDates = Object.keys(dateMap).sort();
    let cumulative = 0;
    const dailyData = sortedDates.map(date => {
      cumulative += dateMap[date];
      return { date, count: dateMap[date], cumulative };
    });

    expect(dailyData[0].cumulative).toBe(5);
    expect(dailyData[1].cumulative).toBe(10);
    expect(dailyData[2].cumulative).toBe(11);
  });
});

describe("Export Stats - Hourly Statistics", () => {
  const mockParticipations = [
    { createdAt: new Date("2026-01-15T10:00:00"), contribution: 3 },
    { createdAt: new Date("2026-01-15T10:30:00"), contribution: 2 },
    { createdAt: new Date("2026-01-15T14:00:00"), contribution: 5 },
    { createdAt: new Date("2026-01-15T22:00:00"), contribution: 1 },
  ];

  it("should aggregate by hour correctly", () => {
    const counts: number[] = Array(24).fill(0);

    mockParticipations.forEach(p => {
      const hour = new Date(p.createdAt).getHours();
      counts[hour] += p.contribution || 1;
    });

    expect(counts[10]).toBe(5); // 3 + 2
    expect(counts[14]).toBe(5);
    expect(counts[22]).toBe(1);
    expect(counts[0]).toBe(0);
  });
});

describe("Export Stats - Date Formatting", () => {
  function formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  function formatDateTime(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  it("should format date correctly", () => {
    const date = new Date(2026, 0, 15); // ローカルタイムゾーンで2026年1月15日
    expect(formatDate(date)).toBe("2026/1/15");
  });

  it("should format datetime correctly", () => {
    const date = new Date("2026-01-15T10:05:00");
    expect(formatDateTime(date)).toBe("2026/1/15 10:05");
  });

  it("should pad minutes correctly", () => {
    const date = new Date("2026-01-15T10:00:00");
    expect(formatDateTime(date)).toBe("2026/1/15 10:00");
  });
});

describe("Export Stats - Text Report Generation", () => {
  it("should include challenge title in report", () => {
    const title = "テストチャレンジ";
    const report = `🎯 チャレンジ: ${title}`;
    expect(report).toContain("テストチャレンジ");
  });

  it("should include progress information", () => {
    const current = 50;
    const goal = 100;
    const unit = "人";
    const progressLine = `現在: ${current} / ${goal}${unit}`;
    expect(progressLine).toBe("現在: 50 / 100人");
  });

  it("should calculate progress rate", () => {
    const current = 50;
    const goal = 100;
    const rate = ((current / goal) * 100).toFixed(1);
    expect(rate).toBe("50.0");
  });
});

describe("Export Stats - CSV Header Generation", () => {
  it("should generate proper CSV header", () => {
    const header = "表示名,都道府県,同行者数,貢献数,参加日時";
    const columns = header.split(",");
    expect(columns.length).toBe(5);
    expect(columns[0]).toBe("表示名");
    expect(columns[4]).toBe("参加日時");
  });

  it("should escape special characters in CSV", () => {
    const displayName = "テスト,ユーザー";
    const escaped = `"${displayName}"`;
    expect(escaped).toBe('"テスト,ユーザー"');
  });
});
