# 地図: ネイティブアプリのログインが外部ブラウザに出る問題（2026-08-06）

作成: 司令塔（Claude Opus 5）が実コードと本番を読んで作成。手順は
`github/WAYFINDER-TO-SPEC-HOWTO.md` の wayfinder→to-spec 方式。

## お題

App Store 却下3件（2026-08-06 / Submission `4509d431` / build 480 / iPhone 17 Pro Max・iOS 26.6）を解決する。

| # | Guideline | 指摘 |
|---|---|---|
| A | **4 - Design** | ログイン（Google/Apple/X すべて）が既定ブラウザに出る。アプリ内で完結させるか SFSafariViewController を使え |
| B | **2.1(a) - App Completeness** | Apple ログインでエラーメッセージが出た |
| C | **2.1(a) - Information Needed** | 「すれ違う」「たどれる」を検証できる**データ入りのデモアカウント**が必要（2度目の指摘） |

方針として確定済み（ユーザー承認）:
- **Capacitor Browser（iOS では SFSafariViewController）方式**で A を解く。Apple が却下通知で
  明示的に許容した解法（"You may also choose to implement the Safari View Controller API"）。
- **Expo prebuild への移行は採らない**（土台の作り替えになり却下対応として過剰）。
- C は**デモ用 X アカウント**を作り、足あと入りの状態にして ASC に登録する。

---

## 1. 入口になる画面・コマンド・API

| 入口 | 実体 |
|---|---|
| ゲストのCTA「はじめる」 | [components/molecules/kimito-login-cta.tsx](components/molecules/kimito-login-cta.tsx) → `signInHref` へ遷移 |
| `/sign-in` 画面 | [app/sign-in.tsx](app/sign-in.tsx) → Clerk の `<SignIn />`（[components/organisms/clerk-sign-in.tsx](components/organisms/clerk-sign-in.tsx)） |
| プログラム的ログイン | `useAuth().login(returnUrl, forceSwitch, provider)` = [components/providers/clerk-auth-bridge.tsx:191](components/providers/clerk-auth-bridge.tsx) |
| X未連携の救済 | [components/dashboard/x-link-rescue-card.tsx](components/dashboard/x-link-rescue-card.tsx) → 同じ `login()` に委譲 |

## 2. 関係する主要ファイルと責務

| ファイル | 責務 |
|---|---|
| [capacitor.config.json](capacitor.config.json) | `server.url` でリモートWebを読む設定。`server.allowNavigation` が WebView 内に留めるドメインの allowlist |
| [components/providers/clerk-auth-bridge.tsx](components/providers/clerk-auth-bridge.tsx) | `login()` の本体。Web分岐（`:218`）とネイティブ分岐（`:237`）を持つ |
| [components/organisms/clerk-sign-in.tsx](components/organisms/clerk-sign-in.tsx) | Clerk `<SignIn />` の描画。Apple/Google/X の3ボタンを出す |
| [components/auth/auto-advance-to-x.tsx](components/auth/auto-advance-to-x.tsx) | `?auto=x` で X ボタンを自動クリックする1タップ導線。ネイティブでは無効化済み（`:22-40`） |
| [lib/native-app-shell.ts](lib/native-app-shell.ts) | Capacitor ネイティブ判定（`isNativeAppShell()`）。2026-08-05 に新設 |
| [scripts/appstore-submit.mjs](scripts/appstore-submit.mjs) | 審査ノート（`buildDefaultReviewNotes`・`:463`）とデモ資格情報（`:507-509`）を ASC に送る |
| [.github/workflows/ios-appstore-release.yml](.github/workflows/ios-appstore-release.yml) | `npx cap add ios`（`:210`）で iOS プロジェクトを生成してビルド |

## 3. データが流れる順番（＝Aの真因）

**確認済みの事実**（本番実測 + 一次資料）:

1. ネイティブアプリは `server.url = https://surechigai.kimito.link`（[capacitor.config.json:35](capacitor.config.json)）を
   WebView で読む。よって**アプリ内でも `Platform.OS === "web"` になる**。
   - これは `lib/native-app-shell.ts` のコメントにも記載があり、同ファイルが `Capacitor.isNativePlatform()`
     で判別している理由そのもの。
2. `login()` が呼ばれると [clerk-auth-bridge.tsx:218](components/providers/clerk-auth-bridge.tsx) の
   `if (Platform.OS === "web" ...)` に入り、`window.location.href` で `/sign-in?...` に遷移する（`:232`）。
   → **`:237` 以降のネイティブ経路（`useOAuth`）には到達しない。**
3. `/sign-in` で Clerk の `<SignIn />` が Apple/Google/X の3ボタンを描画する。
   - **本番実測（2026-08-06）**: `cl-socialButtonsIconButton__apple` / `__google` / `__x` の
     3ボタンが実在。`Clerk.frontendApi = "clerk.kimito.link"`。
4. ボタンを押すと Clerk が各プロバイダの**認可ドメイン**へ遷移させる。
   - **本番実測（2026-08-06、HTTP応答で実在確認）**:
     `appleid.apple.com/auth/authorize`(200) / `accounts.google.com/o/oauth2/v2/auth`(302) /
     `x.com/i/oauth2/authorize`(200) / `twitter.com/i/oauth2/authorize`(301)
5. これら3ドメインは **`allowNavigation` に入っていない**（[capacitor.config.json:37-50](capacitor.config.json)）。
   現在の allowlist は `surechigai.kimito.link` / `*.kimito.link` / `kimito.link` /
   `surechigai-romi.link` / `*.clerk.accounts.dev` / `*.clerk.com` / `clerk.kimito.link` /
   `challenges.cloudflare.com` / `api.x.com` / `api.twitter.com` / `*.twimg.com` /
   `*.openfreemap.org` / `tile.openstreetmap.org`。
   - `api.x.com` はあるが、**OAuth のユーザー向け画面は `x.com`**。別ドメイン。
6. Capacitor の既定挙動: **allowlist 外のURLは外部ブラウザで開く。**
   - 一次資料（capacitorjs.com/docs/config を 2026-08-06 に取得）:
     「By default, all external URLs are opened in the external browser (not the Web View).」
     `allowNavigation` はその例外を指定する allowlist。

**結論（A の真因）**: OAuth プロバイダの認可ドメインが `allowNavigation` に無いため、
Capacitor が既定挙動で外部ブラウザを開いている。コードのバグではなく**設定の不足**。

**B（Apple ログインのエラー）の関係** — *一部推測*:
外部ブラウザで認証が完了しても、アプリの WebView とは Cookie/ストレージが別なので
Clerk のセッションがアプリ側に載らない。戻ってきても未ログインか、Clerk が
state 不一致でエラーを返す。**A を直せば B も解消する可能性が高いが、B の実物のエラー文言は
未確認**（審査員のスクリーンショットは提供されていない）。

## 4. 既存の設計判断と、その根拠（壊してはいけない境界）

| 判断 | 根拠 | 壊すと何が起きるか |
|---|---|---|
| **`useUser()` を新規コンポーネントで呼ばない** | [components/auth/auto-x-return-notice.tsx:51-57](components/auth/auto-x-return-notice.tsx)。ClerkProvider は `app/_layout.tsx` で動的 import されるため、chunk 解決前に描画されると「useUser can only be used within the ClerkProvider」でアプリ全体が落ちる。**2026-07-31 と 08-01 の2度、無関係な変更で本番が壊れた** | 本番が白画面 |
| **自前 OAuth を書き起こさない** | linktree の `components/LinkAccountsNotice.tsx` のコメント（正本 `CLERK_X_LOGIN_PLAYBOOK.md §1`）に「自前 OAuth 化は本番のセッション確立を壊した実績があるため厳禁」 | セッションが確立しない |
| **ネイティブでは `?auto=x` の自動クリックを無効化** | [components/auth/auto-advance-to-x.tsx:22-40](components/auth/auto-advance-to-x.tsx)。2026-08-05 の Guideline 4.8 却下対応。自動クリックのせいで審査員が Apple を選べなかった | 4.8 で再却下 |
| **ネイティブでは価格表現を出さない** | [lib/native-app-shell.ts](lib/native-app-shell.ts) `loginCtaNote()`。2026-08-05 の Guideline 2.3.7 却下対応 | 2.3.7 で再却下 |
| **サーバーの tRPC 内で fetch を投げっぱなしにしない** | [server/routers/ogp.ts](server/routers/ogp.ts) の警告コメント。Vercel Serverless は未解決 Promise があると関数を終了しない | シェアが固まる |
| **CDN_CACHE_EPOCH を上げないと配信されないことがある** | [theme/tokens/index.ts:40-47](theme/tokens/index.ts)。Metro は子チャンクの参照先を親のハッシュに含めない。2026-08-04 に実際に踏んだ | 修正が反映されない |

関連メモリ: [[surechigai-appstore-reject-2026-08-05]] / [[surechigai-clerk-hook-chunk-landmine]] /
[[surechigai-x-link-rescue-2026-08-06]] / [[surechigai-cdn-chunk-cache-landmine]]

## 5. 変更すると壊れうる箇所

- **`capacitor.config.json` の `allowNavigation`** — ここに足すドメインは WebView 内に留まる。
  広げすぎると「アプリ内で任意サイトが開ける」状態になり、審査でもセキュリティ面で不利。
  必要最小限（OAuth 認可ドメインのみ）にすること。
- **`login()` の Web 分岐**（[clerk-auth-bridge.tsx:218](components/providers/clerk-auth-bridge.tsx)） —
  Web ブラウザ（PWA）とネイティブが同じ経路を通る。ネイティブだけ変えたい場合は
  `isNativeAppShell()` で分ける必要がある。Web の1タップUXは維持する方針（2026-08-05 の判断）。
- **`ios.limitsNavigationsToAppBoundDomains: false`**（[capacitor.config.json:11](capacitor.config.json)） —
  現在 false。true にすると `WKAppBoundDomains` の制約下に入り、許可ドメイン数が3つまでに
  制限される。**触らないこと**（推測: true にすると OAuth が動かなくなる）。
- **`scripts/appstore-submit.mjs` の審査ノート**（`:474-506`） — デモ資格情報の有無で文言が
  分岐する（`_DEMO_USER`）。2026-08-05 に「資格情報があると書いてあるのに空欄」という
  自己矛盾を修正した箇所。デモアカウントを入れる場合は `IOS_REVIEW_DEMO_USERNAME` /
  `IOS_REVIEW_DEMO_PASSWORD` を設定すれば `:489` の分岐が切り替わる。
- **既存テスト** — `__tests__/native-app-shell.test.ts`（Capacitor 判定と文言の出し分け）、
  `__tests__/auth-providers.test.ts`（プロバイダの出し分け）が既存の挙動を固定している。

## 5.5. 【追記 2026-08-06】allowNavigation 追加だけでは解けないことが一次資料で確定

地図の初版と Fable 仕様は「`allowNavigation` に OAuth ドメインを足せば解ける」としていたが、
**一次資料で否定された**。以下は司令塔が確認した事実。

| プロバイダ | WKWebView 内での OAuth | 出典（2026-08-06 取得） |
|---|---|---|
| **Google** | **明確に拒否**。`disallowed_useragent` エラーを返す。「iOS/macOS 開発者が WKWebView で認可リクエストを開くとこのエラーに遭う」と明記 | [Google 公式: OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app) |
| **Apple** | **iOS 17 以降 WKWebView で動作しない**。同一端末の Safari では入れるのに WebView では入れないという報告が複数 | [Apple Developer Forums #740376](https://developer.apple.com/forums/thread/740376) |
| X | 拒否の報告は見つからず（**未確認**） | — |

**帰結**: `accounts.google.com` / `appleid.apple.com` を allowlist に足すと、外部ブラウザには
出なくなるが**ログイン自体が壊れる**。審査環境は iOS 26.6 なので Apple も確実に該当する。
Guideline 4 は直るが 2.1(a)（Apple ログインのエラー）が悪化する、という最悪の交換になる。

**Google も Apple も、そして却下通知の Apple 自身も、同じ解法を指している**:
- Google 公式: 「Using `SFSafariViewController` as a supported option」
- 却下通知: 「You may also choose to implement the Safari View Controller API」

### SFSafariViewController の残る難所（ここが設計の核心）

**Cookie は WKWebView と共有されない。** 確認した事実:
- SFSafariViewController と WKWebView 間でセッション Cookie は共有されない
  （[Apple Developer Forums #717670](https://developer.apple.com/forums/thread/717670)）
- `HTTPCookieStorage` は WKWebView の `WKHTTPCookieStore` と自動同期しない。WKWebView が
  別プロセスで動く WebKit の out-of-process 構造に由来する
- OAuth 中に WKWebView がバックグラウンドに回ると、iOS が Cookie を捨てることがある

**見つかった解法**（[Medium: Supabase PKCE OAuth in Capacitor iOS](https://medium.com/@vpodugu/supabase-pkce-oauth-in-capacitor-ios-why-your-code-verifier-disappears-and-how-to-fix-it-29a4747dce9e)）:
> カスタムスキームへ直接リダイレクトするのではなく、**まず HTTPS のエンドポイントへ戻し、
> そこから 302 でカスタムスキームへリダイレクトする**。SFSafariViewController は
> サーバー側リダイレクトを確実に処理する。

このアプリには `surechigai://` スキームが既に設定済み
（[capacitor.config.json:8](capacitor.config.json) `ios.scheme`、[app.config.json](app.config.json) `identity.iosScheme`）。

### Clerk 側の対応状況（未確認・要調査）

Clerk は「**Native Sign in with Apple（ブラウザリダイレクトなし）**」を提供している
（[Clerk Expo overview](https://clerk.com/docs/references/expo/overview) を 2026-08-06 に取得）。
ただしこれは Expo 前提であり、**素の Capacitor で使えるかは未確認**。
また「SFSafariViewController で認証し、別の WKWebView にセッションを載せる」経路を
Clerk が公式にサポートしているかは、公式ドキュメントに記載が見つからなかった（**未確認**）。

## 5.7. 【追記 2026-08-06】Expo ネイティブ資産が既に整備済みという発見

「30年後に楽したい」という方針（＝場当たり的な回避ではなく、プラットフォームの正道に乗る）を
受けて移行コストを実測したところ、**見立てが大きく変わった**。

### 既にあるもの（実測）

| 資産 | 状態 |
|---|---|
| Expo 系パッケージ | **26個**（`expo@~54.0.36` / `expo-router` / `@clerk/expo@^3.0.1` / `expo-auth-session` / `expo-secure-store` 等） |
| [app.config.ts](app.config.ts) | **整備済み**。iOS の `bundleIdentifier` / 位置情報の許諾文 / `ITSAppUsesNonExemptEncryption` / Android の権限最小化 / `intentFilters`（カスタムスキーム）/ プラグイン構成（expo-router・splash-screen・build-properties） |
| [eas.json](eas.json) | **整備済み**（development / preview / production・`autoIncrement`・submit） |
| `react-native` | `0.81.5`・`newArchEnabled: true` |

導入コミット: `4a6cde14d`（2026-07-30「EAS Build 用の iOS/Android ネイティブ化設定を追加」）。

### 使われていない理由

**CI が Capacitor 経路でビルドしている。** [.github/workflows/ios-appstore-release.yml:210](.github/workflows/ios-appstore-release.yml)
が `npx cap add ios` で iOS プロジェクトを生成しており、`eas build` / `expo prebuild` を
使う workflow は存在しない（実測: `.github/workflows/` に EAS 用は無い）。

つまり **2026-07-30 に Expo ネイティブ化の設定を入れた直後、Capacitor 経路を採用したため、
Expo 資産が使われないまま残っている**（メモリ [[surechigai-splash-strategy]] の
「まず PWA →その後 Capacitor ネイティブ化」という順序判断の帰結）。

### 帰結（重要）

案2 は**ゼロからの「移行」ではなく、既にある資産への「切り替え」**である。
未配線なのは以下に絞られる（実測）:

1. `app.config.ts` の `plugins` に Clerk のネイティブ認証プラグインが**無い**
   （`grep clerk app.config.ts` が 0 件）
2. `eas build` / `expo prebuild` を使う CI workflow が**無い**
3. `login()` の Web 分岐（[clerk-auth-bridge.tsx:218](components/providers/clerk-auth-bridge.tsx)）が
   ネイティブでも先に当たるため、`:237` 以降のネイティブ経路に到達しない
   → prebuild 構成なら `Platform.OS === "ios"` になるので**この分岐は自然に解決する**（未確認・要検証）

Clerk は「**Native Sign in with Apple（ブラウザリダイレクトなし）**」を公式提供している
（[Clerk Expo overview](https://clerk.com/docs/references/expo/overview)、2026-08-06 取得）。
`@clerk/expo` は既に依存に入っているため、**Guideline 4（外部ブラウザに出る）は
「ブラウザを一切使わない」ことで構造的に消える**。

### 30年後の観点での比較

| | 案1: SFSafariViewController + 自前橋渡し | 案2: Expo prebuild（EAS） |
|---|---|---|
| プラットフォームとの関係 | **禁止されている方向に自前実装で抵抗する**（Google は WKWebView を明示拒否、Apple は iOS 17 で塞いだ）。OS 更新ごとに壊れうる | Google/Apple/Clerk が**公式に推奨・サポートする経路** |
| Cookie 分断問題 | 自前で橋渡しを設計・保守し続ける | **そもそも発生しない**（ブラウザを使わない） |
| 過去の事故との関係 | 「自前 OAuth 化は本番のセッション確立を壊した実績があるため厳禁」（4章）に抵触 | 抵触しない |
| 資産の状態 | 新規実装 | **設定は既に整備済み**（上記） |
| 未配線の残り | — | プラグイン登録 / CI workflow / 分岐の検証 |

**推奨は案2。** ただし着手前に 6章の未確認項目（特に 6-8〜6-11）を潰す必要がある。

## 6. 未確認の前提と、追加調査が必要な点

1. **B のエラーの実物が未確認**。審査員が見たエラー文言・発生箇所（Apple の画面か、戻ってきた
   アプリ内か）が不明。A を直せば消えるという見立ては**推測**。
2. **Clerk が OAuth 中に経由する中間ドメインが網羅できていない**。実測したのは各プロバイダの
   認可エンドポイントの実在のみ。Apple は `appleid.apple.com` 以外に `idmsa.apple.com` を
   使うことがある（**未確認**）。Google は `accounts.google.com` 以外に `accounts.youtube.com` を
   経由する場合がある（**未確認**）。X は `api.x.com`（既に allowlist にある）と
   `x.com`/`twitter.com` の両方を使う（`x.com` は未登録）。
3. **`@capacitor/browser` が未導入**。`package.json` に無い（実測）。導入すると
   `npx cap add ios` 時に pod が増える。CI のビルド時間・Podfile の deployment target への
   影響は**未確認**。
4. **Capacitor の `allowNavigation` にワイルドカードをどこまで書けるか**が未確認。
   既存設定に `*.clerk.com` があるので前方ワイルドカードは動くと推測されるが、
   一次資料での確認はしていない。
5. **iOS 26.6 / iPhone 17 Pro Max 固有の問題かどうか**が未確認。審査環境がこれ。
6. **デモアカウントで Clerk のセッションが審査員側でも成立するか**が未確認。

### 案2（Expo prebuild）に着手する前に潰すべき未確認事項

8. **EAS ビルドが実際に通るか未確認**。`eas.json` はあるが、このリポジトリで
   `eas build` を成功させた記録が無い（`.github/workflows/` に EAS 用 workflow が無く、
   `git log` にも成功記録が見つからない）。**まず1回ビルドを通すことが最初の関門**。
   EAS のクラウドビルドは無料枠に制限があり、課金の有無も未確認。
9. **既存の CI 資産がどれだけ捨てになるか未確認**。`ios-appstore-release.yml` は
   Capacitor 前提で 12 箇所が `cap`/`capacitor` に依存（実測）。ただし
   **提出部分（`scripts/appstore-submit.mjs`・スクショ撮影・`IOS_FORCE_RESUBMIT`）は
   ビルド方式に依存しないため再利用できる**（推測・要確認）。
10. **Clerk のネイティブ Sign in with Apple に必要な Apple 側の設定が未確認**。
    Services ID / Key / Return URL の登録が要る可能性が高い（[[surechigai-store-submission-blockers-2026-07-31]]
    にも「ネイティブ実機での Apple 確認」が残件として記載されている）。
11. **X（Twitter）のネイティブログイン手段が未確認**。Clerk が公式提供しているのは
    Apple と Google のネイティブ認証で、**X は含まれていない**
    （[Clerk Expo overview](https://clerk.com/docs/references/expo/overview) の記載）。
    このアプリは公開URLが X ハンドル依存なので、**X ログインをどう実現するかが最大の未解決**。
    `expo-auth-session`（既に依存にある）+ `ASWebAuthenticationSession` で
    やることになる可能性が高い（推測）。これは SFSafariViewController と違い
    **Cookie 分断が起きない**（システムブラウザのセッションを共有する）ため案1とは別物。
12. **スプラッシュ・位置情報・地図が prebuild で従来どおり動くか未確認**。
    `app.config.ts` の設定は入っているが、実機で検証した記録が無い。
    メモリ [[surechigai-splash-strategy]] の「LUUP級の軽さ」目標との整合も未検証。
   Clerk は X OAuth 専用構成（`email_address: off / password: off`。メモリ
   [[surechigai-e2e-auth-x-oauth-only]]）なので、**ASC に入れる「username/password」に
   何を入れるのかが未解決**（X アカウントの資格情報を入れる想定でよいのか、
   それは X の利用規約に触れないのか）。

## 7. 実装前に決める必要がある質問（Fable に答えさせる）

1. **A の解き方**: `allowNavigation` に OAuth ドメインを足すだけで済むか、それとも
   `@capacitor/browser`（SFSafariViewController）を明示的に使うべきか。
   - allowlist 追加は「WebView 内で開く」＝アプリ内で完結。Apple の主文
     「enable users to sign in or register for an account in the app」に合致する。
   - SFSafariViewController は Apple が代替案として提示したもの。こちらは
     「アプリ内に表示されるブラウザ」であり、Cookie は WebView と共有されない
     （**この点が B の再発につながらないか要検討**）。
   - **どちらを主にするか、両方入れるのか。**
2. **足すドメインの範囲**: 6-2 の未確認ドメイン（`idmsa.apple.com` / `accounts.youtube.com`）を
   予防的に入れるか、実測できたものだけにするか。fail-closed の原則とのバランス。
3. **Web（PWA）側の挙動を変えるか**: `allowNavigation` はネイティブのみに効くので Web は無影響。
   ただし `login()` の分岐に手を入れる場合は Web への影響を評価する必要がある。
4. **B をどう検証するか**: 実機が無い状態で「Apple ログインのエラーが直った」と言える根拠を
   どう作るか。iOS シミュレータで Capacitor ビルドを動かす手段はあるか（CI は macOS ランナー）。
5. **C のデモアカウント**: 6-6 の通り Clerk は OAuth 専用で username/password を発行できない。
   - デモ用 X アカウントの資格情報を ASC に入れるのか。
   - それとも「デモモード」（審査用の固定アカウントでログイン不要に全機能を見せる）を実装するか。
   - Apple は "It is also acceptable to include a demonstration mode" と明記している。
   - **どちらを採るか。** 実装量・本番への抜け道リスク・X の規約を踏まえて判断が必要。
6. **足あとデータの投入方法**: デモアカウントに「すれ違う」「たどれる」を見せられる
   データを入れる必要がある。`locations` / `encounters` への投入をどうするか
   （既存のシード手段があるか未確認。手作業か、スクリプトか）。
7. **再提出の順序**: A の修正はネイティブ設定（`capacitor.config.json`）なので**新ビルドが必要**。
   C のデモアカウントは ASC のメタデータなので**ビルド不要**。
   `IOS_FORCE_RESUBMIT=1` の扱いを含めて、どの順で出すか。

---

## セルフチェック（HOWTO の項目）

- [x] ファイル名の列挙だけで終わっていない（3章で「なぜ外部ブラウザに出るか」を一次資料付きで追った）
- [x] 既存仕様を守る理由が書かれている（4章に6件・根拠付き）
- [x] ユーザー体験上の制約が書かれている（Web の1タップUX維持・価格表現の非表示）
- [x] データ保存・互換性・失敗時の挙動を含む（5章の allowNavigation の広げすぎリスク、
      `limitsNavigationsToAppBoundDomains` の地雷）
- [x] 確認した事実と未確認の推測が分かれている（3章は実測、B の因果と6章は「推測」「未確認」と明記）
- [x] 重要な判断に根拠が付いている（ファイル:行番号・本番実測日・一次資料URL・メモリリンク）
