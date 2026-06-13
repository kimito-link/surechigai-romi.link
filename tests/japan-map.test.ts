import { describe, it, expect } from "vitest";

// 都道府県データのテスト
describe("Prefecture data", () => {
  const PREFECTURES = [
    "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
    "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
    "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知",
    "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
    "鳥取", "島根", "岡山", "広島", "山口",
    "徳島", "香川", "愛媛", "高知",
    "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"
  ];

  it("should have 47 prefectures", () => {
    expect(PREFECTURES.length).toBe(47);
  });

  it("should start with Hokkaido", () => {
    expect(PREFECTURES[0]).toBe("北海道");
  });

  it("should end with Okinawa", () => {
    expect(PREFECTURES[46]).toBe("沖縄");
  });
});

// 地域カラーのテスト
describe("Region colors", () => {
  const REGION_COLORS: Record<string, string> = {
    "北海道": "#4FC3F7",
    "東北": "#9575CD",
    "関東": "#81C784",
    "中部": "#FFD54F",
    "関西": "#FFB74D",
    "中国": "#F06292",
    "四国": "#BA68C8",
    "九州": "#EF5350",
    "沖縄": "#FF8A65",
  };

  it("should have 9 regions", () => {
    expect(Object.keys(REGION_COLORS).length).toBe(9);
  });

  it("should have valid hex colors", () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(REGION_COLORS).forEach(color => {
      expect(color).toMatch(hexColorRegex);
    });
  });
});

// 都道府県から地域への変換テスト
describe("Prefecture to region mapping", () => {
  function getRegion(prefecture: string): string {
    const regionMap: Record<string, string> = {
      "北海道": "北海道",
      "青森": "東北", "岩手": "東北", "宮城": "東北", "秋田": "東北", "山形": "東北", "福島": "東北",
      "茨城": "関東", "栃木": "関東", "群馬": "関東", "埼玉": "関東", "千葉": "関東", "東京": "関東", "神奈川": "関東",
      "新潟": "中部", "富山": "中部", "石川": "中部", "福井": "中部", "山梨": "中部", "長野": "中部", "岐阜": "中部", "静岡": "中部", "愛知": "中部",
      "三重": "関西", "滋賀": "関西", "京都": "関西", "大阪": "関西", "兵庫": "関西", "奈良": "関西", "和歌山": "関西",
      "鳥取": "中国", "島根": "中国", "岡山": "中国", "広島": "中国", "山口": "中国",
      "徳島": "四国", "香川": "四国", "愛媛": "四国", "高知": "四国",
      "福岡": "九州", "佐賀": "九州", "長崎": "九州", "熊本": "九州", "大分": "九州", "宮崎": "九州", "鹿児島": "九州",
      "沖縄": "沖縄",
    };
    return regionMap[prefecture] || "不明";
  }

  it("should map Hokkaido correctly", () => {
    expect(getRegion("北海道")).toBe("北海道");
  });

  it("should map Tohoku prefectures correctly", () => {
    expect(getRegion("青森")).toBe("東北");
    expect(getRegion("宮城")).toBe("東北");
  });

  it("should map Kanto prefectures correctly", () => {
    expect(getRegion("東京")).toBe("関東");
    expect(getRegion("神奈川")).toBe("関東");
  });

  it("should map Okinawa correctly", () => {
    expect(getRegion("沖縄")).toBe("沖縄");
  });

  it("should return unknown for invalid prefecture", () => {
    expect(getRegion("存在しない県")).toBe("不明");
  });
});

// レスポンシブ設定のテスト
describe("Responsive map configuration", () => {
  function getResponsiveConfig(width: number) {
    if (width < 320) {
      return { cellSize: 44, fontSize: 8, gap: 2 };
    } else if (width < 375) {
      return { cellSize: 44, fontSize: 9, gap: 2 };
    } else if (width < 414) {
      return { cellSize: 46, fontSize: 10, gap: 3 };
    } else if (width < 768) {
      return { cellSize: 48, fontSize: 11, gap: 3 };
    } else if (width < 1024) {
      return { cellSize: 56, fontSize: 12, gap: 4 };
    } else if (width < 1440) {
      return { cellSize: 64, fontSize: 14, gap: 5 };
    } else if (width < 2560) {
      return { cellSize: 72, fontSize: 16, gap: 6 };
    } else {
      return { cellSize: 80, fontSize: 18, gap: 6 };
    }
  }

  it("should return minimum 44px cell size for all screen sizes", () => {
    const screenWidths = [280, 320, 375, 414, 768, 1024, 1440, 2560];
    screenWidths.forEach(width => {
      const config = getResponsiveConfig(width);
      expect(config.cellSize).toBeGreaterThanOrEqual(44);
    });
  });

  it("should increase cell size with screen width", () => {
    const small = getResponsiveConfig(320);
    const large = getResponsiveConfig(1440);
    expect(large.cellSize).toBeGreaterThan(small.cellSize);
  });

  it("should increase font size with screen width", () => {
    const small = getResponsiveConfig(320);
    const large = getResponsiveConfig(1440);
    expect(large.fontSize).toBeGreaterThan(small.fontSize);
  });
});

// ヒートマップ色計算のテスト
describe("Heatmap color calculation", () => {
  function getHeatmapColor(count: number, maxCount: number, baseColor: string): string {
    if (count === 0) return baseColor;
    
    const ratio = maxCount > 0 ? count / maxCount : 0;
    
    if (ratio < 0.1) return "#FFA726"; // オレンジ
    if (ratio < 0.4) return "#FF7043"; // 赤オレンジ
    if (ratio < 0.7) return "#F44336"; // 赤
    return "#C62828"; // 濃い赤
  }

  it("should return base color for 0 participants", () => {
    expect(getHeatmapColor(0, 100, "#4FC3F7")).toBe("#4FC3F7");
  });

  it("should return orange for low participation", () => {
    expect(getHeatmapColor(5, 100, "#4FC3F7")).toBe("#FFA726");
  });

  it("should return red-orange for medium participation", () => {
    expect(getHeatmapColor(20, 100, "#4FC3F7")).toBe("#FF7043");
  });

  it("should return red for high participation", () => {
    expect(getHeatmapColor(50, 100, "#4FC3F7")).toBe("#F44336");
  });

  it("should return dark red for very high participation", () => {
    expect(getHeatmapColor(80, 100, "#4FC3F7")).toBe("#C62828");
  });
});

// グリッドレイアウト計算のテスト
describe("Grid layout calculation", () => {
  function calculateGridLayout(screenWidth: number, cellSize: number, gap: number) {
    const padding = 16;
    const availableWidth = screenWidth - padding * 2;
    const numCols = Math.floor(availableWidth / (cellSize + gap));
    const actualCellSize = Math.floor((availableWidth - gap * (numCols - 1)) / numCols);
    
    return {
      numCols,
      cellSize: Math.max(actualCellSize, 44), // 最小44px保証
      totalWidth: numCols * (actualCellSize + gap) - gap,
    };
  }

  it("should calculate grid layout correctly", () => {
    const layout = calculateGridLayout(375, 46, 3);
    expect(layout.numCols).toBeGreaterThan(0);
    expect(layout.cellSize).toBeGreaterThanOrEqual(44);
  });

  it("should guarantee minimum cell size of 44px", () => {
    const layout = calculateGridLayout(280, 30, 2);
    expect(layout.cellSize).toBeGreaterThanOrEqual(44);
  });
});

// 統計サマリー計算のテスト
describe("Statistics summary calculation", () => {
  interface PrefectureData {
    name: string;
    count: number;
  }

  function calculateSummary(data: PrefectureData[]) {
    const prefecturesWithParticipants = data.filter(p => p.count > 0).length;
    const totalParticipants = data.reduce((sum, p) => sum + p.count, 0);
    const maxParticipants = Math.max(...data.map(p => p.count));
    const hottestPrefecture = data.find(p => p.count === maxParticipants)?.name || "";

    return {
      prefecturesWithParticipants,
      totalParticipants,
      maxParticipants,
      hottestPrefecture,
    };
  }

  it("should calculate summary correctly", () => {
    const data: PrefectureData[] = [
      { name: "東京", count: 100 },
      { name: "大阪", count: 50 },
      { name: "北海道", count: 0 },
    ];

    const summary = calculateSummary(data);
    expect(summary.prefecturesWithParticipants).toBe(2);
    expect(summary.totalParticipants).toBe(150);
    expect(summary.maxParticipants).toBe(100);
    expect(summary.hottestPrefecture).toBe("東京");
  });

  it("should handle empty data", () => {
    const data: PrefectureData[] = [];
    const summary = calculateSummary(data);
    expect(summary.prefecturesWithParticipants).toBe(0);
    expect(summary.totalParticipants).toBe(0);
  });
});

// アクセシビリティラベル生成のテスト
describe("Accessibility label generation", () => {
  function generateAccessibilityLabel(prefecture: string, count: number): string {
    if (count === 0) {
      return `${prefecture}、参加者なし`;
    }
    return `${prefecture}、${count}人が参加`;
  }

  it("should generate label for prefecture with participants", () => {
    expect(generateAccessibilityLabel("東京", 100)).toBe("東京、100人が参加");
  });

  it("should generate label for prefecture without participants", () => {
    expect(generateAccessibilityLabel("北海道", 0)).toBe("北海道、参加者なし");
  });
});
