# AI用プロンプト集：バグ出し・修正・デッドコード削除

このドキュメントは、Cursor / Windsurf / Claude Code / ChatGPT などで、**そのままコピペして使える**プロンプト集です。  
本プロジェクト（doin-challenge.com）の構成に合わせて、実行コマンド・パス・環境変数を埋め込んであります。

---

## プロジェクト構成（事前共有用）

| 項目 | 内容 |
|------|------|
| フレームワーク | **Expo + React Native Web**（expo-router） |
| バックエンド | Express + tRPC |
| 認証 | Clerk |
| DB | PostgreSQL + Drizzle |
| テスト | Vitest（単体）, Playwright（E2E） |
| パッケージマネージャ | pnpm |

### 主要URL（ローカル）

| 用途 | URL |
|------|-----|
| フロント（Expo Web） | http://localhost:8081 |
| API（Express） | http://localhost:3000 |
| ヘルスチェック | http://localhost:3000/api/health |

### 実行コマンド

```bash
# 開発起動（サーバー + Metro 同時）
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm check

# 単体テスト
pnpm test

# E2E（ローカル向け）
PLAYWRIGHT_BASE_URL=http://localhost:8081 pnpm e2e

# E2E（本番向け・デフォルト）
pnpm e2e
```

### 環境変数（.env.local 例）

```
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
VITE_APP_ID=...
JWT_SECRET=...
```

### 主要ルーティング（app/）

- `(tabs)/` … タブ（index, create, stats, mypage）
- `dashboard/[id]`, `event/[id]`, `profile/[userId]`
- `admin/` … 管理画面
- `join/[code]`, `invite/[id]`, `oauth/twitter-callback`

---

## 1) 全体診断（バグ洗い出し → 優先度付け → 修正計画）

```text
あなたはシニアQA + フルスタックエンジニアです。
目的：このWebサイト（リポジトリ全体）の「バグ出し」と「修正計画」を作り、重大バグから順に直すこと。

# 入力として渡すもの
- リポジトリの構成（ツリー）
- 主要ページURL/ルーティング一覧（分かる範囲で）
- 実行手順（dev起動コマンド、env例、ログイン情報があれば）
- エラー/不具合の再現手順が分かるもの（あれば）

# 本プロジェクトの実行手順
- 開発起動: pnpm dev
- フロント: http://localhost:8081
- API: http://localhost:3000
- 型チェック: pnpm check
- 単体テスト: pnpm test
- E2E（ローカル）: PLAYWRIGHT_BASE_URL=http://localhost:8081 pnpm e2e

# やってほしいこと
1) まず「サイトの期待仕様」を推定し、足りない点は仮定を明記して進める
2) バグ候補をカテゴリ別に列挙
   - 画面/UI崩れ、ルーティング、フォーム、API通信、認証、状態管理、権限、パフォーマンス、SEO、アクセシビリティ、セキュリティ
3) 各バグ候補について以下の形式で出す
   - 症状 / 影響範囲 / 再現手順 / 原因仮説（コードの当たり）/ 修正方針 / テスト観点 / 優先度(P0/P1/P2)
4) 「最短で安定させる修正順」を提案（P0から）
5) 追加で入れるべきログ、Sentry等の監視ポイントも提案

# 出力形式
- バグ一覧（表形式っぽく：ID, 優先度, 症状, 原因候補, 修正案, テスト）
- 次にやるタスクのチェックリスト（P0→P1→P2）
- 変更が大きい箇所は安全な段階的手順（small PR方針）

注意：削除や修正は「根拠（参照検索結果・呼び出し元）」が示せるものだけに限定し、曖昧なものは"保留リスト"に回してください。
```

---

## 2) 実装修正モード（実際にコードを直す指示）

```text
あなたはこのリポジトリの実装担当です。
目的：P0バグを「壊さずに」修正し、回帰を防ぎ、レビューしやすい差分でPR単位に分けること。

制約：
- 既存の仕様を変えない（変える場合は必ず理由と影響を説明）
- 1PR=1テーマ（小さく）
- 変更後は必ず動作確認手順を書く
- テストが無いなら「最低限の回帰防止」を追加（ユニット or E2Eどちらか）

# 本プロジェクトの確認コマンド
- 型チェック: pnpm check
- 単体テスト: pnpm test
- E2E（ローカル）: PLAYWRIGHT_BASE_URL=http://localhost:8081 pnpm e2e
- ビルド: pnpm build

手順：
1) 直す対象バグを1つ選び、再現 → 原因箇所を特定（該当ファイル/関数名まで）
2) 修正案を2案出し、リスクが低い案を採用
3) 実装（変更点をdiff風に説明してもよい）
4) テスト/確認項目を追加
5) コミットメッセージ案、PR説明文案も出す

出力：
- 修正内容（ファイル別）
- テスト/確認手順
- PR本文テンプレ

注意：削除や修正は「根拠（参照検索結果・呼び出し元）」が示せるものだけに限定し、曖昧なものは"保留リスト"に回してください。
```

---

## 3) デッドコード削除（安全に削る：未使用検出 → 削除 → 回帰確認）

```text
あなたはリファクタリング担当です。
目的：このリポジトリから「未使用コード（デッドコード）」を安全に削除し、ビルド/動作を壊さないこと。

# 本プロジェクトの構成
- Expo + React Native Web（app/ が Expo Router）
- Express + tRPC（server/）
- コンポーネント: components/, features/
- hooks: hooks/
- 確認コマンド: pnpm check, pnpm test, pnpm build, PLAYWRIGHT_BASE_URL=http://localhost:8081 pnpm e2e

# まずやること（実行計画）
1) 未使用検出の方針を提示（言語/フレームワークに合わせる）
   - TypeScript: ts-prune / eslint(no-unused-vars) / IDEのFind Usages
   - Expo Router: 未使用コンポーネント・未使用hooks・未使用APIルートも対象
   - tRPC: 未使用のprocedure/router
2) 「削除してはいけない可能性があるコード」を最初に列挙
   - 動的import、reflection、文字列参照、環境変数で切替
   - 外部から叩かれるAPI、cron、OAuth callback 等

# 削除の進め方
A) 未使用一覧を作成（ファイル/シンボル/参照元）
B) 1カテゴリずつ削除（未使用import → 未使用関数 → 未使用コンポーネント → 未使用API → 未使用依存）
C) 各ステップで pnpm check / pnpm test / pnpm build / E2Eスモーク を実施
D) 変更点と削除理由をログ（PRに書ける形）

# 出力形式
- 未使用候補一覧（危険度：低/中/高）
- 削除手順（安全確認ポイント付き）
- 実際の削除パッチの提案（ファイル別）
- 回帰チェックリスト（ページ/機能単位）

注意：削除や修正は「根拠（参照検索結果・呼び出し元）」が示せるものだけに限定し、曖昧なものは"保留リスト"に回してください。
```

---

## 使い方

1. **1) 全体診断** … まずこれでバグ候補と修正計画を出す
2. **2) 実装修正** … P0から順に、1バグずつコード修正
3. **3) デッドコード削除** … バグ修正が落ち着いたら、未使用コードを安全に削る

各プロンプト末尾の「注意」文は、AIが曖昧な根拠で削除・修正するのを抑えるためのものです。必ず含めてください。

---

## 実施履歴（2026-03-04）

### P0バグ修正

| ID | 症状 | 修正内容 |
|----|------|----------|
| 1 | `clerk.verifyToken` が存在しない（Clerk SDK v3 API変更） | `verifyToken(token, { secretKey })` に変更（server/_core/sdk.ts, index.ts） |
| 2 | use-auth.test.ts: `useAuth({ autoFetch: false })` が型エラー | `useAuth()` に変更（Clerk移行で引数廃止） |
| 3 | use-auth-ux-machine.ts: `authError instanceof Error` が型エラー | `authError as unknown` で型ガード |
| 4 | isAllowedOrigin: 関数が return なしで undefined を返す可能性 | server/_core/cors.ts に切り出し、テストは cors を直接 import |
| 5 | CORS テストがサーバー起動で undefined を返していた | cors.ts を分離し、テストがサーバーを起動せずに実行可能に |

### デッドコード（保留リスト）

- ts-prune で検出された未使用 export の多くは、Expo Router の default export、設定ファイル、動的参照のため false positive
- 根拠が示せるもののみ削除対象。要検証: constants/index.ts の一部、event-categories の getCategoryLabel 等
