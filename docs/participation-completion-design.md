# 参加完了演出の設計 v4.7.0

**日付**: 2026年1月26日  
**目的**: ファンが参加完了時に「盛り上がった！」と感じる体験を作る

---

## 設計思想

> **「ライブ動員体験の"締め"を完成させる」**
> - 参加完了は「ゴール」ではなく「スタート」
> - ファンに「次はシェアしよう」と思わせる
> - 主催者に「次にやること」を明確に示す

---

## 現在の実装状況

### ✅ 既に実装されている機能

1. **フォームのリセット**
2. **メッセージ一覧へのスクロール**
3. **シェアプロンプトの表示**（2秒後）
4. **参加情報の保存**（`lastParticipation`）

### ❌ 未実装の機能

1. **りんく吹き出し「◯人目の参加だよ！」**
2. **県点灯演出**

---

## 実装仕様

### 1. りんく吹き出し「◯人目の参加だよ！」

#### 表示タイミング

- 参加完了直後（シェアプロンプトの前）
- 表示時間: 3秒間
- フェードイン/フェードアウト

#### 表示内容

```
あなたは◯人目の参加だよ！
みんなで盛り上げよう！
```

#### 実装方法

1. **参加者数の取得**:
   - `createParticipationMutation.onSuccess`で`refetch()`後に参加者数を取得
   - `lastParticipation`に`participantNumber`を追加

2. **りんく吹き出しの表示**:
   - `LinkSpeech`コンポーネントを使用
   - `showParticipantNumberSpeech`状態を追加
   - 3秒後に自動で非表示

3. **表示順序**:
   ```
   参加完了
   ↓
   フォームリセット
   ↓
   メッセージ一覧へスクロール
   ↓
   りんく吹き出し表示（3秒間）← NEW
   ↓
   シェアプロンプト表示（2秒後）
   ```

---

### 2. 県点灯演出

#### 表示タイミング

- 参加完了直後（りんく吹き出しと同時）
- アニメーション時間: 1秒間

#### 演出内容

1. **点灯アニメーション**:
   - 該当都道府県が光る
   - スケールアップ（1.0 → 1.2 → 1.0）
   - 色変化（通常色 → ハイライト色 → 通常色）

2. **色の定義**:
   - 男性: 蒼（青）`#0a7ea4`
   - 女性: 赤 `#ef4444`

#### 実装方法

1. **`ParticipantsOverview`コンポーネントの拡張**:
   - `highlightPrefecture`プロップを追加
   - `highlightGender`プロップを追加
   - アニメーション用の`Animated.Value`を追加

2. **アニメーションの実装**:
   ```typescript
   const scaleAnim = useRef(new Animated.Value(1)).current;
   const opacityAnim = useRef(new Animated.Value(1)).current;
   
   useEffect(() => {
     if (highlightPrefecture) {
       Animated.sequence([
         Animated.parallel([
           Animated.timing(scaleAnim, {
             toValue: 1.2,
             duration: 500,
             useNativeDriver: true,
           }),
           Animated.timing(opacityAnim, {
             toValue: 0.7,
             duration: 500,
             useNativeDriver: true,
           }),
         ]),
         Animated.parallel([
           Animated.timing(scaleAnim, {
             toValue: 1.0,
             duration: 500,
             useNativeDriver: true,
           }),
           Animated.timing(opacityAnim, {
             toValue: 1.0,
             duration: 500,
             useNativeDriver: true,
           }),
         ]),
       ]).start();
     }
   }, [highlightPrefecture]);
   ```

3. **`useParticipationForm`フックの拡張**:
   - `highlightPrefecture`状態を追加
   - `highlightGender`状態を追加
   - 参加完了時に設定、1秒後にクリア

---

## UI/UXフロー

### ファン側の体験

```
1. 参加フォーム送信
   ↓
2. ローディング表示
   ↓
3. 参加完了
   ↓
4. フォームが閉じる
   ↓
5. メッセージ一覧へスクロール
   ↓
6. 県が点灯（1秒間）← NEW
   ↓
7. りんく吹き出し「◯人目の参加だよ！」（3秒間）← NEW
   ↓
8. シェアプロンプト表示（2秒後）
   ↓
9. 通常状態に戻る
```

### 主催者側の体験（次のPR）

```
1. チャレンジ作成完了
   ↓
2. 「次にやること」チェックリスト表示
   - ✅ 告知する
   - ✅ URLを貼る
   - ✅ 進捗を見る
```

---

## 実装タスク

### Phase 1: りんく吹き出し実装

- [ ] `lastParticipation`に`participantNumber`を追加
- [ ] `showParticipantNumberSpeech`状態を追加
- [ ] `LinkSpeech`コンポーネントを作成
- [ ] 表示タイミングの調整（3秒間）
- [ ] フェードイン/フェードアウトアニメーション

### Phase 2: 県点灯演出実装

- [ ] `ParticipantsOverview`コンポーネントの拡張
- [ ] `highlightPrefecture`プロップの追加
- [ ] `highlightGender`プロップの追加
- [ ] アニメーションの実装（スケール + 色変化）
- [ ] `useParticipationForm`フックの拡張

### Phase 3: テスト・デプロイ

- [ ] 全テストパス確認
- [ ] チェックポイント保存
- [ ] GitHubにpush（production main:main）

---

## 技術的な注意点

1. **アニメーション**:
   - `react-native-reanimated`を使用
   - `useNativeDriver: true`でパフォーマンス最適化

2. **タイミング**:
   - りんく吹き出し: 参加完了直後
   - 県点灯: 参加完了直後（りんく吹き出しと同時）
   - シェアプロンプト: りんく吹き出し終了後（2秒後）

3. **状態管理**:
   - `useParticipationForm`フックで一元管理
   - `lastParticipation`に必要な情報を追加

---

## 期待される効果

1. **ファンの満足度向上**:
   - 「◯人目の参加」で達成感
   - 県点灯で視覚的なフィードバック

2. **シェア率の向上**:
   - りんく吹き出し → シェアプロンプトの流れで自然にシェアへ誘導

3. **主催者の行動促進**:
   - 「次にやること」チェックリストで迷わない

---

よろしくお願いします！
