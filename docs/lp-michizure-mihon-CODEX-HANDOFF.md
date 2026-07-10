# Codex実装ハンドオフ: LP増補「道連れと見本の巻」

> この1枚と設計正本 `docs/lp-michizure-mihon-DESIGN.md` だけで着手できる。
> 設計=Fable ／ 裏取り=司令塔(挿入位置の目印9種の実在を機械確認済み) ／ 2026-07-10

## 目的(1行)
reply-suggest.link との残差=「封筒(コア体験)の実物が無い・語り手が居ない・道行きに扉が無い」を、灯・逢の増補4部品+幻燈2巻で埋める。

## 読む順
1. このファイル
2. `docs/lp-michizure-mihon-DESIGN.md` の **C章(Phase別の具体機構)とF章(禁止事項)** — HTML/CSS/コピー実文はすべてC章にあり、**そのままコピーして使う**(旧仮名を変えない)
3. 対象: `public/lp/index.html`(インラインCSS同居) / `store-assets/lp-video-plan.json`

## スコープ = P1→P2→P3→P4a(→P4b任意)。1 Phase=1コミット
| Phase | 内容 | 対象 | 完了判定(DESIGN C章に機械チェックあり) |
|---|---|---|---|
| P1 | 宛て札×3+道連れの詞×3(面紋SVG) | index.htmlのみ | tb-ate=3, tsure=3, li=31不変, tsc 0, 375px横はみ出し0 |
| P2 | 封筒の見本(五の宿の封筒svg→CSS見本に置換) | index.htmlのみ | fuutou-mihon=HTML1, 旧svgパス消滅, 見立て明示行あり |
| P3 | 通行手形CTA×3+奥付 | index.htmlのみ | tb-tegata=3(全href=sign-in), okuzuke=1 |
| P4a | 幻燈junrei-v2(ゲスト録画・/u/公開の書を初収録) | plan.json+録画+index.html | v2ファイル存在, #tb-junrei内v1参照0, ?v=0 |
| P4b | 幻燈mamoru-v1(auth録画・守りの実画面)+結の宿・弐 | 同上 | gento li=5, 奥付「五巻」→「六巻」 |

## 着手手順
1. `git fetch && git log HEAD..origin/main --oneline` && `git worktree list`(並行セッション事故が過去2回)
2. ブランチ `feat/lp-michizure-mihon` を切る(push/デプロイ判断は監督側)
3. P1から順に: 実装→DESIGN記載の機械チェック→コミット
4. 検証の作法: 一発scrollToは不可(content-visibilityで座標が狂う)。リポ直下 `.tmp-mokuroku-verify.mjs` / `.tmp-hoshizora-verify.mjs` の settleTo(反復スクロール)方式を流用
5. li=31チェック: `.tmp-*`検証流儀 or scratchpadに `check-mokuroku` 相当を書く(品名集合の完全一致まで見る)

## ユーザー(監督)に依頼が必要なもの
- **P4a**: 録画に使う実在の `/u/<slug>`(運営者の公開頁推奨・軌跡が実在すること) → plan.json の `★実在slug★` を置換
- **P4b**: `.auth/auth-state.json`(Patchright経由X OAuth。手順=docs/handoff-lp-auth-video-2026-07-08.md+メモリ。保存先が親github/.authになる罠)
- P4bが待ちになったら P4a までで完結してよい(奥付は「五巻」のまま)

## 絶対に踏むな(F章の要約)
- section系の overflow は clip のみ(hidden=sticky全滅)
- 画像/動画に `?v=` 禁止。版はファイル名(-v2)。app.js無改変なら版上げ不要
- 目録のli(31品)・物語パート・願・叶カード本体・フィナーレ・Canvas群に触れない
- `.reveal`/`.gento` は静的DOM追加のみ可(動的挿入禁止)
- 禁句: マッチング/友達を探す/匿名/安全に/位置情報は保存されません
