# 他コンセプトへの適用ガイド

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**バージョン**: 6.144  
**最終更新**: 2026年1月29日  
**作成者**: Manus AI

---

## 概要

本ドキュメントは「動員チャレンジ」アプリケーションを他のコンセプトに適用する方法を記述したものです。本アプリケーションは、イベント応援プラットフォームとして設計されていますが、同様のアーキテクチャを活用して、さまざまな分野のアプリケーションを構築できます。

本ガイドでは、以下のトピックをカバーします：

1. **アーキテクチャの再利用性**: どの部分が汎用的で、どの部分がドメイン固有か
2. **適用可能なコンセプト**: 具体的な適用例
3. **カスタマイズ手順**: ステップバイステップの変更方法
4. **技術スタックの変更**: 必要に応じた技術の置き換え

---

## アーキテクチャの再利用性

本アプリケーションのアーキテクチャは、以下のように**汎用的な部分**と**ドメイン固有の部分**に分離されています。

| レイヤー | 汎用性 | 説明 |
|---------|-------|------|
| **認証モジュール** | 高 | Twitter OAuth 2.0は、他のOAuthプロバイダー（Google、GitHub、Facebook）に置き換え可能 |
| **データベース層** | 高 | PostgreSQL + Drizzle ORMは、任意のスキーマに対応可能 |
| **API層（tRPC）** | 高 | tRPCは、任意のビジネスロジックに対応可能 |
| **通知モジュール** | 高 | プッシュ通知とWebSocketは、任意のイベントに対応可能 |
| **可視化モジュール** | 中 | 日本地図は日本固有だが、他の地図やグラフに置き換え可能 |
| **チャレンジ管理** | 低 | イベント応援に特化しているが、類似のイベント管理に応用可能 |

### 汎用的な部分

以下のモジュールは、ほとんど変更せずに他のコンセプトに適用できます。

| モジュール | ファイル | 再利用方法 |
|----------|---------|----------|
| **認証** | `server/twitter-oauth2.ts`, `server/twitter-auth.ts` | OAuthプロバイダーのURLとスコープを変更するだけ |
| **データベース** | `server/db/schema.ts`, `server/db.ts` | スキーマを変更するだけ |
| **tRPC API** | `server/routers/`, `lib/trpc.ts` | ルーターとプロシージャを追加・変更するだけ |
| **通知** | `lib/push-notifications.ts`, `server/_core/index.ts` | 通知内容を変更するだけ |
| **オフライン対応** | `lib/offline-cache.ts`, `hooks/use-offline-cache.ts` | キャッシュキーを変更するだけ |

### ドメイン固有の部分

以下のモジュールは、コンセプトに応じて大幅な変更が必要です。

| モジュール | ファイル | 変更が必要な理由 |
|----------|---------|----------------|
| **チャレンジ管理** | `server/routers/events.ts`, `app/(tabs)/create.tsx` | イベントの種類やフィールドが異なる |
| **可視化** | `components/japan-deformed-map.tsx`, `components/growth-trajectory-chart.tsx` | 表示するデータや地域が異なる |
| **UI/UX** | `app/`, `components/` | ブランドやデザインが異なる |

---

## 適用可能なコンセプト

本アプリケーションのアーキテクチャは、以下のようなコンセプトに適用できます。

### 1. クラウドファンディングプラットフォーム

**概要**: プロジェクトを作成し、支援者を募るプラットフォーム。

**変更点**:

| 項目 | 現在（動員チャレンジ） | 変更後（クラウドファンディング） |
|------|---------------------|----------------------------|
| **イベント** | 生誕祭・イベント | プロジェクト |
| **参加者** | 応援者 | 支援者 |
| **目標** | 参加人数 | 資金調達額 |
| **可視化** | 都道府県別参加者数 | 支援額の推移 |
| **通知** | 参加登録通知 | 支援完了通知 |

**カスタマイズ手順**:

1. **スキーマ変更**: `events`テーブルに`targetAmount`（目標金額）フィールドを追加
2. **API変更**: `participations`を`pledges`に変更し、`amount`フィールドを追加
3. **UI変更**: 参加登録フォームを支援フォームに変更
4. **可視化変更**: 日本地図を資金調達グラフに変更

### 2. コミュニティイベント管理

**概要**: 地域イベント（フェス、マラソン、勉強会など）の参加者管理。

**変更点**:

| 項目 | 現在（動員チャレンジ） | 変更後（イベント管理） |
|------|---------------------|---------------------|
| **イベント** | 生誕祭・イベント | 地域イベント |
| **参加者** | 応援者 | 参加者 |
| **目標** | 参加人数 | 参加人数（同じ） |
| **可視化** | 都道府県別参加者数 | 地域別参加者数 |
| **通知** | 参加登録通知 | イベントリマインダー |

**カスタマイズ手順**:

1. **スキーマ変更**: `events`テーブルに`location`（開催場所）フィールドを追加
2. **API変更**: `participations`に`ticketType`（チケット種類）フィールドを追加
3. **UI変更**: イベント作成フォームに開催場所を追加
4. **可視化変更**: 日本地図を世界地図に変更（必要に応じて）

### 3. オンライン学習プラットフォーム

**概要**: コースを作成し、受講者を募るプラットフォーム。

**変更点**:

| 項目 | 現在（動員チャレンジ） | 変更後（学習プラットフォーム） |
|------|---------------------|----------------------------|
| **イベント** | 生誕祭・イベント | コース |
| **参加者** | 応援者 | 受講者 |
| **目標** | 参加人数 | 受講者数 |
| **可視化** | 都道府県別参加者数 | 学習進捗グラフ |
| **通知** | 参加登録通知 | コース更新通知 |

**カスタマイズ手順**:

1. **スキーマ変更**: `events`を`courses`に変更し、`lessons`テーブルを追加
2. **API変更**: `participations`を`enrollments`に変更し、`progress`フィールドを追加
3. **UI変更**: イベント詳細画面をコース詳細画面に変更
4. **可視化変更**: 日本地図を学習進捗グラフに変更

### 4. ボランティア募集プラットフォーム

**概要**: ボランティア活動を作成し、参加者を募るプラットフォーム。

**変更点**:

| 項目 | 現在（動員チャレンジ） | 変更後（ボランティア） |
|------|---------------------|---------------------|
| **イベント** | 生誕祭・イベント | ボランティア活動 |
| **参加者** | 応援者 | ボランティア |
| **目標** | 参加人数 | ボランティア数 |
| **可視化** | 都道府県別参加者数 | 地域別ボランティア数 |
| **通知** | 参加登録通知 | 活動リマインダー |

**カスタマイズ手順**:

1. **スキーマ変更**: `events`テーブルに`skills`（必要なスキル）フィールドを追加
2. **API変更**: `participations`に`availability`（参加可能日時）フィールドを追加
3. **UI変更**: イベント作成フォームに必要なスキルを追加
4. **可視化変更**: 日本地図をスキル別ボランティア数グラフに変更

### 5. ペットイベント管理

**概要**: ペットイベント（ドッグラン、猫カフェなど）の参加者管理。

**変更点**:

| 項目 | 現在（動員チャレンジ） | 変更後（ペットイベント） |
|------|---------------------|----------------------|
| **イベント** | 生誕祭・イベント | ペットイベント |
| **参加者** | 応援者 | ペットオーナー |
| **目標** | 参加人数 | 参加ペット数 |
| **可視化** | 都道府県別参加者数 | ペット種類別参加数 |
| **通知** | 参加登録通知 | イベントリマインダー |

**カスタマイズ手順**:

1. **スキーマ変更**: `participations`に`petType`（ペット種類）フィールドを追加
2. **API変更**: `participations`に`petName`（ペット名）フィールドを追加
3. **UI変更**: 参加登録フォームにペット情報を追加
4. **可視化変更**: 日本地図をペット種類別グラフに変更

---

## カスタマイズ手順

本セクションでは、具体的なカスタマイズ手順を説明します。

### ステップ1: プロジェクト名の変更

**目的**: プロジェクト名を「動員チャレンジ」から新しい名前に変更します。

**変更ファイル**:

| ファイル | 変更内容 |
|---------|---------|
| `app.config.ts` | `name`, `slug`を変更 |
| `package.json` | `name`を変更 |
| `README.md` | プロジェクト名を変更 |
| `docs/*.md` | すべてのドキュメントでプロジェクト名を変更 |

**例**:

```typescript
// app.config.ts
const config: ExpoConfig = {
  name: "クラウドファンディング", // 変更
  slug: "crowdfunding", // 変更
  // ...
};
```

### ステップ2: データベーススキーマの変更

**目的**: データベーススキーマを新しいコンセプトに合わせて変更します。

**変更ファイル**:

- `server/db/schema.ts`

**例（クラウドファンディング）**:

```typescript
// server/db/schema.ts

// eventsテーブルを変更
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  targetAmount: integer("target_amount").notNull(), // 追加: 目標金額
  currentAmount: integer("current_amount").default(0), // 追加: 現在の金額
  eventDate: timestamp("event_date").notNull(),
  creatorId: text("creator_id").notNull(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// participationsをpledgesに変更
export const pledges = pgTable("pledges", {
  id: text("id").primaryKey(),
  eventId: text("event_id").references(() => events.id),
  userId: text("user_id").references(() => users.id),
  amount: integer("amount").notNull(), // 追加: 支援金額
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**マイグレーション**:

```bash
# スキーマ変更後、マイグレーションを実行
pnpm db:push
```

### ステップ3: API（tRPC）の変更

**目的**: APIエンドポイントを新しいコンセプトに合わせて変更します。

**変更ファイル**:

- `server/routers/events.ts`
- `server/routers/participations.ts`（または新しいルーター）

**例（クラウドファンディング）**:

```typescript
// server/routers/pledges.ts（新規作成）

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { pledges } from "../db/schema";

export const pledgesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        amount: z.number().min(1),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pledge = await ctx.db.insert(pledges).values({
        id: crypto.randomUUID(),
        eventId: input.eventId,
        userId: ctx.user.id,
        amount: input.amount,
        comment: input.comment,
      });
      return pledge;
    }),
  
  list: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.pledges.findMany({
        where: (pledges, { eq }) => eq(pledges.eventId, input.eventId),
      });
    }),
});
```

**ルーターの登録**:

```typescript
// server/routers.ts

import { pledgesRouter } from "./routers/pledges";

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  pledges: pledgesRouter, // 追加
});
```

### ステップ4: UIの変更

**目的**: ユーザーインターフェースを新しいコンセプトに合わせて変更します。

**変更ファイル**:

- `app/(tabs)/index.tsx`（ホーム画面）
- `app/(tabs)/create.tsx`（作成画面）
- `app/event/[id].tsx`（詳細画面）
- `components/challenge-card.tsx`（カードコンポーネント）

**例（クラウドファンディング）**:

```tsx
// app/(tabs)/create.tsx

export default function CreateProjectScreen() {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState(0); // 変更
  const [eventDate, setEventDate] = useState(new Date());

  const createProject = trpc.events.create.useMutation();

  const handleSubmit = async () => {
    await createProject.mutateAsync({
      title,
      targetAmount, // 変更
      eventDate,
    });
  };

  return (
    <ScreenContainer>
      <Text>プロジェクトを作成</Text>
      <TextInput
        placeholder="プロジェクト名"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="目標金額"
        keyboardType="numeric"
        value={String(targetAmount)}
        onChangeText={(text) => setTargetAmount(Number(text))}
      />
      <Button title="作成" onPress={handleSubmit} />
    </ScreenContainer>
  );
}
```

### ステップ5: 可視化の変更

**目的**: 可視化コンポーネントを新しいコンセプトに合わせて変更します。

**変更ファイル**:

- `components/japan-deformed-map.tsx`（日本地図）
- `components/growth-trajectory-chart.tsx`（成長軌跡グラフ）

**例（クラウドファンディング）**:

```tsx
// components/funding-progress-chart.tsx（新規作成）

import { View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface FundingProgressChartProps {
  pledges: Array<{ amount: number; createdAt: Date }>;
  targetAmount: number;
}

export function FundingProgressChart({
  pledges,
  targetAmount,
}: FundingProgressChartProps) {
  const data = pledges.map((p) => p.amount);
  const labels = pledges.map((p) => p.createdAt.toLocaleDateString());

  return (
    <View>
      <Text>資金調達の推移</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data }],
        }}
        width={300}
        height={200}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        }}
      />
      <Text>目標: {targetAmount}円</Text>
    </View>
  );
}
```

### ステップ6: 通知の変更

**目的**: 通知内容を新しいコンセプトに合わせて変更します。

**変更ファイル**:

- `lib/push-notifications.ts`
- `hooks/use-notification-triggers.ts`

**例（クラウドファンディング）**:

```typescript
// lib/push-notifications.ts

export async function sendPledgeNotification(
  userId: string,
  projectTitle: string,
  amount: number
) {
  await sendPushNotification(userId, {
    title: "支援完了",
    body: `「${projectTitle}」に${amount}円の支援をしました！`,
  });
}
```

### ステップ7: テストの更新

**目的**: テストを新しいコンセプトに合わせて更新します。

**変更ファイル**:

- `__tests__/`ディレクトリ内のすべてのテストファイル

**例**:

```typescript
// __tests__/pledges.test.ts

import { describe, it, expect } from "vitest";
import { trpc } from "@/lib/trpc";

describe("Pledges", () => {
  it("should create a pledge", async () => {
    const pledge = await trpc.pledges.create.mutate({
      eventId: "event-1",
      amount: 1000,
      comment: "応援しています！",
    });
    expect(pledge).toBeDefined();
  });
});
```

---

## 技術スタックの変更

本セクションでは、技術スタックを変更する方法を説明します。

### OAuthプロバイダーの変更

**現在**: Twitter OAuth 2.0

**変更可能なプロバイダー**: Google、GitHub、Facebook、Apple、Microsoft

**変更手順**:

1. **OAuth 2.0クライアントの作成**: 新しいプロバイダーのデベロッパーポータルでクライアントを作成
2. **環境変数の変更**: `.env`ファイルでクライアントIDとシークレットを変更
3. **OAuth 2.0フローの変更**: `server/twitter-oauth2.ts`を変更

**例（Google OAuth 2.0）**:

```typescript
// server/google-oauth2.ts

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function generateAuthUrl(state: string, codeChallenge: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}
```

### データベースの変更

**現在**: PostgreSQL

**変更可能なデータベース**: MySQL、SQLite、MongoDB

**変更手順**:

1. **Drizzle ORMの設定変更**: `server/db.ts`でデータベース接続を変更
2. **スキーマの変更**: `server/db/schema.ts`で新しいデータベースに対応したスキーマを定義
3. **マイグレーション**: `pnpm db:push`でマイグレーションを実行

**例（MySQL）**:

```typescript
// server/db.ts

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

export const db = drizzle(pool);
```

### フロントエンドフレームワークの変更

**現在**: React Native + Expo

**変更可能なフレームワーク**: Next.js、Remix、SvelteKit

**変更手順**:

1. **新しいフレームワークのセットアップ**: `npx create-next-app`などでプロジェクトを作成
2. **tRPCクライアントの移行**: `lib/trpc.ts`を新しいフレームワークに対応させる
3. **コンポーネントの移行**: `app/`と`components/`を新しいフレームワークに移行

**例（Next.js）**:

```typescript
// lib/trpc.ts（Next.js版）

import { createTRPCNext } from "@trpc/next";
import type { AppRouter } from "@/server/routers";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_API_URL + "/trpc",
        }),
      ],
    };
  },
});
```

---

## チェックリスト

他のコンセプトに適用する際のチェックリストです。

- [ ] プロジェクト名を変更した
- [ ] データベーススキーマを変更した
- [ ] APIエンドポイントを変更した
- [ ] UIを変更した
- [ ] 可視化コンポーネントを変更した
- [ ] 通知内容を変更した
- [ ] テストを更新した
- [ ] ドキュメントを更新した
- [ ] 環境変数を設定した
- [ ] デプロイ設定を変更した

---

## まとめ

本アプリケーションのアーキテクチャは、高い再利用性を持っており、さまざまなコンセプトに適用できます。汎用的な部分（認証、データベース、API、通知）はほとんど変更せずに利用でき、ドメイン固有の部分（チャレンジ管理、可視化、UI/UX）のみをカスタマイズすることで、迅速に新しいアプリケーションを構築できます。

本ガイドを参考に、あなた自身のコンセプトに適用してみてください。

---

## 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
