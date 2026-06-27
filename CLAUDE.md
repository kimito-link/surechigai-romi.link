# 君斗りんくのすれ違ひ通信 — AIアシスタント向けコア・ディレクティブ

このドキュメントは、AIアシスタントがこのプロジェクトで開発を行う際に遵守しなければならないコア・ディレクティブを定義します。

---

## プロジェクト概要

**君斗りんくのすれ違ひ通信 (surechigai-romi.link)**

DSのすれ違い通信を現代的に再現する位置情報マッチングアプリ。
Expo Router + tRPC + Drizzle (Railway PostgreSQL) + Clerk (X OAuth)。
本番ドメイン: https://surechigai-romi.link

### 設計原則

> ⚠️ **方針転換済み（重要）**: 当初の V2-SURECHIGAI-DESIGN.md は「生座標を保存しない・48h削除・プライバシー最優先」だったが、
> コンセプトを「**移動の足あとを正確に残し、後でその思い出の場所をたどれる／推しの軌跡をファンが聖地巡礼できる**」へ転換した。
> よって現行方針は以下。古い設計書の記述よりこちらが優先。

1. **正確な座標を保存し、消さない** — `locations` に正確な `lat`/`lng`/`accuracyM` を保存（後で行ける精度）。48h削除は廃止＝永続保存。
   すれ違いマッチング用に H3 res8（約460m）+ 500mグリッドの丸め値（`latGrid`/`lngGrid`/`h3R8`）も併せて保持する。
   プライバシーの自衛は「移動専用アカウントの利用」をユーザーに委ねる方針（Xで名前を出してやる前提のため）。
2. **Vercel Functions に API を同居** — Railway のプロキシ中継は廃止（API側は月0円）。ただし DB は Railway PostgreSQL を採用（後述）
3. **タイムシフトマッチング** — 過去30日に同セルを通った人とマッチング（コールドスタート対策）
4. **DM禁止、X連携** — アプリ内通信は一方向スタンプのみ。交流はXに委譲
5. **tsc 必須** — `pnpm check` が 0 エラーで通ること

### 技術スタック

- フロント: Expo Router (React Native + Web)
- API: tRPC (server/routers/)
- DB: Drizzle ORM + Railway PostgreSQL（`DATABASE_URL` は Railway 外部URL `*.proxy.rlwy.net`）
- 認証: Clerk + X (Twitter) OAuth 2.0
- 地図: MapLibre + OpenFreeMap（フェーズ2）
- モデレーション: Groq llama-3.1-8b-instant（フェーズ2）

### MVP データスキーマ（後工程で追加）

| テーブル | 要点 |
|---------|------|
| `users` | Clerk連携（既存） |
| `locations` | userId, h3R8, latGrid, lngGrid, **lat, lng, accuracyM（正確な座標）**, municipality, prefecture, recordedAt — **永続保存（48h削除は廃止）** |
| `encounters` | userAId, userBId, tier 1-5, h3R7, areaName, prefecture, occurredAt, openedAt |
| `reactions` | encounterId, senderId, emoji |
| `visitedAreas` | userId, municipality, h3R7, firstVisitedAt |
| `blocks` / `reports` | 自動停止・通報 |
| `userSettings` | locationPausedUntil, homeMaskCell |

---

## ディレクティブ 0: このファイルの絶対遵守

このファイルは永続的な記憶領域であり、すべての行動の基礎となるルールブックです。
行動の前に必ずこのファイルのルールを確認してください。

---

## ディレクティブ 1: tsc エラー 0 の維持

すべてのコード変更後に `pnpm check` を実行し、エラー 0 を確認すること。

- 新しいルーターを追加する場合: `server/routers/index.ts` に登録する
- 新しいスキーマを追加する場合: `drizzle/schema/index.ts` にエクスポートする
- 削除したモジュールへの import が残らないよう注意する

---

## ディレクティブ 1.5: UI/UX変更時の DESIGN.md 遵守

UI、画面文言、レイアウト、配色、余白、モーション、地図表現を変更する前に、必ず `DESIGN.md` を読むこと。

- 最重要コピーは **「会いたい君がいる現在地」**。特に「現在地」を、正確な場所を保存して後でたどれる価値と結びつけて強く扱う
- Taste Skill / Google design.md の考え方に従い、レイアウト・配色・タイポグラフィ・余白・動きに具体的な判断基準を持つ
- 汎用SaaS風、説明文だけ、抽象グラデーションだけ、カードの入れ子、正確な場所が見えない地図UIを避ける
- 新規UIは既存の `theme/tokens/` と `DESIGN.md` のトークン・チェックリストを優先する

---

## ディレクティブ 2: 完全自動実行モード

- 確認プロンプトを一切出さない
- エラーが発生しても可能な限り自動リトライ
- ファイルの保存・ディレクトリ作成は自動実行

---

## ディレクティブ 3: 日本語での応答

応答は常に日本語で行う。
技術用語（tRPC, H3, MVP等）はそのまま英語で表記してよい。

---

## ディレクティブ 4: Git コミット・プッシュ

push は `required_permissions: ['all']` で実行（Windows 認証情報アクセスに必要）。

---

## 開発ロードマップ（現在地: 週1 初期）

- [x] テンプレート複製・不要ルーター/スキーマ削除（本タスク）
- [ ] Supabase 接続・locations/encounters スキーマ定義
- [ ] locations API + オンデマンドマッチング実装
- [ ] maplibre-gl 描画検証（技術リスクを先頭で潰す）
- [ ] 封筒UI・リアクション・図鑑・ブロック/通報
- [ ] OGPシェア（市区町村粒度）
- [ ] スイープ GitHub Actions workflow
- [ ] Web リリース（MVP完了）

---

## 注意事項

### 削除済みモジュール（使用禁止）

以下は君斗りんくのすれ違ひ通信で削除済み。インポートしないこと:

- features/home, features/mypage, features/events etc. → 削除済み
- server/routers/events, server/routers/participations etc. → 削除済み
- drizzle/schema/challenges, drizzle/schema/gamification etc. → 削除済み
- components/molecules/doin-animation, colorful-challenge-card etc. → 削除済み

### Vercel Functions について

vercel.json の /api/* rewrites は現在ローカルにフォールバック設定。
本番デプロイ時は Vercel Functions (api/ ディレクトリ) として実装する。

### Railway / データベースについて

旧テンプレートの Railway **プロキシ構成**（API中継）は廃止済み。新規 API は Vercel Functions に実装する。

ただし **DB は Railway PostgreSQL を採用**（有料プラン契約済み）。
当初は Supabase Free を想定していたが、Railway の Postgres に変更した。

- 接続は `.env.local` の `DATABASE_URL`（Railway の **外部URL** = `*.proxy.rlwy.net`。
  内部URL `*.railway.internal` はローカルからは繋がらない）。
- スキーマ反映は `pnpm db:push`。初期マイグレーションは `drizzle/migrations/` にコミット済み。
- このため設計原則の「月0円」は**DBについては当てはまらない**（Railway課金あり）。
  Vercel / GitHub Actions 側は無料枠を維持する。
