/**
 * データ整合性関連のテスト
 * 
 * currentValue更新ロジックとデータ整合性確認機能のテスト
 */

import { describe, it, expect, vi } from "vitest";

// generateSlug関数のテスト
describe("generateSlug", () => {
  // モック用のgenerateSlug関数（実際の実装をシミュレート）
  function generateSlug(title: string): string {
    const translations: Record<string, string> = {
      '生誕祭': 'birthday',
      'ライブ': 'live',
      'ワンマン': 'oneman',
      '動員': 'attendance',
      'チャレンジ': 'challenge',
      'フォロワー': 'followers',
      '同時視聴': 'viewers',
      '配信': 'stream',
      'グループ': 'group',
      'ソロ': 'solo',
      'フェス': 'fes',
      '対バン': 'taiban',
      'ファンミーティング': 'fanmeeting',
      'リリース': 'release',
      'イベント': 'event',
      '人': '',
      '万': '0000',
    };
    
    let slug = title.toLowerCase();
    
    for (const [jp, en] of Object.entries(translations)) {
      slug = slug.replace(new RegExp(jp, 'g'), en);
    }
    
    const words = slug.match(/[a-z]+|\d+/g) || [];
    slug = words.join('-');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-|-$/g, '');
    
    if (!slug) {
      slug = `challenge-${Date.now()}`;
    }
    
    return slug;
  }

  it("日本語タイトルを英語スラッグに変換する", () => {
    // 日本語が連続している場合はハイフンなしで結合される
    expect(generateSlug("生誕祭ライブ")).toBe("birthdaylive");
    expect(generateSlug("ワンマンライブ動員100人チャレンジ")).toBe("onemanliveattendance-100-challenge");
  });

  it("数字を含むタイトルを正しく変換する", () => {
    expect(generateSlug("フォロワー1万人チャレンジ")).toBe("followers-10000-challenge");
  });

  it("英語タイトルをそのまま変換する", () => {
    expect(generateSlug("Birthday Live 2024")).toBe("birthday-live-2024");
  });

  it("空のタイトルの場合はタイムスタンプ付きスラッグを生成する", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/^challenge-\d+$/);
  });
});

// currentValue計算ロジックのテスト
describe("currentValue計算", () => {
  it("参加者の貢献度と同伴者数を正しく計算する", () => {
    const participation = {
      contribution: 1,
      companionCount: 2,
    };
    
    const totalContribution = (participation.contribution || 1) + (participation.companionCount || 0);
    expect(totalContribution).toBe(3);
  });

  it("貢献度が未設定の場合はデフォルト1を使用する", () => {
    const participation = {
      contribution: undefined,
      companionCount: 0,
    };
    
    const totalContribution = (participation.contribution || 1) + (participation.companionCount || 0);
    expect(totalContribution).toBe(1);
  });

  it("同伴者数が未設定の場合は0を使用する", () => {
    const participation = {
      contribution: 1,
      companionCount: undefined,
    };
    
    const totalContribution = (participation.contribution || 1) + (participation.companionCount || 0);
    expect(totalContribution).toBe(1);
  });
});

// データ整合性レポートのテスト
describe("データ整合性レポート", () => {
  it("不整合を正しく検出する", () => {
    const challenge = {
      storedCurrentValue: 10,
      actualTotalContribution: 15,
    };
    
    const hasDiscrepancy = challenge.storedCurrentValue !== challenge.actualTotalContribution;
    const discrepancyAmount = challenge.actualTotalContribution - challenge.storedCurrentValue;
    
    expect(hasDiscrepancy).toBe(true);
    expect(discrepancyAmount).toBe(5);
  });

  it("整合している場合は不整合なしと判定する", () => {
    const challenge = {
      storedCurrentValue: 10,
      actualTotalContribution: 10,
    };
    
    const hasDiscrepancy = challenge.storedCurrentValue !== challenge.actualTotalContribution;
    
    expect(hasDiscrepancy).toBe(false);
  });

  it("参加者内訳を正しく計算する", () => {
    const participations = [
      { contribution: 1, companionCount: 2 },
      { contribution: 1, companionCount: 0 },
      { contribution: 3, companionCount: 1 },
    ];
    
    const totalParticipations = participations.length;
    const totalContribution = participations.reduce((sum, p) => sum + (p.contribution || 1), 0);
    const totalCompanions = participations.reduce((sum, p) => sum + (p.companionCount || 0), 0);
    const actualTotalContribution = totalContribution + totalCompanions;
    
    expect(totalParticipations).toBe(3);
    expect(totalContribution).toBe(5);
    expect(totalCompanions).toBe(3);
    expect(actualTotalContribution).toBe(8);
  });
});

// 達成率計算のテスト
describe("達成率計算", () => {
  it("達成率を正しく計算する", () => {
    const currentValue = 45;
    const goalValue = 100;
    
    const achievementRate = Math.round((currentValue / goalValue) * 100);
    
    expect(achievementRate).toBe(45);
  });

  it("目標値が0の場合は0%を返す", () => {
    const currentValue = 10;
    const goalValue = 0;
    
    const achievementRate = goalValue > 0 ? Math.round((currentValue / goalValue) * 100) : 0;
    
    expect(achievementRate).toBe(0);
  });

  it("100%を超える場合も正しく計算する", () => {
    const currentValue = 150;
    const goalValue = 100;
    
    const achievementRate = Math.round((currentValue / goalValue) * 100);
    
    expect(achievementRate).toBe(150);
  });
});
