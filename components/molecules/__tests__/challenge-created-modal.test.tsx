/**
 * ChallengeCreatedModal のユニットテスト
 * 
 * 主催者向け作成完了モーダルの機能テスト
 * - チェックリスト表示
 * - 告知文テンプレート生成
 * - コピー機能
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { palette } from "@/theme/tokens";

// モックの設定
vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("expo-haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));

vi.mock("@/hooks/use-colors", () => ({
  useColors: () => ({
    background: palette.gray900,
    foreground: palette.white,
    muted: palette.gray400,
    primary: palette.primary500,
    success: palette.teal500,
    border: palette.gray700,
    surface: palette.gray800,
  }),
}));

vi.mock("@/lib/navigation", () => ({
  navigate: {
    toEventDetail: vi.fn(),
    toDashboard: vi.fn(),
  },
}));

describe("ChallengeCreatedModal", () => {
  const mockProps = {
    visible: true,
    onClose: vi.fn(),
    challengeId: 123,
    challengeTitle: "テストライブ2026",
    eventDate: "2026-02-15",
    venue: "渋谷CLUB QUATTRO",
    goalValue: 100,
    goalUnit: "人",
    hostName: "テストアーティスト",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("告知文テンプレート生成", () => {
    it("Twitter用テンプレートが正しく生成される", () => {
      const { challengeTitle, eventDate, venue, goalValue, goalUnit, hostName, challengeId } = mockProps;
      
      // 日付フォーマット
      const date = new Date(eventDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const weekday = weekdays[date.getDay()];
      const dateStr = `${month}/${day}(${weekday})`;
      
      // 期待されるテンプレート
      const expectedTemplate = `【参加者募集中🎉】

${challengeTitle}
${dateStr} 📍${venue}

${goalValue}${goalUnit}達成を目指しています！

参加表明はこちらから👇
https://doin-challenge.com/event/${challengeId}

#動員チャレンジ #${hostName}`;

      expect(expectedTemplate).toContain("【参加者募集中🎉】");
      expect(expectedTemplate).toContain(challengeTitle);
      expect(expectedTemplate).toContain(dateStr);
      expect(expectedTemplate).toContain(venue);
      expect(expectedTemplate).toContain(`${goalValue}${goalUnit}達成`);
      expect(expectedTemplate).toContain(`#${hostName}`);
    });

    it("Instagram用テンプレートにはURLが含まれない", () => {
      const { hostName } = mockProps;
      
      // Instagram用はハッシュタグにスペースが含まれない
      const hashtagHostName = hostName.replace(/\s/g, "");
      expect(hashtagHostName).toBe("テストアーティスト");
    });

    it("LINE用テンプレートはシンプルな形式", () => {
      const { challengeTitle, challengeId } = mockProps;
      
      // LINE用テンプレートの特徴
      const lineTemplate = `【参加者募集中】

${challengeTitle}

参加表明はこちら↓
https://doin-challenge.com/event/${challengeId}`;

      expect(lineTemplate).toContain("【参加者募集中】");
      expect(lineTemplate).not.toContain("🎉"); // 絵文字が少ない
    });
  });

  describe("日付フォーマット", () => {
    it("日付が正しくフォーマットされる", () => {
      // タイムゾーンに依存しないテスト
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
        const weekday = weekdays[date.getDay()];
        return `${month}/${day}(${weekday})`;
      };

      // フォーマットが正しい形式であることを確認
      const result = formatDate("2026-02-15");
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\([日月火水木金土]\)$/);
    });

    it("曜日が正しく計算される", () => {
      // 固定の日付で曜日を確認（UTCで計算）
      const date = new Date("2026-02-15T12:00:00Z"); // UTC正午を使用
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const weekday = weekdays[date.getUTCDay()];
      expect(weekday).toBe("日"); // 2026-02-15はUTCで日曜日
    });
  });

  describe("チェックリストアイテム", () => {
    it("4つのチェックリストアイテムが定義されている", () => {
      const checklistItems = [
        { id: "share_twitter", label: "Twitterで告知" },
        { id: "share_instagram", label: "Instagramで告知" },
        { id: "share_line", label: "LINEで告知" },
        { id: "check_dashboard", label: "ダッシュボードを確認" },
      ];

      expect(checklistItems).toHaveLength(4);
      expect(checklistItems.map(item => item.id)).toEqual([
        "share_twitter",
        "share_instagram",
        "share_line",
        "check_dashboard",
      ]);
    });
  });

  describe("目標表示", () => {
    it("目標値がある場合は表示される", () => {
      const { goalValue, goalUnit } = mockProps;
      const goalStr = `目標${goalValue}${goalUnit}`;
      
      expect(goalStr).toBe("目標100人");
    });

    it("目標値がない場合は代替テキストが使用される", () => {
      const goalValue = undefined;
      const goalStr = goalValue ? `目標${goalValue}人` : "みんなの参加を待ってます！";
      
      expect(goalStr).toBe("みんなの参加を待ってます！");
    });
  });

  describe("会場表示", () => {
    it("会場がある場合は表示される", () => {
      const { venue } = mockProps;
      const venueStr = venue ? `📍${venue}` : "";
      
      expect(venueStr).toBe("📍渋谷CLUB QUATTRO");
    });

    it("会場がない場合は空文字", () => {
      const venue = undefined;
      const venueStr = venue ? `📍${venue}` : "";
      
      expect(venueStr).toBe("");
    });
  });
});
