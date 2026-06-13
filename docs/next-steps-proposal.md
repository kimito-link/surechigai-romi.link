# 次のステップ提案 - GPT相談用

## 現状のサマリー

### 完了した作業

1. **視認性問題の修正**
   - ContributionRanking.tsx: ユーザー名・フォロワー数の色とフォントサイズを修正
   - MessageCard.tsx: 同様に修正

2. **eventsテーマトークンの作成**
   - `features/events/ui/theme/tokens.ts` を作成
   - ContributionRanking.tsx と MessageCard.tsx でトークンを使用

### 残存する直書き色

| 場所 | 直書き色の数 | 主な用途 |
|------|-------------|---------|
| `features/events/` | 21箇所 | アクセントカラー、補助テキスト |
| `features/home/` | 多数 | グラデーション、日付表示 |
| `app/` 配下 | 多数 | 各画面のUI要素 |

---

## 選択肢の詳細

### 選択肢1: 他のeventsコンポーネントもトークン化

**対象ファイル（21箇所）:**
- `ContributionRanking.tsx` - 残り2箇所（fallbackColor, 貢献度表示）
- `MessageCard.tsx` - 残り8箇所（補助テキスト、アイコン色）
- `ParticipantsList.tsx` - 6箇所
- `ProgressGrid.tsx` - 3箇所
- `RegionMap.tsx` - 2箇所

**作業内容:**
1. `tokens.ts` にトークンを追加（fallback, accent, icon など）
2. 各ファイルの直書き色をトークンに置換

**メリット:**
- events内の一貫性が完全に確保される
- 将来の修正が容易
- 約1-2時間で完了可能

**デメリット:**
- events以外の画面には効果なし

---

### 選択肢2: ChallengeCard.tsxの視認性改善

**対象箇所:**
```tsx
// 128-129行目
<MaterialIcons name="event" size={12} color="#DD6500" />
<Text style={{ color: "#DD6500", fontSize: 11, marginLeft: 2 }}>{formattedDate}</Text>
```

**問題:**
- 日付表示が `#DD6500`（コントラスト比 4.78:1）+ 11px
- ホーム画面で頻繁に表示されるため影響大

**修正案:**
- 色: `#DD6500` → `#FBBF24`（コントラスト比 10.13:1）
- フォントサイズ: 11px → 12px

**メリット:**
- 最小の作業量（2箇所のみ）
- ホーム画面の視認性が即座に改善
- 約10分で完了

**デメリット:**
- 根本的な解決ではない（直書きが残る）

---

### 選択肢3: アプリ全体のテキストトークン作成

**作業内容:**
1. `constants/text-colors.ts` を作成
2. アプリ全体の直書き色をトークンに置換（469箇所）

**メリット:**
- 全画面で一貫した色使用
- 将来の保守性が大幅に向上
- ダーク/ライトテーマ対応が容易

**デメリット:**
- 大規模な変更（469箇所）
- リグレッションリスクあり
- 数日〜1週間の作業

---

## 質問

1. **優先順位**: どの選択肢を先に進めるべきですか？

2. **組み合わせ**: 複数の選択肢を組み合わせる場合、どの順序が最適ですか？

3. **選択肢3の実行タイミング**: アプリ全体のトークン化は今すぐ必要ですか？それとも機能開発が落ち着いてからの方が良いですか？

4. **追加の視認性問題**: 他に優先的に修正すべき画面や箇所はありますか？

---

## 私の推奨（参考）

**短期（今すぐ）:** 選択肢2（ChallengeCard.tsxの視認性改善）
- 最小の作業で最大の効果
- ホーム画面は最も閲覧頻度が高い

**中期（今週中）:** 選択肢1（他のeventsコンポーネントもトークン化）
- events内を完全にトークン化
- イベント詳細画面の品質向上

**長期（機能開発後）:** 選択肢3（アプリ全体のテキストトークン作成）
- 大規模リファクタリングは安定期に実施
- 計画的に段階的に進める

---

## 補足: 現在のトークン定義

```typescript
// features/events/ui/theme/tokens.ts
export const eventText = {
  primary: "#E5E7EB",   // ほぼ白
  muted: "#D1D5DB",     // サブテキスト
  username: "#FBBF24",  // @username
  follower: "#F472B6",  // フォロワー数
  secondary: "#9CA3AF", // 補助テキスト（大きいサイズ用）
  hint: "#6B7280",      // ヒントテキスト
} as const;

export const eventFont = {
  meta: 12,       // フォロワー数、日付など
  username: 12,   // @username
  body: 14,       // 本文
  title: 16,      // タイトル
} as const;
```
