# 無限スクロール導入ガイド

## 概要

このドキュメントでは、ランキング、通知、メッセージ一覧画面に無限スクロールを導入する際の手順をまとめています。現時点ではバックエンドAPIが無限スクロールに対応していないため、将来的に導入する際の参考にしてください。

## 無限スクロールとは

**無限スクロール（Infinite Scroll）**は、ユーザーがリストの最後までスクロールすると、自動的に次のページのデータを取得して表示する機能です。これにより、大量のデータを効率的に表示できます。

### メリット
- **ユーザー体験の向上**: ページネーションボタンをタップする手間がない
- **パフォーマンスの向上**: 必要なデータのみを取得するため、初回ロードが速い
- **モバイルフレンドリー**: スクロールだけで操作が完結

### デメリット
- **実装の複雑さ**: バックエンドとフロントエンドの両方を修正する必要がある
- **スクロール位置の保持**: 画面遷移後に元の位置に戻るのが難しい

## 導入が推奨される画面

| 画面 | 優先度 | 理由 |
|------|--------|------|
| **通知画面** | 高 | 通知は時間とともに蓄積され、数百件になる可能性がある |
| **メッセージ一覧画面** | 高 | メッセージも時間とともに蓄積され、数百件になる可能性がある |
| **ランキング画面** | 低 | ランキングは通常50-100件程度で十分 |

## 導入手順

### Step 1: バックエンドAPIの修正

無限スクロールを実装するには、バックエンドAPIが`offset`と`limit`パラメータをサポートする必要があります。

#### 1.1 通知APIの修正

**現在の実装:**
```typescript
// server/routers/notifications.ts
list: protectedProcedure.query(async ({ ctx }) => {
  return db.getNotificationsByUserId(ctx.user.id);
}),
```

**修正後:**
```typescript
// server/routers/notifications.ts
list: protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(20),
    cursor: z.number().optional(), // 最後に取得したnotificationId
  }))
  .query(async ({ ctx, input }) => {
    const notifications = await db.getNotificationsByUserId(
      ctx.user.id,
      input.limit,
      input.cursor
    );
    
    return {
      items: notifications,
      nextCursor: notifications.length === input.limit 
        ? notifications[notifications.length - 1].id 
        : undefined,
    };
  }),
```

#### 1.2 データベースクエリの修正

**現在の実装:**
```typescript
// server/db/notification-db.ts
export async function getNotificationsByUserId(userId: number) {
  const [rows] = await db.query(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
  return rows;
}
```

**修正後:**
```typescript
// server/db/notification-db.ts
export async function getNotificationsByUserId(
  userId: number,
  limit: number = 20,
  cursor?: number
) {
  const cursorCondition = cursor ? `AND id < ?` : '';
  const params = cursor ? [userId, cursor, limit] : [userId, limit];
  
  const [rows] = await db.query(
    `SELECT * FROM notifications 
     WHERE userId = ? ${cursorCondition}
     ORDER BY createdAt DESC 
     LIMIT ?`,
    params
  );
  return rows;
}
```

#### 1.3 メッセージAPIの修正

**現在の実装:**
```typescript
// server/routers/dm.ts
conversations: protectedProcedure
  .query(async ({ ctx }) => {
    return db.getConversationList(ctx.user.id);
  }),
```

**修正後:**
```typescript
// server/routers/dm.ts
conversations: protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(20),
    cursor: z.number().optional(), // 最後に取得したmessageId
  }))
  .query(async ({ ctx, input }) => {
    const conversations = await db.getConversationList(
      ctx.user.id,
      input.limit,
      input.cursor
    );
    
    return {
      items: conversations,
      nextCursor: conversations.length === input.limit 
        ? conversations[conversations.length - 1].id 
        : undefined,
    };
  }),
```

### Step 2: フロントエンドの修正

#### 2.1 `useQuery`を`useInfiniteQuery`に変更

**現在の実装（通知画面）:**
```typescript
// app/notifications.tsx
const { data: notifications, isLoading, isFetching, refetch } = 
  trpc.notifications.list.useQuery();
```

**修正後:**
```typescript
// app/notifications.tsx
const { 
  data, 
  isLoading, 
  isFetching, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage,
  refetch 
} = trpc.notifications.list.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);

// ページをフラット化
const notifications = data?.pages.flatMap(page => page.items) ?? [];
```

#### 2.2 `FlatList`の`onEndReached`で次のページを取得

**修正後:**
```typescript
// app/notifications.tsx
<FlatList
  data={notifications}
  renderItem={renderNotification}
  keyExtractor={(item) => item.id.toString()}
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  onEndReachedThreshold={0.5} // 50%スクロールしたら次のページを取得
  ListFooterComponent={() => 
    isFetchingNextPage ? (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    ) : null
  }
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

#### 2.3 ローディング状態の分離

**修正後:**
```typescript
// app/notifications.tsx
// ローディング状態を分離
const hasData = notifications.length > 0;
const isInitialLoading = isLoading && !hasData;
const isRefreshing = isFetching && hasData && !isFetchingNextPage;

// スケルトンは初回のみ
if (isInitialLoading) {
  return <Skeleton />;
}

// 更新中インジケータ
{isRefreshing && <RefreshingIndicator />}

// 無限スクロール中インジケータ
{isFetchingNextPage && <ActivityIndicator />}
```

### Step 3: パフォーマンスの最適化

#### 3.1 `getItemLayout`の使用

`FlatList`の`getItemLayout`を使用すると、スクロールパフォーマンスが向上します。

```typescript
<FlatList
  data={notifications}
  renderItem={renderNotification}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(data, index) => ({
    length: 80, // アイテムの高さ（固定の場合）
    offset: 80 * index,
    index,
  })}
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  onEndReachedThreshold={0.5}
/>
```

#### 3.2 `removeClippedSubviews`の使用

Androidでのパフォーマンスを向上させるために、`removeClippedSubviews`を使用します。

```typescript
<FlatList
  data={notifications}
  renderItem={renderNotification}
  keyExtractor={(item) => item.id.toString()}
  removeClippedSubviews={Platform.OS === "android"}
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  onEndReachedThreshold={0.5}
/>
```

## トラブルシューティング

### 1. 無限スクロールが動作しない

**原因:**
- `onEndReachedThreshold`が適切に設定されていない
- `hasNextPage`が常に`false`

**対策:**
```typescript
// onEndReachedThresholdを調整
<FlatList
  onEndReachedThreshold={0.3} // 30%スクロールしたら次のページを取得
/>

// hasNextPageのデバッグ
console.log('hasNextPage:', hasNextPage);
console.log('nextCursor:', data?.pages[data.pages.length - 1]?.nextCursor);
```

### 2. 重複したデータが表示される

**原因:**
- `keyExtractor`が正しく設定されていない
- バックエンドのクエリが重複したデータを返している

**対策:**
```typescript
// keyExtractorを確認
<FlatList
  keyExtractor={(item) => item.id.toString()} // idがユニークであることを確認
/>

// バックエンドのクエリを確認
// cursorConditionが正しく設定されているか確認
const cursorCondition = cursor ? `AND id < ?` : '';
```

### 3. スクロール位置が保持されない

**原因:**
- React Queryのキャッシュが無効化されている
- `FlatList`の`key`が変更されている

**対策:**
```typescript
// React Queryのキャッシュ設定を確認
const { data } = trpc.notifications.list.useInfiniteQuery(
  { limit: 20 },
  {
    staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
    gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持
  }
);

// FlatListのkeyを固定
<FlatList
  key="notifications-list" // 固定のkeyを使用
/>
```

## 完全な実装例

### 通知画面の完全な実装

```typescript
// app/notifications.tsx
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // 無限スクロール対応のクエリ
  const { 
    data, 
    isLoading, 
    isFetching, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = trpc.notifications.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
      gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持
    }
  );

  // ページをフラット化
  const notifications = data?.pages.flatMap(page => page.items) ?? [];

  // ローディング状態を分離
  const hasData = notifications.length > 0;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData && !isFetchingNextPage;

  // リフレッシュハンドラー
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // スケルトンは初回のみ
  if (isInitialLoading) {
    return (
      <ScreenContainer>
        <View style={{ padding: 16 }}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* 更新中インジケータ */}
      <RefreshingIndicator isRefreshing={isRefreshing} />

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <Text>{item.message}</Text>
            <Text style={{ color: "#666", fontSize: 12 }}>{item.createdAt}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={Platform.OS === "android"}
        ListFooterComponent={() => 
          isFetchingNextPage ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={{ padding: 16, alignItems: "center" }}>
            <Text>通知はありません</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ScreenContainer>
  );
}
```

## まとめ

無限スクロールを導入するには、バックエンドAPIとフロントエンドの両方を修正する必要があります。このガイドに従って、通知画面とメッセージ一覧画面に無限スクロールを導入してください。

**導入の優先順位:**
1. **通知画面** - 通知は時間とともに蓄積され、数百件になる可能性が高い
2. **メッセージ一覧画面** - メッセージも時間とともに蓄積され、数百件になる可能性が高い
3. **ランキング画面** - ランキングは通常50-100件程度で十分なため、優先度は低い

**関連ドキュメント:**
- **パフォーマンス最適化のベストプラクティス**: `docs/performance-best-practices.md`
- **自動計測の詳細**: `docs/performance-monitoring-auto.md`
- **手動計測の詳細**: `docs/performance-monitoring.md`
- **ローディング状態の分析**: `docs/loading-state-analysis.md`
