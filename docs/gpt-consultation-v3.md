# GPT相談ドキュメント v3 - デプロイ問題の根本解決と環境統一

**作成日**: 2026年1月19日  
**緊急度**: 最高（チャレンジ作成機能が完全に停止中、ユーザーに影響大）  
**繰り返し発生**: 同じ問題が何度も発生し、一時的に解決しても再発する

---

## 1. 問題の概要

### 1.1 現在の症状

チャレンジ作成ボタンを押すと「チャレンジの作成に失敗しました」というエラーが表示される。この問題は以下の特徴がある。

| 特徴 | 詳細 |
|------|------|
| エラーメッセージ | 「チャレンジの作成に失敗しました。入力内容を確認して再度お試しください。」 |
| APIレスポンス | HTTP 500 INTERNAL_SERVER_ERROR |
| 発生頻度 | 常に発生 |
| 再現性 | 100% |
| 影響範囲 | 全ユーザー |

### 1.2 デプロイ問題（最も深刻）

GitHubにコードをプッシュし、Vercel/Railwayで「デプロイ成功」と表示されても、**本番サイトに反映されない**。

| 環境 | 期待バージョン | 実際のバージョン | ステータス |
|------|---------------|-----------------|-----------|
| GitHub | v6.03 | v6.03 | ✅ 正常 |
| Railway API | v6.03 | v6.03（ACTIVE） | ✅ 正常 |
| Vercel | v6.03 | v6.03（表示上） | ⚠️ 要確認 |
| 本番サイト | v6.03 | **v5.98** | ❌ 未反映 |

**この問題は何度も繰り返し発生している。** 一時的に解決しても、また同じ状態に戻る。

---

## 2. 試した解決策（すべて失敗）

### 2.1 デプロイ関連

| 試した解決策 | 結果 |
|-------------|------|
| Vercelで「Redeploy」 | 変化なし |
| Vercelで「Promote to Production」 | 変化なし |
| Vercelのキャッシュをパージ | 変化なし |
| 「Use existing Build Cache」を外して再デプロイ | 変化なし |
| ブラウザのキャッシュをクリア | 変化なし |
| シークレットモードで確認 | v5.98のまま |
| curlで直接確認 | v5.98を返す |

### 2.2 コード修正関連

| 試した解決策 | 結果 |
|-------------|------|
| AI関連カラム5つをINSERTから除外（v6.03） | デプロイが反映されないため効果不明 |
| バージョン番号をv6.03に更新 | デプロイが反映されないため効果不明 |

---

## 3. 本番DBの実際の構造（確認済み）

TiDB Cloudに直接接続して`DESCRIBE challenges;`を実行した結果、**AI関連カラム5つはすべて存在している**。

```sql
| aiSummary          | text      | YES  | NULL |
| intentTags         | json      | YES  | NULL |
| regionSummary      | json      | YES  | NULL |
| participantSummary | json      | YES  | NULL |
| aiSummaryUpdatedAt | timestamp | YES  | NULL |
```

**つまり、スキーマの不整合は問題ではない。** 問題はデプロイが反映されないことにある。

---

## 4. 現在のインフラ構成

### 4.1 3環境の分離

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
│    │ v5.98?  │    │ v6.03   │          │                   │
│    └────┬────┘    └────┬────┘          │                   │
│         │              │               │                   │
│         │              ▼               │                   │
│         │         ┌─────────┐          │                   │
│         │         │ TiDB    │◄─────────┘                   │
│         │         │ Cloud   │                              │
│         │         └─────────┘                              │
│         │                                                   │
│         ▼                                                   │
│    https://doin-challenge.com                               │
│    （v5.98のまま！）                                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 問題点

1. **Vercelのデプロイが本番に反映されない** - ダッシュボードでは成功と表示されるが、実際のサイトは古いまま
2. **3環境の同期が取れない** - GitHub、Vercel、Railway、TiDBがそれぞれ独立して動作
3. **デバッグが困難** - どこで問題が発生しているか特定しにくい

---

## 5. 質問1: デプロイ問題の根本解決

### 5.1 なぜVercelのデプロイが反映されないのか？

Vercelダッシュボードでは以下が確認できる。

- Source: `main` → `41db70f v6.03: DB構造確認API追加`
- Status: Ready
- Domains: `doin-challenge.com` と `www.doin-challenge.com`

しかし、本番サイトはv5.98のまま。考えられる原因は？

### 5.2 Vercel + Railway + TiDBの3環境を統一する方法

**提案1: Railwayに統一**
- フロントエンド、バックエンド、DBをすべてRailwayでホスティング
- メリット: 1つのダッシュボードで管理、デプロイの同期が容易
- デメリット: Vercelの高速CDNが使えない

**提案2: Vercelに統一**
- Vercel Functions + Vercel Postgres（またはPlanetScale）
- メリット: 高速CDN、エッジ関数
- デメリット: 既存のTiDBからの移行が必要

**提案3: 現状維持 + CI/CD強化**
- GitHub Actionsでデプロイの検証を自動化
- ヘルスチェックAPIでバージョンを確認
- デプロイ失敗時にアラート

どの方法が最も現実的か？

---

## 6. 質問2: LLM機能を使ったエラー分析

### 6.1 現在のLLM機能

プロジェクトには`server/_core/llm.ts`にLLM機能が実装されている。

```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, world!" },
  ],
});
```

**しかし、この機能は現在どこでも使われていない。**

### 6.2 提案: LLMを使ったエラー分析機能

以下のような機能を実装できないか？

```typescript
// server/routers.ts
analyzeError: publicProcedure
  .input(z.object({ errorLog: z.string() }))
  .mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: "あなたはエラー分析の専門家です。以下のエラーログを分析し、原因と解決策を提案してください。" 
        },
        { role: "user", content: input.errorLog },
      ],
    });
    return response.choices[0].message.content;
  }),
```

これにより、Railwayのログをコピペしてアプリ内で分析できる。

### 6.3 質問

1. **LLM機能を有効活用する方法は？** - エラー分析、ユーザーサポート、コンテンツ生成など
2. **OpenRouter vs Manus Forge** - 現在は`forge.manus.im`を使用しているが、OpenRouterに切り替えるメリットは？
3. **コスト管理** - LLM APIの使用量をどう管理するか？

---

## 7. 質問3: チャレンジ作成エラーの根本原因

### 7.1 Railwayのログ

Railwayのログには以下のエラーが大量に出ている。

```
[Auth] /api/auth/me failed: HttpError: Invalid session cookie
[Auth] Missing session cookie
[Auth] Session verification failed: JWTInvalid: Invalid Compact JWS
```

### 7.2 考えられる原因

1. **セッション管理の問題** - ログインしているはずなのにセッションが無効
2. **Cookie設定の問題** - Vercel（フロント）とRailway（バック）でドメインが異なる
3. **CORS設定の問題** - クロスオリジンリクエストがブロックされている

### 7.3 質問

1. **セッションエラーとチャレンジ作成エラーは関連しているか？**
2. **Vercel + Railwayの構成でCookieベースの認証は正しく動作するか？**
3. **認証をBearerトークンに統一すべきか？**

---

## 8. 質問4: 長期的な解決策

### 8.1 現在の問題の根本原因

1. **インフラの複雑さ** - 3つの環境（Vercel、Railway、TiDB）が独立して動作
2. **デプロイの不確実性** - 成功と表示されても実際には反映されない
3. **デバッグの困難さ** - どこで問題が発生しているか特定しにくい
4. **マイグレーションの手動管理** - TiDBへのスキーマ変更が自動化されていない

### 8.2 提案する解決策

**短期（今すぐ）:**
- Vercelのビルドログを詳細に確認
- Vercelのドメイン設定を確認
- 必要ならVercelプロジェクトを再作成

**中期（1週間以内）:**
- CI/CDパイプラインを構築（GitHub Actions）
- デプロイ後のヘルスチェックを自動化
- バージョン確認APIを追加

**長期（1ヶ月以内）:**
- インフラを1つのプラットフォームに統一
- または、3環境の同期を完全に自動化

### 8.3 質問

1. **最も現実的な短期解決策は？**
2. **インフラ統一のコストと時間の見積もりは？**
3. **同様の問題を経験した他のプロジェクトの事例は？**

---

## 9. 技術情報

### 9.1 環境情報

| 項目 | 値 |
|------|-----|
| フロントエンド | React Native (Expo) + TypeScript |
| バックエンド | Node.js + Express + tRPC |
| ORM | Drizzle ORM |
| データベース | TiDB Cloud (MySQL互換) |
| ホスティング（Front） | Vercel |
| ホスティング（Back） | Railway |
| 認証 | Twitter OAuth 2.0 + Manus OAuth |
| LLM | Manus Forge (gemini-2.5-flash) |

### 9.2 関連ファイル

| ファイル | 役割 |
|----------|------|
| `server/db.ts` | データベースクエリ（createEvent関数） |
| `server/routers.ts` | tRPC APIルート |
| `server/_core/llm.ts` | LLM機能（未使用） |
| `drizzle/schema.ts` | DBスキーマ定義 |
| `shared/version.ts` | バージョン番号 |

### 9.3 接続情報

| サービス | URL/接続先 |
|----------|-----------|
| 本番サイト | https://doin-challenge.com |
| API | https://api.doin-challenge.com |
| TiDB | gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000 |
| GitHub | kimito-link/doin-challenge.com |

---

## 10. 期待する回答

1. **即時解決策**: 今すぐチャレンジ作成を復旧させる具体的な手順
2. **デプロイ問題の原因特定**: なぜVercelのデプロイが反映されないのか
3. **インフラ統一の提案**: 3環境を統一または安全に管理する方法
4. **LLM活用の提案**: エラー分析やデバッグにLLMを活用する方法
5. **長期的なアーキテクチャ改善**: 同様の問題を防ぐための設計変更

---

*このドキュメントは2026年1月19日時点の状態を反映しています。*
