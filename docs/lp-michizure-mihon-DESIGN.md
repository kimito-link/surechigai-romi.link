# 設計書: LP増補「道連れと見本の巻」— 機能が"濃く"伝わる次の一手

> 設計=Fable(claude-fable-5) ／ 裏取り=司令塔Opus ／ 2026-07-10 ／ 実装=Codex(別チャット)
> 対象: `public/lp/index.html`＋`store-assets/lp-video-plan.json`。app.js現版=`?v=33`(本増補ではJS改変なし＝版上げ不要)
> 前提の正: `docs/lp-feature-appeal-DESIGN.md`(目録=案内板・実装済み)。本書はその**次の一手**であり、既実装(絵図/願ひ札/栞/絵札見本/お品書き/全国の灯)には一切触れない。
> **司令塔の裏取り済み**: C章の挿入位置の目印文字列9種はすべて実物に1箇所づつ実在(2026-07-10機械確認)。録画プランJSONのスキーマ(goto/wait/scroll{px,durationMs})も既存エントリと一致。chara PNGは実測373KB(konta)で重量却下の根拠も正。

**中核の診断**: reply-suggestとの残差は「物語の量」ではない。**(i) コア体験(封筒が届く瞬間)の実物がLP上のどこにも見えない、(ii) 語り手が居ない(誰も道具を"使ってみせて"くれない)、(iii) 道行きの終はりに扉がない(読み終へても入口が遠い)** の三つである。よって新章は作らず、既存の灯・逢(道行き)に「宛て札・道連れの詞・実物見本・通行手形」の4部品を差し込み、幻燈を1巻更新+1巻増補する。

---

## A. ギャップ6点の裁定

| # | ギャップ(司令塔) | 裁定 | うちの世界観での等価物 |
|---|---|---|---|
| 1 | 機能ごとの使用場面の物語(会話劇+実例) | **一部採用** | 会話劇の直輸入は**却下**(俳文の没入を壊す)。等価物は①**道連れの詞**=三キャラが各道行きの結びに一言だけ"使ってみせる"合いの手 ②**実物見本**=封筒のCSS写し(P2)。1機能1画面の反復はうちでは宿場が既に担う |
| 2 | スクショの物量 | **採用(録画のみで)** | 新規画像は禁のまま、幻燈を増補: junrei-v2(公開の書 /u/… を追加)+mamoru-v1(守りの実画面・auth)。31機能全部のスクショは**却下**(保守コストと重量。幻燈=動く実画面の方が証拠能力が高い) |
| 3 | キャラクターの案内役 | **採用(紋+詞)** | コンタ/タヌ姉/りんくを**道連れ**(弥次喜多の文法)として起用。ただし顔PNGの再利用は**却下**(373〜508KB/枚。endroll到達前に読ませると重量制約に抵触)→ **inline SVGの面紋+名乗り**で代替 |
| 4 | 段階的な深さの明示 | **採用(宛て札)** | ビギナー/配信者/ファンのタブ分けは**却下**(世界観分断)。三道行きは既にペルソナ別なので、各道行き冒頭に手紙の**宛て名**1行を掲げて明示するだけでよい |
| 5 | 数値・透明性 | **大半却下・一点だけ採用** | テスト数/コミット数等の可変数値は前設計どおり**再却下**(陳腐化)。既にある正直数値(三十一/四十七/実の画面/ストア準備中)を endroll の**奥付**1ブロックに集約して"見える化"のみ採用 |
| 6 | 機能ごとのCTA | **採用(圧縮形)** | 全宿場CTAは**却下**(CTA公害)。各道行きの結びに**通行手形**(朱印「通」の木札CTA)を1枚づつ、計3枚 |

**Fableが追加した見落とし(第7・第8)**:
- **7. 封筒の不在**(採用→P2の核): 「すれ違へば封筒が届く」がこのアプリの一枚看板なのに、届いた封筒の中身(エリア名・距たり・スタンプ返し)がLPのどこにも具体物として存在しない。reply-suggestで言へば「返信例が一つも載ってゐないLP」に相当する最大の穴。
- **8. ファーストビューCTA**(非採用と明記): 序章は闇の扉であり続ける。栞+お品書きが既に代替してをり、FVにボタンを置くのは没入不可侵に反する。裁定として「置かない」を確定する。

## B. 統合設計 — どの章に何を足すか

すべて**灯・逢(`#tomoshibi`)と作品クレジット(`.endroll`)の内側**で完結する。物語パート(序〜結章)・願・叶・目録・巻・携・フィナーレには触れない。

```
灯・逢 各道行き(×3)の新しい形:
  [宛て札]  宛て――はじめて宴に参る君へ          ← P1(誰のための道行きか)
  [口上]    「逢ひたい人の宴がある。…」            ← 既存
  [宿場…]   一の宿〜五の宿                        ← 既存(場面二の五の宿のみP2で見本に改装)
  [結の宿]  幻燈=実の画面                          ← 既存(場面三はP4aでv2に更新)
  [道連れ]  紋+名乗り+一言(使ってみせる)           ← P1
  [手形]    朱印「通」この道行き、けふ試みる――𝕏で  ← P3
作品クレジット: Special Thanks の後に [奥付] 正直な静的数値4行 ← P3
第四場面(総括幻燈): 結の宿・弐として mamoru-v1 を増補 ← P4b
```

三道行きが reply-suggest の「困った場面→実例→解決→CTA」1セット構造と等価になる。形式は宛て名・口上・道中・写し絵・道連れの評・手形――**手紙と道中記の文法**であり、直輸入ではない。

---

## C. 具体機構(Phase分割・1 Phase=1コミット)

### P1: 宛て札+道連れの詞(index.htmlのみ)

**C-1a. 宛て札** — 各 `.tb-koujou` の**直前**に1行挿入。挿入位置の目印(各1箇所・ユニーク):

| 目印文字列(この行の直前に挿入) | 挿入するHTML |
|---|---|
| `<p class="tb-koujou reveal">「逢ひたい人の宴がある。` | `<p class="tb-ate reveal">宛て――はじめて宴に参る君へ</p>` |
| `<p class="tb-koujou reveal">「会ひに行くばかりが旅ではない。` | `<p class="tb-ate reveal">宛て――配信して、待つ君へ</p>` |
| `<p class="tb-koujou reveal">「憧れの人の見た景色を、この目で見たい。` | `<p class="tb-ate reveal">宛て――推しの跡を慕ふ君へ</p>` |

**C-1b. 道連れの詞** — 各道行きの `</ol>` の後(場面div閉じ`</div>`の直前)に挿入。目印: 次場面のコメント行。

- `<!-- 場面二：灯を掲げて、待つ（配信者の凸待ち） -->` の直前の `</div>` の前へ(場面一の分):

```html
<div class="tsure reveal">
  <span class="tsure-mon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#3a352c" stroke-width="1.3"><path d="M4 4 L8 8 Q12 6 16 8 L20 4 Q21 12 12 20 Q3 12 4 4 Z"/><circle cx="9" cy="12" r=".9" fill="#3a352c" stroke="none"/><circle cx="15" cy="12" r=".9" fill="#3a352c" stroke="none"/></svg></span>
  <span class="tsure-fuki"><b class="tsure-na">道連れ・コンタ</b>「拙者、道にはとんと迷ふ性分。されど『ここへ向かふ』の札ひとつで、地図が立ち上がって連れて行ってくれた。」</span>
</div>
```

- `<!-- 場面三：聖地を、巡る（推しの軌跡を聖地巡礼） -->` の直前の `</div>` の前へ(場面二の分)。紋=狸:

```html
<div class="tsure reveal">
  <span class="tsure-mon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#3a352c" stroke-width="1.3"><circle cx="7" cy="6" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="12" cy="13" r="8"/><ellipse cx="8.5" cy="12" rx="2.4" ry="1.7" fill="#3a352c" stroke="none" opacity=".8"/><ellipse cx="15.5" cy="12" rx="2.4" ry="1.7" fill="#3a352c" stroke="none" opacity=".8"/></svg></span>
  <span class="tsure-fuki"><b class="tsure-na">道連れ・タヌ姉</b>「点すも消すも、ボタンひとつ。あたしは宴のあひだだけ、灯を点けてゐるよ。」</span>
</div>
```

- `<!-- 幻燈（写し絵）：実アプリ画面の動画。` の直前の `</div>` の前へ(場面三の分)。紋=提灯:

```html
<div class="tsure reveal">
  <span class="tsure-mon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#3a352c" stroke-width="1.3"><line x1="12" y1="2" x2="12" y2="4"/><ellipse cx="12" cy="12" rx="7" ry="8"/><line x1="5.5" y1="9" x2="18.5" y2="9"/><line x1="5.5" y1="15" x2="18.5" y2="15"/><line x1="12" y1="20" x2="12" y2="22"/><circle cx="12" cy="12" r="2.2" fill="#a8572f" stroke="none"/></svg></span>
  <span class="tsure-fuki"><b class="tsure-na">道連れ・りんく</b>「わたしの通った道は、頁になってゐる。𝕏の名で、いつでも開ける。同じ景色を、見においで。」</span>
</div>
```

**C-1c. CSS** — `<style>`内、`.tomoshibi .tb-tsugi{ ... }` の行の**直後**に追加:

```css
  /* 宛て札(手紙の宛名)と道連れの詞(三キャラの合いの手)。面紋はinline SVGのみ・画像不使用 */
  .tomoshibi .tb-ate{ font-family:var(--mincho); font-size:clamp(11.5px,3.2vw,13px); letter-spacing:.24em; color:var(--kin); margin:0 auto 12px; max-width:var(--maxw); }
  .tomoshibi .tsure{ display:flex; align-items:flex-start; gap:10px; width:min(80vw,340px); margin:clamp(18px,4vw,30px) auto 0; text-align:left; }
  .tomoshibi .tsure-mon{ flex:0 0 34px; width:34px; height:34px; border-radius:50%; background:var(--washi); border:1px solid rgba(176,138,62,.5); display:grid; place-items:center; padding:5px; box-sizing:border-box; }
  .tomoshibi .tsure-mon svg{ width:100%; height:100%; display:block; }
  .tomoshibi .tsure-fuki{ font-family:var(--mincho); font-size:clamp(12.5px,3.3vw,14px); line-height:1.95; letter-spacing:.03em; color:#b8ccea; }
  .tomoshibi .tsure-na{ font-family:var(--fude); font-weight:400; color:var(--kin); letter-spacing:.12em; margin-right:.5em; display:inline-block; }
```

**P1完了判定(機械)**: ①`grep -c 'class="tb-ate' public/lp/index.html` = 3 ②`grep -c 'class="tsure ' public/lp/index.html` = 3 ③mokuroku内`<li>`数=31不変 ④`pnpm check` 0エラー ⑤375pxで`scrollWidth===clientWidth`(反復スクロール検証スクリプト流用)。

### P2: 封筒の見本(コア体験の実物・場面二の五の宿を改装)

場面二 `#tb-totsu` の五の宿「封書が残る」の封筒SVGを、**届いた封筒の中身**のCSS見本に差し替へる。目印: `<path d="M8 14 L44 38 L80 14"/>` を含む`<svg class="sk-art" viewBox="0 0 88 60" ...>...</svg>`(ファイル内ユニーク)。このsvg全体を以下に置換(figcaptionの`sk-name`/`sk-desc`は不変):

```html
<div class="fuutou-mihon" aria-label="すれ違ひの封筒(見立ての一葉)">
  <span class="fm-obi">すれ違ひの封書</span>
  <b class="fm-area">渋谷区にて、すれ違ひ、ひとつ。</b>
  <span class="fm-tier">距たり――五百歩のうち</span>
  <span class="fm-stamps">返しは、スタンプひとつでよい <i>👋</i><i>🌸</i><i>🍵</i></span>
  <span class="fm-mitate">――見立ての一葉。実の画面は、結の宿の幻燈にて。</span>
</div>
```

内容の根拠(捏造でない): encountersは`tier 1-5`/`areaName`(市区町村)を持ち、返信はreactions(emoji)のみ=DM禁止。「五百歩」は既存コピー「五つの距たり」の第一段。渋谷区は既存の絵札見本(`of-bubble`「渋谷区 にいるよ」)と同じ見立て地名で統一。**「見立て」明示行を必ず含める**。

CSS — P1で足したブロックの直後に追加:

```css
  /* 封筒の見本: 届く封書の中身の写し(見立て)。washi地に朱の帯・スタンプ返しまで一望 */
  .tomoshibi .fuutou-mihon{ display:flex; flex-direction:column; gap:6px; width:min(88%,260px); margin:2px auto 12px; padding:12px 14px 10px; background:var(--washi-2); border:1px solid rgba(58,53,44,.45); border-top:3px solid var(--taisha); border-radius:2px; box-shadow:2px 3px 0 rgba(35,32,27,.18); text-align:left; }
  .tomoshibi .fm-obi{ font-family:var(--fude); font-size:11px; letter-spacing:.3em; color:var(--taisha); }
  .tomoshibi .fm-area{ font-family:var(--fude); font-weight:400; font-size:clamp(14.5px,3.9vw,16.5px); letter-spacing:.08em; color:var(--sumi); }
  .tomoshibi .fm-tier{ font-family:var(--mincho); font-size:12px; letter-spacing:.06em; color:var(--sumi-soft); }
  .tomoshibi .fm-stamps{ font-family:var(--mincho); font-size:12px; color:var(--sumi-soft); }
  .tomoshibi .fm-stamps i{ font-style:normal; margin-left:4px; }
  .tomoshibi .fm-mitate{ font-family:var(--mincho); font-size:10.5px; letter-spacing:.04em; color:var(--muted); border-top:1px dashed rgba(58,53,44,.3); padding-top:6px; margin-top:2px; }
```

**P2完了判定**: ①`fuutou-mihon`がHTML内1箇所 ②旧封筒svgのパス文字列`M8 14 L44 38 L80 14`が消えてゐる ③li=31不変 ④375px横はみ出しゼロ ⑤音読チェック(見立て明示があること)。

### P3: 通行手形CTA×3+奥付

**C-3a. 通行手形** — P1の各`.tsure`ブロックの**直後**(同じ場面div内)に1枚:

```html
<a class="tb-tegata reveal" href="https://surechigai.kimito.link/sign-in"><span class="tg-in" aria-hidden="true">通</span>この道行き、けふ試みる ―― 𝕏 で旅をはじめる</a>
```

(3場面とも同一実文・同一href。機能別パラメータは付けない=シンプル優先)

**C-3b. 奥付** — endroll内、目印 `<p class="footnote">` の**直前**に挿入:

```html
<div class="okuzuke">
  <span class="ok-title">奥付</span>
  <span class="ok-row"><b>道具</b>三十一種――絵空事なし、みな今日も動く</span>
  <span class="ok-row"><b>国</b>四十七州――灯の咲くのを待ってゐる</span>
  <span class="ok-row"><b>幻燈</b>五巻――すべて実の画面の写し</span>
  <span class="ok-row"><b>入り口</b>𝕏 ひとつ――ブラウザで今すぐ。ストアは支度中</span>
</div>
```

(※P4bでmamoru-v1を足したら「五巻」→「六巻」に更新すること)

CSS — 手形はP2ブロックの直後、奥付は`.footnote{`定義の**直前**へ:

```css
  .tomoshibi .tb-tegata{ display:inline-flex; align-items:center; gap:10px; margin:clamp(16px,4vw,24px) auto 0; padding:11px 20px;
    background:var(--washi-2); border:1.5px solid var(--sumi-soft); border-radius:3px; box-shadow:2px 3px 0 rgba(35,32,27,.25);
    font-family:var(--fude); color:var(--sumi); font-size:clamp(13.5px,3.7vw,15px); letter-spacing:.12em; text-decoration:none; }
  .tomoshibi .tb-tegata .tg-in{ display:inline-grid; place-items:center; width:1.8em; height:1.8em; background:var(--taisha); color:#fff; font-size:12px; border-radius:2px; transform:rotate(-2deg); }
```
```css
  .okuzuke{ display:flex; flex-direction:column; gap:6px; align-items:center; margin:clamp(24px,5vw,40px) auto 0; }
  .okuzuke .ok-title{ font-family:var(--fude); font-size:12px; letter-spacing:.5em; text-indent:.5em; color:var(--kin); margin-bottom:4px; }
  .okuzuke .ok-row{ font-family:var(--mincho); font-size:clamp(11.5px,3.2vw,13px); letter-spacing:.06em; color:var(--sumi-soft); }
  .okuzuke .ok-row b{ font-weight:400; font-family:var(--fude); color:var(--sumi); letter-spacing:.2em; margin-right:.8em; }
```

**P3完了判定**: ①`tb-tegata`がHTML内3箇所・全hrefが`surechigai.kimito.link/sign-in` ②`okuzuke`がHTML内1箇所 ③li=31不変 ④`pnpm check`。

### P4a: 幻燈 junrei-v2(公開の書 /u/… を巡礼の写し絵に組み込む・ゲスト録画)

1. `store-assets/lp-video-plan.json` の `videos` 配列に追加(v1エントリは残す):

```json
{
  "video": "junrei-v2",
  "_desc": "場面三v2: 図鑑→推しの頁(/u/公開の書)→軌跡地図。公開の書を初収録(約24秒)",
  "steps": [
    { "goto": "/zukan", "wait": 2500 },
    { "scroll": { "px": 600, "durationMs": 3500 } },
    { "goto": "/u/★実在slug★", "wait": 3000 },
    { "scroll": { "px": 500, "durationMs": 3500 } },
    { "goto": "/map", "wait": 3500 }
  ]
}
```

2. 録画→変換(実行コマンド):
```
node scripts/record-lp-videos.mjs junrei-v2
ffmpeg -i .tmp-lp-video-raw/junrei-v2.webm -vf scale=540:-2 -c:v libx264 -crf 27 -preset veryslow -an -movflags +faststart public/lp/video/junrei-v2.mp4
ffmpeg -i public/lp/video/junrei-v2.mp4 -ss 00:00:02 -frames:v 1 public/lp/video/junrei-poster-v2.webp
```
3. index.html `#tb-junrei` の結の宿(目印: `junrei-poster-v1.webp`)で、`junrei-poster-v1.webp`→`junrei-poster-v2.webp`(2箇所: img srcとvideo poster)、`junrei-v1.mp4`→`junrei-v2.mp4`(1箇所)。figcaptionの`sk-desc`を「国の図鑑から、推しの頁（公開の書）、歩いた道の地図まで。推しの軌跡をたどる、その実の画面。」に更新。v1ファイルは削除しない(CDN安全のため放置)。

**P4a完了判定**: ①`public/lp/video/junrei-v2.mp4`と`junrei-poster-v2.webp`が存在(mp4は1.5MB以下目安) ②`#tb-junrei`内に`v1`参照ゼロ ③メディアURLに`?v=`ゼロ ④実ブラウザで「観る」→再生を確認。

### P4b(任意・auth待ち): 幻燈 mamoru-v1「守りの写し絵」

plan追加(`"auth": true`): `{ "video": "mamoru-v1", "auth": true, "_desc": "守るの組: マイページの見せ方の按配/宿を隠す/灯を消す設定画面(約18秒)", "steps": [ { "goto": "/mypage", "wait": 2500 }, { "scroll": { "px": 600, "durationMs": 4000 } }, { "wait": 800 }, { "scroll": { "px": 500, "durationMs": 3500 } } ] }`(※設定UIの実ルートは録画前にCodexが実アプリで確認し、必要ならstepsのgoto/scrollを調整)。変換はP4aと同コマンドのファイル名違ひ。

置き場所: 第四場面(総括)の`</ol>`内、既存megiri結の宿`</li>`の直後に**結の宿・弐**として同型の`<li class="shukuba gento reveal">`を追加。`sk-no`=「結の宿・弐」、`sk-name`=「幻燈 ― 守りの写し絵」、`sk-desc`=「見せ方の按配、宿を隠す、灯を消す。名は明かしても寝屋は明かさぬ、その実の画面。」poster/mp4は`mamoru-poster-v1.webp`/`mamoru-v1.mp4`。奥付の「五巻」→「六巻」に更新。

**P4b完了判定**: P4aと同型+gentoのli数が5(4→5)。**ユーザー作業**: `.auth/auth-state.json`の用意(Patchright経由のX OAuth。保存先が親github/.authになる罠=メモリ[surechigai-patchright-x-oauth-auth]、正本手順は docs/handoff-lp-auth-video-2026-07-08.md 参照)。

## D. 新規アセットまとめ

| アセット | 本数 | 録画プラン | ユーザー作業 |
|---|---|---|---|
| junrei-v2.mp4+poster | 1 | 上記P4a(ゲスト・認証不要) | **実在の/u/スラッグを1つ指定**(推奨: 運営者自身の公開頁。足あとが実在し軌跡が映ること) |
| mamoru-v1.mp4+poster | 1 | 上記P4b(auth:true) | auth-state.json の取得(X OAuthログイン) |

新規画像=0枚。posterは録画パイプラインの産物(webp・540px)で規約内。キャラ面紋はinline SVG(バイト増のみ・リクエスト増なし)。

## E. 捨てた案と理由

| 案 | 理由 |
|---|---|
| 3キャラのフル会話劇(reply-suggest直輸入) | 俳文の語りと会話劇は文体が衝突。合いの手1行×3に減量(道連れの詞) |
| キャラ顔PNG(img/chara/*)の道中再利用 | 1枚373〜508KB。endroll未到達ユーザーに最大~900KBの新規転送=重量制約に実質抵触。面紋SVGで代替 |
| 31機能ぶんのスクショ/録画 | 録画6巻+CSS見本で「実物が在る」証明は足りる。31本は保守が破綻する |
| テスト数・コミット数等の自動数値 | 前設計の却下を維持(陳腐化・検証コスト)。奥付は変はらない数値のみ |
| 機能ごと(全宿場)CTA | 木札だらけになり「ここへ向かふ」実演札と視覚競合。道行き末尾1枚×3に圧縮 |
| FVへのCTA追加 | 没入不可侵。栞+お品書きが既に担ふ(裁定として非採用を確定) |
| 封筒見本を願・叶カード内へ | 願・叶は視覚階層の頂点・不変の裁定(既存DESIGN)を守る。tomoshibiの五の宿が適地 |
| 目録(mk-mamoru)内へ幻燈埋め込み | 目録はテキスト索引の速さが命。動画は道行き側(結の宿・弐)へ |

## F. Codexへの注意(地雷サマリ+禁止事項)

1. **overflow**: 新規CSSでsection系に overflow を書くなら**clipのみ**(hiddenはsticky殺し)。本設計の新要素はoverflow指定不要な設計。
2. **CDN immutable**: 画像・動画に`?v=`を**絶対に付けない**。動画/posterは**ファイル名で版数**(-v2)。app.jsは**今回無改変なので版上げ不要**(触った場合のみ`?v=34`へ)。
3. **触ってはいけない場所**: 序〜結章の物語パート/`.story.night`のkama機構/願・叶の5カード本体/目録のli(31品・品名・説明文は一字も変へない)/巻・携/フィナーレ/星景・水面Canvas。
4. **挿入はすべて静的DOM**。`.reveal`はapp.jsのIntersectionObserverが初期化時に全走査するため静的追加はOK・**動的挿入は禁止**。gentoも同様。
5. アンカーを足す場合は`data-mkjump`必須(lp-defer座標狂ひ対策)…だが本設計の新リンクは外部(sign-in)のみで不要。
6. **検証**: 各Phaseで ①li=31 ②375px横はみ出しゼロ ③反復スクロール方式(settleTo)で鹿威し/水面/星景の回帰 ④`pnpm check` 0 ⑤`git diff --stat`が当該Phaseのファイルのみ。コミット→push→デプロイ確認はCLAUDE.mdディレクティブ4に従ふ。
7. **コピーは本書の実文をそのまま使ふ**(旧仮名は音読済み)。禁句(マッチング/友達を探す/匿名/安全に/位置情報は保存されません)は新文言に不使用・変更時も維持。
8. 実装順はP1→P2→P3→P4a(→P4b)。P4bのみユーザー作業(auth)待ちでブロックされるため、届かなければP4aまでで完結してよい(その場合奥付は「五巻」のまま)。
