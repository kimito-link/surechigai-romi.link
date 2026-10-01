# surechigai-romi.link Web版 Next.js移行設計

## 状態: 設計完了・実装未着手・要本人承認

## 到達点

**今の理解**: Web版のちらつき（React error #418・二重`_layout`チャンクロード・AutoAdvanceToXの再レンダリング）は、
個別のバグではなく**Expo Router Webというアーキテクチャの構造的な脆さ**が原因。

### 確定した事実（実機・実コードで裏取り済み）

1. **本番で実際に再現している**（2026-10-01、Browser paneで`https://surechigai.kimito.link/`を確認）:
   - コンソールに`Uncaught Error: Minified React error #418`（Hydration failed）が繰り返し発生
   - `_layout-05ba1a6f259fe7183453516585e02f91.js`と`_layout-1133f15d6f5dc6201c9c7178d228d869.js`という
     **2つの異なる`_layout`チャンクが同一ページロードで並行取得**されている
   - `[AutoAdvanceToX][DEBUG] render #1〜#4`が1回のページロードで4回発生（通常は1回のはず）

2. **surechigai-romi.link/app/_layout.tsx のコメントに明記された既知の構造的問題**:
   - `authProviders`（ClerkRootProvider/OnboardingGateの動的import解決）が`null → 値`に変わる瞬間、
     Reactは親コンポーネントの型系譜が変わった子を強制的にアンマウント・再マウントする
   - これにより`stack`（React Navigation一式）が丸ごと再構築され、ナビゲーション状態が失われる
   - `components/auth/auto-advance-to-x.tsx`のコメント「useAuth()を直接呼ばないこと」は、
     この再マウントに巻き込まれてHydrationエラーを起こすことを実機ログで確認した結果の回避策

3. **kimitolink-linktree（Next.js + Clerk構成）は同じ問題を持たない**（2026-10-01実機確認、コンソールエラーゼロ）:
   - `components/AutoAdvanceToX.tsx`が`useUser()`（Clerk公式フック）を**直接呼んでいる**
   - 150ms遅延・sessionStorageロック・`window.Clerk`グローバル参照等の回避策が**一切不要**
   - Next.jsのApp Routerには「認証プロバイダの動的import解決によるツリー丸ごと再マウント」という
     構造的問題が存在しない（Client Componentの`"use client"`境界とServer Componentの分離が明確なため）

### 根本原因の特定

**Expo Router Web（React Native for Web）の動的importベースの認証プロバイダ遅延ロード設計が、
Reactのコンポーネント型系譜変化による強制再マウントを引き起こし、それがHydrationエラー・
二重チャンクロード・AutoAdvanceToXの多重レンダリングという形で表面化している。**

前回の一連の修正（sessionStorageロック・150ms遅延・`navigateReplace.withUrl()`経由のURL操作等）は
すべて**この構造的問題の症状に対する回避策**であり、回避策を重ねるたびに複雑さが増し、
新しい症状（今回のReact #418・二重chunk）が発生し続けている。

## 選ばれた方針: Web版だけをNext.js + Clerkへ移行

### なぜこの範囲か

- **ネイティブアプリ(iOS/Android)は対象外**: 既にストア審査を通過した本番Expoバイナリがあり、
  今日それに手を入れるのは不可逆リスクが大きい。Web版のちらつきとは無関係。
- **kimitolink-linktreeを一次参照先とする**: 同じkimito.link系サービスで、Next.js 16 + Clerk 7 +
  `app/(auth)`ルーティングという実証済み構成が既に本番稼働している。ゼロから設計しない。

### 移行の骨子

1. **新規Next.jsプロジェクトを立てる**（`surechigai-romi.link`のWeb版として、既存Expoリポとは別に
   `apps/web`のようなmonorepo構成にするか、完全に別リポにするかは実装フェーズで判断）
2. **認証**: `kimitolink-linktree/components/AutoAdvanceToX.tsx`をベースに移植。
   `useUser()`を直接呼ぶシンプルな実装のまま、迂回策を持ち込まない
3. **画面**: 既存Expo Router Web版の画面（サインイン・タブ・地図等）をNext.jsのApp Routerへ移植
4. **ネイティブアプリとの関係**: ネイティブアプリは引き続きExpo（`apps/native`相当）のまま。
   Web版とネイティブ版でコードを共有する部分（型定義・APIクライアント等）があれば、
   monorepo化を検討（kimitolink-linktreeの`apps/native`構成が参考になる）

## 未確認事項（実装フェーズで必ず確認すること）

1. surechigai-romi.linkのExpo版が使っているバックエンドAPI（tRPC等）が、Next.js版からも
   同じ形で呼べるか（認証トークンの受け渡し方式の互換性）
2. Web版とネイティブ版でユーザーセッションを共有する必要があるか（`.kimito.link`共有Cookie
   `__client_uat`の話。templates/web/auth-mode/の金型が使える可能性が高い）
3. 既存のExpo Router Web版で実装済みの機能（地図・タイムライン等）の網羅的な棚卸し
4. Vercelデプロイ設定・ドメイン（`surechigai.kimito.link`）の切り替え手順

## 参照ファイル

- 移行元(問題箇所): `surechigai-romi.link/app/_layout.tsx`、`components/auth/auto-advance-to-x.tsx`
- 移行先の実証済み参照: `kimitolink-linktree/components/AutoAdvanceToX.tsx`、`app/(auth)/`
- 認証ちらつきゼロ金型: `web-ios-android/templates/web/auth-mode/`
- 正本KB: `ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md`

## 次の一手

**完了**: この設計をFableに渡し、実装ハンドオフを作成した。
→ [`IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.md`](IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.md)
（Step 0〜6の具体的な移行手順・緑の条件・地雷と回避策・司令塔による事実裏取り結果を含む）。

実装は次チャット（または別セッション・別モデル）で、上記ハンドオフのStep 0から着手する
（ネイティブアプリのビルド構成に影響しうる大規模作業のため、拙速に実装を始めない）。
