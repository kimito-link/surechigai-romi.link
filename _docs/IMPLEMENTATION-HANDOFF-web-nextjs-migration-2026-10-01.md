# surechigai-romi.link Web版 Next.js + Clerk 移行 詳細設計（Fable設計・司令塔裏取り済み）

> 設計=Fable(claude-fable-5-1) / 裏取り=司令塔 / 2026-10-01 / 3段構えの手順2の産物
> 一次設計: [`DESIGN-web-nextjs-migration-2026-10-01.md`](DESIGN-web-nextjs-migration-2026-10-01.md)（本書はその次段）

## 状態: 設計完了・実装未着手（要本人承認: ①`apps/web/`同居方式 ②Phase 1で旧プロジェクトから`/sign-in`だけをNext.jsへプロキシする段階方式）

- 実装が終わったら `surechigai-romi.link/handoff.md` を本件の状態で上書きする（現在は2026-09-30のワンタップ不具合完了報告のまま）

---

## 司令塔による裏取り結果（実装着手前に必読）

Fableが提示した事実主張のうち、設計の前提を左右する最重要項目を実際に検証した。

- **0-1（ネイティブはExpo prebuildでWeb HTMLを読まない・`capacitor.config.json`は不使用）: 確認済み**。
  `capacitor.config.json`は実在するが、`.github/workflows/ios-appstore-release.yml:65`に
  「prebuild のネイティブ設定はここ（旧 capacitor.config.json の役割）」と明記されており、
  現在の実ビルドはprebuild設定に置き換わっている。さらに`lib/api/config.ts:67-70`で
  `Platform.OS !== "web"`の場合は`Constants.expoConfig?.extra?.apiUrl`または本番URL固定
  （`https://surechigai.kimito.link`）を使う実装を確認した。ネイティブアプリがWeb版のHTML/JS
  バンドルを一切読まないことは実コードで裏付けられている。
- **参照ファイルパスの実在**: Fableが本書で参照した移行元（surechigai-romi.link）17ファイル、
  移行先参照（kimitolink-linktree）9ファイル、正本1ファイルすべて実在確認済み（2026-10-01、
  `ls`コマンドで一括検証）。
- **未検証のまま残る項目**（Fable自身が「未確認事項」として明記、Step 0で埋める設計になっている）:
  0-3（Vercelプロジェクトの保護状態・エイリアス名）、0-7（本番のsatellite真偽）、
  Vercel MCPのteamスコープ再認証。これらは実装フェーズの最初の半日（Step 0）で確認する前提。
  司令塔はこの時点でVercel本番環境への追加アクセスは行っていない。

---

## 0. この設計が立脚する確定事実（Fable調査、一部司令塔裏取り済み・一部Step 0で要確認）

| # | 事実 | 出典 | 検証状態 |
|---|---|---|---|
| 0-1 | ネイティブ(iOS/Android)はExpo prebuild（バンドルJS実行）。Web HTMLを読まない。APIだけを`https://surechigai.kimito.link/api/*`に固定で叩く | `lib/api/config.ts:67-70`、`lib/native-app-shell.ts`、`web-ios-android/CLAUDE.md`金型表 | **司令塔が実ファイルで確認済み** |
| 0-2 | APIは同一Vercelプロジェクトの`api/`Functions。認証は`Authorization: Bearer <Clerkセッショントoken>`を`@clerk/backend verifyToken`で検証する経路が第一 | `server/_core/sdk.ts:132-152, 283-290`、`lib/trpc.ts:56-66` | Fable調査（ファイル実在確認のみ、内容は未読） |
| 0-3 | Vercelプロジェクト名`surechigai-romi-link`。本番エイリアス`https://surechigai-romi-link.vercel.app`は保護なしで200 | Vercel MCP `list_projects`、curl実測(Fable) | **未検証**(Step 0で再確認要) |
| 0-4 | `surechigai.kimito.link`はCloudflareプロキシ経由→Vercel。デプロイは`.github/workflows/deploy-vercel.yml` | nslookup・curl実測(Fable)、`vercel.json` `git.deploymentEnabled:false` | 司令塔が本セッションで実際にこのワークフローを読んでおり整合 |
| 0-7 | Clerkはkimito.link共有インスタンス。satellite化は環境変数が揃うときだけ。**本番でどちらか未確認** | `lib/clerk-provider-props.ts:46-54` | **未確認（Fable自身が明記）** |
| 0-9 | 参照実装kimitolink-linktree: Next 16.3/`@clerk/nextjs` 7.9/React 19.3、`AutoAdvanceToX`は`useUser()`直呼び。本番コンソールエラー0 | `kimitolink-linktree/next.config.ts`、`components/AutoAdvanceToX.tsx` | **司令塔が本セッションで実機確認済み**（コンソールエラーゼロを自ら確認） |

（0-5・0-6・0-8・0-10はFable調査のみ、実装Step 0で再確認する設計になっている。詳細は下記本文参照）

---

## A. 理想の体験フロー

### 変わらないもの
- 入口URL: `/sign-in?redirect_url=…&auto=x`。`/auth/kimito-link`
- Xワンタップの体験（1回押すだけ）
- ログイン済みで`/sign-in?auto=x`を開いても自動発火しない
- **ネイティブアプリは一切変わらない**
- 既存ユーザーのセッション: 再ログイン不要（同一Clerkインスタンス・同一オリジン）

### 変わるもの
- `/sign-in`着地時のちらつきが構造的に消える（ClerkProviderが静的importになり、ツリー丸ごと再マウントが起きない）
- Phase 1では`/`等の旧Expo画面のちらつきは残る（後続Phaseで解消）

---

## B. 統合アーキテクチャ

### B-1. 置き場所: 同一リポの`apps/web/`（pnpm workspaceにはしない）

```
surechigai-romi.link/
├─ app/ components/ lib/ server/ api/ …   ← 旧Expo（ネイティブ＋当面のWeb）。一切動かさない
├─ vercel.json                            ← 旧プロジェクト用。Phase 1でrewritesを4行だけ変更
├─ public/sw.js                           ← Phase 1で`/_next/`素通し1行追加
└─ apps/web/                              ← 新規Next.js（独立package.json・独立lockfile）
   ├─ package.json / next.config.ts / tsconfig.json / tailwind.config.ts
   ├─ app/
   │  ├─ layout.tsx
   │  ├─ (auth)/layout.tsx                ← ClerkProvider（D-1）
   │  ├─ (auth)/sign-in/[[...sign-in]]/page.tsx
   │  └─ auth/kimito-link/page.tsx
   ├─ components/
   │  ├─ AutoAdvanceToX.tsx               ← linktree版を土台にD-2の3点を移植
   │  └─ AuthPageShell.tsx等（8ファイル）
   ├─ lib/
   │  ├─ clerk-route.ts / auto-advance-to-x-guard.ts / auth-redirect-path.ts
   │  ├─ clerk-appearance.ts / clerk-localization.ts / native-app-shell.ts
   ├─ public/images/…
   └─ e2e/（Playwright: one-tap smoke）
```

**なぜ同一リポか**: git履歴・Gate・`.agent/coord.md`・`handoff.md`が1つで済む。
**なぜworkspaceにしないか**: ルートはReact 19.1.0固定・`@clerk/react`ピン留め等の強い依存固定を持つ。
Next 16はReact 19.3系を要求し別系統の依存を連れてくる。同じnode_modulesに同居させると、
ストア審査済みビルドの依存が動くリスクがある。独立lockfileなら干渉ゼロ。

**ルート側に必要な排他設定**:
- `tsconfig.json` `exclude`に`"apps"`追加
- `eslint.config.cjs` ignoresに`apps/**`
- `metro.config.cjs`に`resolver.blockList = [/apps\/web\/.*/]`追加
- `.vercelignore`（旧プロジェクト側）に`apps/`追加
- `pnpm check`内の各`verify-*.mjs`がリポ全体走査する場合は除外オプションを確認（Gateを迂回しない）

### B-2. 配線（トラフィック）— 2段階

**Phase 1〜N: ドメインは旧プロジェクトが持ち続け、`/sign-in`系だけ新プロジェクトへプロキシ**

```
ブラウザ → https://surechigai.kimito.link/sign-in?auto=x
  → Cloudflare(proxy) → Vercel[surechigai-romi-link]
       → vercel.json rewrites:
            /sign-in, /sign-in/, /sign-in/:path*, /auth/kimito-link(/), /_next/:path*
              → https://surechigai-web.vercel.app/…（外部rewrite=透過プロキシ）
            それ以外 → 今までどおり
```

- 旧`vercel.json`の既存4エントリのdestinationを差し替えるだけ
- ロールバック＝この`vercel.json`差分をrevertして`deploy-vercel.yml`（約3分）
- 旧`app/sign-in.tsx`・`app/sso-callback.tsx`は削除しない
- Next.js側は**Client Component中心・`clerkMiddleware()`を置かない**（G-1）

**Phase N+1: ドメインを新プロジェクトへ移し、旧プロジェクトを`/api/*`のfallbackにする**（別設計書スコープ）

### B-3. デプロイ
- 新Vercelプロジェクト`surechigai-web`（名前固定）。Root Directory: `apps/web`、Git連携ON（main）
- env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`（旧`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`と同じ値）、
  `CLERK_SECRET_KEY`、satellite系（D-1参照）。値の受け渡しは`~/.claude/CLAUDE.md`
  「クリップボード経由」節に従う

### B-4. 主要コンポーネント（4つ）
1. `app/(auth)/layout.tsx` — ClerkProvider（静的importが根本解決そのもの）
2. `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — linktreeの同名ファイルをそのまま
3. `components/AutoAdvanceToX.tsx` — D-2
4. `components/AuthPageShell.tsx`一式 — linktree版を土台に文言をsurechigai版から移す

---

## C. 移行手順（小さく検証しながら）

### Step 0: 事実確認（コードを書く前・半日）
1. `ios-appstore-release.yml`/`android-play-release.yml`の実行内容を読み、`capacitor.config.json`を
   参照するステップが無いことを再確認（司令塔は既に65行目のコメントで確認済みだが、実装フェーズでも
   もう一度確認する）
2. Vercel MCPをteam `kimito-link`スコープで再認証し、旧プロジェクトのenv名前一覧
   （`filter_project_envs`、値は見ない）からsatellite関連envの有無を記録
3. 本番`/sign-in`をBrowser paneで開き`window.Clerk.isSatellite`等を記録
4. kimitolink-linktreeの依存関係一式を棚卸し

緑の条件: 上記が実装ハンドオフの「確定事実」表に追記されている

### Step 1: `apps/web`骨組み（ローカルのみ）
- `create-next-app`→ B-1のファイル一式を作る
- ルート側排他設定を入れる
- 緑の条件: `pnpm check`が変更前と同じ結果／`npx expo export -p web --clear`成功／
  `apps/web`で`pnpm build`成功／ローカルで`/sign-in/?redirect_url=%2F&auto=x`をBrowser paneで開き
  コンソールエラー0・オーバーレイ表示→x.com遷移確認

### Step 2: 新Vercelプロジェクト作成・プレビュー検証
- `surechigai-web`作成、env登録、push→本番エイリアスが200
- 緑の条件: curlでヘッダー確認、Browser paneでオーバーレイ→x.com遷移（★このオリジンではログイン
  往復は完走できない。往復検証はStep 3で行う）

### Step 3: 旧プロジェクトの`vercel.json` rewrites差し替え＋`sw.js`素通し（本番切替・ロールバック可能）
- `vercel.json`をB-2の5パターンへ差し替え、`sw.js`に`/_next/`素通し追加
- 緑の条件（handoff.md 2026-09-30と同じ強度）:
  - `/sign-in`・`/sign-in/`・`/sign-in?auto=x`すべて200、Next.jsが応答
  - **Browser pane・新規タブ・sessionStorage.clear()済みで`/sign-in?redirect_url=%2F&auto=x`を
    5回連続実行し、5/5でX認可画面へ遷移・認可後ログイン済み着地を確認**（前回のsurechigai対応と
    同じ強度の実機検証基準）
  - コンソールの`Minified React error #418` = 0
  - `/sign-in`のネットワークタブに`_layout-*.js`が出ない
  - ログイン済みで`/sign-in?auto=x`→自動発火せず`auto`が消える
  - `/api/health`の応答がStep 3前と同一（ネイティブ契約不変）
  - `pnpm e2e:one-tap`緑

### Step 4: `/auth/kimito-link`移植
### Step 5（Phase 1.5）: 金型への格上げ
`AutoAdvanceToX.tsx`等を`web-ios-android/templates/web/auth-mode/nextjs/`へ格上げ、
`check-drift.mjs`のPAIRSに登録

### Step 6以降（Phase 2〜、本書のスコープ外）
静的ページ→認証済みシェル→タブ画面→ドメイン移動→API移動、の順（詳細はFable設計本文参照）

---

## D. 認証(Clerk)詳細実装方針

### D-1. ClerkProvider props
`lib/clerk-provider-props.ts`の意図をpropsとして静的に書く（動的importしない＝これが根本解決）。
移行中にsatellite真偽を変えない。詳細な対応表はFable設計本文参照。

### D-2. AutoAdvanceToXの移植方針
土台: `kimitolink-linktree/components/AutoAdvanceToX.tsx`（`useUser()`直呼び）。
還流する改善3点（すべて正本`CLERK_X_LOGIN_PLAYBOOK.md`に既採録）:
1. ネイティブシェル除外ガード（`window.Capacitor?.isNativePlatform?.()`判定のみ）
2. click後にURLから`auto=x`を消す順序
3. ボタン発見→click まで150ms遅延＋2秒後`warnIfUrlUnchanged`

### D-3. バックエンドAPI呼び出しの認証トークン
サーバー(`server/_core/sdk.ts`)は無変更。`useAuth().getToken()`が返す同一インスタンスの
セッションJWTをBearerに載せれば通る。トークン取得暴走防止（45秒メモ・in-flight共有等、
2026-07-04の実損対応）は純モジュールとして移植する。

---

## E. MVP範囲（Step 3で確認する最小）

**入れる**: `/sign-in`系、AutoAdvanceToX、AuthPageShell一式、`/auth/kimito-link`、
CSP/no-storeヘッダー、sw.jsの`/_next/`素通し、ルート排他設定。
**入れない**: タブ・シェル・tRPC・clerkMiddleware・ログアウト・ドメイン移動・API移動・workspace化。

受け入れ基準はStep 3の緑条件を全部満たすこと。デプロイ完了・CI緑だけで完了と言わない
（web-ios-android CLAUDE.md「裏取りも同じ強度で徹底する」節）。

---

## F. 捨てた案とその理由（要旨、詳細はFable設計本文）

- 一気に全画面書き換え→検証点が1つに集中しリスク大、却下
- Next.jsをリポルートに置く→`app/`ディレクトリ名衝突で不可能
- react-native-webをNext.jsに載せる→消したい脆さを別の器に移すだけ
- 完全に別リポ→純ロジック共有・最終形への距離で同一リポが勝つ（ただし逃げ道として保持）
- satelliteとしてprimaryへ委譲→2026-08-10に自オリジン維持で決着済み、蒸し返さない
- `authenticateWithRedirect()`直呼び→正本で名指し禁止（commit db0032aで本番破壊の前科）

---

## G. 地雷と回避策（要旨、詳細はFable設計本文）

1. プロキシ越しのHostが`*.vercel.app`になる→`clerkMiddleware`を置かない、遷移はクライアント起点のみ
2. 末尾スラッシュ→`trailingSlash:true`+`skipTrailingSlashRedirect:true`
3. Service Worker→`/_next/`素通し追加
4. CSPヘッダーがプロキシ経由では新プロジェクト由来になる→`next.config.ts`に複製、ドリフト検査登録
5. Cloudflareキャッシュ→`/sign-in`はno-store、`/_next/static`はハッシュ付きimmutable
6. ルートの走査ツールが`apps/web`を拾う→B-1排他設定＋Step 1の緑条件で機械確認
7. 依存の混線→pnpm-workspace.yamlを作らない、`.npmrc`に`shamefully-hoist=false`
8. `AppRouter`型共有（Phase 2の関所）→`.d.ts`生成方式をPhase 2初手に
9. プレビューオリジンでログイン往復を検証できない→往復は本番ドメイン切替後に5/5で確認
10. 既存セッション断絶リスク→理論上ゼロ（同一Clerkインスタンス・同一オリジン・同名cookie）
11-15: 詳細はFable設計本文参照

---

## 参照ファイル（実在確認済み・絶対パス）

移行元(surechigai-romi.link): `app/_layout.tsx`、`components/auth/auto-advance-to-x.tsx`、
`components/providers/clerk-root-provider.tsx`、`lib/clerk-provider-props.ts`、
`lib/clerk-route.ts`、`lib/auto-advance-to-x-guard.ts`、`lib/auth-redirect-path.ts`、
`lib/clerk-appearance.ts`、`lib/clerk-localization.ts`、`lib/native-app-shell.ts`、
`lib/trpc.ts`、`lib/api/config.ts`、`server/_core/sdk.ts`、`api/trpc/[trpc].ts`、
`vercel.json`、`public/sw.js`、`tsconfig.json`、`metro.config.cjs`、
`.github/workflows/deploy-vercel.yml`、`app/sign-in.tsx`、`app/auth/kimito-link.tsx`、
`app/sso-callback.tsx`

移行先参照(kimitolink-linktree): `components/AutoAdvanceToX.tsx`、`app/(auth)/layout.tsx`、
`app/(auth)/sign-in/[[...sign-in]]/page.tsx`、`components/AuthPageShell.tsx`、
`components/ClerkMountFallback.tsx`、`components/AuthCallbackShell.tsx`、`next.config.ts`、
`lib/clerk-route.ts`、`docs/SHARED-ACCOUNT-SATELLITE-GUIDE.md`

正本・金型: `ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md`、
`web-ios-android/templates/web/auth-mode/README.md`

## 次の一手

実装は今回やらない。次チャット（または別モデル・別セッション）にこの実装ハンドオフを読ませ、
ブランチを切ってStep 0から着手する。着手前に必ずStep 0の未確認事項（0-3・0-7、Vercel MCPの
teamスコープ再認証）を埋めること。
