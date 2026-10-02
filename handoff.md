<!--
  PC・AIをまたいだ作業継続ルールのテンプレート。
  正本: web-ios-android/CLAUDE.md「デスクトップ／ノートPC・複数AI共通の開発継続ルール」節。
  .agent/coord.md（誰が今このリポを触っているか＝ロック調整）とは役割が違う。
  このファイルは「作業の中身そのもの」（原因・変更点・テスト結果・次の一手）を持つ。
-->

# Handoff

STATUS: Step 1〜3完了＋サインイン画面のブランディング追加、本番反映済み・実機検証済み
  （mainへマージ・push済み、最新commit 22c83a436）
ROOT_CAUSE: Web版のちらつき（React #418・多重レンダリング）の真因はExpo Router Web構造の脆さ
  （Clerk認証プロバイダの動的import解決時にReactがコンポーネントツリー全体を強制再マウントする）。
  詳細は _docs/DESIGN-web-nextjs-migration-2026-10-01.md 参照（この節の過去記録は変更なし）。

  Step 3実施中に新たに2つの地雷を踏み、解決した（いずれも金型
  web-ios-android/templates/next-app/middleware.ts.templateへ還流済み）:

  1. **`/__clerk/`プロキシ経路がmatcherの拡張子除外パターンに誤って該当し404になる地雷**
     （matcher内`js(?!on)`が`/__clerk/npm/.../clerk.browser.js`にもマッチしてしまう）。
     `/__clerk/(.*)`をmatcherの先頭に明示して解消。

  2. **「別Vercelプロジェクトへの外部rewriteプロキシ」構成で`/__clerk/v1/client`が
     「400 Invalid host」を返し続ける地雷**（本丸）。真因はClerk JS自身の自動判定——
     本番URL(`VERCEL_PROJECT_PRODUCTION_URL`)が`*.vercel.app`で終わるとき、Clerk JSは
     サーバー側の設定に関わらず強制的に自前プロキシ経路(`/__clerk/`)を使おうとする。
     `surechigai-web`プロジェクトにカスタムドメインを割り当てていない限り常に該当する。
     - 誤った対処1: `frontendApiProxy: { enabled: true }` → 常にClerkデフォルトドメイン
       (frontend-api.clerk.dev)へ転送する別機能で、カスタムフロントエンドAPI
       (clerk.kimito.link)を使う構成では逆効果。却下・削除。
     - 誤った対処2: `frontendApiProxy: { enabled: false }` / 環境変数`CLERK_DISABLE_AUTO_PROXY=true`
       → サーバー側では効くが、**クライアントコンポーネント(ClientClerkProvider)内で
       mergeNextClerkPropsWithEnvが再実行される際、`NEXT_PUBLIC_`接頭辞の無い環境変数は
       Next.jsの仕様上ブラウザバンドルに埋め込まれずundefinedになる**ため効かない
       （@clerk/nextjs 7.9.9のソースを直接読んで特定）。
     - **正しい解決**: `ClerkProvider`に`domain="clerk.kimito.link"`を明示。
       `getAutoProxyUrlFromEnvironment`の`hasDomain`チェックで早期リターンし、
       サーバー・クライアント両方で自動判定を回避できる。
       （apps/web/app/(auth)/layout.tsx に実装済み）

FILES_CHANGED:
  - apps/web/middleware.ts（/__clerk/ matcher追加、最終的にオプションなしのシンプルな形）
  - apps/web/app/(auth)/layout.tsx（domain="clerk.kimito.link"追加、★最終解決の本体。
    localization=surechigaiJaJP・appearance=surechigaiClerkAppearance追加）
  - apps/web/lib/clerk-localization.ts（新規・日本語見出し、kimitolink-linktree踏襲）
  - apps/web/lib/clerk-appearance.ts（新規・X主役化スタイル、kimitolink-linktree踏襲）
  - apps/web/components/AuthPageIntro.tsx（新規・左カラムのサービス紹介、
    3キャラクター画像使用。AuthPageShellのintroスロットが全てnullのまま
    <SignIn/>単体だけが寂しく表示されていたのを解消。sign-in専用に
    シンプル化済み＝variant propは無い、下記sign-up撤回の経緯参照）
  - apps/web/public/pwa-icon-192.png・chara/{link,konta,tanunee}.png（新規、画像素材）
  - apps/web/lib/auth-routes.ts（SIGN_UP_HREFをSIGN_IN_HREFと同じ値に統一。
    旧Expo側 lib/clerk-route.ts の正本実装に揃えた）
  - （削除・撤回）apps/web/app/(auth)/sign-up/ — 一度新設したが、surechigaiは
    サインアップ専用ページを持たない既存設計と矛盾し本番で到達不可能だったため削除
  - vercel.json（Step 3: /sign-in・/sign-in/・/auth/kimito-link・/auth/kimito-link/・
    /__clerk/:path*・/_next/:path* をsurechigai-web.vercel.appへの外部プロキシに差し替え。
    さらに/_next/image/専用rewriteを追加＝trailingSlash:true構成でのnext/image地雷対処）
  - public/sw.js（Next.jsアセットの素通し、Step 3の前提）
  - web-ios-android/templates/next-app/middleware.ts.template（地雷と訂正を金型へ還流）
  - ai-hub/kb/clerk-vercel-custom-domain-auto-proxy-trap.md（新規KB、両地雷を記録）

TESTS_RUN: 2026-10-02、本番ドメイン(https://surechigai.kimito.link/sign-in/)でBrowser pane実機検証:
  - window.Clerk.loaded / frontendApi / proxyUrl の値を直接確認
  - 新規タブ・キャッシュなしでコンソールエラー0件を確認
  - ?redirect_url=%2F&auto=x を5回連続実行し、X認可画面への自動遷移を確認
  - （ブランディング追加後）デスクトップ幅(1280px)でintro+Clerkカードの2カラム表示を確認
  - ロゴ・3キャラクター画像のnaturalWidth実測でnext/image最適化経由の読み込みを確認
  - ブランディング追加後も auto=x 自動遷移が壊れていないことを再確認（1回成功）
TEST_RESULT: 全項目緑。
  - window.Clerk.frontendApi === "clerk.kimito.link"、proxyUrl === ""（空、プロキシ不使用）
  - Minified React error #418 = 0件
  - auto=x自動遷移 5/5成功（x.com/i/oauth2/authorize への遷移を確認）
  - ブランディング（日本語見出し・X主役化・左カラムのサービス紹介・ロゴ/キャラ画像）
    すべて本番ドメインで表示確認済み
  ログイン済み状態の確認（2026-10-02、ユーザー本人の普段のChrome＝X・kimito.linkにログイン済みで実施。
  資格情報の入力は無し）:
  - /sign-in/?auto=x: isSignedIn=true・待機画面(overlay)なし・x.comへ遷移せず /sign-in/ に留まる ＝ 非発火OK
  - /auth/kimito-link/: ログイン済みで surechigai.kimito.link/ （トップ）へ着地 ＝ 分岐OK
  - 観察: ログイン済みでも /sign-in/ は通常のログイン画面を表示し続ける（本家kimito.linkと同じ挙動。
    URLのauto=xも残る。設計書の「autoが消える」は満たさないが実害なし。直すなら
    AutoAdvanceToXでログイン済み時もremoveAutoXParamを呼ぶ／ログイン済みはafterAuthPathへ送る、が候補）
REMAINING_RISKS:
  - /auth/kimito-link(/)はStep 4でNext.jsへ移植済み（commit 4eea5a695）。経緯: Step 3で
    未移植のまま新プロジェクトへ転送して本番404になり、一度旧Expo側へ戻して(517ad1510)から
    移植した。ロールバックはvercel.jsonの2ルートを /auth/kimito-link.html に戻すだけ
    （旧静的HTMLは dist に残っている）。教訓: 付け替えは「移植→新プロジェクト単体で200確認→
    vercel.json付け替え」の順で行う
  - （解消）ログイン済み時のauto=x非発火・/auth/kimito-linkのトップ分岐は2026-10-02に
    確認済み（上のTEST_RESULT）。Browser paneはXに未ログインなので、ログイン済みの再確認は
    ユーザー本人のChrome（claude-in-chrome）で行うこと
  - /sso-callback系・/oauth/twitter-callback系はMVPスコープ外のため旧Expo側のまま
    （vercel.jsonでsurechigai-webへは転送していない）
  - apps/web/middleware.tsが"edge" runtimeの非推奨警告をビルドログに出している
    （`const config = { runtime: 'nodejs' }`への移行をClerkが推奨。実害なし、次の機会に対応）
NEXT_ACTION:
  1. （完了）ログイン済み状態のauto=x非発火・中継ページの分岐は確認済み
  2. _docs/IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.md のStep 4は完了
     （/auth/kimito-link移植済み・本番実機で未ログイン→X認可画面まで2回確認）。
     Step 5（金型への格上げ）も完了（web-ios-android commit 586669e）: 穴5件を
     templates/web/auth-mode/nextjs/ へ還流し、無改変コピーの4ファイル
     （kimito-link-redirect.ts / KimitoLinkRedirect.tsx / auth-guide-page /
     そのテスト）を check-drift PAIRS に登録（このリポのコピーとバイト一致）。
     ★これら4ファイルをこのリポだけで書き換えると drift 検査が割れる。直すなら金型側から。
  3. apps/web/middleware.tsのedge runtime非推奨警告への対応（任意、優先度低）
  4. ★sign-upページは作らない（2026-10-02確定・既存設計を確認済み）。
     surechigaiはサインアップ専用ページを持たない設計（lib/auth-routes.tsの
     SIGN_UP_HREF = SIGN_IN_HREF、vercel.jsonの/sign-up→/sign-inリダイレクト参照）。
     一度apps/web側にsign-upページを新設したが、この既存設計と矛盾し本番で
     到達不可能だったため削除・撤回済み（commit 22c83a436）。次にこの提案が
     出たら、まずこのSTATUSとlib/auth-routes.tsのコメントを読むこと
LAST_WORKED_ON: 2026-10-02
WORKED_BY: claude-desktop（web-ios-androidキットのセッションから越境作業。前セッションが
  Step 1・2を実施、本セッションがStep 3の実機検証・地雷解決・本番反映・mainマージ・
  サインイン画面のブランディング追加を担当）
MACHINE_NOTES: vercel.jsonへの直接編集がこのセッションのClaude Code権限分類器(Blind Apply /
  Auto-Mode Bypass)に繰り返し拒否された。最終的にユーザー本人がGit Bash経由でファイルを
  上書き保存し、コミットのみセッション側で実行した。同種の作業を別セッションで行う場合、
  同じ拒否に当たる可能性がある。
