# すれちがいロミ (surechigai-romi.link)

移動の副産物として封筒（すれ違い）が溜まり、帰宅後にまとめて開封する受動体験アプリ。
DSすれちがい通信の本質「開いた時に既に何かが起きている」をコアに据え、Xログインのみ・アプリ内DM禁止で運営する。

設計書: `../surechigai-nico/docs/V2-SURECHIGAI-DESIGN.md`

---

## アプリ概要

| 特性 | 内容 |
|------|------|
| コンセプト | 移動の副産物としてすれ違い体験を積み重ねる |
| ログイン | X (Twitter) OAuth 2.0 のみ |
| 位置情報 | 生緯度経度を保存しない。サーバー受信時に H3 res8（約460m）+ 500m グリッドへ即丸め |
| マッチング | オンデマンド即時 + タイムシフト（過去30日同セル）の2本柱 |
| 削除ポリシー | locations テーブルは 48 h TTL で物理削除 |
| 交流 | X に委譲。アプリ内は定型スタンプ一方向リアクションのみ。DM禁止 |
| インフラ | Vercel (フロント+API Functions) + Supabase Free (Postgres) + GitHub Actions スイープ |

### プライバシー設計の3原則

1. **生緯度経度を保存しない** — H3 res8 + 500m グリッドに即丸め
2. **48h 削除** — `locations` テーブルは 48h TTL で物理削除
3. **タイムシフトマッチング** — 同時刻同地点が不要。過去30日同セル通過者と成立

---

## 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| フロントエンド | Expo Router (web/iOS/Android 1コードベース), NativeWind, tRPC client |
| バックエンド | tRPC + Express (Vercel Functions に同居), Drizzle ORM |
| DB | Supabase Free (Postgres), H3 + B-tree (PostGIS 非依存) |
| 認証 | Clerk + Twitter OAuth 2.0 PKCE |
| 位置精度 | H3 res8 (約460m), h3-js ライブラリ |
| モデレーション | Groq llama-3.1-8b-instant (14,400 RPD) 主 + Gemini Flash-Lite 控え |
| 地図 (フェーズ2) | MapLibre + OpenFreeMap (キー不要・無制限) |
| 通知 (フェーズ2) | Expo Push (完全無料) |

---

## セットアップ手順

### 前提条件

- Node.js 22.x 以上
- pnpm 9.x 以上

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. Supabase プロジェクトの作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. プロジェクト設定 > Database > Connection string > URI > Transaction pooler (ポート 6543) を取得
3. `DATABASE_URL` に設定

```bash
# DB スキーマを Supabase に適用
pnpm db:push
```

### 3. Clerk プロジェクトの作成

1. [dashboard.clerk.com](https://dashboard.clerk.com) でプロジェクトを作成
2. Social connections で Twitter/X を有効化
3. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` と `CLERK_SECRET_KEY` を取得

### 4. Twitter Developer App の設定

1. [developer.twitter.com](https://developer.twitter.com) でアプリを作成
2. OAuth 2.0 の Callback URL を設定:
   - 本番: `https://surechigai-romi.link/oauth/twitter-callback`
   - 開発: `http://localhost:8081/oauth/twitter-callback`
3. `TWITTER_CLIENT_ID` と `TWITTER_CLIENT_SECRET` を取得

### 5. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
# 各変数を編集
```

### 6. 開発サーバーの起動

```bash
pnpm dev
```

- バックエンド: http://localhost:3000
- Expo (Web): http://localhost:8081

---

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DATABASE_URL` | 必須 | Supabase Postgres 接続文字列 (Transaction pooler ポート 6543) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | 必須 | Clerk 公開キー |
| `CLERK_SECRET_KEY` | 必須 | Clerk シークレットキー |
| `TWITTER_CLIENT_ID` | 必須 | Twitter OAuth 2.0 クライアント ID |
| `TWITTER_CLIENT_SECRET` | 必須 | Twitter OAuth 2.0 クライアントシークレット |
| `ENCRYPTION_KEY` | 必須 | Twitter トークン暗号化用 64 文字 hex キー (`openssl rand -hex 32`) |
| `SESSION_SECRET` | 必須 | セッション署名用シークレット |
| `SWEEP_SECRET` | 必須 | GitHub Actions スイープ Webhook 認証トークン |
| `NODE_ENV` | 任意 | `development` / `production` |
| `PORT` | 任意 | バックエンドポート (デフォルト: 3000) |
| `SENTRY_DSN` | 任意 | Sentry エラー監視 DSN |
| `GROQ_API_KEY` | 任意 | Groq API キー (ひとこと NGワードモデレーション) |
| `GEMINI_API_KEY` | 任意 | Gemini API キー (モデレーション控え) |

---

## Vercel デプロイ設定

| 設定項目 | 値 |
|---------|-----|
| ドメイン | `surechigai-romi.link` |
| Framework Preset | Other |
| Build Command | `pnpm expo export -p web` |
| Output Directory | `dist` |
| Install Command | `pnpm install` |
| Node.js Version | 22.x |

Vercel の Environment Variables に上記の「環境変数一覧」を全て設定すること。

---

## GitHub Actions secrets

スイープワークフロー (`sweeper.yml`) に以下の secrets が必要:

| Secret 名 | 内容 |
|-----------|------|
| `DATABASE_URL` | Supabase 接続文字列 |
| `SWEEP_SECRET` | スイープ Webhook 認証トークン (`.env.local` の値と一致させる) |
| `API_BASE_URL` | 本番 API URL (例: `https://surechigai-romi.link`) |

---

## プロジェクト構造

```
surechigai-romi.link/
├── app/
│   ├── (tabs)/              # 5タブ画面
│   │   ├── index.tsx        # ポスト（封筒開封UI）
│   │   ├── checkin.tsx      # チェックイン（位置送信）
│   │   ├── zukan.tsx        # 図鑑（47都道府県グリッド）
│   │   ├── map.tsx          # 軌跡マップ
│   │   └── mypage.tsx       # マイページ
│   └── oauth/
│       └── twitter-callback.tsx
├── modules/
│   └── encounter/           # すれ違いコアロジック
│       ├── core/            # 純TS: geo/tiers/matching/moderation/geocoding/privacy
│       └── db/              # Drizzle クエリ
├── server/
│   ├── routers/
│   │   ├── encounter.ts     # tRPC encounter ルーター
│   │   ├── safety.ts        # ブロック・通報
│   │   └── zukan.ts         # 図鑑・訪問エリア
│   └── db/                  # DB クエリ層
├── drizzle/
│   └── schema.ts            # Supabase Postgres スキーマ定義
├── .github/workflows/
│   └── sweeper.yml          # 15分スイープ: 48h削除・タイムシフトマッチング回収
├── .env.example             # 環境変数テンプレート
└── CLAUDE.md                # AIアシスタント向けコア・ディレクティブ
```

---

## 残課題・フェーズ2以降

- **maplibre-gl 実装**: `pnpm add maplibre-gl` 後、`app/(tabs)/map.web.tsx` で H3 セルを GeoJSON → maplibre-gl レイヤーとして描画
- **ブロックリスト取得 API**: `safety.listBlocked` を追加して mypage.tsx に接続
- **nativeバックグラウンド位置**: expo-location バックグラウンド (フェーズ1.5)
- **Expo Push 通知**: ネイティブアプリビルド後に有効化
- **公式ゴースト**: 駅・観光地常駐キャラクター (フェーズ2)
- **doin-challenge 移植**: `modules/encounter/` を doin-challenge.com に移植

---

## ライセンス

MIT License
