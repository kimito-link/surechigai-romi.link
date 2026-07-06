# アプリ総点検SPEC（2026-07-06）— クリック不発・シェア・OGP・着地の不具合

> **目的**: ユーザー報告（Xシェアが無反応 / OGPが出ない / アクセス先が違う / カードが押せない）を
> 起点に、全画面のインタラクティブ要素・シェア・OGP・ログイン導線をコード精査した結果。
> **この文書は「思考・特定」まで。実装は別モデルが行う。**
> 4体の並列調査エージェント + 監督（fable）による裏取り済み。**確度を厳格に判定し、
> 誤判定・推測は末尾「§5 却下・保留」に分離した**（実装者はそこを直さないこと）。
>
> ⚠️ エージェントが「twitter.com/intent は廃止で無反応の主因」と最優先主張したが、これは**誤り**。
> twitter.com/intent は今も x.com へ302で動作する。無反応の真因はP0-1（非同期後のwindow.open）。
> §5参照。

---

## §1. 最優先（P0）— ユーザー報告の直因。確度：高（コードで裏取り済み）

### P0-1. Xシェアが押しても何も出ない（PC/スマホ両方）
- **症状**: シェアボタンを押しても X の投稿画面が開かない。エラーも出ない。
- **真因（2つの複合）**:
  1. **非同期処理の後に `window.open` を呼んでいる → ブラウザがポップアップとしてブロック**。
     ブラウザは「ユーザークリック直後の同期的 window.open」しか許可しない。`await`（サーバー通信）を
     挟むと非ジェスチャー扱いになりブロックされる。
     - `components/mypage/mypage-authenticated-screen.tsx:260-266`
       ```tsx
       const handleShareLocation = useCallback(async () => {
         const res = await shareSlugMutation.mutateAsync();  // ← サーバー通信を待つ
         await shareMyLocation(res.url, res.areaLabel ?? undefined);  // ← その後 window.open → ブロック
       ```
     - `lib/share.ts` の `shareToTwitter()` が `window.open` を呼ぶ本体。
  2. **失敗を握り潰している**: `lib/share.ts:93-99`
     ```tsx
     if (Platform.OS === "web") {
       if (typeof window !== "undefined") {
         window.open(twitterUrl, "_blank", "noopener,noreferrer");  // 戻り値を見ない
         return true;  // ← ブロックされても true（成功扱い）→ エラーも出ない
       }
     ```
- **修正方針（実装者向け）**:
  - **クリック直後に同期で先にタブ/ウィンドウを開き、slug取得後にそのタブのURLを差し替える**パターンにする。
    典型: `const w = window.open("about:blank","_blank"); const res = await mutate(); if(w) w.location.href = tweetUrl;`
  - または、シェアURLを**クリック時点で確定できる形**にして `await` を挟まず即 `window.open`。
  - `window.open` の戻り値 `null`（＝ブロック）を検知し、フォールバック（同タブ遷移 or トースト「ポップアップを許可してください」）。
  - **他の全シェア呼び出し箇所も同じ罠が無いか点検**（下記の呼び出し元すべて）:
    `components/checkin/checkin-authenticated-screen.tsx`（shareMyLocation使用）、
    `components/mypage/mypage-authenticated-screen.tsx`、`components/post/*`、`components/events/*`。

### P0-2. アクセス先が違う — シェアURL/OGP/OAuthコールバックのドメイン不統一
- **症状**: シェアリンクを踏むと意図と違うURLに着地する / ログイン後に別ドメインに飛ぶ。
- **背景事実**: `surechigai-romi.link` は `surechigai.kimito.link` へ **308/301 恒久リダイレクト**（`vercel.json`）。
  実体は常に `surechigai.kimito.link`。
- **真因（3つ）**:
  1. **シェアURL生成が「現在のオリジン」をそのまま使い、旧ドメインを許容している**:
     `lib/share.ts:12-31` `getAppUrl()` が `hostname.includes("surechigai-romi.link")` を許容し、
     旧ドメインのURLをシェアに使ってしまう。→ og:url が旧ドメイン → 踏むとリダイレクト経由で着地がぶれる。
  2. **OAuthコールバックが旧ドメインへ固定**: `server/twitter-routes.ts:152-153, 316-317`
     ```ts
     if (host.includes("railway.app")) {
       baseUrl = "https://surechigai-romi.link";  // ← リダイレクトされる旧ドメイン
     }
     ```
     ※ 現在の本番APIがVercel Functions主体なら railway 分岐は発火しない可能性がある。**要実測**
     （現状のOAuthが実際にどのbaseUrlを使うかをログ/実機で確認してから直す）。
  3. **共有着地の正規は `surechigai.kimito.link`** に統一されているか、生成系（`server/routers/ogp.ts`,
     `lib/ogp/share-meta.ts`, `api/u/[slug].ts` の `APP_ORIGIN`）を全て確認。api/u/[slug].ts は
     `APP_ORIGIN="https://surechigai.kimito.link"` 固定なのでここは正しい。
- **修正方針**:
  - **シェアURL・og:url・OAuthコールバックを、常に正規 `APP_ORIGIN`(surechigai.kimito.link) に統一**。
    `getAppUrl()` の `surechigai-romi.link` 許容を削除し、旧ドメインアクセス時も正規URLでシェアさせる。
  - `twitter-routes.ts` の旧ドメイン固定を `APP_ORIGIN` 由来に。ただし②は発火有無を先に実測。

### P0-3. 統計カードが押せない（すれ違った人 / 図鑑 / 市区町村 / 都道府県）
- **症状**: ダッシュボードの数値カードが押せそうに見えて押せない。ユーザー要望=「押したら対応情報を出す」。
- **真因**: いずれも `<View>` で囲まれ `onPress` が無い（インタラクティブ要素になっていない）。確度100%。
  - `components/dashboard/my-signal-summary.tsx:7-23,49-60` — StatCell（足あと/未開封/すれ違い/都道府県）
  - `components/zukan/zukan-authenticated-screen.tsx:203-228` — summaryCard 3枚（訪問/すれ違い都道府県/すれ違った人）
  - `components/zukan/zukan-complete-header.tsx:26-39` — 市区町村数・すれ違い人数
- **修正方針**: 各セルを `Pressable` 化し、対応先へ `navigate`:
  - 足あと→map、未開封→ホーム(封筒)、すれ違い→zukan(相手リスト)、都道府県/市区町村→zukan該当セクション。
  - `navigate.toMapTab` / `toZukanTab` は既存（`lib/navigation`）。飛び先が実在することを確認して繋ぐ。

---

## §2. 高優先（P1）— 機能欠落・導線切れ。確度：高〜中

### P1-1. ログインCTAの `<Link>`+`onPress` 併用で演出onPressが無視される
- **場所**: `components/molecules/kimito-login-cta.tsx:40-51`（Web版）。
- **真因**: Expo Router `<Link>` は `onPress` を無視し `href` だけ処理する。`useLoginGuide()` の
  ハンドオフ演出（りんく全画面）等の `onPress` が発火しない。href遷移自体は起きるので「完全無反応」
  ではないが「意図した体験が出ない」。
- **修正方針**: Web版も `Pressable` + `onPress`（内部で `window.location` 遷移）に統一するか、
  `<Link>` に寄せて演出を href 先で行う。**多重送信防止**（isStarting時 disabled）も併せて。

### P1-2. 共有着地 `/u/[slug]` の `retry:false` で一時エラーが固定化
- **場所**: `app/u/[slug].tsx:45` `trpc.ogp.getTrailBySlug.useQuery(..., { retry:false })`。
- **真因**: サーバ一時遅延/5xx時に「見つかりません」で固定。UIに再試行導線なし→リロードするしかない。
  （共有着地の第一印象を壊す＝流入損失に直結）
- **修正方針**: `retry:1`+指数バックオフ、または明示的「再読み込み」ボタン(`refetch()`)。
  ※ [[surechigai-share-landing-uiux-spec]] のP0スコープにも含まれる既知事項。

### P1-3. EventCard にonPressが無い / `/event/[id]` ルート不在
- **場所**: `components/events/events-authenticated-screen.tsx:92` で `<EventCard>` を並べるが押せない。
  ナビ先 `app/event/[id].tsx` が**存在しない**（`app/` を確認）。
- **修正方針**: イベント詳細を出す設計なら詳細ルートを新設 or モーダル化。**要件確認が先**
  （そもそもイベント詳細画面が必要かは仕様判断。§5に「仕様確認要」として再掲）。

### P1-4. OGPが出ないケース — bot判定の取りこぼし（確度：中・要実測）
- **場所**: `middleware.ts:8-9` `BOT_UA` 正規表現。
- **懸念**: `twitterbot` は入っているが、X/各SNSのUA変更で新パターンを取りこぼす可能性。
  bot判定に外れると人間向けSPAが返り、動的OGPメタが無いHTMLになる=「OGPが出ない」。
- **重要**: **OGP生成パイプライン自体(`api/u/[slug].ts`,`/api/og`)は正常**（curl実測で確認済み・
  docsにも記録）。問題は「botと認識されるか」だけ。
- **修正方針**: 実際にXでシェアして Card Validator 相当で確認 → 取りこぼすUAがあればBOT_UAに追加。
  **まず実測**（トップ `/` はOGP出る＝§1のドメイン統一を直せば大半解決の可能性。/u/[slug]固有のbot判定は
  実際に出ないことを確認してから触る）。

---

## §3. 中優先（P2）— UX/堅牢性。確度：中

- **P2-1. 「ほか N 通」が押せない**: `components/post/envelope-rail.tsx:80-86` が `<View>`。
  全封筒を見たいintentに応えていない → Pressable化して一覧展開 or ホームへ。
- **P2-2. 市区町村スタンプの onPress 欠落リスク**: `components/zukan/municipality-stamp-card.tsx:32-35` は
  `onPress` があれば押せる実装だが、親(`zukan-authenticated-screen.tsx:271`)が渡し損ねる経路が無いか確認。
  （現状は渡している＝実際に壊れているか要実機確認。確度中）
- **P2-3. LazyEncounterOpenModal のロード遅延で「開かない」体感**:
  `components/post/post-authenticated-screen.tsx:488` — 開封時にchunk未達だと無反応に見える。
  プリフェッチ or ローディングUI。
- **P2-4. shareEncounter が存在しないルートを生成**: `lib/share.ts` `shareEncounter()` が
  `${getAppUrl()}/encounters/${id}` を作るが `app/encounters/` は無い。この関数の呼び出し元が
  現存するか確認し、使うなら正しい共有URL(`/u/[slug]`系)に、使わないなら削除。

---

## §4. 検証手法メモ（実装後の確認に使う）

- **シェア無反応**: PC Chrome + スマホ実機で、シェアボタン押下→Xの投稿画面が**実際に開く**こと。
  ポップアップブロック設定でも代替導線が動くこと。
- **OGP**: 修正後の共有URLを実際にXに貼り、カードが出るか。`curl -A "Twitterbot/1.0" <url>` で
  bot向けHTMLにog:*が入るか。
- **着地**: 共有URLを踏んで最終着地が `surechigai.kimito.link/u/[slug]` になり、リダイレクトで
  内容がぶれないこと。
- 全て**実機/本番相当**で。ブラウザプレビューだけでは popup/OGP/OAuth は再現しきれない。

---

## §5. 却下・保留（実装者はここを「直さない」）— fableの選別

- **【却下】「twitter.com/intent が廃止で無反応の主因」**（エージェント1の最優先主張）:
  誤り。twitter.com/intent は今も x.com へ302で動作する。無反応の真因はP0-1。
  ただし `twitter.com`→`x.com` への表記統一自体は害がない軽微改善なので、やるならP2以下で。
- **【却下】「チェックインのシェアボタンが disabled で導線が死んでいる」**（エージェント3 A1）:
  誤判定。`checkin-authenticated-screen.tsx:899-917` の disabled ボタンは
  `state==="loading"||"adjust"` の時だけ出る**意図的プレースホルダ**（「記録完了後に押せます」）。
  記録完了時は別の押せるボタンが出る設計。**触るとUXを壊す**。
- **【保留/仕様確認要】**:
  - イベント機能（P1-3）: イベント詳細画面を作るのか、そもそもイベントを主機能に残すのか要判断。
  - `nav-live-prefecture-panel` の defer中shell長時間表示、Clerk defer判定のズレ: 自動回復する
    軽微事象。優先度低。まず実測で本当にユーザー影響が出るか確認してから。
  - Web地図のピンチズーム未実装: 別途 [[surechigai-uiux-brushup-spec]] のピンチズーム要望と統合して設計。
