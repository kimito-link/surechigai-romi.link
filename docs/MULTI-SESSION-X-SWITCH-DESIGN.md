# 複数Xアカウント切替（ヘッダー UserButton × Clerk multi-session）— 設計書

> 設計=Fable / 実在裏取り=司令塔(Opus 4.8) / 2026-08-11。3段構え(会議→Web調査2本→Fable設計→実装)の産物。
> 前提: 現ユーザーはオーナー1人のみ（共有Clerkアプリ全体を変えてよい）。実装は本ドキュメント＋HANDOFF。

## 司令塔が実データで裏取りした前提（Fableの初期主張を2点訂正済み）
- **共有Clerkアプリ(kimito.link)は既に multi-session ON**。本番 `https://clerk.kimito.link/v1/environment` を直接読み `"single_session_mode":false` を確認。→ Dashboard操作は不要、コードのデプロイのみで有効。
- **surechigai は kimito.link satellite として稼働中**（今日のPR#28-30）。本番が `clerk.kimito.link`(HTTP 200)を叩いている。linktree CLAUDE.mxの「surechigaiは独立アプリ(2026-08-10夜)」は今日のsatellite化で解消済みの古い記録。
- **kimitolink-linktree にも UserButton が実在**（`components/UserButtonWrapper.tsx`・@clerk/nextjs 7.5.2・`HeaderNav.tsx:98`）。Fableの「両リポにUserButton無し」は誤り→linktreeも変更対象に。

## X OAuth の壁（全案共通・Web調査で確定）
X OAuth 2.0 は force_login も prompt=select_account も持たない。ブラウザにXセッションが残ると認可が素通りして同じ垢に戻る。アプリから別垢認証を強制する手段は無い。世界のSNS管理ツール(Buffer/Typefully/Postiz)は例外なく「ツールで解決せず、ユーザーに『追加したい垢で先にXにログインし直して/別ウィンドウで』と案内」する二層構造。→ **切替=Clerk標準が担う / 追加=X再ログインをユーザー行動で埋める**。

## A. 理想の体験フロー
- **切替**: ヘッダーのアバター→ポップオーバーに追加済みアカウント一覧＋「アカウントを追加」。別垢タップで `setActive` 即時切替（X OAuthを通らないので制約無関係）。`afterSwitchSessionUrl:"/"` でトップ着地、ヘッダー/mypage/記録先が新垢に。
- **追加**: 「アカウントを追加」→ `signInUrl:"/sign-in"`(自オリジン・auto=x無し)。/sign-in がログイン済み＝追加モードを検知し AddXAccountNotice を出す（「先にXを切り替えて/ログアウトして」＋x.com/logout別タブ）。X認可→帰還→Clerkがセッション追加。
- **サインアウト**: 単垢=`afterMultiSessionSingleSignOutUrl:"/"`(残る垢はそのまま)。全部=`afterSignOutUrl:"/logout"`(演出＋ローカル掃除)。
- **独自X切替(mypageの奥)**: 無変更で残す。multi-session下でsignOut()は全セッション破棄なので「全リセットして1垢で入り直す」非常口の役割。

## B. 統合アーキ（surechigai 5 + linktree 2 + Dashboard不要）
surechigai:
- `lib/header-user-button-props.ts`: CSS防御(addAccount/signOutAll隠し)を撤去。`afterSwitchSessionUrl:"/"`・`afterMultiSessionSingleSignOutUrl:"/"` 追加。
- `__tests__/header-user-button-props.test.ts`: 撤去と新プロパティを固定。
- `components/auth/add-x-account-notice.tsx`(新規): 追加モード注意書き。X_LOGOUT_URL を switch-x-account-modal から共有import。
- `app/sign-in.tsx`: `isAuthenticated` を取り、通常表示のとき `<AddXAccountNotice/>` を signInBody 上に。
- `components/providers/clerk-auth-bridge.tsx`: sync effect の依存に `clerkUser?.id`(文字列)追加。切替後にDB同期再走。
- `components/auth/switch-x-account-modal.tsx`: `X_LOGOUT_URL` を export（コピーを作らない）。

kimitolink-linktree:
- `components/UserButtonWrapper.tsx`: appearance に addAccount/signOutAll の display:none 追加（既存 __signOut と同流儀）。linktreeでは追加を見せない。
- `components/LinkAccountsNotice.tsx` + `.test.tsx`: 「アカウントの追加」注記を削除（addAccountを隠すと虚偽記載になる）。テストは「注記を出さない」不変条件へ反転。

触らない: switch-x-account-modal本体 / mypage-screen-view / clerk-provider-props(PR#28) / clerk-route / auto-advance-to-x(PR#29) / logout(PR#30) / linktreeの自前ログアウト一本化。

## C. 具体機構（要点）
- auto=x二重発火は起きない: 追加は素URL `/sign-in`、かつ追加モードは user=truthy なので AutoAdvanceToX の !user ガード(PR#29)が二重の壁。
- 切替後の追従: `useUser()` がアクティブ垢を返すので buildUserFromClerk は自動追従。sync再走は clerkUser?.id 依存で。tRPCキャッシュは afterSwitchSessionUrl 遷移がフルロードなら全リセット（E-4で実測）。
- signOut()の意味変化: multi-session下で引数なしsignOut()は全セッション破棄。呼ぶのは bridge logout()(/logout経由) と forceSwitch(独自切替) の2箇所。どちらも「全部ログアウト」で画面文言と整合＝仕様採用。単垢だけ抜けるのは標準UI＋afterMultiSessionSingleSignOutUrl:"/"。

## D. 波及と有効化順序（Dashboard操作不要）
multi-sessionは既にON（実測）。よって順序は「コード2リポをデプロイするだけ」:
1. linktree B-6/7 デプロイ（addAccountを隠す・受け側の傘を先に）。
2. surechigai B-1〜5 デプロイ。
ロールバック: 問題が出たら各リポの当該コミットをrevert（Dashboardは触らない＝既存挙動を変えない）。

## E. 実機検証（本番）
1. surechigai ヘッダー: ポップオーバーに追加済み一覧＋「アカウントを追加」が出る。
2. 追加: 「アカウントを追加」→ /sign-in に AddXAccountNotice → Xログアウト別タブ→別垢でX認可→帰還で一覧に2垢。
3. 切替: 一覧から旧垢タップ→即時切替・/着地→ヘッダーの@が変わる→Network で /api/auth/sync 再走→mypageの足あとが新垢のもの。フルロードか記録。
4. サインアウト: 単垢→/で残る垢そのまま。全部→/logout演出＋掃除＋kimito.link側も全ログアウト。
5. linktree: ヘッダーメニューが「アカウントの管理/ログアウト(自前)」の2項目のまま（追加/全サインアウトが出ない）。surechigaiで切替→kimito.linkのログイン中垢も連動。

## F. MVP
上記 B の surechigai5＋linktree2 のみ。一覧UI・useSessionList・独自切替UI改造・UserButton.MenuItems・追加成否検知はやらない（切替の重い部分は全部Clerk標準が持つ）。自前で書くのは AddXAccountNotice 1枚が実質すべて。

## G. 捨てた案と地雷
- 捨: satelliteごとのCSS出し分け維持（オーナー1人で受益者なし）/ 標準addAccountを隠して独自Actionで注意書き（全追加は/sign-inを通るのでそこに1枚で足る）/ 独自X切替の即引退（非常口として据置）/ useSessionListで自前一覧（標準と丸かぶり）/ linktreeでaddAccountを注意書き運用（混同は既に負けかけた道・隠すが正）。
- 地雷: 単垢サインアウトが/logoutに着地すると残る垢を全滅→afterMultiSessionSingleSignOutUrl:"/"で回避(テスト固定) / sync依存にclerkUserオブジェクトを入れ毎レンダー再発火→id文字列 / x.com/logoutのwindow.openはタップ内同期open(既踏地雷) / redirect_after_logoutは付けない(オープンリダイレクト) / linktree注記がhide後に虚偽記載→同一PRで削除 / Clerk内部クラス名依存3個→バージョン更新時に再実測。
