# LP水面・KV作り直しSPEC（Fable完成版・2026-07-07）

> `/goal docs/lp-mizu-redesign-SPEC.md に書かれたことを完遂しろ` で実装担当に渡す。
> 3段構え（会議で素材集め→Fable設計→実装は別モデル）の最終成果。
> 技術解はマルチLLM会議2回で確定済み（§0）。本版はそこに演出・詩情・音同期・体験のリズムを
> Fable が織り込んで昇華したもの。**この文書は設計。実装は別モデルが行う。**
>
> 対象ファイル: `public/lp/index.html`（v=27 時点）/ `public/lp/app.js`。
> app.js を変えたら `index.html` の `app.js?v=NN` を必ず +1（現在 v=27 → 28以降）。

---

## 背景

surechigai-romi.link の物語LP（`public/lp/`）を、日本でバズった2つのFable製LP
（①SAKURA=墨絵桜の静止画KV・16万インプ ②MINAMO=コードで描く波紋の水面・29万インプ）を
超える最高の物語LPにする。芭蕉「月日は百代の過客」の四季道中記・和紙/墨/明朝/旧字体の世界観は死守。

**直近で失敗した実装（1df9bb4bc）を作り直す**のが最優先。結章「湖に、月が、逆さに浮かんでゐる」に
Canvas水面を入れたが、月光が巨大な縦の柱になり逆さ月の球体が見えず、position:fixed とスクロール
文の干渉で月が見切れた（本番でユーザーが「ひどい」と評価）。

---

## §0. 会議で確定した「失敗の真因」と「正しい技術解」（前提・覆さない）

| 論点 | 前回失敗（1df9bb4bc） | 正しい解（会議で確定・実装必須） |
|---|---|---|
| **レイヤー** | `position:fixed` 全画面Canvas。ビューポート基準で描画し、スクロールで本文と座標系がずれ、月が上端で見切れた | **結章`<section>`内に置いたCanvas**（fixed禁止）。本文テキストは同一スタックコンテキストで`z-index:2`（前面）。座標系が本文と一致し、スクロール量に依存しない |
| **柱状月の原因** | 逆さ月を横スライスに切り、各スライスを横に`wob`ずらし。**縦方向の情報が失われ**、円が上下に伸びて光の帯（柱）になった | **月ディスクを完全な円でオフスクリーンバッファに描く → 水面の高さ場(height field)の勾配でピクセル単位にサンプリング変位**。円形を保ったまま屈折で揺れる |
| **波紋の物理** | `{x,y,r,a}`の波紋リストをsin/cosで毎ピクセル評価。O(N波紋×Mピクセル)でモバイル60fps不可 | **2バッファ Height-Field（離散波動方程式）**。O(W×H)固定。低解像度バッファで計算し`drawImage`で拡大。GPU不要で60fps |
| **配置基準** | fixedのtop/left固定で見切れ | **`section.getBoundingClientRect()`を毎フレーム参照**してビューポート内の位置・進行度を取得。どのスクロール量でも画面内に安定 |

**section内配置の実装形（会議解1・4の具体化）**: 結章sectionは文が8つあり全高 約500vh。
`position:absolute; inset:0` のCanvasを実ピクセルで確保すると（幅780×高さ8000px級）メモリが爆発し
描画も破綻する。よって会議解の意図（**fixed廃止・section内・本文と同一スタックコンテキスト**）を
満たす実装形として、**「高さ0の sticky ホルダー + 100dvh Canvas」**を採用する:

```html
<div class="mizu-holder" aria-hidden="true">      <!-- position:sticky; top:0; height:0 → レイアウトに影響ゼロ -->
  <canvas id="mizuCanvas" class="mizu-canvas"></canvas>  <!-- position:absolute; top:0; height:100dvh -->
</div>
```

- sticky は fixed ではない。sectionのスタックコンテキスト内に留まり、sectionが画面を通過する間だけ
  ビューポートに貼り付く。**同一コードベースの `.story .kama`（かまいたち演出）が既にこの
  sticky+100vh パターンで安定稼働している前例**であり、座標系は本文と一致する。
- `getBoundingClientRect()` は「sectionをどこまで読み進めたか（進行度p）」の取得に使い、
  フェードイン/アウトと演出のタイミング制御に充てる（§2.6）。

---

## §1. 全体コンセプト — 「墨と水の対話」

**「読むと、世界が応える LP」**。芭蕉の句を読み進める（スクロールする）と四季の情景が文に応じて
息づき、要所ではユーザーが触れると世界が反応する。派手さで勝つのではなく、
**芭蕉の"間"の中に、触れられる一点を置く**ことでインパクトと品を両立する。

このLPの触れられる一点は、物語の両端に置く。

- **序（墨）**: 冒頭の句が、筆で**書かれてゆく**。墨は乾けば消えない——「足あとは消えない」という
  このアプリの約束を、開幕の数秒で体に入れる。
- **結（水）**: 湖に映る逆さ月に、指で**触れられる**。触れれば揺れ、待てば凪いで、月はまた円に戻る
  ——「思ひ出は、揺れても、そこにある」。

墨は刻むもの、水は映すもの。**書き出しで刻み、結びで映す**。この対話が全体の弧になる。
SAKURAの静止画・MINAMOの水面単体を超えるのは、この「物語＋インタラクション＋静謐」の三位一体。

### 体験のリズム（力の入れどころ・引きどころ）

原則は **「一章一芸」**。1つの章に大きな演出は1つまで。何もしない章（四章「一服の間」）を必ず残す。
息を吸わない歌はない。

| 章 | 強度 | その章の「一芸」 | 備考 |
|---|---|---|---|
| 序・扉（KV） | ●●● | 墨書き（§4・P1） | 触れると胡粉がにじむ |
| 序章〜一章 | ●● | 汽笛・トンネル | 既存のまま |
| 二章 雪道 | ●● | 足跡と足音 | 既存のまま |
| 三章 春 | ● | 人力車・鳥 | 既存のまま |
| 四章 間 | ○ | 鹿威しのみ。**何も足さない** | LP全体の「休符」 |
| 五〜六章 夏 | ●● | 魚・花火 | 既存のまま |
| 七〜八章 秋 | ● | 既存のまま | 引きの区間 |
| **結章** | **●●●●** | **触れる水面（§2）＝クライマックス** | 本SPECの主役 |
| 巻・携 | ● | アプリ紹介 | 既存のまま・壊さない |
| フィナーレ | ●● | 星空とりんく | 既存のまま |

結章の水面が最も強い体験になるよう、他の章には**新しい演出を足さない**こと。

---

## §2. 結章・触れる水面（最優先・最も具体的に）

> 「湖に、月が、逆さに浮かんでゐる。」——この一文が画面中央に灯るとき、
> 語られた通りの湖が、文の背後に、コードで現れる。それがすべての狙い。

### 2.1 体験の脚本（何が起きるか・秒数つき）

```
 0.0s  data-mizu文が可視域に入る → start()。canvasが 1.8s かけて帳のように明ける。
       水面は「ほぼ鏡」。逆さ月は完全な円。呼吸のさざなみ（§2.5）だけが極微に揺れる。
 0.9s  「迎えの一滴」: 逆さ月の右肩あたりに strength 0.35 の波紋がひとつ、自然に落ちる。
       soundOn なら雫音（vol 0.25）。世界からの小さな挨拶。誰も触れなくても、湖は生きている。
 3.0s  まだ誰も触れていなければ、水面下端に淡くヒントを出す（§2.8）:
       「―― そっと、水に触れてみられよ。」 4s 表示 or 初タッチで消える。
 タップ  strength 1.0 の波紋＋雫音。月が屈折で揺れ、波が月心を通ると「月の琴」が一音（§3.2）。
 スワイプ 90ms かつ 24px 移動ごとに strength 0.4。雫音は 340ms に1回・音量35%（うるさくしない）。
 〜5s後  減衰（damping 0.985/frame）で波はおよそ5秒で凪ぐ。
 凪の瞬間 タッチ起因の揺れが収まりきった瞬間（エネルギー閾値を60フレーム下回る）、
       月暈がひと呼吸ぶん（+12%を2.5sで往復）ふくらんで戻る。「月が、息をつく」。
 待機中  9〜15s ごとに微小な一滴（strength 0.15）。魚か、風か。雫音 vol 0.12。
 離脱   data-mizu文が可視域を出る → stop()。1.8s フェードで帳が下り、rAF停止（省電力）。
       body.mizu-active が外れ、photoStage（hoshizora写真）へ滑らかに戻る。
```

触れる→揺れる→凪ぐ→月が息をつく。**波紋がご褒美なのではない。凪が戻ってくることがご褒美**である。
この円環を壊すような常時派手なエフェクト（連続花火的な波・レンズフレア等）は入れない。

### 2.2 レイヤー構成（HTML/CSS・確定形）

`index.html` 963〜967行付近、結章sectionの `<canvas id="mizuCanvas">`（現在967行）を差し替え:

```html
<section class="story lp-defer night photo-bg" data-scene="clear" data-veil="dusk" data-bg="fuji-yoru">
  <div class="veil"></div>
  <div class="mizu-holder" aria-hidden="true">
    <canvas id="mizuCanvas" class="mizu-canvas"></canvas>
    <p class="mizu-hint" id="mizuHint">―― そっと、水に触れてみられよ。</p>
  </div>
  <div class="ep-head">…（既存のまま）…</div>
  <p class="ph" data-img="fuji-yoru">雲が晴れ、はじめて、富士が見えた。</p>
  <p class="ph" data-img="tsuki-mizu" data-mizu="1">湖に、月が、逆さに浮かんでゐる。</p>
  …（以下、既存のまま）…
</section>
```

CSS（現在の `.mizu-canvas` ブロック=506〜513行付近を差し替え）:

```css
/* ===== 触れる水面（結章）。fixedは使わない: 高さ0のstickyホルダーでsection内に留める ===== */
.mizu-holder{ position:sticky; top:0; height:0; z-index:1; }
.mizu-canvas{
  position:absolute; left:0; top:0; width:100%;
  height:100vh; height:100dvh;              /* モバイルURLバー対策。dvh非対応は100vhへフォールバック */
  opacity:0; transition:opacity 1.8s ease;
  pointer-events:none;                       /* 起動中以外は触れない＝下の要素の邪魔をしない */
  touch-action:pan-y;                        /* ★縦スクロールは絶対に殺さない（地雷。§2.9） */
}
.mizu-canvas.on{ opacity:1; pointer-events:auto; }
/* 本文・見出し・CTAはCanvasより前面（同一スタックコンテキスト内で解決） */
.story .ph, .story .ep-head, .story .saso, .story .ep-rule{ position:relative; z-index:2; }
/* 水面が主役の間、静止画ステージは休む（既存規則を維持） */
body.mizu-active #photoStage{ opacity:0; transition:opacity 1s ease; }
/* ヒント（§2.8） */
.mizu-hint{ position:absolute; left:50%; bottom:9dvh; transform:translateX(-50%);
  font-family:var(--mincho); font-size:13px; letter-spacing:.3em; white-space:nowrap;
  color:rgba(226,238,252,.55); text-shadow:0 1px 6px rgba(4,10,24,.8);
  opacity:0; transition:opacity 1.6s ease; pointer-events:none; z-index:2; }
.mizu-hint.show{ opacity:1; }
```

- Canvas実ピクセルは `clientWidth×DPR × clientHeight×DPR`、`DPR=Math.min(2, devicePixelRatio)`。
  `ResizeObserver`（なければ resize イベント）で再設定。
- `.ph` への `position:relative` 付与で、既存の `.ph::before`（文字背後の暗がり）の位置基準が
  section→.ph 自身に変わる。意図通り（文の中央に敷かれる）だが、**他章で文の暗がりがずれて
  いないか目視確認すること**（Phase 1 の受け入れ条件に含む）。

### 2.3 画面の構図（世界座標）

```
      W = canvas幅 / H = canvas高（=ビューポート）
      ┌────────────────────────────┐
      │  星（60個・horizon より上のみ・微瞬き）      │
      │                        ● 月 (moonX,moonY)   │  moonX=W*0.68, moonY=H*0.18
      │                          moonR=clamp(22, min(W,H)*0.055, 48)
      │ ～～ 富士の稜線シルエット ～～～～～～～～～ │  horizon = H*0.56
      ├──────────── 水面境界 ──────────┤
      │      （height field の支配領域）             │
      │                        ◐ 逆さ月 (reflX,reflY) │  reflX=moonX
      │                                              │  reflY=horizon+(horizon-moonY)*0.62
      └────────────────────────────┘   （遠近の圧縮率0.62で画面内に収める）
```

- 富士の稜線: 序章の扉 `.fuji-yo` と同じ形（`M0 220 L0 150 Q420 28 560 24 Q700 28 1120 150 …`を
  スケール）を `#0a1626` で horizon 上に一度だけ Path2D 化して毎フレーム塗る。
  写真(fuji-yoru)からCanvasへ切り替わっても「同じ富士がそこにいる」連続性を作る。
- 空: 縦グラデ `#0a1730 → #0c1b34 →(horizon)→ #08152b → #040c1c`（現行を踏襲）。
- 月（空側）: radialGradient `#fdf6e3 → #f0e6c8 → #d9cba0` ＋ shadowBlur 30 の暈（現行を踏襲）。

### 2.4 水面の物理 — 2バッファ Height-Field（会議解・実装必須）

水面帯（horizon〜H）だけを低解像度グリッドでシミュレートする。

```js
// グリッド（水面帯のみ）: GW=176, GH=64。Float32Array 2枚を交互に。
var GW=176, GH=64, prev=new Float32Array(GW*GH), cur=new Float32Array(GW*GH);
var DAMP=0.985;                       // 減衰: タップが約5秒で凪ぐ値

function stepWave(){
  for(var y=1;y<GH-1;y++){
    for(var x=1;x<GW-1;x++){
      var i=y*GW+x;
      var v=(cur[i-1]+cur[i+1]+cur[i-GW]+cur[i+GW])/2 - prev[i];  // 離散波動方程式
      prev[i]=v*DAMP;
    }
  }
  var t=prev; prev=cur; cur=t;        // swap（2バッファ）
}

// 注入（タップ・迎えの一滴・待機の一滴が全部これ）
function poke(nx, ny, strength){       // nx,ny は水面帯内の正規化座標 0..1
  var gx=(nx*GW)|0, gy=(ny*GH)|0;
  // 1セルでなく半径2セルのなだらかな山として注入（角の立たない波にする）
  for(var dy=-2;dy<=2;dy++) for(var dx=-2;dx<=2;dx++){
    var x=gx+dx, y=gy+dy; if(x<1||x>=GW-1||y<1||y>=GH-1) continue;
    var d=Math.sqrt(dx*dx+dy*dy); if(d>2.4) continue;
    cur[y*GW+x] += strength*3.2*(1-d/2.4);
  }
}
```

- 計算量は O(GW×GH)=11,264 セル/フレームで固定。モバイルで60fps余裕。
- **波紋リスト方式は禁止**（前回失敗）。波の見た目は height field の勾配（§2.5）から自然に生まれる。
  楕円ストロークで波紋の輪を「描き足す」ことも禁止——それは嘘の波紋であり、屈折と二重になる。

### 2.5 逆さ月を「円」のまま揺らす（会議解・実装必須）

```js
// 1) 月ディスクを完全な円でオフスクリーンに（一度だけ・キャッシュ。暈込みで半径の1.6倍）
var MB=Math.ceil(moonR*1.6), moonBuf=offscreenCanvas(MB*2, MB*2);
//    radialGradient(#fdf6e3 → #f0e6c8 60% → rgba(217,203,160,0) 100%) の円を中心に描く
var moonPix = moonBufCtx.getImageData(0,0,MB*2,MB*2);   // サンプリング用に一度だけ取得

// 2) 合成バッファ: 水面帯を「表示解像度の 1/3（モバイル≤480pxは 1/2）」の ImageData で組み立てる
var CS = (window.innerWidth<=480 ? 0.5 : 1/3);           // COMPOSE_SCALE
var CW=(W*CS)|0, CH=((H-horizon)*CS)|0, water=ctx2.createImageData(CW,CH);

function renderWater(){
  for(var py=0; py<CH; py++){
    for(var px=0; px<CW; px++){
      // --- 高さ場の勾配（このピクセルに対応するセルの傾き＝屈折方向） ---
      var gx=px*GW/CW, gy=py*GH/CH;                        // グリッド座標（最近傍で可）
      var i=(gy|0)*GW+(gx|0);
      var dx=cur[i+1]-cur[i-1], dy=cur[i+GW]-cur[i-GW];

      // --- 月の鏡像サンプル: 「どこを映すか」だけを勾配でずらす（円は崩れない） ---
      var wx=px/CS, wy=horizon+py/CS;                      // 表示座標
      var u=(wx-reflX) + dx*REFRACT;                       // REFRACT=14（合成バッファpx）
      var v=(reflY-wy)*1.0 + dy*REFRACT;                   // 鏡像なので縦を反転して参照
      var mu=(MB+u)|0, mv=(MB+v)|0;
      var moonA=0;
      if(mu>=0&&mu<MB*2&&mv>=0&&mv<MB*2) moonA=moonPix.data[(mv*MB*2+mu)*4+3]/255;

      // --- 水の地色（深さで暗く）＋ 月光（水の青みを乗せた金） ---
      var depth=py/CH;
      var r=8+6*(1-depth), g=18+8*(1-depth), b=38+14*(1-depth);
      r+=moonA*225; g+=moonA*212; b+=moonA*168;            // #fdf6e3 を水に溶かした色

      // --- 揺れたときだけ現れる「月の道」（§2.5b）: 勾配のきらめき ---
      var spark=Math.max(0, dy)*SPARK * glade(wx, wy);      // SPARK=0.9
      r+=spark*120; g+=spark*118; b+=spark*96;

      var o=(py*CW+px)*4;
      water.data[o]=r; water.data[o+1]=g; water.data[o+2]=b; water.data[o+3]=255;
    }
  }
  ctx2.putImageData(water,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(cv2, 0,0,CW,CH, 0,horizon, W,H-horizon);   // 1回の拡大転写でぼかしごと馴染む
}
```

**ポイント（前回失敗の直接の解）**: 月は常に「完全な円のバッファ」から取る。ずらすのは
"どこを映すか"だけ。だから円が伸びて柱にならない。波が来た所だけ屈折で歪む＝水面で月が揺れて見える。

#### 2.5b 「月の道」— 失敗を、意図された一瞬の美に反転する

前回は月光が常時「柱」になって失敗した。今回は**揺れているときだけ**、逆さ月から手前へ
月光がきらめきの水脈として伸び、凪げば消えて完全な円に戻る——これを意図した演出として設計する。

```js
// glade(x,y): 逆さ月の下に伸びる細い許可領域。列の中だけ spark を通す
function glade(wx, wy){
  if(wy < reflY) return 0;                                  // 逆さ月より手前のみ
  var half=moonR*1.6 * (1+(wy-reflY)/(H-reflY)*0.8);        // 遠→近でわずかに広がる
  var t=1-Math.min(1, Math.abs(wx-reflX)/half);             // 列の外は0
  return t*t;
}
```

- spark の源は height field の勾配 `dy` なので、**水が静まれば月の道は物理的に消える**。
  柱が常時立つことは構造上あり得ない。強度上限は `spark≤0.35` にクランプすること。
- 凪→タップ→月の道がきらめく→凪いで円へ戻る、が §2.1 の脚本と噛み合う。

#### 2.5c 呼吸のさざなみ・凪の検知・月が息をつく

```js
// 呼吸のさざなみ: 完全静止は死んだ水。毎秒2セルへ極微注入（strength 0.02）
if(frame%30===0){ poke(Math.random(), Math.random(), 0.02); }

// エネルギー（QAにも使う）: 30フレームごとに全セル|h|の平均
E = mean(|cur[i]|);
// 凪の検知: タッチ起因の揺れ(E>0.05)のあと、E<0.012 が60フレーム続いたら「凪」イベント
// → 月暈（空の月・逆さ月の合成強度）を 2.5s かけて +12% → 2.5s で戻す。「月が、息をつく」
```

### 2.6 起動・停止・進行度（既存配線の流用）

- 起動/停止は現行の `data-mizu` 検知（app.js `updateNarrative` 内 180〜184行）を**そのまま流用**。
  差し替えるのは `mizu` モジュール（app.js 661〜720行の IIFE）の中身だけ。
- `start()`: running=true → サイズ設定 → `.on` 付与（CSSが1.8sで帳を上げる）→ `body.mizu-active`
  → バッファゼロクリア → 0.9s 後に迎えの一滴 → rAFループ開始。
- `stop()`: running=false → `.on` 除去 → `body.mizu-active` 除去 → rAF停止。バッファは保持でよい。
- `section.getBoundingClientRect()` は毎フレーム取得し、`rect.top` から結章の読み進み progress を
  算出して**待機の一滴の頻度**に使ってよい（読み始め＝多め、CTAに近づいたら控えめ）。必須ではない。

### 2.7 入力（タップ・スワイプ）と座標変換

```js
cv.addEventListener('pointerdown', function(e){
  if(!running) return;
  var r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
  if(y<horizon) return;                          // 空に触れても波は立たない（月は遠い）
  poke((x)/W, (y-horizon)/(H-horizon), 1.0);
  shizuku(1.0, 0.3);                             // §3.1
}, {passive:true});

cv.addEventListener('pointermove', function(e){  // スワイプ＝指先が水を撫でる
  if(!running || !e.pressure && e.pointerType==='mouse' && e.buttons===0) return;  // マウスは押下中のみ
  // 90ms かつ 24px 以上移動したときだけ
  poke(..., 0.4);
  // 雫音は 340ms に1回・vol×0.35（撫でる音は控えめに）
}, {passive:true});
```

- **リスナーは必ず `{passive:true}`。`preventDefault()` 禁止**。`touch-action:pan-y` と合わせ、
  水に触れてもページの縦スクロールは一切妨げない（§2.9 地雷）。
- 「月の琴」（§3.2）: 毎フレーム、逆さ月中心セル `cur[reflCell]` を見て `|h|>0.35` かつ
  クールダウン6s経過なら一音。波が月心を通過した瞬間だけ鳴る。

### 2.8 ヒントの作法

- 起動から3s、無タッチなら `#mizuHint.show`。初タッチ or 4s経過で除去。**1ページ訪問につき1回だけ**
  （セッション変数でよい。localStorage不要）。
- 文言は「―― そっと、水に触れてみられよ。」（旧字体・命令でなく誘い）。
- reduced-motion 時はヒント自体を出さない（水面が起動しないため）。

### 2.9 地雷（このセクション固有）

- **`position:fixed` は二度と使わない**（前回失敗の主因）。stickyホルダーはfixedではない。
- **500vhのsectionに `inset:0` 実ピクセルCanvasを張らない**（メモリ爆発。§0の実装形を守る）。
- **`touch-action:pan-y` ＋ passiveリスナー必須**。水面がスクロールを殺したら物語が死ぬ。
- 波紋の楕円ストローク描き足し禁止・横スライス方式禁止（前回失敗の再発）。
- `height:100dvh`（フォールバック100vh）。iOSのURLバー伸縮で下端が切れないこと。
- reduced-motion では Canvas を一切起動せず、既存の `tsuki-mizu.png` 静止写真に委ねる
  （現行の `if(!cv||reduce) return {start(){},stop(){}}` の作法を踏襲）。
- `body.mizu-active #photoStage{opacity:0}` の既存規則を壊さない（写真とCanvasの交代はこの1行が担う）。

### 2.10 調整パラメータ一覧（実装時はこの既定値から開始）

| 定数 | 既定値 | 意味 |
|---|---|---|
| GW×GH | 176×64 | height field 解像度（水面帯のみ） |
| DAMP | 0.985 | 減衰。タップ→凪 約5秒 |
| REFRACT | 14 | 屈折の強さ（合成バッファpx） |
| SPARK / 上限 | 0.9 / 0.35 | 月の道のきらめき係数 / クランプ |
| COMPOSE_SCALE | 1/3（≤480pxは1/2） | 水面合成バッファの縮尺 |
| DPR上限 | 2 | Canvas実ピクセル |
| moonR | clamp(22, min(W,H)*0.055, 48) | 月半径 |
| horizon | H*0.56 | 水面境界 |
| reflY圧縮 | 0.62 | 鏡像の遠近圧縮 |
| 迎えの一滴 | 0.9s後 / str 0.35 | 起動時の挨拶 |
| 待機の一滴 | 9〜15s毎 / str 0.15 | 魚か、風か |
| タップ/スワイプ | str 1.0 / 0.4 | 注入強度 |
| スワイプ間引き | 90ms かつ 24px | poke頻度 |
| 凪閾値 | E<0.012 ×60frame | 「月が息をつく」判定 |
| 月琴 | \|h\|>0.35 / CD 6s | 波が月心を通った一音 |

---

## §3. 音の設計 — 雫と、月の琴

音は既存の Web Audio 系（`master` → dry/reverb → compressor。app.js 325〜347行）に**乗せるだけ**。
新しいバスは作らない。既存のリバーブ（2.6s減衰のConvolver）が、雫に湖の夜の残響を与えてくれる。
BGM（bgmClear・結章の弦・vol 0.28）は下敷きのまま止めない。**足すのは以下の2音だけ**。墨（§4）は無音。

### 3.1 雫（しずく）— 水に触れた音

```js
/* splash() の近く（app.js 526行付近）に追加。soundOn ゲートは他の合成音と同じ作法 */
function shizuku(strength, vol){
  if(!soundOn||!actx) return;
  var t=actx.currentTime;
  // 「ぽ」: sine のピッチ落下（強く触れるほど低く・太く）
  var f0=(420+Math.random()*140)*(1.15-0.3*strength);
  var o=actx.createOscillator(), g=actx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(f0*1.6, t);
  o.frequency.exponentialRampToValueAtTime(f0*0.55, t+0.28);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime((vol||0.3)*(0.5+strength*0.5), t+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t+0.5);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.55);
  // 「ちゃ」: ごく短い高域ノイズ（水面の張力が切れる音）
  var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.03,actx.sampleRate),
      ch=bf.getChannelData(0);
  for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2);
  n.buffer=bf;
  var f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2600; f.Q.value=1.2;
  var ng=actx.createGain(); ng.gain.value=0.08*strength;
  n.connect(f); f.connect(ng); ng.connect(master); n.start(t);
}
```

- 連打対策: 直前の雫から **160ms 未満なら鳴らさない**（波紋pokeは通す。音だけ間引く）。
- 迎えの一滴 vol 0.25 / タップ vol 0.3 / スワイプ vol 0.3×0.35 / 待機の一滴 vol 0.12。

### 3.2 月の琴 — 波が逆さ月の心を通った一音

```js
function tsukigoto(){
  if(!soundOn||!actx) return;
  var t=actx.currentTime;
  // 箏の一撥: D4 とその倍音。減衰は長め（湖の上に置き去りにする）
  [[293.66,0.09,0],[587.33,0.035,0],[440.0,0.05,0.09]].forEach(function(p){
    var o=actx.createOscillator(), g=actx.createGain();
    o.type='triangle'; o.frequency.value=p[0];
    g.gain.setValueAtTime(0.0001,t+p[2]);
    g.gain.linearRampToValueAtTime(p[1], t+p[2]+0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t+p[2]+1.5);
    o.connect(g); g.connect(master); o.start(t+p[2]); o.stop(t+p[2]+1.6);
  });
}
```

- 発火条件は §2.7（|h|>0.35・クールダウン6s）。**狙って鳴らせるが、狙わないと鳴らない**——
  月に波を届かせた人だけが聴く音。SNSで「月に触ると音がする」と言及される仕掛けはここ。
- BGM（弦）と同居するので音量は控えめ（合計ゲイン≈0.09）。リバーブが尾を伸ばしてくれる。

### 3.3 鳴らさない勇気

- スワイプ追従の連続音・環境の水音ループ・タップ毎の効果音全発火は**しない**。
  結章の主役は BGM の弦と静寂であり、雫と琴は句読点にすぎない。
- `soundOn=false`（ミュート）でも水面・波紋・月の道は全て動く。音はご褒美であって前提ではない。

---

## §4. KV（序・扉）— 墨書きの開幕（P1・水面の後）

> 対象は最初の `<section class="novel">`（序・扉）。夜の峠・星空・title「君斗りんくのすれ違ひ通信」・
> 芭蕉の五行（`.nv-text .l`）。**構図・文言・星・流れ星は一切変えない**。変えるのは文字の現れ方だけ。

### 4.1 墨書きリビール — 句が「書かれてゆく」

現在の `.l` はフェードイン。これを「筆が走り、墨がにじんで定着する」動きに差し替える:

```css
.nv-text .l{ opacity:0; }
.novel.in .nv-text .l{
  animation: sumi-hake 2.4s cubic-bezier(.3,.5,.2,1) forwards;
  -webkit-mask-image:linear-gradient(90deg, #000 45%, transparent 65%);
          mask-image:linear-gradient(90deg, #000 45%, transparent 65%);
  -webkit-mask-size:300% 100%; mask-size:300% 100%;
  -webkit-mask-position:100% 0; mask-position:100% 0;
}
.novel.in .nv-text .l:nth-child(1){ animation-delay:1.0s }
.novel.in .nv-text .l:nth-child(2){ animation-delay:3.4s }
.novel.in .nv-text .l:nth-child(3){ animation-delay:6.2s }
.novel.in .nv-text .l:nth-child(4){ animation-delay:8.6s }
.novel.in .nv-text .l:nth-child(5){ animation-delay:11.0s }
@keyframes sumi-hake{
  0%  { opacity:0; filter:blur(5px); letter-spacing:.22em;
        -webkit-mask-position:100% 0; mask-position:100% 0; }
  45% { opacity:.9; filter:blur(1.6px); }
  100%{ opacity:1; filter:blur(0); letter-spacing:inherit;
        -webkit-mask-position:0% 0; mask-position:0% 0; }
}
@media(prefers-reduced-motion:reduce){
  .nv-text .l{ opacity:1 !important; animation:none !important;
    -webkit-mask-image:none !important; mask-image:none !important; filter:none !important; }
}
```

- マスクの左→右スイープ＝筆の運び。blur 5px→0 ＋ 字間の僅かな締まり＝**にじんだ墨が乾いて定着する**。
  この二層で「書かれた」感が出る。SVGパスの一画ずつ描画は明朝体テキストでは不可能なので追わない
  （文字を画像化・アウトライン化するのは検索性・アクセシビリティ・世界観運用の面で却下）。
- タイトル `nv-title` は動かさない（品位。静かな看板のまま）。開幕にゆっくり opacity 0→1（2s）のみ可。
- 行間隔 2.2〜2.6s は「読み手の目が行を追い終える」呼吸。速くしないこと。

### 4.2 胡粉のにじみ — 扉に触れた指あと

扉は夜。黒い墨は見えないので、**薄めた胡粉（白顔料）が夜ににじむ**意匠にする:

```js
/* .novel（序・扉）への pointerdown で1つ生成。最大5個、古い順に消す */
function gofunNijimi(x,y){
  var s=document.createElement('span'); s.className='gofun';
  s.style.left=x+'px'; s.style.top=y+'px';
  door.appendChild(s); requestAnimationFrame(function(){ s.classList.add('bloom'); });
  /* 12s後に remove。生成数>5なら最古を即フェードアウト */
}
```

```css
.novel .gofun{ position:absolute; width:110px; height:110px; margin:-55px 0 0 -55px;
  border-radius:47% 53% 50% 50%/55% 45% 55% 45%;     /* 真円でない、にじみの輪郭 */
  background:radial-gradient(circle at 45% 42%, rgba(214,228,240,.16), rgba(214,228,240,.05) 55%, transparent 72%);
  filter:blur(3px); transform:scale(.15); opacity:0; pointer-events:none; z-index:1;
  transition:transform 1.8s cubic-bezier(.2,.7,.3,1), opacity 1.8s ease; }
.novel .gofun.bloom{ transform:scale(1); opacity:1; }
```

- 音は付けない。**墨も胡粉も、無音**。最初のタップは既存の音アンロック（`arm()`）と同じ操作なので、
  「触れた瞬間、にじみが生まれ、遠くで冬の風が鳴りはじめる」——既存の風の環境音が音側の返事になる。
- ここで指が覚えた「触れると世界が応える」が、結章の水面で回収される。**扉のにじみは伏線**である。

---

## §5. SD画像の扱い

- 全置換は不要。**要所だけコード描画に置換**: 結章の月・水面（§2）、KVの文字の現れ方（§4）。
- 四季の情景写真（雪国・桜・滝・祭・紅葉）はSD維持。ただし**低解像度のボケが目立つものは差し替え候補**。
  判断基準: 全画面背景で使われボケが目立つもの ＞ 小さく添える程度のもの。
- 当面はコード描画部分（水面・墨）の品質で"見せ場"を作り、SD写真は世界観の下地に徹させる。
  差し替え候補の洗い出しは Phase 4 で**提案に留める**（差し替え実行は要ユーザー確認）。

---

## §6. 実装フェーズと受け入れ条件（小さく安全に）

各Phase完了ごとに `app.js?v=NN` を+1してデプロイし、実機確認してから次へ進む。

### Phase 1（最優先）: 水面の作り直し
app.js 661〜720行の mizu IIFE を §2 の実装に全置換。index.html のcanvas/CSSを §2.2 に差し替え。
順序: ①静止した水面で**逆さ月が円に見える**こと → ②poke で屈折の揺れ → ③月の道 → ④凪検知と月の息。

受け入れ条件:
- [ ] 逆さ月が静止時に真円（柱・帯にならない）。タップで歪み、約5秒で円に戻る
- [ ] どのスクロール位置でも月・逆さ月が画面内（見切れなし）
- [ ] 結章以外の章で `.ph` の文字暗がり(::before)の位置が崩れていない
- [ ] 水面に触れたままの縦スワイプでページがスクロールする（scroll殺しなし）
- [ ] `body.mizu-active` で photoStage が消え、stop で hoshizora 写真へ滑らかに戻る

### Phase 2: 音・凪の余韻・reduced-motion・モバイル
雫（§3.1）・月の琴（§3.2）・ヒント（§2.8）・呼吸のさざなみと月の息（§2.5c）。

受け入れ条件:
- [ ] reduced-motion で Canvas 不起動・tsuki-mizu.png 静止表示・ヒント非表示
- [ ] ミュート時も水面演出は全て動く
- [ ] モバイル実機で 55fps 以上・横はみ出しなし・URLバー伸縮で下端が切れない
- [ ] 雫音の連打で音が濁らない（160ms間引きが効いている）

### Phase 3（P1）: KVの墨書き（§4）
水面が完成・本番検証済みになってから着手。CSS中心・app.js追加は胡粉にじみのみ。

受け入れ条件:
- [ ] 五行が順に「書かれて」ゆき、reduced-motion では全行静止表示
- [ ] タップで胡粉がにじむ（最大5個・音なし）。既存の音アンロックを阻害しない

### Phase 4: SD写真の品質棚卸し（§5）
差し替え候補リストの提案のみ。実行しない。

---

## §7. 検証

### QAフック（実装必須・Playwright前提）

mizu モジュールは以下を `window.__mizu` に公開する:

```js
window.__mizu = {
  energy: function(){ return E; },                  // 現在の水面エネルギー
  poke:   function(nx,ny,s){ poke(nx,ny,s); },      // 合成タップ（座標は水面帯正規化）
  state:  function(){ return { running:running, nagi:isNagi }; }
};
```

### Playwright手順

1. **`reducedMotion:"no-preference"` を必ず渡す**（渡さないとreduce扱いで水面が起動しない＝前回ハマった罠）。
2. `document.querySelector("[data-mizu]").scrollIntoView({block:"center"})` → rAF数フレーム待ち。
3. スクショA（静止・逆さ月が真円であること目視＋前回の「柱」画像と見比べる）。
4. `__mizu.poke(0.68, 0.4, 1)` → 400ms待ち → スクショB（月が歪み・月の道がきらめく）。
5. 6s待ち → スクショC（Aとほぼ同じ＝凪に戻る。`__mizu.energy()<0.012` をassert）。
6. `document.documentElement.scrollWidth <= innerWidth` で横はみ出しなし。
7. rAFカウンタで1秒間のフレーム数 ≥ 50 を確認（CPUスロットリング4xでも ≥ 30）。
8. 実機（スマホ）で最終確認。**CDNキャッシュのため `app.js?v=NN` を上げてデプロイ**。
   重要修正は「HTML→app.js?v=NN→マーカー文字列」を curl で辿り配信確認（CLAUDE.md の作法）。

---

## §8. 死守・禁止（地雷マップ）

- 世界観死守: 和紙/墨/明朝/旧字体（ゐ・思ひ出・触れてみられよ）/四季道中記/「会いたい君がいる現在地」。
  汎用SaaS風・派手なだけの演出は却下。
- 既存資産を壊さない: サウンドノベルのスクロール送り・四季BGM機構（manageBgm）・効果音・
  キャラりんく・フィナーレのアプリ紹介章「巻・携」・音アンロック（arm/unlockIOS）。
- 技術: 素のHTML/CSS/JS維持。重いライブラリ（Three.js等）追加しない（Canvas 2Dで足りる）。
- **`position:fixed` 全画面Canvasは二度と使わない**（前回失敗の主因）。
- **横スライス＋横ずらしの月は二度と描かない**（柱化の真因）。
- **水面Canvasでスクロールを殺さない**（touch-action:pan-y・passive・preventDefault禁止）。
- 一章一芸。結章以外に新演出を足さない。四章「間」には何も足さない。
- app.jsを変えたら `index.html` の `app.js?v=NN` を必ず+1（CDN immutableキャッシュ対策）。

---

## 付録: 出典と設計判断の記録

- 会議1（クラウド・design）: KV「墨と水の対話」/レイヤー分離/SD補完/段階的エンハンスメント。
- 会議2（ローカル込み・質優先・水面特化）: §0の技術解4点。height field 2バッファ方式が
  波紋リスト方式より軽く美しいと裏取り。
- Fable統合（本版）: sticky ホルダーによる §0 解1・4の実装形確定（kama前例・メモリ根拠）、
  「月の道」による失敗の反転、凪の報酬（月の息）、雫・月の琴の音設計、墨書き/胡粉の KV、
  一章一芸のリズム設計、QAフック `__mizu`。
- 判断の記録: 文字のSVG一画描画は却下（明朝テキストの検索性・a11y優先）。波紋の楕円ストローク
  描き足しは却下（屈折と二重の嘘になる）。スワイプ連続音は却下（静寂が主役）。
