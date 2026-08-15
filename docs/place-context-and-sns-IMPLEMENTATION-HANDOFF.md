# 実装ハンドオフ: 「その場の情報」「SNS往復」「すれちがい通知」

> **この1枚だけで着手できる粒度で書いてある。** 迷ったら仕様書の該当章を見る。
> 設計 = Fable / 地図・裏取り = 司令塔 / 2026-08-15
> 仕様: [place-context-and-sns-SPEC.md](place-context-and-sns-SPEC.md) ／ 地図: [place-context-and-sns-MAP.md](place-context-and-sns-MAP.md)

## 最初にやること（例外なし）

```bash
git fetch origin && git log HEAD..origin/main --oneline && git worktree list
```

並行セッションで成果物が孤立した事故が2回ある（[[surechigai-parallel-sessions-caution]]）。

---

## このタスクの背景（1分で把握する）

ユーザーから7件の依頼が出た。設計の結論は **「新しいデータ取得を一切増やさず、既に流れているデータに相乗りする」**。

- **位置取得の追加: ゼロ**（ユーザーの明示要求「電池を消耗しない形で」）
- **OS権限の追加: ゼロ**（Play で権限申告動画を要求された実害があるため）
- **DBカラムの追加: ゼロ**（マイグレーション4罠を踏まない）
- **CSP変更: ゼロ**
- 審査中の iOS 504 / Play 589 には**影響しない**（次ビルドに自然に乗る）

---

## スコープ（Phase A のみが今回の MVP）

| Phase | 内容 | 今回やるか |
|---|---|---|
| **A** | ②押せないUI 3群 + ③着地ページのXリンク | **やる** |
| B | ①すれちがい通知（pulse 相乗り） | A の検証後 |
| C | ⑤Instagramコピー + ⑦天気 | B の後 |
| P2 | ⑥ライブカメラ / OGPへの天気 / OS通知 | **やらない** |

Phase A から始める理由: コード最小・データ追加ゼロ・「UIが嘘をついている」のはアプリ信頼の土台だから。

---

## 着手手順

```bash
git checkout -b feat/place-context-phase-a
```

TDD で進める。**pure 関数を先に切り出してテストを書き、それから画面を繋ぐ。** このリポジトリにはコンポーネントレンダリングのテスト基盤が無いため、判定ロジックを関数に逃がさないとテストで守れない。

---

## 実装ステップ（Phase A）

### A-1. 地図タブの統計カード3枚を押せるようにする

**対象**: [components/organisms/web-trail-map.tsx:172-191](../components/organisms/web-trail-map.tsx)

現状3枚とも素の `<View>`。仕様 §4 A-1 のとおり `onStatsPress` prop を足し、**ハンドラが渡されたときだけ Pressable になる** opt-in 方式にする。

> ⚠️ **この部品は `/u/[slug]`（他人の公開ページ）でも使われている**（[app/u/[slug].tsx:168](../app/u/[slug].tsx)）。他人のページで自分の図鑑へ飛ばすと文脈が壊れるので、**着地ページ側はハンドラを渡さない**＝非対話のまま。

先に `isStatCardInteractive()` を export して `__tests__/web-trail-map-stats-press.test.ts` を書く。遷移先は `navigate.toHome()` / `navigate.toZukanTab()`（裏取り済・[app-routes.ts:146,171](../lib/navigation/app-routes.ts)）。

### A-2. 図鑑タブの自己遷移4箇所をスクロールに変える

**対象**: [components/zukan/zukan-authenticated-screen.tsx:231,244](../components/zukan/zukan-authenticated-screen.tsx) / [components/zukan/zukan-complete-header.tsx:29,53](../components/zukan/zukan-complete-header.tsx)

今いる図鑑タブで `navigate.toZukanTab()` を呼んでいる＝押しても何も起きない。仕様 §4 A-2 のセクションスクロールに置換。

> ⚠️ `onLayout` は**セクション見出しの View で測る**。地図を包む View を測ると自己参照で縮んで戻らなくなる（[[surechigai-japan-map-responsive-landmine]]）。
> ⚠️ `navigate.toMapTab()` を呼んでいる2箇所は**正しく動いているので触らない**。

### A-3. 「ほかN通」を押せるようにする

**対象**: [components/post/envelope-rail.tsx:82](../components/post/envelope-rail.tsx)

`visibleEnvelopes()` を pure 関数として切り出し、`__tests__/envelope-rail-expand.test.ts` を先に書く。押すとその場で全件展開（新ルートは作らない）。

### A-4. 着地ページに X へ戻る導線を足す

**対象**: [app/u/[slug].tsx](../app/u/[slug].tsx)

`@handle` テキストを Pressable にして `openTwitterProfile(username)` を呼ぶ。**新しい UI 要素は足さない**（既存テキストの対話化のみ。着地ページの常設要素を増やさないのが設計原則）。

> ⚠️ **`openExternalUrl` の false を無言で捨てない**。押しても無反応になる前科がある（[[surechigai-share-dl-cta-2026-08-10]]）。失敗時は handle 行の直下にメッセージを出す。
> ⚠️ **現在タブを X に差し替える fallback を書かない**（[lib/share.ts:174-179](../lib/share.ts) の 2026-08-04 実障害）。

`x.com` / `twitter.com` はホワイトリスト済みなので [external-links.ts](../lib/navigation/external-links.ts) は**変更不要**。変更したくなったら設計が間違っている。

---

## 機械的な完了判定

```bash
pnpm check
```
→ エラー0（`tsc --noEmit` + ESM import 検査 + Hermes 危険 import 検査）

```bash
npx vitest run
```
→ 全件通過（現在 581件 + 新規追加分）

**テストが本物か必ず確かめる。** 新規テストは対象ロジックを一時的に壊して**赤くなることを確認してから**復元する。このリポジトリには「grep で書いたテストが、許可リストから外しても緑のままだった」前科がある（[[surechigai-share-dl-cta-2026-08-10]]）。戻り値で判定すること。

デプロイ確認:
```bash
curl -s https://surechigai.kimito.link/version.json
```
→ `commitSha` がローカル HEAD と一致。反映されない時は `theme/tokens/index.ts` の `CDN_CACHE_EPOCH` を +1（CLAUDE.md ディレクティブ4）。

**最後に reality-checker に検証を委任する。自己採点しない。** 確認させる項目:
1. `/u/[slug]` の統計カードが**押せない**こと・見た目の回帰が無いこと
2. 自分の地図タブでカード3枚が遷移すること
3. 図鑑タブの4カードがスクロールすること
4. `@handle` タップで X が開くこと

---

## 地雷（踏むと分かりにくい形で壊れる）

1. **`web-trail-map.tsx` は2画面で共有されている**。`/u/[slug]` を非対話のまま保つのが Phase A の最重要制約。
2. **`useToast` は `ClerkRootProvider` の内側でしか呼べない**。外で呼ぶと画面全体がクラッシュする（[photo-import-screen.tsx:154](../components/photo-import/photo-import-screen.tsx)）。**tsc は通る。** Phase B で効いてくる。
3. **`use-live-presence.ts` の依存配列・間隔・精度に触らない**。429×1000req/数秒の実障害の現場（同ファイル 138-143 のコメント）。Phase B では戻り値の後処理1行だけ足す。
4. **`app/event/` は存在しない**のに [host-events-summary.tsx:73](../components/dashboard/host-events-summary.tsx) が `toEventDetail` を呼んでいる（押すと not-found に落ちる）。**Phase A のスコープ外**。仕様判断が要るので勝手に直さない。
5. **`pnpm db:push` は使えない**。今回 DB 変更は無いが、思いつきでカラムを足さないこと。

---

## Phase B・C に進むときの入口

仕様書の §4 Phase B / Phase C をそのまま読む。特に:

- **B**: `presence.pulse` の応答に `unopened` を足す。**フィールド追加のみ**（既存フィールドの型を変えるとクライアント3箇所が壊れる）
- **C**: 天気は `/api/weather` 経由。**ブラウザから気象庁を直接叩くと CSP で遮断される**（[vercel.json:12](../vercel.json) に気象庁ドメインが無い）

---

## ユーザーに確認が要る未解決事項

1. **北海道・沖縄の天気の粒度**（Phase C）。気象庁の予報区は都道府県より細かく、代表値を使うと「函館の足あとに札幌の天気」が出る。許容するか、細分表を作るか。
2. **ライブカメラのデータ源**（P2）。国交省カメラ等の商用可否・レート制限・ライセンスが未調査。調査してから着手する。
3. **`app/event/[id]` を作るか、`toEventDetail` の呼び出しを消すか**（地雷4）。

---

## 実装は指示があるまで着手しない

次のチャットでこのハンドオフを読ませ、ブランチを切って Phase A から実装する。
