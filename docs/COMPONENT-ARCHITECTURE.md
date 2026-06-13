# コンポーネントアーキテクチャ（Atomic Design）

このプロジェクトでは、Brad Frostが提唱したAtomic Designパターンに基づいてコンポーネントを整理しています。このアプローチにより、再利用性の高い一貫したUIを構築し、メンテナンス性を向上させています。

## ディレクトリ構成

```
components/
├── atoms/           # 基本UI要素（22コンポーネント）
├── molecules/       # 複合コンポーネント（31コンポーネント）
├── organisms/       # 機能単位コンポーネント（17コンポーネント）
└── templates/       # ページレイアウト（将来追加予定）
```

合計70コンポーネントがAtomic Design構造に整理されています。

---

## Atoms（原子）

最小単位のUIコンポーネントです。単独で意味を持ち、他のコンポーネントの構成要素となります。これらは他のコンポーネントに依存せず、プロジェクト全体で再利用されます。

### ボタン系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Button** | 基本ボタン（variant: primary/secondary/ghost/danger） | フォーム送信、アクション実行 |
| **LoadingButton** | ローディング状態付きボタン | 非同期処理中の表示 |
| **HoverableButton** | ホバー効果付きボタン | PC表示でのインタラクション |

### 入力系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Input** | テキスト入力フィールド | フォーム入力 |

### テキスト・ラベル系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Text** | スタイル付きテキスト | 統一されたテキスト表示 |
| **Badge** | ステータスバッジ | 状態表示、カウント表示 |

### アイコン系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **IconSymbol** | SF Symbols/Material Iconsの統合アイコン | ナビゲーション、アクション |
| **LabeledIcon** | ラベル付きアイコン | アクセシビリティ向上 |

### フィードバック系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Skeleton** | ローディングスケルトン | コンテンツ読み込み中表示 |
| **SkeletonLoader** | 各種スケルトンバリエーション | カード、リスト、プロフィール用 |
| **Toast** | 通知トースト | 成功/エラー通知 |
| **SyncStatusIndicator** | 同期状態インジケーター | オフライン/同期中表示 |

### アニメーション系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **BlinkingCharacter** | まばたきアニメーション付きキャラクター | ローディング画面 |
| **HelloWave** | 手を振るアニメーション | ウェルカム表示 |

### ナビゲーション系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **ExternalLink** | 外部リンク | 外部サイトへの遷移 |
| **HapticTab** | ハプティクス付きタブ | タブバーナビゲーション |

### ユーティリティ系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Countdown** | カウントダウンタイマー | イベント開始までの表示 |
| **LazyLoadingFallback** | 遅延読み込みフォールバック | Suspense用フォールバック |
| **Touchable** | アクセシビリティ対応タッチターゲット | 44px以上のタップ領域確保 |

### ビュー系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **ThemedView** | テーマ対応ビュー | 背景色の自動切り替え |
| **ParallaxScrollView** | パララックススクロール | ヘッダー画像付きスクロール |

---

## Molecules（分子）

Atomsを組み合わせた再利用可能なコンポーネントです。特定の機能を持ちながらも、様々な場面で再利用できるよう設計されています。

### カード系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Card** | カードコンテナ（Header, Footer付き） | コンテンツのグループ化 |
| **HoverableCard** | ホバー効果付きカード | PC表示でのインタラクション |
| **PressableCard** | プレス効果付きカード | タップ可能なカード |
| **AnimatedPressable** | アニメーション付きプレス | スケール/フェードアニメーション |

### 画像・アバター系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **LazyImage/LazyAvatar** | 遅延読み込み画像 | パフォーマンス最適化 |
| **OptimizedImage/OptimizedAvatar** | 最適化画像（WebP対応） | 画像サイズ最適化 |
| **ProgressiveImage** | プログレッシブ画像読み込み | 低解像度→高解像度表示 |

### リストアイテム系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **HoverableListItem** | ホバー効果付きリストアイテム | PC表示でのリスト |
| **AnimatedListItem** | アニメーション付きリストアイテム | フェードイン/スライドイン |

### モーダル系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **ConfirmModal** | 確認モーダル | 削除/ログアウト確認 |
| **FollowSuccessModal** | フォロー成功モーダル | フォロー完了時のお祝い |
| **LoginSuccessModal** | ログイン成功モーダル | ログイン完了時の表示 |
| **LoginSuccessModalWrapper** | ログイン成功モーダルラッパー | グローバルモーダル管理 |
| **SharePromptModal** | シェア促進モーダル | 参加表明後のシェア促進 |
| **PrefectureParticipantsModal** | 都道府県別参加者モーダル | 地域別参加者表示 |
| **RegionParticipantsModal** | 地域別参加者モーダル | ブロック別参加者表示 |

### フォーム系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **DatePicker** | 日付選択 | イベント日時設定 |
| **ExportButton** | エクスポートボタン | データエクスポート |
| **ReminderButton** | リマインダーボタン | リマインダー設定 |
| **ShareButton** | シェアボタン | SNSシェア |

### キャラクター系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **BlinkingCharacter** | まばたきキャラクター | ローディング画面 |
| **CelebrationAnimation** | お祝いアニメーション | 達成時の演出 |
| **InteractiveCharacter** | インタラクティブキャラクター | タップ反応 |
| **TalkingCharacter** | 吹き出し付きキャラクター | セリフ表示 |

### ユーティリティ系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **Collapsible** | 折りたたみコンテンツ | FAQ、詳細表示 |
| **EnhancedRefreshControl** | 強化プルリフレッシュ | リスト更新 |
| **FollowGate** | フォローゲート | プレミアム機能制限 |
| **LoadingScreen** | ローディング画面 | 画面読み込み中表示 |
| **ResponsiveContainer** | レスポンシブコンテナ | PC/モバイル対応 |
| **ThemeSettingsPanel** | テーマ設定パネル | ライト/ダーク切り替え |

---

## Organisms（有機体）

特定の機能を持つ大きなコンポーネントです。ページの主要なセクションを構成し、ビジネスロジックを含むことがあります。

### ヘッダー・ナビゲーション系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **AppHeader** | アプリヘッダー | 画面上部のヘッダー |
| **GlobalMenu** | グローバルメニュー | ハンバーガーメニュー |
| **ScreenContainer** | 画面コンテナ | SafeArea対応レイアウト |

### チャート・地図系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **JapanHeatmap** | 日本地図ヒートマップ | 地域別参加者分布 |
| **JapanMap** | 日本地図 | 都道府県選択 |
| **JapanBlockMap** | 日本ブロック地図 | 地方別表示 |
| **JapanDeformedMap** | デフォルメ日本地図 | 簡略化地図表示 |
| **GrowthTrajectoryChart** | 成長軌跡チャート | 参加者推移グラフ |

### セクション系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **TicketTransferSection** | チケット譲渡セクション | 譲渡掲示板 |
| **ParticipantRanking** | 参加者ランキング | 貢献度ランキング |
| **OnboardingSteps** | オンボーディングステップ | 初回利用ガイド |
| **NotificationSettings** | 通知設定 | プッシュ通知設定 |

### エラー・状態表示系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **ErrorMessage** | エラーメッセージ表示 | エラー状態表示 |
| **OfflineBanner** | オフラインバナー | ネットワーク切断表示 |

### スケルトン系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **EventDetailSkeleton** | イベント詳細スケルトン | 詳細画面ローディング |
| **MypageSkeleton** | マイページスケルトン | マイページローディング |

### アカウント系

| コンポーネント | 説明 | 主な用途 |
|--------------|------|---------|
| **AccountSwitcher** | アカウント切り替え | 複数アカウント管理 |

---

## 使用方法

### Atomsからのインポート

```tsx
import { Button, Input, Badge, IconSymbol, Skeleton } from "@/components/atoms";

// 使用例
<Button variant="primary" onPress={handleSubmit}>
  送信する
</Button>

<Input
  placeholder="名前を入力"
  value={name}
  onChangeText={setName}
/>

<Badge variant="success">完了</Badge>
```

### Moleculesからのインポート

```tsx
import { 
  Card, 
  CardHeader, 
  LazyAvatar, 
  TalkingCharacter,
  ConfirmModal 
} from "@/components/molecules";

// カード使用例
<Card>
  <CardHeader title="チャレンジ情報" />
  <Text>内容...</Text>
</Card>

// キャラクター使用例
<TalkingCharacter
  characterType="link"
  messages={["こんにちは！", "応援してるよ！"]}
  onTap={handleTap}
/>

// モーダル使用例
<ConfirmModal
  visible={showModal}
  title="確認"
  message="本当に削除しますか？"
  onConfirm={handleDelete}
  onCancel={() => setShowModal(false)}
/>
```

### Organismsからのインポート

```tsx
import { 
  AppHeader, 
  ScreenContainer, 
  JapanHeatmap,
  TicketTransferSection 
} from "@/components/organisms";

// 画面レイアウト例
<ScreenContainer containerClassName="bg-background">
  <AppHeader title="ホーム" showBackButton={false} />
  <ScrollView>
    <JapanHeatmap data={participantData} />
    <TicketTransferSection eventId={eventId} />
  </ScrollView>
</ScreenContainer>
```

---

## 設計原則

### 1. 単一責任

各コンポーネントは1つの責任のみを持ちます。複数の責任を持つコンポーネントは、より小さなコンポーネントに分割します。

### 2. 再利用性

汎用的に使えるよう設計し、特定のコンテキストに依存しないようにします。プロップスを通じて柔軟にカスタマイズできるようにします。

### 3. 一貫性

デザインシステムに従った統一されたスタイルを適用します。色、フォント、間隔は`constants/design-system.ts`と`constants/colors.ts`で一元管理しています。

### 4. アクセシビリティ

Apple Human Interface Guidelinesに準拠し、タッチターゲットは最小44x44pxを確保しています。色のコントラスト比はWCAG AA基準（4.5:1以上）を満たしています。

### 5. パフォーマンス

遅延読み込み（LazyImage）、メモ化（React.memo、useMemo）、仮想化（FlatList）を活用してパフォーマンスを最適化しています。

### 6. テーマ対応

ライトモード/ダークモードの両方に対応しています。ハードコードされた色は使用せず、テーマ変数（`useColors`フック、`useThemedStyles`フック）を使用します。

---

## ファイル命名規則

コンポーネントファイルは以下の命名規則に従います。

| 規則 | 例 |
|-----|-----|
| ケバブケース | `loading-button.tsx` |
| 機能を表す名前 | `celebration-animation.tsx` |
| プラットフォーム固有 | `icon-symbol.ios.tsx` |

---

## 今後の予定

以下の改善を計画しています。

1. **Templates（ページレイアウト）の追加**: 共通のページレイアウトパターンをテンプレート化
2. **Storybookの導入**: コンポーネントカタログとビジュアルテスト環境の構築
3. **アクセシビリティテストの強化**: 自動化されたa11yテストの追加
4. **パフォーマンスモニタリング**: コンポーネントレベルのパフォーマンス計測

---

*最終更新: 2026年1月16日 | バージョン: v4.98*
