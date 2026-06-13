# GPT相談ドキュメント v2 - デプロイ問題と環境統一

**作成日**: 2026年1月19日  
**バージョン**: v6.03 → v5.98（本番未反映）  
**緊急度**: 高（チャレンジ作成機能が完全に停止中）

---

## 1. 現在発生している問題

### 1.1 チャレンジ作成エラー（継続中）

チャレンジ作成ボタンを押すと、以下のエラーが表示される。

> **エラーメッセージ**: 「チャレンジの作成に失敗しました。入力内容を確認して再度お試しください。」

**APIレスポンス**:
```json
{
  "error": {
    "json": {
      "message": "チャレンジの作成に失敗しました。入力内容を確認して再度お試しください。",
      "code": -32603,
      "data": {
        "code": "INTERNAL_SERVER_ERROR",
        "httpStatus": 500,
        "path": "events.create"
      }
    }
  }
}
```

### 1.2 デプロイが反映されない問題（新規）

GitHubにv6.03をプッシュし、Vercel/Railwayで「デプロイ成功」と表示されているにもかかわらず、本番サイトはv5.98のまま。

| 環境 | 期待バージョン | 実際のバージョン | ステータス |
|------|---------------|-----------------|-----------|
| GitHub | v6.03 | v6.03 | ✅ 正常 |
| Railway | v6.03 | v6.03（表示上） | ⚠️ 要確認 |
| Vercel | v6.03 | v5.98 | ❌ 未反映 |
| 本番サイト | v6.03 | v5.98 | ❌ 未反映 |

**確認コマンド**:
```bash
curl -s "https://doin-challenge.com/api/trpc/system.version"
# 結果: {"result":{"data":{"json":{"version":"v5.98"}}}}
```

---

## 2. 問題の根本原因（推定）

### 2.1 チャレンジ作成エラーの原因

前回のGPT相談で特定した原因:

1. **スキーマとコードの不整合**: `drizzle/schema.ts`でAI関連カラム5つを定義したが、本番TiDB Cloudにマイグレーションが適用されていない
2. **直接SQLの使用**: `server/db.ts`の`createEvent`関数で直接SQLを書いているため、存在しないカラムにINSERTしようとしてエラー

**問題のカラム**:
- `aiSummary`
- `intentTags`
- `regionSummary`
- `participantSummary`
- `aiSummaryUpdatedAt`

**修正内容（v6.03）**:
```typescript
// AI関連カラムをINSERTから除外
const result = await db.execute(sql`
  INSERT INTO challenges (
    hostUserId, hostTwitterId, hostName, hostUsername, hostProfileImage, hostFollowersCount, hostDescription,
    title, slug, description, goalType, goalValue, goalUnit, currentValue,
    eventType, categoryId, eventDate, venue, prefecture,
    ticketPresale, ticketDoor, ticketSaleStart, ticketUrl, externalUrl,
    status, isPublic, createdAt, updatedAt
    -- AI関連カラム5つを除外
  ) VALUES (...)
`);
```

### 2.2 デプロイが反映されない原因（推定）

1. **Vercelのキャッシュ問題**: CDNキャッシュが古いバージョンを配信し続けている
2. **ビルドの失敗**: Vercelのビルドが実際には失敗しているが、UIでは成功と表示されている
3. **環境変数の不整合**: Vercel/Railway/TiDBで環境変数が異なる
4. **APIルーティングの問題**: Vercelがバックエンドに正しくプロキシしていない

---

## 3. 現在のインフラ構成と問題点

### 3.1 3環境の分離による複雑さ

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│              kimito-link/doin-challenge.com                 │
│                         │                                   │
│                    git push                                 │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               │                   │
│    ┌─────────┐    ┌─────────┐          │                   │
│    │ Vercel  │    │ Railway │          │                   │
│    │ (Front) │    │ (Back)  │          │                   │
│    └────┬────┘    └────┬────┘          │                   │
│         │              │               │                   │
│         │              │               │                   │
│         │              ▼               │                   │
│         │         ┌─────────┐          │                   │
│         │         │ TiDB    │◄─────────┘                   │
│         │         │ Cloud   │  マイグレーション             │
│         │         └─────────┘  （手動、忘れがち）          │
│         │                                                   │
│         ▼                                                   │
│    https://doin-challenge.com                               │
│    （v5.98のまま！）                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 問題点の整理

| 問題 | 影響 | 発生頻度 |
|------|------|----------|
| Vercelデプロイが反映されない | フロントエンドが古いまま | 今回発生 |
| TiDBマイグレーション忘れ | DBスキーマとコードの不整合 | 頻繁 |
| 環境変数の不整合 | 予期しないエラー | 時々 |
| バージョン管理の分散 | どの環境が最新か分からない | 常に |

---

## 4. 試した解決策と結果

### 4.1 チャレンジ作成エラーの修正

| 試した解決策 | 結果 |
|-------------|------|
| AI関連カラム5つをINSERTから除外（v6.03） | コード修正完了、デプロイ未反映 |
| GitHubにプッシュ | 成功（41db70f） |
| Vercel自動デプロイ | 「成功」表示だがv5.98のまま |
| Railway自動デプロイ | 「成功」表示（v6.03 ACTIVE） |

### 4.2 デプロイ問題の解決試行

| 試した解決策 | 結果 |
|-------------|------|
| Vercelダッシュボードで確認 | デプロイ成功と表示 |
| Publishボタン再クリック | 変化なし |
| 本番サイトでバージョン確認 | v5.98のまま |
| API直接呼び出しでバージョン確認 | v5.98を返す |

---

## 5. GPTへの質問

### 5.1 デプロイ問題について

1. **Vercelのデプロイが反映されない原因として何が考えられるか？**
   - キャッシュ？ビルド失敗？環境変数？
   
2. **Vercel + Railway + TiDB Cloudの3環境を確実に同期させる方法は？**
   - 現状、GitHubプッシュ → Vercel/Railway自動デプロイ → TiDB手動マイグレーション
   - どこかで失敗しても気づきにくい

3. **デプロイの成功/失敗を確実に検証する方法は？**
   - 現状、バージョン番号をコードに埋め込んで確認している
   - もっと良い方法はあるか？

### 5.2 環境統一について

4. **3環境を1つに統一することは可能か？**
   - 例: Railwayだけでフロントエンド+バックエンド+DBをホスティング
   - 例: Vercelだけでサーバーレス関数+DBをホスティング

5. **統一する場合のメリット・デメリットは？**
   - コスト、パフォーマンス、管理の容易さ

6. **統一しない場合、3環境を安全に管理するベストプラクティスは？**
   - CI/CDパイプラインの設計
   - ヘルスチェックの自動化
   - ロールバック戦略

### 5.3 チャレンジ作成エラーについて

7. **本番DBのスキーマを確認する最も安全な方法は？**
   - 現状、admin APIを作成したがデプロイが反映されない
   - TiDB Cloudのコンソールから直接確認すべきか？

8. **スキーマとコードの整合性を保つベストプラクティスは？**
   - Drizzle ORMの`insert()`メソッドを使えば自動で整合性が取れる？
   - 直接SQLを書くのは避けるべきか？

9. **マイグレーションを本番に適用する安全な手順は？**
   - `drizzle-kit push`を本番に対して実行する方法
   - ロールバック可能な方法

---

## 6. 現在のコード構造（参考）

### 6.1 問題のある箇所

**server/db.ts (237-280行)** - createEvent関数:
```typescript
// 現在の実装（直接SQL）
const result = await db.execute(sql`
  INSERT INTO challenges (...) VALUES (...)
`);
```

**drizzle/schema.ts** - challengesテーブル定義:
```typescript
export const challenges = mysqlTable("challenges", {
  id: int("id").primaryKey().autoincrement(),
  // ... 基本カラム
  aiSummary: text("aiSummary"),           // 本番DBに存在しない可能性
  intentTags: json("intentTags"),          // 本番DBに存在しない可能性
  regionSummary: json("regionSummary"),    // 本番DBに存在しない可能性
  participantSummary: text("participantSummary"), // 本番DBに存在しない可能性
  aiSummaryUpdatedAt: datetime("aiSummaryUpdatedAt"), // 本番DBに存在しない可能性
});
```

### 6.2 理想的な実装

```typescript
// Drizzle ORMを使用（スキーマと自動同期）
const result = await db.insert(challenges).values({
  hostUserId: data.hostUserId,
  title: data.title,
  // ... スキーマに定義されたカラムのみ
});
```

---

## 7. 添付資料

### 7.1 スクリーンショット

1. **チャレンジ作成エラー画面**: エラーモーダルが表示される
2. **Vercelダッシュボード**: デプロイ成功と表示
3. **Railwayダッシュボード**: v6.03 ACTIVE
4. **GitHubリポジトリ**: v6.03コミットが最新
5. **本番サイト**: v5.98と表示

### 7.2 環境情報

| 項目 | 値 |
|------|-----|
| フロントエンド | React Native (Expo) + TypeScript |
| バックエンド | Node.js + Express + tRPC |
| ORM | Drizzle ORM |
| データベース | TiDB Cloud (MySQL互換) |
| ホスティング（Front） | Vercel |
| ホスティング（Back） | Railway |
| 認証 | Twitter OAuth 2.0 |

### 7.3 バージョン履歴

| バージョン | 内容 | 状態 |
|-----------|------|------|
| v5.98 | チャレンジ作成機能（エラー発生中） | 本番稼働中 |
| v6.01 | 追体験モード追加 | ロールバック済み |
| v6.02 | エラーポップアップ連続表示修正 | デプロイ済み？ |
| v6.03 | AI関連カラム除外修正 | デプロイ未反映 |

---

## 8. 期待する回答

1. **即時解決策**: 今すぐチャレンジ作成を復旧させる方法
2. **中期解決策**: デプロイの信頼性を向上させる方法
3. **長期解決策**: 3環境を統一または安全に管理する方法

---

*このドキュメントは2026年1月19日時点の状態を反映しています。*
