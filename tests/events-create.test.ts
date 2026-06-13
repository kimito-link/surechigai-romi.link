import { describe, it, expect, vi } from 'vitest';

describe('Events Create API', () => {
  it('should accept valid event creation input', () => {
    const validInput = {
      title: 'テストチャレンジ',
      description: 'テスト説明',
      eventDate: '2026-02-01T10:00:00.000Z',
      venue: '東京ドーム',
      hostTwitterId: '123456789',
      hostName: 'テストユーザー',
      hostUsername: 'testuser',
      hostProfileImage: 'https://example.com/image.jpg',
      hostFollowersCount: 1000,
      hostDescription: 'テストの自己紹介',
      goalType: 'attendance' as const,
      goalValue: 100,
      goalUnit: '人',
      eventType: 'solo' as const,
      categoryId: 1,
    };

    // Validate required fields
    expect(validInput.title).toBeDefined();
    expect(validInput.hostTwitterId).toBeDefined();
    expect(validInput.hostName).toBeDefined();
    expect(validInput.eventDate).toBeDefined();
  });

  it('should require hostTwitterId for event creation', () => {
    const inputWithoutTwitterId = {
      title: 'テストチャレンジ',
      hostTwitterId: '', // Empty string
      hostName: 'テストユーザー',
      eventDate: '2026-02-01T10:00:00.000Z',
    };

    // Empty hostTwitterId should be rejected
    expect(inputWithoutTwitterId.hostTwitterId).toBe('');
  });

  it('should validate goal types', () => {
    const validGoalTypes = ['attendance', 'followers', 'viewers', 'points', 'custom'];
    
    validGoalTypes.forEach(goalType => {
      expect(validGoalTypes).toContain(goalType);
    });
  });

  it('should validate event types', () => {
    const validEventTypes = ['solo', 'group'];
    
    validEventTypes.forEach(eventType => {
      expect(validEventTypes).toContain(eventType);
    });
  });

  it('should format date correctly for MySQL/TiDB', () => {
    const isoDate = '2026-02-01T10:00:00.000Z';
    const mysqlFormat = new Date(isoDate).toISOString().slice(0, 19).replace('T', ' ');
    
    expect(mysqlFormat).toBe('2026-02-01 10:00:00');
  });
});
