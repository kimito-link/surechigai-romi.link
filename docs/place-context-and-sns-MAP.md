# 地図(wayfinder): 「その場の情報」と「SNS往復」と「通知」

> 作成: 2026-08-15 / 地図・裏取り = 司令塔(Claude Opus 5) / コード変更なし
> 方式: [WAYFINDER-TO-SPEC-HOWTO.md](../../WAYFINDER-TO-SPEC-HOWTO.md) 手順1
> この地図を Fable に渡して `place-context-and-sns-SPEC.md` を設計させる。

## お題（ユーザーからの7件）

| # | 依頼 | 種別 |
|---|---|---|
| ① | 近づいたら通知。**ただし電池を消耗しない形で** | 機能追加 |
| ② | 押せそうなのに押せない箇所を直す | バグ |
| ③ | X アプリに戻る導線がない | 機能追加 |
| ④ | X と行き来する仕組みがない（本人・交流したい人の両方） | 機能追加 |
| ⑤ | Instagram / Threads に貼る導線 | 機能追加 |
| ⑥ | 場所のライブカメラがあるものは入れる | 機能追加 |
| ⑦ | 位置ごとの天気 | 機能追加 |

ユーザー確定事項（2026-08-15 の対話で明示的に回答済み）:
- **通知の遅延は「数十分〜数時間後でよい」**
- **通知の範囲は「アプリを開いている間だけ」**（バックグラウンドは今回やらない）
- **7件まとめて設計から**

---

## 1. 入口になる画面・コマンド・API

| 入口 | ファイル | 関わる依頼 |
|---|---|---|
| チェックイン画面（足あと保存＋シェア） | [components/checkin/checkin-authenticated-screen.tsx](../components/checkin/checkin-authenticated-screen.tsx) | ③④⑤⑦ |
| チェックイン成功パネル（X/Threadsボタン） | [components/checkin/checkin-success-panel.tsx:130](../components/checkin/checkin-success-panel.tsx) | ⑤ |
| 地図タブ（統計カード3枚・足あと一覧） | [components/organisms/web-trail-map.tsx](../components/organisms/web-trail-map.tsx) | ②⑥⑦ |
| 公開着地ページ `/u/[slug]`（X から来た人が最初に見る） | [app/u/[slug].tsx](../app/u/[slug].tsx) / [api/u/[slug].ts](../api/u/[slug].ts) | ②③④⑥⑦ |
| レーダー（ライブ在席・60秒 pulse） | [hooks/use-live-presence.ts](../hooks/use-live-presence.ts) | ① |
| 封筒レール（すれ違い通知の受け皿） | [components/post/envelope-rail.tsx](../components/post/envelope-rail.tsx) | ①② |

---

## 2. 関係する主要ファイルと責務

| ファイル | 責務 |
|---|---|
| [modules/encounter/api/encounter.ts:77](../modules/encounter/api/encounter.ts) | `checkIn` mutation。**encounters を作る唯一の場所**（`:250` `insertEncountersIfNew`） |
| [modules/encounter/api/presence.ts:90](../modules/encounter/api/presence.ts) | `presence.pulse`。60秒ごとに位置を更新するが **encounters は作らない**（`:121`） |
| [hooks/use-live-presence.ts:181](../hooks/use-live-presence.ts) | 位置の常駐監視。`Accuracy.Balanced` / 60秒間隔 / 30m移動（`:222-224`） |
| [lib/event-reminders.ts](../lib/event-reminders.ts) | **実働しているローカル通知**。権限要求・Web/Native分岐・重複抑止まで完成 |
| [lib/push-notifications.ts](../lib/push-notifications.ts) | **デッドコード**。import 0件。動員ちゃれんじ由来の残骸 |
| [lib/share.ts](../lib/share.ts) | X / Threads の Web Intent。`ShareTarget = "x" | "threads"`（`:303`） |
| [lib/navigation/external-links.ts:13](../lib/navigation/external-links.ts) | 外部リンクのホワイトリスト。**ここに無いドメインは無言で false** |
| [lib/ogp/share-meta.ts](../lib/ogp/share-meta.ts) | OGP メタと共有URLの組み立て |
| [api/og.tsx](../api/og.tsx) | OGP 画像生成（1200x630）。地図タイル合成 |
| [api/sweep.ts](../api/sweep.ts) | **マッチングしていない**。DB成長スナップショットのみ（全48行） |

---

## 3. データが流れる順番

### ① 通知（現状は存在しない。乗せる先の経路）

```
[60秒ごと] use-live-presence.ts:208 setInterval
  → :156 presence.pulse を呼ぶ
    → presence.ts:33 canAcceptPulse（30秒ガード）
    → presence.ts:121 userSettings.livePresence* を UPDATE するだけ
    → ★ここで encounters は作られない ＝ 通知の種が無い
```

一方、encounters が生まれるのは手動チェックインのときだけ:

```
[ユーザーがボタンを押す] checkin-authenticated-screen.tsx:319
  → encounter.checkIn（encounter.ts:77）
    → :195 getNearCandidates（kRing(h3R7,2) 約4.5km × 直近6時間）
    → :196 getTimeshiftCandidates（visitedAreas.h3R7 一致 × 30日 × 直近48h稼働）
    → :227 過疎地ゲート（近距離0件かつ当日未マッチのときだけ kRing(h3R5,4)）
    → core/matching.ts:101 findMatches（latGrid/lngGrid の500m丸めで Haversine）
    → core/tiers.ts:40 judgeTier（≤500m→1 / ≤3km→2 / ≤10km→3 / ≤50km→4）
    → encounter.ts:250 insertEncountersIfNew
```

**帰結**: 「アプリを開いている間だけ通知」を実現するなら、pulse の応答に未読 encounter の有無を載せるのが最短。位置取得は1つも増えない。

### ② 押せないカード

```
map-authenticated-screen.tsx:120 → LazyWebTrailMap
app/u/[slug].tsx:168            → LazyWebTrailMap（同じ部品を公開ページでも使う）
  → web-trail-map.tsx:172-191  ★3枚とも素の <View>（onPress 無し）
```

### ③④ SNS の往復（出る側だけ実装済み）

```
[出る] checkin-success-panel.tsx:133 onShare("threads")
  → checkin-authenticated-screen.tsx:184 shareMyLocation(url, label, {target})
    → lib/share.ts:320 target で shareToThreads / shareToTwitter を選択
      → :137 https://www.threads.com/intent/post?...
      → :116 https://twitter.com/intent/tweet?...

[戻る] ★存在しない。/u/[slug] に X へ戻る導線が0件（grep で確認）
```

---

## 4. 既存の設計判断と、その根拠（壊してはいけない境界）

| 判断 | 根拠 | 効く依頼 |
|---|---|---|
| **バックグラウンド位置は MVP に入れない** | [docs/native-ios-app-DESIGN.md:200](native-ios-app-DESIGN.md) 「審査難度が段違い（Always許可の正当化）。フォアグラウンドチェックインで価値は成立している」 | ① |
| **cron・ジョブキュー・別リクエスト分割の導入禁止** | [docs/matching-tier-redesign-DESIGN.md:216](matching-tier-redesign-DESIGN.md) 制約3 | ① |
| **非同期二段階検索＋通知は不採用** | 同 `:205`「通知チャネル不在: プッシュ通知が未実装のため『後から見つかったら知らせる』のUXが成立しない」← **今回ここを解こうとしている** | ① |
| **FOREGROUND_SERVICE は要求しない** | [app.config.ts:57-60](../app.config.ts)。使わない権限の宣言は実害があった（下記） | ① |
| **使わない権限を宣言すると Play で詰まる** | [docs/HANDOFF-2026-08-12.md:89](HANDOFF-2026-08-12.md)。`expo-audio` の `FOREGROUND_SERVICE_MEDIA_PLAYBACK` で用途申告を要求され、**用途を示す動画の提出**まで求められた。依存ごと削除で解決 | ① |
| **ライブ在席のバッテリー負荷は監査 P1-5 で指摘済み・仕様維持と判断** | [hooks/use-live-presence.ts:94-101](../hooks/use-live-presence.ts)「変えるときはこの製品判断ごと見直すこと」 | ① |
| **事前測位ウォームは Native では実装しない（バッテリー配慮）** | [docs/checkin-redesign-SPEC.md:167](checkin-redesign-SPEC.md) | ① |
| **現在タブを X に差し替えてはいけない** | [lib/share.ts:143-144](../lib/share.ts)「アプリの画面を失うので最後の手段にもしない」。`:175` 2026-08-04 の実障害 | ③④ |
| **ホワイトリスト漏れは無言で false** | [lib/navigation/external-links.ts:34-36](../lib/navigation/external-links.ts)「ここに無いと openExternalUrl が無言で false を返し、ボタンを押しても何も起きない」 | ③④⑤⑥ |
| **正確な座標を保存し消さない／プライバシーは移動専用アカウントに委ねる** | [CLAUDE.md](../CLAUDE.md) 設計原則1 | ⑥⑦ |
| **DM禁止・交流はXに委譲** | [CLAUDE.md](../CLAUDE.md) 設計原則4 | ③④ |
| **OGP は v= で必ずキャッシュミスする → ウォームで先回り** | [lib/ogp/warm-og-image.ts:13](../lib/ogp/warm-og-image.ts)。2026-08-15 にネイティブ経路の欠落を修正（commit 536a1d508） | ⑦（OGPに天気を載せる場合） |

関連メモリ: [[surechigai-share-landing-uiux-spec]] / [[surechigai-app-audit-spec]] / [[surechigai-matching-tier-redesign-2026-07-23]] / [[surechigai-both-stores-submitted-2026-08-12]]

---

## 5. 変更すると壊れうる箇所

| 箇所 | リスク |
|---|---|
| `web-trail-map.tsx` の統計カード | **`/u/[slug]`（他人の公開ページ）でも同じ部品を使う**（`app/u/[slug].tsx:168`）。自分の図鑑へ飛ばすと他人のページで破綻する。閲覧者が本人かの出し分けが要る |
| `presence.pulse` の戻り値 | クライアント3箇所が依存。型を増やす分には安全だが、30秒ガード（`presence.ts:33`）と 429 の履歴（[[surechigai-clerk-token-storm]]）に注意 |
| `lib/share.ts` の `openWebShareUrl` | `popup.opener = null` を準備段階で切ると差し替え不能になる既知の罠（`:167`） |
| `external-links.ts` のホワイトリスト | 追加を忘れると無反応。**テストは「許可リストから外しても緑」だった前科あり**（[[surechigai-share-dl-cta-2026-08-10]]）→ 戻り値で判定するテストにすること |
| `api/og.tsx` に要素を足す | satori の要素数が増えると生成が遅くなる。`:47` で「主要8箇所に絞る（旧18箇所）」と削った経緯あり。現状 2.86秒でXのクローラ(~2秒)に既に負けている |
| `userSettings` へのカラム追加 | `pnpm db:push` は不可。マイグレーション手順に4つの罠あり（[[surechigai-place-note-and-premium-2026-07-31]]） |

---

## 6. 未確認の前提と、追加調査が必要な点

- **⑥ライブカメラのデータ源が未定**。全国の任意地点をカバーする公的APIは確認できていない。国交省の河川・道路カメラ、自治体、YouTubeライブ等の候補があるが、**商用可否・レート制限・ライセンスいずれも未調査**（推測: 地点カバレッジは全国均一にならない）
- **⑦天気の気象庁JSONは非公式・無保証**。`https://www.jma.go.jp/bosai/forecast/data/forecast/{area_code}.json` で取得可だが、公式WebAPIとして公開されておらず仕様変更・停止の可能性がある（[出典](https://api-zukan.com/blog/jma-weather-api)）。

### 【司令塔が追加調査で解決した事実（2026-08-15）】

**天気は完全に未実装**（確認済み）。`lib/ modules/ server/ api/ constants/` に「気象/weather/jma/forecast/予報区」のヒット0件。

**予報区コードの変換表はリポジトリに無い**（確認済み）。ただし [constants/prefectures.ts](../constants/prefectures.ts)（全120行）に47都道府県名と地域グループの定数が既にあり、`locations.prefecture` にも都道府県名が入るので、**47件の「都道府県名 → 予報区コード」対応表を新規に作れば紐付けは可能**。市区町村粒度の予報が要るなら対応表はさらに大きくなる。

**CSP がブラウザからの直接取得を遮断する**（[vercel.json:12](../vercel.json) で確認）。現状:
- `connect-src` に気象庁ドメインは**無い** → ブラウザから `jma.go.jp` を fetch すると遮断される
- `frame-src` は `'self'` + Clerk + Cloudflare のみ → **外部ライブカメラの iframe 埋め込みは現状不可**
- `img-src` は OSM/OpenFreeMap/twimg/clerk/unavatar のみ

→ **設計上の帰結**: 天気は `/api/` 配下のサーバー関数で中継すれば CSP を一切緩めずに実現できる（既存の `api/og.tsx` が外部 fetch している前例あり）。ライブカメラを埋め込みにすると CSP の `frame-src` を緩める必要があり、**外部リンクで開く方式なら CSP 変更が不要**。
- **Instagram はフィード投稿にクリッカブルなリンクを貼れない**（仕様）。Web からの投稿APIも実質使えないため、X/Threads と同じ「ワンタップで投稿画面」は**技術的に作れない**。画像+文言のコピーによる手貼りが現実解（推測: ユーザーはこの制約を知らない可能性が高い）
- **P0-2（図鑑タブ内の自己遷移が no-op）は実測未了**。`router.push` が同一タブで本当に何も起きないか、Expo Router の挙動確認が要る
- **`visit-screen-view.tsx:317-330` の3カード**が意図的に非対話か修正漏れか未確認（遷移先の当てが無いので「押せなくて正しい」可能性）
- **実DBに `notification_settings` テーブルが物理的に残っているか未確認**（アーカイブSQLにのみ存在、live migrations には無い）
- **EXPO_PUBLIC_PROJECT_ID が実際に設定されているか未確認**

---

## 7. 実装前に決める必要がある質問（Fable が答えるべき論点）

### 通知（①）
1. pulse の応答に載せるのは「未読 encounter 件数」か「新規発生フラグ」か。60秒ごとに鳴らないための抑止はどこで持つか（サーバー/クライアント/AsyncStorage）
2. **アプリ前景時のローカル通知は、そもそも通知として妥当か**。画面を見ているのにバナーを出す是非。アプリ内バナー（トースト）との使い分け
3. 通知ON/OFF・静音時間帯を `userSettings` に足すか、端末ローカル（AsyncStorage）で持つか。**DBカラム追加はマイグレーション4罠を踏む**ので、避けられるなら避けたい
4. `locationPausedUntil` が効いているとき通知も止めるべきか
5. レーダー（`livePresenceEnabled`）が OFF のユーザーに通知は出るか。OFF なら pulse 自体が飛ばない＝通知も来ない、で正しいか

### 押せないUI（②）
6. `/u/[slug]`（他人のページ）で統計カードを押したらどこへ行くべきか。そもそも押せなくすべきか
7. 図鑑タブ内の自己遷移4箇所は「セクションへスクロール」に変えるか、押せなくするか
8. 「ほかN通」の遷移先

### SNS往復（③④⑤）
9. **「X に戻る」の定義**。(a) 直前のXアプリへ戻る (b) 投稿者のXプロフィールを開く (c) この投稿のツイートへ戻る — どれか。技術的に (a) は `history.back()` でしか実現できず確実性が低い（推測）
10. 「交流したいユーザー」側の導線は、相手のXプロフィールへのリンクでよいか。**DM禁止方針**との整合（`openTwitterDM` は実装済みだが使われていない）
11. Instagram の制約をユーザーにどう説明し、何を提供するか（画像コピー/文言コピー/両方）
12. Threads は既に実装済みだが**チェックイン画面にしか無い**。マイページ・着地ページにも出すか

### 天気・ライブカメラ（⑥⑦）
13. 天気を「いつの」天気にするか。**足あとは過去の記録**なので、記録時点の天気か、その場所の現在の天気か
14. 天気の取得元。気象庁非公式JSON（無料・無保証）か、商用API（有料・安定）か。**落ちたら表示を消すだけ**の作りにするか
15. 天気をどこに出すか。着地ページのみ / 地図タブ / **OGP画像にも載せるか**（載せると生成が重くなる。既に2.86秒でXのクローラに負けている）
16. ライブカメラのデータ源と、カバーできない地点の扱い（無い場所のほうが多い前提の設計）
17. ライブカメラは外部サイトへのリンクか、埋め込みか。**埋め込みは CSP の `frame-src` を緩める必要**があり、現状 `'self'` + Clerk + Cloudflare のみ

### 横断
18. 7件の優先順位と、どれを MVP に入れるか。**審査中の iOS 504 / Play 589 に載らない**（次ビルド送り）ことを踏まえた出し方
19. 着地ページに天気・ライブカメラ・SNS導線を全部足すと情報過多になる。**「会いたい君がいる現在地」の主役を食わない**配置は

---

## セルフチェック

- [x] ファイル名の列挙で終わっていない（なぜそこを通るかを3章で追跡）
- [x] 既存仕様を守る理由（4章に根拠付きで集約）
- [x] ユーザー体験上の制約（電池・審査・情報過多を7章の質問に反映）
- [x] データ保存・互換性・失敗時の挙動（5章のマイグレーション罠・ホワイトリスト無言false）
- [x] 確認した事実と未確認の推測を分離（6章に「推測」「未確認」と明記）
- [x] 重要な判断に根拠（ファイル:行番号・docs・メモリスラッグ）
