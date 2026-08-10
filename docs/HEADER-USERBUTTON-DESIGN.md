# surechigai ヘッダーへの Clerk 標準 UserButton 統合 — 設計書

> 設計=Fable(claude-fable-5) / 会議素材=マルチLLM会議ハーネス / 実在裏取り=司令塔(Opus 4.8) / 2026-08-11
> 3段構えワークフロー(会議→Fable設計→実装引き継ぎ)の手順2の産物。実装は別モデル/次チャットで行う。
> 実装着手は [HEADER-USERBUTTON-IMPLEMENTATION-HANDOFF.md](./HEADER-USERBUTTON-IMPLEMENTATION-HANDOFF.md) を読む。

## 検証済みの前提(司令塔が実コードで裏取り)
- auto=x を生成するのは `lib/clerk-route.ts` の `SIGN_IN_AUTO_X_HREF`(:9) と `buildSignInAutoXHref`(:44) **だけ**。他は import して使うのみ→UserButton から auto=x は湧かない(SafeUserButton 却下が正しい)。
- `app/logout.tsx` に `if (!isAuthenticated) { setStatus("success"); return; }` の早期return が実在(ローカル掃除スキップの穴)。
- `components/auth/auto-advance-to-x.tsx` 実在。発火条件 `hasAutoXParam()`(:23)/`isSsoCallback()`(:35)/`isWithinCooldown()`(:43)、effect は :116 で判定。
- Web 本番。`@clerk/expo/web` が UserButton を再エクスポート。`.web.tsx`/`.native` 分割は `clerk-sign-in.tsx`/`clerk-sign-in.web.tsx` が手本。

---

## A. 理想の体験フロー

ログイン済みユーザー（Web 本番）:

1. ヘッダー右上に、従来の自前アカウントピル（名前・@ID・フォロワー数＝ブランド体験）の隣に **Clerk 標準 UserButton のアバター**（36px 円形）が出る。
2. アバターをタップ → Clerk 標準ポップオーバー（日本語・kimito appearance 継承）。項目は **「アカウントの管理」「サインアウト」の2つだけ**。複数アカウント追加/切替は出さない（後述）。
3. 「アカウントの管理」→ モーダルではなく **自オリジン `/mypage` へ遷移**。そこに既存の管理 UI と独自X切替ボタン（「別のアカウントに切り替える」）が既に揃っている。
4. 「サインアウト」→ Clerk signOut → **既存の `/logout` 画面に着地**し、ブランドのログアウト演出＋ローカルデータ掃除が走る。共有 Clerk セッションなので kimito.link 側もログアウトされる（fc2id として正しい挙動）。
5. **Xアカウント切替は今まで通り mypage の独自フローのみ**。UserButton はそこに触らない。
6. 未ログイン・ゲストルート（`/` 等）・native では UserButton は一切描画されない。

「kimito.link で管理」への集約は、kimito.link 側の正規アカウントURLが確定した時点で `userProfileUrl` を1行差し替えるだけで移行できる形にしておく（今回は未検証URLに賭けない）。

## B. 統合アーキ（新規2 + 変更3 + 純関数1）

| # | ファイル | 種別 | 内容 |
|---|---|---|---|
| 1 | `components/organisms/header-user-button.web.tsx` | **新規** (~40行) | `lazy(() => import("@clerk/expo/web").then(m => ({default: m.UserButton})))` + `<Suspense fallback={null}>`。ガード: `const { user, isAuthReady } = useAuth(); if (!isAuthReady || !user) return null;`。props は #3 の定数を spread |
| 2 | `components/organisms/header-user-button.tsx` | **新規** (~5行) | native/フォールバック実体。`return null` のみ。**`@clerk/expo/web` を import しない**（`clerk-sign-in.tsx`/`clerk-sign-in.web.tsx` と同じ分割手本） |
| 3 | `lib/header-user-button-props.ts` | **新規** (~25行) | `HEADER_USER_BUTTON_PROPS` 純定数（C 参照）。`clerk-route.ts` と同じ「意図を名前とテストで固定する」流儀。`__tests__/header-user-button-props.test.ts` で `auto=x` 非含有・`afterSignOutUrl==="/logout"` を固定 |
| 4 | `components/organisms/app-header.tsx` | **変更** (~3行) | actionRow 内、`:192`（ログインボタン分岐の閉じ）と `:194` `{showMenu && (` の間に `<HeaderUserButton />` を挿入。狭幅時もピルは下段(`:210-243`)のまま、UserButton は actionRow に残す |
| 5 | `components/auth/auto-advance-to-x.tsx` | **変更** (~15行) | effect(`:116-`)に useAuth ガードを追加（C の条件式）。判定を純関数 `shouldAutoAdvanceToX()` として export しテスト可能に |
| 6 | `app/logout.tsx` | **変更** (~5行) | `:96-99` の `if (!isAuthenticated) { setStatus("success"); return; }` 早期 return を削除し**常に `runLogout()`**。UserButton 経由の signOut 後に着地したとき、ローカル掃除（`Auth.removeSessionToken`/`clearUserInfo`/`clearAllTokenData`）が走らない穴を塞ぐ（bridge の `logout()` は `clerk-auth-bridge.tsx:297-307` で signOut 失敗を握り潰して finally で掃除まで走らせるので、セッション無しでも安全に再実行できる） |

`switch-x-account-modal.tsx` / `clerk-route.ts` / `clerk-provider-props.ts` / `global-menu.tsx` は**一切触らない**。

## C. 具体機構

### C-1. auto=x 二重発火の物理遮断 — SafeUserButton は不要

裏取り結果: `auto=x` を生成するのは自前の `buildSignInAutoXHref`（`lib/clerk-route.ts:44`）と `SIGN_IN_AUTO_X_HREF`（`:9`）**だけ**。UserButton が誘発する遷移は provider の `signInUrl: "/sign-in"`（`lib/clerk-provider-props.ts:62`、素の URL）。**UserButton 側から auto=x が湧く経路は存在しない**。よってラッパー新設は死にコードになる。塞ぐべき本当の穴は AutoAdvanceToX 側の「ログイン済みでも発火する」ことだけ。

`auto-advance-to-x.tsx` の発火条件を次に厳格化する:

```
発火 = hasAutoXParam()          // 既存 :23-33（native shell 除外含む）
     && !isSsoCallback()        // 既存 :35-41
     && isAuthReady             // ★追加: Clerk 確定まで待つ（未確定時はXボタン自体まだ無い）
     && !user                   // ★追加: ログイン済みなら発火しない＝ループの根を絶つ
     && !isWithinCooldown()     // 既存 :43-52
```

実装: `const { user, isAuthReady } = useAuth();` を追加し、effect 依存配列を `[isAuthReady, !!user]` に。`user` が truthy のときは param を除去して overlay を消すだけで終了。sign-in ルートは常に AuthContext 配下（Guest/placeholder 含む）なので useAuth は安全。

### C-2. UserButton props（`lib/header-user-button-props.ts`）

```ts
export const HEADER_USER_BUTTON_PROPS = {
  userProfileMode: "navigation",   // モーダル UserProfile を封印
  userProfileUrl: "/mypage",       // 管理=既存 mypage（独自X切替もここに居る）
  afterSignOutUrl: "/logout",      // 既存ログアウト演出＋ローカル掃除に合流
  appearance: {
    elements: {
      userButtonAvatarBox: { width: "36px", height: "36px" }, // ピルのアバターと同寸
      // 防御: primary(kimito.link)側で将来 multi-session が ON にされても
      // 「アカウントを追加」を出さない（X は prompt/force_login 非対応で標準切替が同一垢ループになる）
      userButtonPopoverActionButton__addAccount: { display: "none" },
      userButtonPopoverActionButton__signOutAll: { display: "none" },
    },
  },
} as const;
```

`colorPrimary`・日本語化（`kimitoJaJP`）・kimito appearance は ClerkProvider（`clerk-root-provider.tsx:331-344` → `clerk-provider-props.ts:73-74`）から自動継承される。ここでは寸法と防御だけ足す。**どの値にも `auto=x` を含まないことをテストで恒久固定**する。

### C-3. .web / .native 分割と chunk 規律

- `header-user-button.tsx`（既定＝native）: `null` を返すだけ。Web 専用 @clerk UI を native バンドルに混ぜない（Metro チャンク破壊の既往事故対策、`clerk-sign-in.tsx` と同じ型）。
- `header-user-button.web.tsx`: `@clerk/expo/web` を**静的 import せず `lazy()`** で取り込む。AppHeader は全ルート初期チャンクに入るため、静的 import すると Clerk UI が初期 JS に染み出す。`LazyGlobalMenu`（`lib/lazy-heavy-components.tsx`）と同じ流儀。
- 「ClerkProvider 外で描画すると crash → ErrorBoundary が `/` へ押し戻す」既知事故（`app/sign-in.tsx` の実測コメント）への対処が `isAuthReady && user` ガード。ゲスト Web シェル（`app/_layout.tsx` の `GuestAuthProvider`）は `user` が常に null、chunk 解決待ち placeholder は `isAuthReady: false` なので、**両方このガードで自然に落ちる**。

## D. 実機検証手順（satellite 本番で1回）

**D-0（人間・事前）**: Clerk Dashboard（kimito.link アプリ）で **session mode が single-session であることを確認**。multi-session だった場合は C-2 の CSS 防御が最後の砦になるため、確認結果を記録してから進む。

1. ローカル（satellite OFF・単独インスタンス）: `pnpm check` 0 エラー → dev 起動 → X ログイン → ヘッダーにアバター出現 → メニュー2項目 → 「アカウントの管理」で `/mypage` 遷移 → 「サインアウト」で `/logout` の「ログアウトしました」まで到達し、devtools で `auth_return_url` / USER_INFO_KEY / token-manager キーが消えていること。
2. `/`（ゲストシェル）と未ログイン状態で UserButton が出ない・console に ClerkProvider エラーが無いこと。
3. デプロイ後、`version.json` の commitSha 一致＋ヘッダーチャンクにマーカー文字列（反映されなければ `CDN_CACHE_EPOCH` +1、プロジェクト CLAUDE.md の既知地雷）。
4. 本番 surechigai.kimito.link（satellite ON）: ログイン → UserButton サインアウト → kimito.link を開き**そちらもログアウトされている**ことを確認（共有セッションの仕様確認。想定外なら設計を止めて報告）。
5. 回帰: (a) mypage の「別のアカウントに切り替える」→ x.com/logout 案内 → 帰還後の成否バナーが出る。 (b) ログイン済みのまま `/sign-in?redirect_url=%2F&auto=x` を直打ち → **X 自動クリックが起きず** param が消える。 (c) ログアウト状態で通常の1タップログインが従来どおり動く。

**壊れたときに見えるもの**: ガード漏れ → `/` で "UserButton can only be used within ClerkProvider" の赤画面（即発見できる）。chunk 失敗 → アバターが出ないだけ（Suspense fallback null＝fail-safe、ヘッダー他要素は無傷）。auto=x ガード漏れ → x.com への往復が繰り返される（5-b で検出）。

## E. MVP（最小の一手）

**B の 6 ファイルのみ＝「アバター＋2項目メニュー（管理→/mypage・サインアウト→/logout）」＋ AutoAdvanceToX ガード＋ logout 掃除穴の修正。** 追加/切替 UI・UserProfile モーダル・kimito.link への navigation・UserButton へのX切替統合はすべてやらない。既存ピル・独自X切替・satellite 設定は無変更。

## F. 捨てた案と理由

1. **SafeUserButton ラッパー** — auto=x の生成源は自前ビルダーのみで、UserButton は素の `/sign-in` しか出さない（C-1 で裏取り）。塞ぐべきは AutoAdvanceToX の発火条件であり、ラッパーは守るものが無い保守コード。
2. **標準の複数アカウント追加/切替（multi-session）** — X が prompt/force_login 非対応のため標準切替は同一垢に即戻るループ（批判役の指摘は正しい）。さらに multi-session 化は primary の Dashboard 設定変更＝kimito.link 全体に波及する。surechigai は実質Xログインのみなので、**出さないことが穴塞ぎ**。独自X切替は無傷で残す。
3. **UserButton メニューへの独自X切替統合（UserButton.MenuItems）** — 切替の成否バナーは `switch-x-account-modal.tsx` が mypage にマウントされている前提の閉ループ（スナップショット比較）。任意ページ発の切替を許すと「帰還してもバナーが出ない」導線が生まれる。管理→/mypage 遷移で1タップ余分なだけで同じ場所に届く。
4. **UserProfile モーダル（`userProfileMode` 既定）** — satellite 側から X 連携解除等の破壊的書き込みを開放することになり、会議の「書き込みは primary 集約」原則に反する。navigation 化でモーダル自体を封印。
5. **`userProfileUrl` を kimito.link の管理ページに向ける** — kimito.link 側の正規 URL がこのリポからは未検証。確定後に1行差し替えで移行可能（設計上の逃げ道は確保済み）。
6. **自前ピルを UserButton に置き換え** — フォロワー数・「現在このアカウントでログインしています」のブランド体験が消え、diff も大きい。共存で足りる。

## G. 地雷と回避策

| 地雷 | 回避策 |
|---|---|
| ClerkProvider 外描画クラッシュ（ゲストシェル `/`・chunk 解決待ち） | `isAuthReady && user` ガード（C-3）。GuestAuthProvider は `isAuthReady:true` だが `user:null` 恒常なのでガードが効く点をコメントに明記 |
| UserButton 署名アウトでローカルデータが残る | `app/logout.tsx` の早期 return 削除（B-6）。afterSignOutUrl を `/logout` にして既存掃除経路へ合流 |
| 共有セッションの signOut が kimito.link 側も落とす | 仕様（fc2id）だが体感は驚き。D-4 で実測確認し、想定外なら出荷しない |
| primary で将来 multi-session が ON になる | C-2 の `__addAccount` / `__signOutAll` CSS 隠し（防御）。ただし Clerk 内部クラス名依存なので**主たる守りは D-0 の Dashboard 確認**。実装時に `../KIMITO-CLERK-UNIFICATION-PLAN.md` へ「multi-session を ON にする前に surechigai の UserButton を再確認」の1行追記を推奨 |
| Metro チャンク破壊 / 初期 JS 肥大 | `.web.tsx` 内 `lazy()` import・native 実体は null（C-3）。`@clerk/expo/web` の静的 import を app-header 系チャンクに置かない |
| CDN immutable キャッシュで反映されない | D-3: マーカー文字列で配信確認、ダメなら `CDN_CACHE_EPOCH` +1 |
| ログイン済み `/sign-in?auto=x` 再訪での認証ループ | C-1 の `isAuthReady && !user` ガード＋ param 即時除去。純関数化してテスト固定 |
| 「同じだから」と `buildSignInSwitchHref` を auto=x に寄せられる回帰 | 既存テスト（`__tests__/clerk-route.test.ts`）が守っている。新規 props テストで UserButton 側にも同じ柵を張る |
