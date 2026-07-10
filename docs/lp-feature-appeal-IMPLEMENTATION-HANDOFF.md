# 実装ハンドオフ: LP「全機能が伝わる」増強（目録→案内板昇格）

> この1枚だけで着手できる。設計正本: `docs/lp-feature-appeal-DESIGN.md`（設計=Fable/裏取り=司令塔/2026-07-10）。
> 実装は別モデル（このハンドオフを読んだ次チャット）が行う。push/デプロイ判断は監督側。

## 読む順
1. このファイル（5分）
2. `docs/lp-feature-appeal-DESIGN.md` の **C章（具体機構）とG章（地雷）**（10分）
3. 対象実体: `public/lp/index.html` の mokuroku セクション（`<section class="mokuroku`で検索）と願・叶（`class="negai"`）

## スコープ（MVP=第1コミットのみ。それ以外はやらない）
1. **目録六組化**: 既存 details **7部 → 6組**（残す/逢ふ/集ふ/巡る/報せる/守る）。31個の `<li>` は**移動のみ・文言不変**。割付は DESIGN C-1 の表が唯一の正（司令塔が実物と機械突合済み。品名表記は「便りの緒（を）」等、実物のまま）
2. **道具絵図**: `.mk-head` 直後に `#ezu`（DESIGN C-2 のHTML/CSS指針どおり。画像・sticky・Canvas禁止）
3. **絵↑リンク**: `mk-sumi` の「既出」span(18個)→ `<a data-mkjump>` 化。行き先id付与: `.ng-item`×5（#ng-ashiato/#ng-fuutou/#ng-junrei/#ng-toki/#ng-tayori）、`.tb-scene`の**先頭3つだけ**（#tb-utage/#tb-totsu/#tb-junrei。4つ目=総括幻燈には付けない）、`section.mokuroku` に id="mokuroku"
4. **ジャンプJS**: DESIGN C-5 の data-mkjump ハンドラを app.js に追加、**`app.js?v=31`→`?v=32`** に版上げ（index.html側）
5. 主役5品に `<span class="mk-omo">主役</span>`、summary新書式（組名+願ひ実文+品数）

**第2コミット以降（今回やらない）**: 願ひ札(.ng-fuzoku)×5、栞(.shiori)、巻・携チップ。

## 着手手順
1. `git fetch && git log HEAD..origin/main --oneline` で並行セッション確認（過去2回、成果物孤立事故あり）
2. ブランチ `feat/lp-mokuroku-annaiban` を切る
3. **先に検証スクリプトを書く**（TDD）: 改装前の品名31個の集合をスナップショット→改装後に (a)li=31 (b)品名集合一致 (c)data-mkjump全hrefのid実在、を突合する node スクリプト（scratchpadでよい）
4. 実装 → 検証green → `pnpm check`（tsc 0エラー） → タグバランス確認（li/details/section開閉）
5. ローカル確認は静的サーバ+Playwrightの**反復スクロール方式**（content-visibilityで座標が狂うため一発scrollToは不可。参考: リポ直下 `.tmp-hoshizora-verify.mjs` の settleTo）

## 機械的な完了判定（全部green必須）
- [ ] mokuroku内 `<li>` = 31、`<b>`品名集合が改装前と完全一致
- [ ] `data-mkjump` の全href（#mk-×6/#ng-×5/#tb-×3/#mokuroku）に対応idが存在
- [ ] `git diff --stat` が `public/lp/index.html` と `public/lp/app.js` のみ
- [ ] 新規画像0・画像への `?v=` クエリ0・`overflow:hidden` の新規追加0
- [ ] `pnpm check` 0エラー
- [ ] 375px幅で `document.documentElement.scrollWidth === clientWidth`
- [ ] 絵図の組を押す→該当details が open 状態で表示される（Playwrightでclick→openプロパティ確認）
- [ ] sticky回帰なし: 星景章のholderが張り付いたまま（.tmp-hoshizora-debug3.mjs 方式）

## 地雷（DESIGN G章の要約・破ると壊れる）
- `body{overflow-x:clip}` と各sticky演出の関係に触るな。新規CSSで overflow を書くなら clip（hidden禁止）
- 画像ファイルは一切触らない。JSは ?v=32 版上げを忘れない（忘れるとCDNで旧JSが配信され続ける）
- lp-defer(content-visibility) 章へのアンカージャンプは C-5 のJS（contentVisibility='visible'を先に）以外でやらない
- li の文言・品名を1文字も変えない（旧仮名の声・「三十一」の確定表記）
- 禁句: マッチング/友達を探す/匿名/安全に/位置情報は保存されません
- ads(広告)は目録に載せない（31を32にしない）

## 転記元の実在確認済みパス
- `public/lp/index.html`: mokuroku=`<section class="mokuroku lp-defer"`（details7・li31・mk-sumi18確認済み）／願・叶 `.ng-item`×5／`.tb-scene`×4（うち行き先は先頭3）／`.ai-feats` 実在
- `public/lp/app.js`: 現版 `?v=31`（index.html L1726付近 `<script src="app.js?v=31">`）
- 検証参考: `.tmp-hoshizora-verify.mjs`（settleTo反復スクロール）/ `.tmp-hoshizora-debug3.mjs`（sticky実測）
