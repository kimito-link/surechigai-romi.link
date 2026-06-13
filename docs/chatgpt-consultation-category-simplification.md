# ChatGPT相談: カテゴリ整理（ライブ動員のみに絞る）

## 背景

React Native（Expo）モバイルアプリで、「動員ちゃれんじ」を開発しています。現在、カテゴリシステムが複雑すぎてユーザーを迷わせているため、**ライブ動員のみに絞る**ことを検討しています。

## プロジェクト概要

- **アプリ名**: 君斗りんくの動員ちゃれんじ（生誕祭応援アプリ）
- **技術スタック**: React Native 0.81, Expo SDK 54, TypeScript, NativeWind
- **データベース**: MySQL（TiDB）+ Drizzle ORM
- **現在のバージョン**: 04af9d09

## 現在のカテゴリシステム

### フロントエンド（constants/event-categories.ts）

#### GENRES（ジャンル）8種類
```typescript
export const GENRES = [
  { id: "idol", label: "アイドル", icon: "🎀", color: "#EC4899" },
  { id: "artist", label: "アーティスト", icon: "🎤", color: "#8B5CF6" },
  { id: "vtuber", label: "Vtuber", icon: "🎮", color: "#06B6D4" },
  { id: "streamer", label: "配信者", icon: "📺", color: "#F59E0B" },
  { id: "band", label: "バンド", icon: "🎸", color: "#EF4444" },
  { id: "dancer", label: "ダンサー", icon: "💃", color: "#10B981" },
  { id: "voice_actor", label: "声優", icon: "🎙️", color: "#6366F1" },
  { id: "other", label: "その他", icon: "✨", color: "#64748B" },
] as const;
```

#### PURPOSES（目的）8種類
```typescript
export const PURPOSES = [
  { id: "live", label: "ライブ・イベント", icon: "🎪", description: "ライブ、コンサート、ファンミーティングなど" },
  { id: "streaming", label: "配信イベント", icon: "📡", description: "YouTube配信、ミクチャ、ツイキャスなど" },
  { id: "release", label: "リリース", icon: "💿", description: "CD、DVD、グッズのリリースイベント" },
  { id: "birthday", label: "生誕祭", icon: "🎂", description: "メンバーの誕生日イベント" },
  { id: "anniversary", label: "周年イベント", icon: "🎉", description: "デビュー周年、グループ結成周年など" },
  { id: "goods", label: "グッズ・物販", icon: "🛍️", description: "グッズ販売、物販イベント" },
  { id: "survey", label: "調査・アンケート", icon: "📊", description: "ファン調査、アンケート企画" },
  { id: "other", label: "その他", icon: "📌", description: "上記に当てはまらないもの" },
] as const;
```

### データベース（drizzle/schema/challenges.ts）

```typescript
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  // ... 他のカラム
  categoryId: int("categoryId"), // ← これだけ
  // genre列とpurpose列は存在しない
});
```

## 重大な問題

**フロントエンドで選択したgenreとpurposeは、データベースに保存されていません。**

- UIでGenreSelectorとPurposeSelectorが表示される
- ユーザーが選択できる
- **しかし、データベースに保存されない**
- 既存データには`categoryId`しかない

## 目指す姿

**「ライブ動員」のみに絞る**

- ユーザーを迷わせない
- シンプルで分かりやすい
- 後から追加可能な設計

## 相談したいこと

### 1. 実装方針の選択

**A案: PURPOSESを"live"のみに絞る（最短）**

```typescript
// constants/event-categories.ts
export const PURPOSES = [
  { id: "live", label: "ライブ・イベント", icon: "🎪", description: "ライブ、コンサート、ファンミーティングなど" },
] as const;
```

**メリット**:
- データベーススキーマ変更なし
- 既存データに影響なし
- 最短で実装可能

**デメリット**:
- PurposeSelectorが1つしか選択肢がない（意味がない？）
- データベースに保存されない

---

**B案: PURPOSESを"live"と"streaming"に絞る**

```typescript
export const PURPOSES = [
  { id: "live", label: "ライブ・イベント", icon: "🎪", description: "ライブ、コンサート、ファンミーティングなど" },
  { id: "streaming", label: "配信イベント", icon: "📡", description: "YouTube配信、ミクチャ、ツイキャスなど" },
] as const;
```

**メリット**:
- 「リアルイベント」と「オンラインイベント」の2択
- 選択肢として意味がある

**デメリット**:
- データベースに保存されない（A案と同じ）

---

**C案: データベースにpurpose列を追加して保存する**

```typescript
// drizzle/schema/challenges.ts
export const challenges = mysqlTable("challenges", {
  // ... 他のカラム
  categoryId: int("categoryId"),
  purpose: varchar("purpose", { length: 32 }), // ← 追加
});
```

**メリット**:
- データが正しく保存される
- 後から分析・フィルタリング可能

**デメリット**:
- マイグレーション実行が必要
- 既存データの移行が必要
- 実装時間がかかる

---

**D案: PurposeSelectorを完全に削除**

```typescript
// CreateChallengeForm.tsxから削除
// <PurposeSelector ... /> ← この行を削除
```

**メリット**:
- 最もシンプル
- ユーザーを迷わせない
- 実装が最短

**デメリット**:
- 将来的に追加する場合、UIを再設計

### 2. GENRESの扱い

**質問**: GENRESも絞るべきか？

**現状**: 8種類（アイドル/アーティスト/Vtuber/配信者/バンド/ダンサー/声優/その他）

**選択肢**:
- **そのまま**: 8種類を維持（ジャンルは重要な情報）
- **絞る**: 主要な3〜4種類に絞る
- **削除**: GenreSelectorを完全に削除

### 3. 既存データの扱い

**質問**: 既存データはどうすべきか？

**現状**:
- `categoryId`のみ保存されている
- `genre`と`purpose`は保存されていない

**選択肢**:
- **A**: 既存データはそのまま（categoryIdのみ）
- **B**: 既存データにデフォルト値を設定（例: purpose="live"）
- **C**: 既存データを手動で移行

### 4. フォールバック表示

**質問**: 既存データ（birthday/release/host等）をどう表示すべきか？

**現状の問題**:
- 既存データには`categoryId`しかない
- `purpose`が保存されていないため、表示できない

**選択肢**:
- **A**: categoryIdから推測して表示（例: categoryId=1 → "ライブ"）
- **B**: "その他"として表示
- **C**: 表示しない（非表示）

### 5. 段階的な実装

**質問**: 一度に全て変更すべきか、段階的に進めるべきか？

**段階的な実装案**:
1. **Phase 1**: PURPOSESを"live"のみに絞る（UI変更のみ）
2. **Phase 2**: データベースにpurpose列を追加
3. **Phase 3**: 既存データを移行
4. **Phase 4**: 必要に応じて選択肢を追加

**一度に全て変更**:
- データベーススキーマ変更 + UI変更 + データ移行を同時実行

## 制約条件

### 技術的制約
- React Native環境（モバイルアプリ）
- MySQL（TiDB）データベース
- Drizzle ORM使用
- 本番環境にデプロイ済み

### ビジネス制約
- ユーザーを迷わせない（最優先）
- 既存データを壊さない
- 後から追加可能な設計

### 開発制約
- Phase 2（ログインUX改善）の前に完了させたい
- 最短で実装したい

## 期待する回答

以下の観点でアドバイスをお願いします：

1. **実装方針**: A/B/C/D案のどれが最適か（または別案）
2. **GENRESの扱い**: そのまま/絞る/削除のどれが良いか
3. **既存データの扱い**: どう移行すべきか
4. **フォールバック表示**: どう表示すべきか
5. **段階的な実装**: 一度に全て変更 vs 段階的実装

## 添付資料

以下のファイルを参照してください：

1. `constants/event-categories.ts` - 現在のGENRESとPURPOSES定義
2. `drizzle/schema/challenges.ts` - challengesテーブル定義
3. `features/create/hooks/use-create-challenge.ts` - フォーム状態管理
4. `features/create/ui/components/PurposeSelector.tsx` - PurposeSelector実装

---

**質問者**: 君斗りんくの動員ちゃれんじ開発チーム  
**日付**: 2026年1月25日  
**優先度**: 高（Phase 2の前に完了させたい）
