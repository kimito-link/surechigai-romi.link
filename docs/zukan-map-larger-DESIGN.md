# zukanゲスト・デスクトップ地図拡大 設計書

> 設計 = Fable (`claude-fable-5`) ／ 素材集め・裏取り = 司令塔(Claude、このチャット) ／ 2026-07-21
> 3段構えワークフロー(`/council-fable`)の手順2の産物。会議ハーネス(groq複数モデル)の素材を土台に
> Fableが設計。数値・関数・ファイルパスは司令塔が本リポ実物と照合済み、実装後にブラウザで
> 1024px/1280px/1920px/モバイルの4サイズで実測検証済み。

## 背景

zukanゲスト画面(デスクトップ幅)で日本地図(`JapanBlockMap`)が小さく見える、との指摘を受けて調査した結果、
直前のセッションで別のバグ(`onLayout`未発火によるはみ出し)を修正済みだったが、正しいペイン幅に収まった
結果、地図の見た目自体は以前より小さくなっていた。今回は「本当に大きく見せる」設計。

## 会議の誤りと訂正(最重要)

会議ハーネス(groq複数モデル)は「`maxMapWidth`を1040→1200pxに上げれば地図が拡大される」という結論に
収束したが、**これは完全な誤り**。司令塔が実際に計算式をNode.jsで実行してシミュレーションした結果:

```
avail = Math.min(availableWidth - 24, maxMapWidth)
```

`availableWidth`(ペイン幅、1024px画面で463px)が常に`maxMapWidth`(1040や1200)より小さいため、
`maxMapWidth`をどれだけ上げても`avail`は変化せず、`cellSize`は28pxのまま固定される
(実際に計算して確認済み)。**`maxMapWidth`は上限キャップ(min)であり、上げても地図は大きくならない。
ボトルネックは常にペイン幅(`availableWidth`)自体**。

## 結論

1. **zukan固有に右パネルを360px→280pxへ縮める**。`OneTapGuestShell`に optional prop
   `heroPanelWidth`(デフォルト360)を追加し、zukanだけ280を渡す。共通定数
   `HERO_DESKTOP_PANEL_WIDTH`自体は変更せず、checkin/map/mypageは無影響(実装後に4画面とも
   ブラウザで確認済み)。
2. **`HERO_MAX_MAP_WIDTH`を1040→760へ引き下げる**(上げるのではなく下げる。これが唯一
   `maxMapWidth`が意味を持つ方向)。目的は超ワイド画面での間延び防止と、地図の縦寸を
   ビューポート内に収めること。

## 具体的な数値設計(実装後にブラウザで実測検証済み)

計算式:
```
heroMapWidth = W - 200(WEB_SIDE_NAV_WIDTH) - P(パネル幅) - 1
avail        = min(heroMapWidth - 24, maxMapWidth)
cellSize     = max(20, floor((avail - 3×13) / 14))
showFullName = cellSize >= 42
```

### 現状(P=360, maxMapWidth=1040、変更前)

| ウィンドウ幅 | ペイン幅 | avail | cellSize | 表記 |
|---|---|---|---|---|
| 1024 | 463 | 439 | 28 | 2文字 |
| 1280 | 719 | 695 | 46 | フルネーム |
| 1920 | 1359 | 1040 | 71 | フルネーム(ビューポート超過) |

### 新設計(P=280, maxMapWidth=760、実装・検証済み)

| ウィンドウ幅 | 実測cellSize | 表記 | 検証方法 |
|---|---|---|---|
| 1024 | **34px**(設計値34と一致) | 2文字 | ブラウザ実測(`getBoundingClientRect`) |
| 1280 | **51px**(設計値51と一致) | フルネーム(北海道・神奈川・和歌山・鹿児島) | ブラウザ実測 |
| 1920 | **51px**(プラトー、設計値と一致) | フルネーム | ブラウザ実測、1280pxと同値=間延び防止確認 |
| モバイル375px | 22px(変更前と同一) | 2文字 | `isDesktop=false`のため無風、実測確認済み |

パネル幅も実測で**280px**(コンテンツ幅231px)と設計値通りであることを確認済み。見出し
「会いたい君がいる現在地」は1行に収まり折り返し崩れなし。

### パネル280pxの根拠(実スタイル値からの逆算)

`heroPanel`は`padding:24×2 + borderLeft:1` → コンテンツ幅 = P - 49。P=280でコンテンツ幅231px。

見出し(fontSize20、11文字)は約220px、BenefitRow最長ラベル「Xでシェア」は3項目で約181px、
CTAボタンは約150px、注記は約190px。理論最小は約230pxだが、見出し1行維持の余裕を見て280pxを採用。

## コンポーネント変更の具体機構(実装済み)

### 1. `components/organisms/one-tap-guest-shell.tsx`
- `OneTapGuestShellProps`に`heroPanelWidth?: number`を追加
- `OneTapGuestShell`の引数に`heroPanelWidth = HERO_DESKTOP_PANEL_WIDTH`をデフォルト値として追加
- `heroMapWidth`計算式の`HERO_DESKTOP_PANEL_WIDTH`を`heroPanelWidth`に置き換え
- `heroPanel`のJSXに`{ width: heroPanelWidth }`のinlineスタイルを追加
- `styles.heroPanel`から`width: HERO_DESKTOP_PANEL_WIDTH`を削除(二重定義防止)

### 2. `app/(tabs)/zukan.tsx`
- `const ZUKAN_HERO_PANEL_WIDTH = 280;`を追加
- `<OneTapGuestShell>`に`heroPanelWidth={ZUKAN_HERO_PANEL_WIDTH}`を追加

### 3. `components/organisms/zukan-guest-live.tsx`
- `HERO_MAX_MAP_WIDTH`を`1040`→`760`に変更(コメントで「上げても大きくならない」旨を明記)

## 他3画面(checkin/map/mypage)への影響評価

**影響ゼロ(実装後にブラウザで確認済み)。** `heroPanelWidth`はデフォルト引数360で、
`checkin.tsx`/`map.tsx`/`mypage.tsx`はこのpropを渡さないため現状と完全同一のレイアウトになる。
checkin画面のパネル幅を実測したところ360pxのまま(変更前と同一)であることを確認済み。

`one-tap-guest-previews.tsx`の`CheckinGuestPreview`/`TrailGuestPreview`/`MypageGuestPreview`は
いずれも`PreviewSurface`(`StyleSheet.absoluteFillObject`)+SVG`preserveAspectRatio="xMidYMid slice"`で
左の地図ペインを全面充填する構造であり、右パネル幅にもペイン幅の具体値にも依存しない
(コード確認済み)。パネル幅が影響するのは`OneTapGuestShell`共通の`heroPanel`内
(見出し・BenefitRow・CTA)のみで、そこはzukanだけ280pxになる。

## 捨てた案と理由

| 案 | 却下理由 |
|---|---|
| **maxMapWidth 1040→1200(会議の収束案)** | 数学的に無効。`min(519, 1200) = min(519, 1040) = 519`。対象画面幅では死んだノブ |
| **CSS transform scaleで見た目だけ拡大** | liveRow・チップとの重なり/クリッピングが発生し、overflow:hidden見切れバグの再来になる |
| **HERO_DESKTOP_PANEL_WIDTH自体を280に変更(全画面)** | プレビューは非依存だが、checkin/map/mypageの装飾プレビューはペインが広がっても得るものがなく、影響範囲拡大の割に利益なし |
| **パネル240pxまで縮める** | cellSize +3px程度の微益に対し、見出し・ctaNoteが2行化するリスク |
| **2ペイン廃止・縦積み/オーバーレイパネル化** | ヒーロー構造の大規模変更。直前に確立したばかりの構造を壊す過剰設計 |
| **outerPadding 24→8** | cellSize +1px程度の微益。`JapanBlockMap`は認証済みzukanでも共用のため影響範囲が広い |
| **ヒーロー高さを実測してcellSizeを高さ制約でも決める** | onLayout/ResizeObserverがSuspense境界越しに発火しない問題こそが直前バグの真因。計測依存の再導入は回帰リスクそのもの |

## 地雷と回避策

1. **`maxMapWidth`は「上げても大きくならない」ノブ**。`min()`の上限側なので、拡大目的で触るのは
   常に無意味(縮小のみ有効)。コードコメントに明記済み。
2. **onLayout計測の再導入禁止**。Suspense境界を挟むと一度も発火しない(コミット0af336023の教訓)。
   幅は必ず`OneTapGuestShell`の計算値をrender prop経由で受け取る。
3. **1920pxでのcellSize縮小(71→51)は仕様であり回帰ではない**。「前より小さくなった」と
   誤判定しないよう、コミットメッセージと`HERO_MAX_MAP_WIDTH`のコメントに縮小理由を明記済み。
4. **`scripts/qa/monkey-guest.mjs`がOneTapGuestShellのレイアウトに依存するアサーションを
   持つ可能性**は未検証。別途モンキーテスト実行時に確認すること。
