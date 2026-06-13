# 根本的解決策の実装内容

**作成日**: 2026年1月31日

## 実装した根本的解決策

### 1. プロフィール設定の確定ボタンが反応しない問題

**根本原因**: 
- エラーハンドリングが不十分（`console.error`のみ）
- 成功時のナビゲーションが確実に実行されていない
- エラー状態の管理がない

**根本的解決策**:
- ✅ `onSuccess` コールバックでナビゲーションを実行（状態更新完了後に確実に実行）
- ✅ `onError` コールバックでエラー状態を管理し、ユーザーにフィードバック
- ✅ エラーメッセージをUIに表示（エラーを可視化）
- ✅ ローディング状態を明確に表示（「保存中...」）

**変更ファイル**:
- `app/oauth/twitter-callback.tsx`

**主な変更点**:
```typescript
// 1. onSuccessでナビゲーションを実行（確実に実行される）
onSuccess: async (data) => {
  // 状態更新完了後にナビゲーション
  setTimeout(() => {
    navigateReplace.withUrl(savedReturnUrl);
  }, 100);
}

// 2. onErrorでエラー状態を管理
onError: (error) => {
  setErrorMessage(error.message || "プロフィールの更新に失敗しました。");
  setErrorType("general");
}

// 3. エラーメッセージをUIに表示
{updateProfileMutation.isError && (
  <View style={{ ... }}>
    <Text>{updateProfileMutation.error.message}</Text>
  </View>
)}
```

---

### 2. 統計ダッシュボードが読み込めない問題

**根本原因**:
- エラーハンドリングが不十分（`isLoading` と `!userStats` のチェックのみ）
- エラー原因が分からない
- リトライ機能がない

**根本的解決策**:
- ✅ tRPCの `isError` と `error` をチェックし、エラー状態を適切に処理
- ✅ エラーメッセージをユーザーに表示し、原因を明確にする
- ✅ リトライ機能を追加（`retry: 2`）
- ✅ 再試行ボタンを追加（ユーザーが手動で再試行可能）

**変更ファイル**:
- `app/(tabs)/stats.tsx`

**主な変更点**:
```typescript
// 1. エラー状態をチェック
const { data: userStats, isLoading, isError, error, refetch } = trpc.stats.getUserStats.useQuery({
  retry: 2, // 一時的なネットワークエラーに対応
  retryDelay: 1000,
});

// 2. エラー状態を明確に処理
if (isError) {
  return (
    <View>
      <Text>エラーが発生しました</Text>
      <Text>{errorMessage}</Text>
      <Pressable onPress={() => refetch()}>
        <Text>再試行</Text>
      </Pressable>
    </View>
  );
}
```

---

### 3. プロフィール文章のはみ出し問題

**根本原因**:
- テキストの折り返し設定が不十分（`numberOfLines` が設定されていない）
- 長いテキストへの対応がない

**根本的解決策**:
- ✅ `numberOfLines={2}` を設定して、最大行数を制限
- ✅ `ellipsizeMode="tail"` を設定して、長いテキストを適切に省略

**変更ファイル**:
- `components/molecules/twitter-user-card.tsx`

**主な変更点**:
```typescript
<Text
  style={{ ... }}
  numberOfLines={2}        // 最大2行まで
  ellipsizeMode="tail"     // 末尾を省略
>
  {user.description}
</Text>
```

---

### 4. E2Eテストの抜け漏れと堅牢性の問題

**根本原因**:
- ページの読み込みタイミングとコンテンツレンダリングの非同期性を考慮していない
- 固定の待機時間（`waitForTimeout`）に依存
- 検証ロジックがテキストマッチングのみ

**根本的解決策**:
- ✅ Playwrightの `waitForSelector` や `waitForLoadState` を使用
- ✅ 複数の検証方法を組み合わせる（テキスト + DOM要素 + URL）
- ✅ リトライロジックを改善
- ✅ 主要フローのテストを追加（プロフィール設定、統計ダッシュボード、チャレンジ作成）

**変更ファイル**:
- `tests/e2e/gate2-flow.spec.ts`（改善）
- `tests/e2e/profile-setup.spec.ts`（新規）
- `tests/e2e/stats-dashboard.spec.ts`（新規）
- `tests/e2e/challenge-creation.spec.ts`（新規）

**主な変更点**:
```typescript
// 1. 実際のレンダリング完了を待つ
await page.goto("/", { waitUntil: "networkidle" });
await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

// 2. 複数の検証方法を組み合わせる
const hasDetailOr404 = /参加表明|参加する|.../i.test(detailText);
const isEventPage = currentUrl.includes("/event/");
const hasParticipationButton = await page.locator('text=/参加表明/i').count() > 0;
const isValidPage = hasDetailOr404 || (isEventPage && hasParticipationButton);
```

---

## 実装の優先順位

1. ✅ **最優先**: エラーハンドリングの統一化（すべての問題の根本原因）
2. ✅ **高優先**: プロフィール設定の確定ボタンの修正（ユーザー体験に直結）
3. ✅ **高優先**: 統計ダッシュボードのエラーハンドリング改善
4. ✅ **中優先**: プロフィール文章のはみ出し修正
5. ✅ **中優先**: E2Eテストの拡充と堅牢化

---

## 次のステップ

### 1. テストの実行
```bash
# E2Eテストを実行
npm run test:e2e

# または個別に実行
npx playwright test tests/e2e/gate2-flow.spec.ts
npx playwright test tests/e2e/stats-dashboard.spec.ts
npx playwright test tests/e2e/challenge-creation.spec.ts
```

### 2. 手動テスト
- [ ] ログイン → プロフィール設定 → 確定ボタン → 遷移
- [ ] 統計ダッシュボードの読み込み（エラー時の再試行ボタン）
- [ ] チャレンジ作成画面でプロフィールが正しく表示される

### 3. モニタリング
- [ ] Sentryでエラーログを確認
- [ ] ユーザーフィードバックを収集
- [ ] E2Eテストの成功率を監視

---

## 期待される効果

1. **ユーザー体験の向上**:
   - エラーが発生しても明確なフィードバックが得られる
   - 再試行が可能になり、一時的なエラーに対応できる

2. **開発効率の向上**:
   - エラーの原因が明確になり、デバッグが容易になる
   - E2Eテストが堅牢になり、回帰テストが確実に実行される

3. **運用の安定化**:
   - エラーハンドリングが統一され、予期しないエラーに対応できる
   - UIコンポーネントが堅牢になり、エッジケースに対応できる
