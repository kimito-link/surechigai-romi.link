# place-context-and-sns-SPEC — 「その場の情報」「SNS往復」「アプリ内すれちがい通知」実装仕様

> **設計 = Fable (claude-fable-5) / 地図・裏取り = 司令塔 (Claude Opus 5) / 2026-08-15**
> 根拠地図: [place-context-and-sns-MAP.md](place-context-and-sns-MAP.md)
> 方式: [WAYFINDER-TO-SPEC-HOWTO.md](../../WAYFINDER-TO-SPEC-HOWTO.md) 手順2

---

## 実装状況（2026-08-15 時点・すべて本番反映済み）

| Phase | 内容 | commit | 状態 |
|---|---|---|---|
| A | 押せないUI 3群 + 着地ページのXリンク | `dd7d21493` | **完了**（reality-checker で pass） |
| B | すれちがい到着のアプリ内通知 | `8af1752b3` | **完了** |
| C | 天気 + Instagram リンクコピー | `23d251673` | **完了**（天気は本番APIで動作確認） |
| — | 起動画面のキャラ拡大 | `6e0835944` | **完了**（Playwright で実描画確認） |
| P2→実装 | ライブカメラ導線 | `9c44818f3` | **完了**（下記の方針変更あり） |

### 仕様からの変更点（実装時に判明した事実による）

1. **⑥ライブカメラは「P2送り」から「実装」に変更**（ユーザー指示「全部やりきって」「無料の範囲で」）。
   調査の結果、無料で成立する形が確定したため。
   - 国交省の**画像APIは有償**（河川情報センターの実費配信）→ 画像は取り込まず公式ページへリンク
   - 地方整備局9つのURLを curl 実測。**東北は到達不能(000)、北海道・中国は http のみ**
     （https しか通らないので載せると無反応）→ この3地方は載せない
   - 穴を埋めるため **YouTube のライブ検索リンク**を併設（ユーザー指摘「youtubeでも無料公開のたくさんある」）。
     検索なので全国どこでも開ける
   - `mlit.go.jp` をホワイトリストに追加（外すとテストが落ちることを変異テストで確認）

2. **通知トーストに「見る」ボタンを付けられなかった**（Q1 の設計と実装の差）。
   `ToastContext` は `message/type/duration` のみ受け取り、`action` を Provider に通していない
   （[components/atoms/toast.tsx:187](../components/atoms/toast.tsx)）。
   → 文言でホームを案内する形に変更。

3. **天気の粒度は「代表値でよいか」の判断が不要になった**（未解決の質問2は解決）。
   気象庁の公式エリア定義を実データで取得したところ、北海道8地域・沖縄4地域・鹿児島2地域に
   細分されていると判明。市区町村名から地域を引く表を作り、**本番で稚内と函館が別の天気を返すことを実測**。

4. **Instagram は文言コピーではなくリンクコピー**（ユーザー指示「メインのアドレスを貼る程度で」）。

### 残っているもの

- `app/event/[id]` が存在しないのに `toEventDetail` が呼ばれている（[host-events-summary.tsx:73](../components/dashboard/host-events-summary.tsx)）。
  押すと not-found に落ちる。**仕様判断が要るため未着手**（ルートを作るか、呼び出しを消すか）。

---

## 司令塔による裏取り結果（2026-08-15・Fableの断定を実コードで検証）

Fable が「assumption list」に隔離した5件のうち4件を、司令塔が実コードで解決した。

| # | Fableの仮定 | 裏取り結果 | 判定 |
|---|---|---|---|
| 1 | 開封カラム名が未確認 | [drizzle/schema/encounter.ts:171,173](../drizzle/schema/encounter.ts) — `openedByA` / `openedByB`（`timestamp`。NULL=未開封） | **確定** |
| 2 | Toast の Provider 有無が未確認 | [components/atoms/toast.tsx:198](../components/atoms/toast.tsx) `ToastProvider` / `:260` `useToast` / `:15` `action?:{label,onPress}` すべて実在 | **確定** |
| 3 | Web の AsyncStorage 複数タブ共有 | 未検証（被害は「各タブで1回ずつ鳴る」に留まるため許容） | 未確認のまま |
| 4 | ネイティブの API ベースURL解決 | 未検証（実装時に tRPC の解決手段を流用のこと） | 未確認のまま |
| 5 | `expo-clipboard` が審査中ビルドに含まれる | [package.json:91](../package.json) `"expo-clipboard": "^8.0.8"` — dependencies に実在 | **確定** |
| 追加 | ホームタブ遷移ヘルパー名（未解決の質問5） | [lib/navigation/app-routes.ts:146](../lib/navigation/app-routes.ts) `navigate.toHome()`（`:171` `toZukanTab` / `:176` `toMapTab` も実在） | **確定** |

### ★司令塔が追加で発見した地雷（Fableの仕様に無い・実装前に必読）

**`ToastProvider` は `ClerkRootProvider` の内側にしか存在しない。** [components/photo-import/photo-import-screen.tsx:154-156](../components/photo-import/photo-import-screen.tsx) に実障害の記録がある:

> ToastProvider は ClerkRootProvider の内側にしか無く、この画面は
> 「useToast must be used within a ToastProvider」で画面全体が落ちた。

→ **B-5 の `encounter-arrival-toast.tsx` を `app/(tabs)/_layout.tsx` にマウントする際、`useToast` が Provider の内側で呼ばれることを必ず確認すること。** 外側だと画面全体がクラッシュする。認証済みタブは Clerk の内側にあるはずだが、**実装時にコンポーネント階層を目視で確認**すること（この罠は tsc を通過する）。

---

以下、Fable による設計本文。

---

## 1. Problem Statement

7件の依頼は、根っこで3つの体験欠陥に集約される。

1. **「すれ違ったのに気づけない」**。encounters は相手のチェックイン時に生まれるが（encounter.ts:250）、本人には何も知らせる経路がない。封筒タブを自発的に開いた人だけが気づく。すれ違い通信アプリの核体験（「届いた」）が受動的に発生しない。
2. **「押せそうなのに押せない／押しても何も起きない」**。地図タブの統計カード3枚は素の `<View>`（web-trail-map.tsx:172-191）、図鑑タブには「今いるタブへ navigate する」自己遷移が4箇所（zukan-authenticated-screen.tsx:231,244 / zukan-complete-header.tsx:29,53、裏取り済）、封筒レールの「ほかN通」は非対話の View（envelope-rail.tsx:82）。UIが嘘をついている状態で、アプリ全体の信頼を削る。
3. **「Xから来た人が行き止まりになる」**。交流はXに委譲する設計（CLAUDE.md 原則4）なのに、着地ページ `/u/[slug]` にはXへ出る導線が0件（地図3章で grep 確認済）。「会いたい君がいる現在地」を見せた後、会いに行く（＝Xで交流する）出口がない。さらに Instagram/Threads 圏のユーザーへの配布経路（⑤）と、場所の文脈情報（⑥⑦）が薄く、着地ページの滞在価値が地図1枚で頭打ちになっている。

制約はユーザーが明示している: **電池を消耗しない（位置取得を1つも増やさない）**、**通知はアプリを開いている間だけ・数十分〜数時間の遅延許容**、**審査リスク（権限追加）を負わない**（FOREGROUND_SERVICE 申告動画の実害あり、地図4章）。

---

## 2. Solution

### 方針の一言

**「新しいデータ取得を増やさず、既に流れているデータ（pulse・getTrailBySlug・EncounterItem）に相乗りして、UIの嘘を直し、出口と文脈を1つずつ足す」**。位置取得はゼロ追加、OS権限はゼロ追加、DBカラムはゼロ追加、CSPもゼロ変更で7件中6件に答える。⑥ライブカメラのみデータ源が未確定のため次期送り（骨子だけ確定）。

### 地図7章・19問への回答

#### 通知（①）

**Q1. pulse に載せるのは件数かフラグか。抑止はどこか。**
→ **「未開封件数 + 最新 encounter id」のペア**を載せる。`unopened: { count: number; latestId: number } | null`（null は「今回は計算していない」）。抑止は二段構え:
- **サーバー側**: 未開封サマリの計算は**ユーザーごとに10分に1回**に間引く。`presence.ts` の `recentPulseAtByUserId` と同じ in-memory Map パターンを流用（新規インフラなし、cron禁止の設計判断とも整合・地図4章）。それ以外の pulse は `unopened: null` を返す（=DBクエリ追加ゼロ）。
- **クライアント側**: AsyncStorage に `lastNotifiedId` を持ち、**`latestId > lastNotifiedId` のときだけ**バナーを出す。件数だけだと「開封して減った→また増えた」の判定ができず、フラグだけだと同一すれ違いで毎回鳴る。id 単調増加比較が最小で確実。

理由: 位置取得ゼロ追加・サーバー負荷は10分に1クエリ・遅延許容「数十分」の要件に対し最大遅延は約10分+pulse間隔で十分速い。

**Q2. 前景でローカル通知は妥当か。**
→ **妥当でない。OSローカル通知は使わず、アプリ内バナー（既存の `components/atoms/toast.tsx`、裏取り済）一本にする。**
理由: (a) 画面を見ている人にOSバナーは二重表示で、iOSの前景通知はハンドリングも特殊。(b) OS通知を使わなければ**通知権限の要求すら不要**＝Play の権限申告に一切触れない（申告動画の実害の再発をゼロにする・地図4章）。(c) `lib/event-reminders.ts` は「アプリを閉じていても未来時刻に鳴らす」用途で、今回の「開いている間だけ」とは別物。流用しない。

**Q3. ON/OFF・静音時間帯はDBか端末か。**
→ **端末ローカル（AsyncStorage）**。キー `surechigai.encounterNotice.enabled.v1`、既定ON。マイページに Switch を1行追加。**静音時間帯は作らない**（アプリを開いている間しか出ないバナーに静音時間帯は意味がない。使っている＝起きている）。
理由: マイグレーション4罠（地図5章）を踏む必要が無い。通知は端末の体験設定であり、複数端末間で同期する価値が薄い。

**Q4. `locationPausedUntil` 中は通知も止めるか。**
→ **止めない（追加の抑止コードを書かない）**。一時停止は「自分の位置を記録・公開しない」意思であり、「届いたすれ違いを見たくない」意思ではない（受信の可視化は独立）。なお停止中は presence.setEnabled が拒否され（presence.ts:61-72、裏取り済）pulse 自体が止まるケースが多く、その場合は自然に通知も止まる。それで正しい。

**Q5. `livePresenceEnabled` OFF のユーザーに通知は出るか。**
→ **出ない。pulse が飛ばない＝通知も来ない、で正しいと確定する。** 理由: 通知のためだけの新規ポーリングは、429嵐の前科（use-live-presence.ts:138-143 のコメント、裏取り済）と電池方針の両方に反する。OFFの人は封筒タブを開けば見える現状の体験を維持。将来必要になったら encounter.list の refetch に相乗りする（P2、今回はやらない）。

#### 押せないUI（②）

**Q6. `/u/[slug]` の統計カードの行き先。**
→ **他人のページでは押せないまま（現状維持）とし、自分の地図タブでのみ押せるようにする。** 実装は「ハンドラを渡されたときだけ Pressable になる」opt-in 方式（後述 `onStatsPress`）。`/u/[slug]` はハンドラを渡さない＝素の View のまま。理由: 他人の統計の遷移先（他人の封筒・他人の図鑑）は存在せず、閲覧者本人の画面へ飛ばすと文脈が壊れる（地図5章の破綻リスクそのもの）。押せる側では pressed スタイルを付け、押せない側は装飾を足さない＝「押せそうに見える」問題を非対称で解消する。

**Q7. 図鑑タブ内の自己遷移4箇所。**
→ **「セクションへスクロール」に変える**（押せなくするのではなく）。4箇所とも数字を見せるカードで、タップの期待は「その内訳を見る」。親スクリーンがセクション見出しの y 座標を onLayout で収集し、`scrollTo` する。`navigate.toMapTab()` を呼んでいる2箇所（タブ跨ぎ）は正しく動いているので触らない。
注意: onLayout は**セクション見出しの View で測る**こと。地図を包む View を測ると自己参照で縮む既知の罠がある（メモリ [[surechigai-japan-map-responsive-landmine]]）。

**Q8. 「ほかN通」の遷移先。**
→ **遷移しない。押すとレールがその場で全件展開される**（`expanded` state で `RAIL_LIMIT` を解除）。理由: 封筒の全件一覧ルートは存在せず（EnvelopeRail はホーム画面 post-screen-view.tsx 内、裏取り済）、新ルートを作るより「その場で見せる」が最小かつ期待に合う。横スクロールレールなので全件出しても縦を圧迫しない。

#### SNS往復（③④⑤）

**Q9. 「Xに戻る」の定義。**
→ **(b) 投稿者のXプロフィールを開く**、に確定。ラベルは「Xで戻る」ではなく **`@handle` 表示そのものをタップ可能にする**。理由: (a) `history.back()` は流入経路依存で不確実（直リンク・ブックマーク流入では戻り先がXでない）。(c) ツイートIDはどこにも保存していないので技術的に不可能。(b) は `getTrailBySlug` 応答に `username` が既にあり（app/u/[slug].tsx:204、裏取り済）、追加データ取得ゼロ。モバイルでは x.com URL がXアプリの universal link で開くため「Xアプリに戻る」体験も実質満たす。`twitter.com`/`x.com` はホワイトリスト済（external-links.ts:15-16、裏取り済）。

**Q10. 交流したい人側の導線。**
→ **相手のXプロフィールへのリンクで確定。DMリンクは出さない**（`openTwitterDM` はデッドコードのまま放置。削除もしない＝今回のスコープ外）。裏取りの結果、**封筒開封モーダルには既に `https://x.com/{handle}` を開くボタンが実装済み**（encounter-open-modal.tsx:239）。よって④の「交流したい人」側は既存実装で成立しており、欠けていたのは③（着地ページ→投稿者のX）だけ。④は③の実装＋既存確認で完結とする。

**Q11. Instagram に何を提供するか。**
→ **文言コピーのみ**（本文+共有URL+ハッシュタグをクリップボードへ）。画像コピー・自動投稿は作らない。lib/share.ts:255-262 のコメントが調査済みの根拠: intent 不在・Graph API 個人不可・Stories はネイティブ限定+App ID必須。制約の説明はコピー成功トーストで行う: 「コピーしました。Instagramアプリに貼り付けてください（リンクはプロフィールかストーリーズで有効になります）」。`expo-clipboard` は依存導入済み（package.json:91、裏取り済）＝ネイティブビルドにも既に入っている。

**Q12. Threads ボタンを他画面にも出すか。**
→ **出さない（チェックイン成功パネルのみ維持）**。理由: 着地ページは「他人のページ」でありシェア主体が違う。マイページへの増設は情報過多の方向で、Q19 の配置原則に反する。Instagram コピーも同じ理由でチェックイン成功パネルのみに置く。

#### 天気・ライブカメラ（⑥⑦）

**Q13. いつの天気か。**
→ **「その場所の、今日の天気（予報）」**に確定。理由: (a) 気象庁の非公式JSONは予報データであり、過去の記録時点の気象は別系統で入手が重い。(b) 製品文脈で有用なのは「これからその足あとを辿る（聖地巡礼する）人」への情報＝現在。記録時点の天気はスコープ外（P2にも入れない。必要性が実証されてから）。

**Q14. 取得元と失敗時。**
→ **気象庁非公式JSON（無料）を、自前の Vercel Function 経由で**取る。クライアント直叩きは CSP `connect-src` の変更が必要になり、CORS も無保証なので不採用（`connect-src 'self'` に /api/weather が収まる。vercel.json 裏取り済）。Function 応答に `s-maxage=1800, stale-while-revalidate=3600` を付け、CDN が都道府県単位でキャッシュ＝気象庁への負荷は 47県×30分に1回が上限。**失敗時は表示を消すだけ（fail-silent）**。無保証APIを主役にしない。

**Q15. 天気をどこに出すか。**
→ **FootprintSheet（足あとタップ時の詳細シート）内に1行だけ**。地図タブと `/u/[slug]` は同じ部品なので両方で自動的に効く。**着地ページの常設要素にはしない。OGPには載せない**（生成2.86秒で既にクローラに負けている・地図5章。satori 要素削減の経緯にも逆行）。「タップした人にだけ見せる」ことで情報過多を構造的に回避する。

**Q16. ライブカメラのデータ源とカバレッジ。**
→ **今回は実装しない（P2送り）**。データ源（国交省河川・道路カメラ等）の商用可否・レート・ライセンスがすべて未調査（地図6章）で、fail-closed 原則上、無根拠のまま仕様化できない。骨子だけ確定する: 採用時は **(a) 外部リンク方式のみ (b) カバー地点が無い場所では導線自体を出さない**（「無い場所のほうが多い」前提を UI の欠落ではなく非表示で吸収）**(c) ドメインはホワイトリストへ明示追加+戻り値判定テスト必須**。

**Q17. リンクか埋め込みか。**
→ **リンク**（P2で実装する場合も）。埋め込みは CSP `frame-src` の緩和が必要（現状 `'self'`+Clerk+Cloudflare のみ、vercel.json 裏取り済）で、セキュリティ境界を外部カメラ事業者の都合で広げることになる。不採用を先に確定しておく。

#### 横断（⑱⑲）

**Q18. 優先順位とMVP。**
→ 3フェーズ+P2に切る。**すべて Web は即デプロイで効き、ネイティブは次ビルド（iOS >504 / Play >589）に自然に乗る。権限・ネイティブモジュールの追加がゼロなので、審査中の両ビルドにも申告変更にも一切影響しない。**

| Phase | 内容 | 理由 |
|---|---|---|
| **A（最初）** | ② 押せないUI3群 + ③ 着地ページXリンク（④はこれで完結） | コード最小・データ追加ゼロ・「UIの嘘」はアプリ信頼の土台 |
| **B** | ① アプリ内すれちがい通知 | 核体験の欠陥修正。サーバー/クライアント両方に触るため単独フェーズ |
| **C** | ⑤ Instagramコピー + ⑦ 天気 | 価値追加系。A/Bの回帰確認後に載せる |
| **P2（今回やらない）** | ⑥ ライブカメラ / 記録時点の天気 / OGPへの天気 / OS通知・バックグラウンド通知 / OFFユーザー向け通知 | 各判断の項に理由記載 |

**Q19. 情報過多を避ける配置。**
→ 原則: **着地ページの常設要素をひとつも増やさない**。序列は現状固定（主役コピー+プロフィール → 地図 → 統計 → 足あと一覧 → ログイン/DL CTA）。今回の追加は (a) 既存の `@handle` テキストの対話化（新要素ゼロ）、(b) タップ時のみ現れる FootprintSheet 内の天気1行、のみ。ライブカメラ・SNSボタン列・天気の常設表示はすべて不採用。「会いたい君がいる現在地」の主役は地図と人であり続ける。

---

## 3. User Stories

### ① すれちがい通知（Phase B）

- **正常系**: レーダーONでアプリを開いたまま移動中、他ユーザーが近くでチェックイン → 数分〜十数分後の pulse 応答に `unopened` が載る → 画面上部にバナー「新しいすれちがいが2通届いています」+「見る」→ タップでホームタブの封筒レールへ。
- **空の状態**: すれ違い0件のユーザーには `unopened.count = 0` でもバナーを出さない（`count > 0` かつ `latestId` 増加時のみ）。
- **読み込み中**: バナーは pulse 完了後にしか出ない＝ローディング表現は不要。出す瞬間に封筒データが未フェッチでも、遷移先の封筒レールが既存のローディングを持つ。
- **失敗と再試行**: pulse 失敗時は既存どおり次回 pulse に任せる（use-live-presence.ts:162-165 の既存方針）。通知のための再試行は追加しない。
- **権限不足**: OS通知権限を使わないため権限不足という状態が存在しない。これが設計の狙い。
- **古いデータとの互換**: `unopened` は optional フィールド。旧クライアント（build 504 等）×新サーバー → フィールドを無視して現状動作。新クライアント×旧サーバー → `undefined` を null 同様に扱い無反応。双方向互換。
- **Undo・Cancel・Back**: バナーは duration で自動消滅。無視しても `lastNotifiedId` は更新済みなので同じ通知が再来しない。「見る」を押さなかったことによる副作用はゼロ。
- **別画面・別ウィンドウとの競合**: 封筒を開いた直後の pulse では count が減った値が来るだけでバナー条件（latestId 増加）を満たさない。Web で複数タブを開いた場合、`lastNotifiedId` は localStorage 共有のため先に受けたタブだけが鳴る。バナー表示中のタブ移動はルートレイアウト搭載のため表示が継続する。

### ② 押せないUI（Phase A）

- **正常系**: 自分の地図タブで「すれ違った人」カード→ホームタブ（封筒レール）へ。「図鑑」カード→図鑑タブへ。「市区町村」カード→図鑑タブへ。図鑑タブ内の4カード→該当セクションへスクロール。「ほかN通」→レールが全件展開。
- **空の状態**: 件数0のカードも同じ遷移先へ（空の遷移先には既存の empty 表示がある）。封筒レールは 0件時に既存の「すれちがいを待っています」を維持。
- **読み込み中**: `isLoading` 中（表示が「—」）はカードを disabled にする（押しても値の意味する場所が定まらないため）。
- **失敗と再試行**: 遷移は同期処理で失敗形なし。スクロール先の y が未収集（onLayout 未発火）の場合は先頭へスクロール（無反応にしない）。
- **権限不足**: なし（認証済み画面のみ対話化。公開ページは非対話のまま）。
- **古いデータとの互換**: `/u/[slug]` はハンドラ未指定で従来レンダリングと完全一致（回帰ゼロ）。
- **Undo・Cancel・Back**: タブ遷移は既存のタブバー/戻るで復帰。「ほかN通」展開は再タップ不要（閉じ機能は付けない。画面遷移でリセット）。
- **別画面との競合**: `/u/[slug]`（他人ページ）で同じ部品が非対話であることが競合対策そのもの（Q6）。

### ③④ X往復（Phase A）

- **正常系**: Xで共有リンクを踏む → `/u/[slug]` → `@handle` をタップ → Xプロフィールが新規タブ/Xアプリで開く。封筒モーダルの相手Xリンクは既存のまま。
- **空の状態**: `username` が null（api/u/[slug].ts:97 の skipUsernameLookup 経路）→ handle 行自体が出ない（既存条件を流用）。リンクだけ消え、ページは成立。
- **読み込み中**: trailQuery ローディング中は handle 行が無い（既存挙動）。
- **失敗と再試行**: `openTwitterProfile` が false（ポップアップブロック等）→ handle 行の直下に「開けませんでした。もう一度タップするか、ブラウザのポップアップ設定をご確認ください」を表示（**無言 false 禁止**・地図4章の前科対応）。再タップで再試行可。
- **権限不足**: なし（公開ページ・未ログインでもタップ可）。
- **古いデータとの互換**: username 無しの古い共有リンクでも上記「空の状態」で安全。
- **Undo・Cancel・Back**: 新規タブで開くため元ページは失われない（現在タブ差し替え禁止・lib/share.ts:143 の境界を厳守）。
- **競合**: Xアプリ内ブラウザで開いている場合、universal link でXアプリ側に遷移する（それが「戻る」の実現形）。

### ⑤ Instagramコピー（Phase C）

- **正常系**: チェックイン成功パネルで「Instagram用に文面をコピー」→ クリップボードに本文+URL → 成功トーストで貼り付け先の案内。
- **空の状態**: 共有URL未生成（shareSlug なし）の間はボタンを出さない（X/Threads ボタンと同条件）。
- **失敗と再試行**: `setStringAsync` 失敗 → エラートースト「コピーできませんでした」→ 再タップ可。
- **権限不足**: クリップボード書き込みはWeb/ネイティブとも許可不要（読み取りと違い）。
- **互換**: 旧ビルドにはボタンが無いだけ。文面は X/Threads と共通関数化するため将来の文言変更が3導線同時に効く。
- **Undo**: 再コピーで上書きされるだけ。破壊的操作なし。
- **競合**: isSharing 中（X/Threads 準備中）は disabled にして popup 準備との干渉を避ける。

### ⑦ 天気（Phase C）

- **正常系**: 足あとをタップ → FootprintSheet に「きょうの東京都: 晴れ時々くもり 32°/25°」が1行出る。
- **空の状態**: `prefecture` が null の足あと（逆ジオコーディング打ち切り等）→ 行を出さない。
- **読み込み中**: 行を出さない（スケルトンも出さない。シートの主要素＝場所と時刻を待たせない）。
- **失敗と再試行**: 気象庁JSON停止・仕様変更・タイムアウト → API が `{ok:false}` → 行が出ないだけ。ユーザー向けエラーは一切出さない（無保証APIを主役にしない）。明示的な再試行UIなし（シート開き直しで再フェッチ）。
- **権限不足**: なし。位置取得もしない（保存済みの prefecture 文字列だけを使う）。
- **互換**: 旧ビルドは /api/weather を呼ばないだけ。
- **競合**: 同一県の足あとを連続タップ → CDN キャッシュ（30分）が吸収し気象庁へは飛ばない。

---

## 4. Implementation Decisions

### Phase A

**A-1. `components/organisms/web-trail-map.tsx` — 統計カードの opt-in 対話化**

```ts
// props に追加
onStatsPress?: {
  encounters?: () => void;      // 「すれ違った人」
  checkins?: () => void;        // 「図鑑（チェックイン）」
  municipalities?: () => void;  // 「市区町村」
};
```

各カードを `handler && !isLoading` のときだけ `<Pressable accessibilityRole="button">`、それ以外は従来の `<View>` でレンダリングする小コンポーネント `SummaryStatCard` に抽出。判定ロジックは pure 関数として export（テスト用）:

```ts
export function isStatCardInteractive(
  handler: (() => void) | undefined,
  isLoading: boolean,
): boolean;
```

`components/map/map-authenticated-screen.tsx`（LazyWebTrailMap 呼び出し側）で `onStatsPress` を渡す。遷移は `lib/navigation/app-routes.ts` の既存ヘルパーを使う（**司令塔裏取り: ホームタブは `navigate.toHome()`、図鑑は `navigate.toZukanTab()`**）。`app/u/[slug].tsx` は**変更しない**（渡さない＝非対話）。

**A-2. 図鑑タブ内スクロール — `components/zukan/zukan-authenticated-screen.tsx` / `zukan-complete-header.tsx`**

```ts
export type ZukanSection = "visitedPrefectures" | "encounteredPrefectures" | "people";

// zukan-authenticated-screen 内
const sectionYRef = useRef<Partial<Record<ZukanSection, number>>>({});
const scrollToSection = (section: ZukanSection) => void; // 未収集なら y=0 へ
```

`zukan-complete-header.tsx` に `onPressSection?: (s: ZukanSection) => void` prop を追加し、`navigate.toZukanTab()` の4呼び出しを置換。`navigate.toMapTab()` の2箇所は不変。セクション見出し View に `onLayout={(e) => { sectionYRef.current[section] = e.nativeEvent.layout.y; }}`（地図を包む View は測らない）。

**A-3. `components/post/envelope-rail.tsx` — 「ほかN通」展開**

```ts
const [expanded, setExpanded] = useState(false);

/** テスト用に export する pure 関数 */
export function visibleEnvelopes<T>(items: T[], expanded: boolean): { shown: T[]; hiddenCount: number };
```

moreCard を `<Pressable accessibilityLabel={`残り${hiddenCount}通を表示`}>` にし、onPress で `setExpanded(true)`。

**A-4. `app/u/[slug].tsx` — handle 行の対話化（③④）**

```ts
// 追加 state
const [xLinkFailed, setXLinkFailed] = useState(false);

// handle Text を Pressable 化
const handleOpenX = async () => {
  const ok = await openTwitterProfile(trailQuery.data.username!);
  setXLinkFailed(!ok);
};
```

`openTwitterProfile` は `lib/navigation/external-links.ts:130` の既存関数（ホワイトリスト済・変更不要）。失敗メッセージ Text は `color.textMuted` 12px、handle 行直下。encounter-open-modal.tsx（相手側リンク）は**変更しない**（実装済み確認のみ）。

### Phase B

**B-1. サーバー: `modules/encounter/db/queries.ts` に追加**

```ts
/** 未開封サマリ。getMyEncounters と同じブロック/停止ユーザー除外条件を適用する。 */
export async function getUnopenedEncounterSummary(
  db: Db,
  userId: number,
): Promise<{ count: number; latestId: number | null }>;
```

**司令塔裏取り**: 開封カラムは [drizzle/schema/encounter.ts:171,173](../drizzle/schema/encounter.ts) の `openedByA` / `openedByB`（`timestamp`、NULL=未開封）。自分が userA 側か userB 側かで見るカラムが変わる点に注意。1クエリ、`count(*)` + `max(id)`。

**B-2. サーバー: `modules/encounter/api/presence.ts` — pulse 相乗り**

```ts
const NOTIFY_SUMMARY_MIN_GAP_MS = 10 * 60 * 1000;
const recentNotifySummaryAtByUserId = new Map<number, number>();

/** canAcceptPulse と同型の間引き。export してテスト可能にする */
export function shouldComputeUnopenedSummary(userId: number, now?: number): boolean;
```

pulse の成功応答を `{ ...既存, unopened: { count, latestId } | null }` に拡張。サマリクエリの失敗は catch して `unopened: null`（pulse 本来の責務を巻き込まない）。**30秒ガード（canAcceptPulse）より後段**に置く。

**B-3. クライアント: 新規 `lib/encounter-notice.ts`**

```ts
export type UnopenedSummary = { count: number; latestId: number };

export function publishUnopenedSummary(s: UnopenedSummary): void;
export function subscribeUnopenedSummary(fn: (s: UnopenedSummary) => void): () => void;

export async function readNoticeEnabled(): Promise<boolean>;        // 既定 true
export async function writeNoticeEnabled(v: boolean): Promise<void>;

/**
 * 通知すべきなら summary を返し lastNotifiedId を latestId へ更新する。
 * enabled=false / count===0 / latestId が前回以下 なら null。
 */
export async function consumeNotifiableSummary(
  s: UnopenedSummary,
): Promise<UnopenedSummary | null>;
```

AsyncStorage キー: `surechigai.encounterNotice.enabled.v1` / `surechigai.encounterNotice.lastNotifiedId.v1`。

**B-4. クライアント: `hooks/use-live-presence.ts` の `sendPulse`**

`pulseMutateAsync` の戻り値に `unopened` が含まれていれば `publishUnopenedSummary(result.unopened)` を呼ぶだけ（1行+import）。**setInterval・watch・依存配列には一切触れない**（429無限ループの前科箇所。コメント 138-143 行の制約を厳守）。

**B-5. クライアント: 新規 `components/post/encounter-arrival-toast.tsx`**

`subscribeUnopenedSummary` を購読し、`consumeNotifiableSummary` が非 null を返したら既存 Toast atom（`components/atoms/toast.tsx`）で表示。message: `新しいすれちがいが${count}通届いています`、action: `{ label: "見る", onPress: () => navigate.toHome() }`。`app/(tabs)/_layout.tsx` にマウント。

> ⚠️ **司令塔追記の地雷**: `ToastProvider` は `ClerkRootProvider` の内側にしか無い。外側で `useToast` を呼ぶと「useToast must be used within a ToastProvider」で**画面全体が落ちる**（[photo-import-screen.tsx:154-156](../components/photo-import/photo-import-screen.tsx) に実障害の記録）。マウント位置は必ず階層を目視確認すること。tsc は通ってしまう。

**B-6. マイページ: 「すれちがいのお知らせ」Switch**

`components/mypage/` の既存設定セクションに1行追加。`readNoticeEnabled`/`writeNoticeEnabled` に直結。サーバー同期なし。

### Phase C

**C-1. `lib/share.ts` — 文面共通化とコピー**

```ts
/** shareMyLocation の本文組み立てを抽出（X/Threads/Instagramコピーで共通） */
export function buildMyLocationShareText(areaLabel?: string): {
  text: string;
  hashtags: string[];
};

/** Instagram 手貼り用: 本文+URL+ハッシュタグをクリップボードへ。成功で true */
export async function copyShareTextForInstagram(
  shareUrl: string,
  areaLabel?: string,
): Promise<boolean>;
```

実装は `expo-clipboard` の `setStringAsync`（**司令塔裏取り: `expo-clipboard@^8.0.8` は [package.json:91](../package.json) に導入済み**）。`shareMyLocation` は `buildMyLocationShareText` を使うようリファクタ（挙動不変）。

**C-2. `components/checkin/checkin-success-panel.tsx`**

props に `onCopyInstagram: () => void` を追加。Threads ボタンの下にテキストリンク風 Pressable「Instagram用に文面をコピー」（`threadsButton` より更に控えめ: 枠線なし・textMuted 13px。主従は X > Threads > Instagram）。`isSharing` 中は disabled。呼び出し側 `checkin-authenticated-screen.tsx` でコピー実行+トースト表示。

**C-3. 新規 `lib/weather/jma-area-codes.ts`**

```ts
/** 都道府県名 → 気象庁 office コード（例: "東京都" → "130000"）。未知は null */
export function jmaOfficeCodeForPrefecture(prefecture: string): string | null;
```

47件の静的表。北海道は札幌管区（016000）、沖縄は本島地方（471000）を代表値とする（county 単位の細分は今回やらない。Further Notes 参照）。既存の [constants/prefectures.ts](../constants/prefectures.ts) に47都道府県名の定数があるので、キーはそれに揃える。

**C-4. 新規 `lib/weather/jma-forecast.ts`（サーバー/テスト共用の pure ロジック）**

```ts
export type PrefWeather = {
  todayLabel: string;          // 例「晴れ時々くもり」
  todayWeatherCode: string;    // 気象庁天気コード（そのまま保持）
  tempMaxC: number | null;
  tempMinC: number | null;
};

/** JMA forecast JSON から今日の天気を抽出。形が想定外なら null（fail-silent） */
export function parseJmaForecast(json: unknown): PrefWeather | null;

/** タイムアウト2500ms。失敗はすべて null */
export async function fetchPrefWeather(
  officeCode: string,
  fetchImpl?: typeof fetch,
): Promise<PrefWeather | null>;
```

**C-5. 新規 `api/weather.ts`（Vercel Function）**

- `GET /api/weather?pref=<都道府県名>`
- 応答: `200 { ok: true, weather: PrefWeather }` / `200 { ok: false }`（404/500 を返さない — クライアントの分岐を1つにする）
- ヘッダ: `Cache-Control: public, s-maxage=1800, stale-while-revalidate=3600`
- **未解決 Promise を残さない**（OGPウォームの実障害と同型の罠）

**C-6. 新規 `hooks/use-pref-weather.ts` + FootprintSheet 1行**

```ts
export function usePrefWeather(prefecture: string | null | undefined): {
  weather: PrefWeather | null;   // 失敗・未取得・pref なしはすべて null
  isLoading: boolean;
};
```

FootprintSheet（**司令塔裏取り: [components/map/footprint-sheet.tsx:42](../components/map/footprint-sheet.tsx) に実在**）に `weather` 非 null のときだけ meta 行を1行追加: `きょうの{prefecture}: {todayLabel} {tempMaxC}°/{tempMinC}°`（textMuted・12px・monospace不使用）。API 呼び出しはシート表示時のみ。ネイティブでは API のベースURLを既存の API base 解決に合わせる（相対パス直書きしない）。

---

## 5. Testing Decisions

流儀: vitest / `__tests__/*.test.ts`。**grep ベースのテスト禁止・戻り値判定必須**（「許可リストから外しても緑」の前科・地図5章）。コンポーネントレンダリングのテスト基盤は無いので、判定ロジックを pure 関数に抽出してユニットで守り、画面は既存の実地系（`scripts/qa/responsive-audit.mjs`・monkey テスト・reality-checker）で確認する2層構え。

### 新規テストファイルとケース名

**`__tests__/presence-unopened-contract.test.ts`**（Phase B・サーバー）
- `shouldComputeUnopenedSummary: 同一ユーザーの2回目はギャップ未満なら false`
- `shouldComputeUnopenedSummary: ギャップ経過後は再び true`
- `pulse応答: サマリ計算スキップ時は unopened が null（フィールド自体は存在する）`
- `pulse応答: サマリクエリが throw しても pulse は ok を返す（fail-silent）`

**`__tests__/encounter-notice.test.ts`**（Phase B・クライアント、AsyncStorage はモック）
- `consumeNotifiableSummary: latestId が前回通知より大きいときだけ summary を返す`
- `consumeNotifiableSummary: 同じ latestId の2回目は null（60秒ごとに鳴らない）`
- `consumeNotifiableSummary: count が 0 なら latestId が進んでいても null`
- `consumeNotifiableSummary: enabled=false なら常に null、かつ lastNotifiedId を進めない`
- `readNoticeEnabled: 未保存時の既定は true`

**`__tests__/envelope-rail-expand.test.ts`**（Phase A）
- `visibleEnvelopes: 6件で expanded=false なら shown 5件 / hiddenCount 1`
- `visibleEnvelopes: expanded=true なら全件 / hiddenCount 0`
- `visibleEnvelopes: 5件以下なら expanded に関わらず hiddenCount 0`

**`__tests__/web-trail-map-stats-press.test.ts`**（Phase A）
- `isStatCardInteractive: ハンドラ未指定なら false（公開ページは非対話）`
- `isStatCardInteractive: isLoading 中はハンドラがあっても false`
- `isStatCardInteractive: ハンドラあり・ロード済みで true`

**`__tests__/landing-x-profile-link.test.ts`**（Phase A）
- `openTwitterProfile が生成する URL はホワイトリスト検証を通過する（戻り値で判定）`
- `ホワイトリストに無いドメインの外部URLは openExternalUrl が false を返す（壊して落ちる確認）`

**`__tests__/instagram-copy-text.test.ts`**（Phase C）
- `buildMyLocationShareText: 地名ありの本文に地名と主役コピーが入る`
- `buildMyLocationShareText: shareMyLocation の既存文面と同一（共通化の回帰）`
- `copyShareTextForInstagram: コピー文字列に本文と共有URLの両方が入る`（clipboard モック）
- `copyShareTextForInstagram: clipboard が throw したら false`

**`__tests__/jma-area-codes.test.ts`**（Phase C）
- `47都道府県すべてで office コードが引ける`
- `コードはすべて6桁数字`
- `未知の文字列・空文字は null`

**`__tests__/jma-forecast-parse.test.ts`**（Phase C）
- `実サンプルJSONから今日の天気ラベルと最高/最低気温を取り出せる`（フィクスチャ同梱）
- `形が想定外のJSONは null（fail-silent）`
- `fetchPrefWeather: fetch reject で null`
- `fetchPrefWeather: タイムアウトで null`

### 実地（自動テストで守れない層）

- Phase A 完了時: `pnpm check` 0エラー → デプロイ → **reality-checker に委任**して (a) `/u/[slug]` の統計カードが押せない・見た目回帰なし (b) 自分の地図タブでカード遷移 (c) 図鑑4カードのスクロール (d) handle タップでX遷移、を実ブラウザで判定。
- Phase B: ゲストではなく**認証済み実測**（メモリ [[surechigai-e2e-auth-x-oauth-only]] の X OAuth auth-state）で、2アカウント間チェックイン→pulse→バナー表示を確認。「テストが緑」を完了根拠にしない。
- Phase C: FootprintSheet の天気行は `x-vercel-cache` ヘッダで CDN キャッシュの HIT を確認（OGPウォームで確立した一撃判定・地図4章）。

---

## 6. Out of Scope（実装者はここを広げないこと）

- **⑥ ライブカメラ全体**（データ源調査が完了するまで着手禁止。ホワイトリスト追加もしない）
- **バックグラウンド位置・OSローカル/プッシュ通知・通知権限の要求**（ユーザー確定事項+審査実害。`lib/push-notifications.ts` デッドコードの復活も削除も行わない）
- **DBスキーマ変更一切**（`userSettings` へのカラム追加を含む。マイグレーション4罠を今回踏まない）
- **通知の静音時間帯・複数端末同期・OFFユーザー向けの新規ポーリング**
- **記録時点（過去）の天気・OGP画像への天気合成・市区町村粒度の天気**
- **Instagram の画像自動生成・Stories 連携・Web Share API 対応**
- **`openTwitterDM` の利用開始または削除**（DM禁止方針。デッドコードのまま触らない）
- **封筒の全件一覧ルートの新設**（「ほかN通」はその場展開で完結）
- **`use-live-presence.ts` の間隔・精度・依存配列の変更**（監査P1-5で仕様維持と確定済みの製品判断）
- **CSP（`frame-src`/`connect-src`）と `external-links.ts` ホワイトリストの変更**（今回の設計はゼロ変更で成立させてある。追加したくなったら設計が間違っている）
- **satori（api/og.tsx）への要素追加**

---

## 7. Further Notes（実装時の地雷）

1. **`pulseMutation` オブジェクトを依存配列に入れるな**。B-4 は `mutateAsync` 戻り値の後処理1行に留める。過去に 429×1000req/数秒の実障害（use-live-presence.ts:138-143）。
2. **Vercel serverless の in-memory Map はインスタンス毎**。`recentNotifySummaryAtByUserId` の間引きは worst case で pulse 毎（60秒毎）にクエリが走る。`getUnopenedEncounterSummary` は必ず 1クエリ・インデックス済みカラムのみで書くこと。
3. **api/weather.ts で未解決 Promise を残すな**。Vercel Functions は未解決 Promise があると応答がその完了まで詰まる。
4. **図鑑スクロールの onLayout は見出し View で測る**。地図を包む View を測ると自己参照で縮む（日本地図レスポンシブの前科）。
5. **現在タブを X に差し替える fallback を書くな**（lib/share.ts:174-179）。`openExternalUrl` の false は必ず UI で拾う（無言 false 禁止）。
6. **デプロイ確認は version.json 一致だけで終わらせない**。反映されない時は `CDN_CACHE_EPOCH` +1（CLAUDE.md ディレクティブ4）。
7. **presence.pulse の型拡張はクライアント3箇所が依存**。フィールド追加のみ・既存フィールドの型変更禁止。`pnpm check` 0エラー必須。
8. 天気行の文言に**モノスペースを使わない**（DESIGN.md: monospace は座標・セル・デバッグ系データ専用）。
9. Phase A/B/C は**フェーズ毎に commit→push→デプロイ確認**まで完了させる（ディレクティブ4）。並行セッション時は `git fetch` + `worktree list` を先に（[[surechigai-parallel-sessions-caution]]）。
10. **★司令塔追記: `useToast` は `ClerkRootProvider` の内側でのみ呼べる**（[photo-import-screen.tsx:154](../components/photo-import/photo-import-screen.tsx)）。B-5 のマウント位置は階層を目視確認すること。

---

## 未解決の質問

1. **⑥ライブカメラのデータ源**: 国交省道路・河川カメラ等の商用利用可否・レート制限・ライセンス（P2着手の前提条件）。
2. **北海道・沖縄等の JMA office コード細分**: 代表値（札幌管区/沖縄本島）で全道・全県を表示することの許容可否。「函館の足あとに札幌の天気」が出るケースがある。**ユーザー判断を仰ぐ**。
3. **気象庁JSONの提供継続性**: 非公式・無保証。fail-silent 設計で被害はゼロだが、恒久停止した場合の乗り換えは発生時に再判断。
4. **P0-2 の実測**: 図鑑の自己遷移が Expo Router で完全 no-op か（副作用の有無）。本仕様はどちらでもスクロール置換で解決するが、実測ログを1度残すこと。
5. ~~通知バナーの「見る」の遷移先ヘルパー名~~ → **司令塔裏取りで解決: `navigate.toHome()`**（[app-routes.ts:146](../lib/navigation/app-routes.ts)）

## 仕様に根拠がない断定（assumption list）

1. ~~encounters の開封カラム名~~ → **司令塔裏取りで解決: `openedByA`/`openedByB`（timestamp・NULL=未開封）**
2. ~~Toast atom がアクション付き表示のグローバル文脈を持つ~~ → **司令塔裏取りで解決: `ToastProvider`/`useToast`/`action` すべて実在。ただし Provider は ClerkRootProvider の内側限定（Further Notes 10）**
3. **Web の AsyncStorage は localStorage バックエンドで複数タブ間共有される**（未検証。被害は「複数タブで各1回鳴る」に留まる）
4. **ネイティブから `/api/weather` を叩く API ベースURL の解決手段が既存にある**（未検証。tRPC の解決手段を流用する前提）
5. **JMA forecast JSON のパース形**は出典記事ベース。実レスポンスのフィクスチャ採取は実装時に行う。`parseJmaForecast` が null を返す設計なので、形が違っても被害は「行が出ない」のみ
6. ~~`expo-clipboard` が審査中ビルドに含まれる~~ → **司令塔裏取りで解決: [package.json:91](../package.json) `^8.0.8` 実在**
