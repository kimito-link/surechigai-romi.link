# 実装ハンドオフ: surechigai ヘッダーに Clerk 標準 UserButton

> このmd1枚で着手できる粒度。設計の根拠は [HEADER-USERBUTTON-DESIGN.md](./HEADER-USERBUTTON-DESIGN.md)。
> 2026-08-11 / 3段構え(会議→Fable設計→本ハンドオフ)の産物。実装は別モデル/次チャットで。

## ゴール(MVPのみ)
ログイン済みユーザーのヘッダー右上に Clerk 標準 UserButton のアバターを出す。メニューは「アカウントの管理(→/mypage)」「サインアウト(→/logout)」の2項目だけ。追加/切替UI・UserProfileモーダル・kimito.linkへのnavigation・独自X切替の統合は**やらない**。

## 読む順
1. この md 全体
2. [HEADER-USERBUTTON-DESIGN.md](./HEADER-USERBUTTON-DESIGN.md) の B(アーキ)・C(具体機構)・G(地雷)
3. 手本コード: `components/organisms/clerk-sign-in.web.tsx` と `components/organisms/clerk-sign-in.tsx`(.web/.native分割の型)、`lib/clerk-route.ts`(意図を名前とテストで固定する流儀)

## スコープ(6ファイル・設計B節)
新規3:
- `components/organisms/header-user-button.web.tsx`(~40行・lazy import + Suspense + isAuthReady&&userガード + 定数spread)
- `components/organisms/header-user-button.tsx`(~5行・return null のみ・@clerk import 禁止)
- `lib/header-user-button-props.ts`(~25行・HEADER_USER_BUTTON_PROPS 定数)

変更3:
- `components/organisms/app-header.tsx`(~3行・actionRow に `<HeaderUserButton />` 挿入。設計B-4の位置)
- `components/auth/auto-advance-to-x.tsx`(~15行・発火条件に isAuthReady&&!user を追加。設計C-1)
- `app/logout.tsx`(~5行・`if (!isAuthenticated) { setStatus("success"); return; }` 早期return を削除し常に runLogout。設計B-6)

テスト新規1:
- `__tests__/header-user-button-props.test.ts`(props に auto=x が含まれない・afterSignOutUrl==="/logout"・userProfileUrl==="/mypage" を固定)

## 着手手順(ブランチ+TDD)
1. `git fetch origin && git checkout main && git pull` で最新化。**衝突チェック**: `git log HEAD..origin/main --oneline`(別セッションが app-header/auto-advance/logout を触っていないか)。未コミット差分(docs/json等の別作業)には触らない。
2. ブランチ `feat/header-userbutton` を切る。
3. 先にテスト(`header-user-button-props.test.ts`)を書いて赤にする→props定数を作って緑。
4. `auto-advance-to-x.tsx` の発火条件変更は、判定を純関数 `shouldAutoAdvanceToX({hasParam,isSso,isReady,hasUser,inCooldown})` に切り出してユニットテストで固定してから effect に配線(設計C-1)。
5. .web/.native 分割を厳守(native実体は null・@clerk import 禁止)。
6. app-header に挿入。
7. logout 早期return 削除。

## 機械的な完了判定
- `pnpm check` 0エラー(型・esm import)。
- `npx vitest run __tests__/header-user-button-props.test.ts __tests__/auto-advance-to-x*.test.ts` 緑。既存 `__tests__/clerk-route.test.ts` も緑のまま。
- **変異テスト**: props に一時的に auto=x を混ぜる/logout早期returnを戻す と対応テストが赤になることを確認。
- Gate1 diff-check 通過(禁止語・危険パス注意。app/・lib/ は危険パス指定外だが `.env*` は触らない)。
- reality-checker で実機D節(特にD-4 共有ログアウト・D-5b auto=xループ非再現)を確認してから出荷。

## 地雷(設計G節の要点)
- **Metroチャンク破壊**: `@clerk/expo/web` の静的importをheader-user-button.web.tsxに置かない→`lazy()`。native実体はnull。
- **ClerkProvider外crash**: `isAuthReady && user` ガード必須。ゲストシェル`/`とchunk解決待ちを両方落とす。
- **auto=xループ**: ログイン済み`/sign-in?auto=x`再訪で発火しないよう`!user`ガード(設計C-1)。
- **共有ログアウトの驚き**: UserButtonのsignOutはkimito.link側も落とす(fc2id仕様)。D-4で実測し想定外なら出荷しない。
- **multi-session**: 実装前にClerk Dashboard(kimito.linkアプリ)でsingle-sessionを確認(設計D-0)。CSS防御は最後の砦。

## 実在裏取り済みのパス(司令塔が確認)
- `lib/clerk-route.ts:9,44`(auto=x生成源はここだけ) / `app/logout.tsx`の早期return / `components/auth/auto-advance-to-x.tsx:23,35,43,116`(発火条件) / `@clerk/expo/web`がUserButton再エクスポート。
- app-header.tsx の挿入位置(:192-194付近)は実装時に現物で再確認すること(行番号はドリフトしうる)。

## やらないこと(将来・別ハンドオフ)
- UserButtonへの独自X切替統合、multi-session、kimito.linkのUserProfileへのnavigation集約(userProfileUrl差し替え1行で移行可)。
