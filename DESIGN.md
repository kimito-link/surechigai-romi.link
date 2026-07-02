---
identity:
  name: "surechigai-romi"
  productName: "君斗りんくのすれ違ひ通信"
  oneLine: "会いたい君がいる現在地"
  category: "location-based encounter memory app"
  audience:
    - "Xで自分の移動や推し活を共有したいユーザー"
    - "後から思い出の場所をたどりたいユーザー"
    - "推しの軌跡を聖地巡礼したいファン"
  mood:
    - "kimito light"
    - "precise location"
    - "nostalgic streetpass"
    - "X-native"
    - "fan pilgrimage"

designDials:
  designVariance: 7
  motionIntensity: 6
  visualDensity: 7
  emotionalSignal: 9
  operationalClarity: 8

brandCopy:
  primary: "会いたい君がいる現在地"
  supporting:
    - "すれちがいの足あとを、正確な場所として残す"
    - "あとで行ける精度で、思い出と軌跡をたどる"
    - "交流はXへ。アプリ内は一方向の合図に留める"
  avoid:
    - "近くの友達を探す"
    - "匿名で安全にマッチング"
    - "ぼかした位置だけを保存"

colorTokens:
  background: "#F0F4F8"
  surface: "#FFFFFF"
  surfaceEmphasis: "#E2EDF7"
  border: "#E2E8F0"
  text: "#0F172A"
  textSecondary: "#334155"
  textMuted: "#475569"
  primary: "#00427B"
  accent: "#DD6500"

typography:
  family: "system sans; monospace only for coordinates, h3 cells, debug-like data"
  letterSpacing: 0
  minBodySize: 12
  scale:
    meta: 12
    body: 14
    title: 16
    section: 20
    hero: 30
    maxHero: 36

layout:
  spacingBase: 8
  touchTargetMin: 44
  cardRadiusMax: 8
  circularControlsAllowed: true
  nestedCards: false
  decorativeFloatingCards: false
  firstScreen: "usable app surface, not a marketing landing page"

motion:
  motifs:
    - "radar pulse"
    - "scan line"
    - "signal glow"
    - "map pin focus"
  rules:
    - "Motion must clarify signal, location, or state."
    - "Respect reduced motion settings where the component already supports it."
    - "Do not add decorative blobs, orbs, or heavy gradient backgrounds."

verification:
  required:
    - "pnpm check"
  recommended:
    - "pnpm lint"
    - "pnpm test"
  visual:
    - "Check mobile and desktop widths for clipped text or overlapping UI."
    - "For map/location UI, verify the precise point, accuracy cue, and surrounding place context are visible."
---

# DESIGN.md

このファイルは、君斗りんくのすれ違ひ通信のUI/UXを実装するAIエージェント向けのデザイン契約です。  
UI、画面文言、レイアウト、配色、余白、モーション、地図表現を変更する前に必ず読みます。

## Core Identity

君斗りんくのすれ違ひ通信は、DSのすれ違い通信の懐かしさを、現代の位置情報とX前提の共有文化に合わせて再設計したアプリです。  
最重要メッセージは **「会いたい君がいる現在地」** です。このコピーは単なる見出しではなく、プロダクトの情緒と機能の中心です。

このアプリの価値は「誰かと近くで会えるかも」だけではありません。正確な場所を足あととして残し、後からその場所をたどれること、推しの軌跡をファンが聖地巡礼できることが重要です。地図、チェックイン、図鑑、レーダーのUIは、この価値が一目で伝わるように設計してください。

Web配信の正式対象は Chrome/Edge/Firefox 100+、Safari/iOS 15.4+ の現行ブラウザです。2021年以前から更新されていないブラウザはサポート対象外とします。

## Visual Taste

kimito.link 親ブランドに合わせ、**淡いクール白（#F0F4F8）** をページ地、**薄青（#E2EDF7）** をヘッダー・強調カード、**ネイビー（#00427B）** と **オレンジ（#DD6500）** をアクセントに使います。  
アプリ全体はライト UI 単一テーマです（旧 midnight ダークは廃止）。地図ヒーロー上のオーバーレイだけ、読みやすさのため白文字を許容します。

避けるべき方向:

- 黒一色のオンボード/モーダル（ライト shell と混在させない）
- 汎用SaaSのような白いカード中心の画面
- ベージュ、淡色グラデーション、抽象的な装飾だけで雰囲気を作る画面
- 機能説明テキストだけが目立つチュートリアル風の画面
- 角丸カードを何重にも重ねた、どこを押すべきかわからない画面
- 位置情報アプリなのに、地図や座標や周辺文脈が見えない画面

## Copy Hierarchy

`会いたい君がいる現在地` は、最初に目に入る感情の核として扱います。  
UI上では「現在地」を特に強調してよいです。これは、正確な場所を保存して後でたどれるという現行方針と直結します。

文言は短く、少し詩的で、でも操作判断は迷わせないこと。  
ボタンやエラーは実用的に書き、見出しや状態表示で情緒を出します。

良い方向:

- `現在地を記録する`
- `この場所に足あとを残す`
- `すれちがいを確認`
- `Xで続きを見る`
- `正確な場所を保存します`

避ける方向:

- `マッチングを開始`
- `友達を検索`
- `匿名で安全`
- `位置情報は保存されません`

## Layout Rules

最初の画面は、説明ページではなく使える画面にします。  
レーダー、チェックイン、地図、図鑑など、ユーザーが今すぐ状態を読めるUIを優先します。

カードは反復項目、モーダル、入力フォーム、明確に区切る必要がある道具に限定します。ページ全体をカード化したり、カードの中にさらにカードを重ねたりしないでください。標準カードの角丸は原則8px以下です。アイコンボタンやピンなど、形自体に意味がある要素だけ円形を使ってよいです。

モバイルでは、文字がボタンやカードからはみ出さないことを最優先します。長い文言は改行し、必要なら文言自体を短くします。フォントサイズをviewport幅で乱暴に拡大縮小してはいけません。

## Map And Location UI

正確な場所が価値の中心です。地図UIでは、可能な限り以下を見せます。

- 最新地点のピン
- 精度を示す円やラベル
- 周辺の道路、建物、ランドマーク
- 記録時刻
- 市区町村や都道府県

すれ違いマッチング用のH3や500mグリッドは内部処理として重要ですが、ユーザーに見せる主役は「あとで行ける具体的な場所」です。ぼかしすぎたり、抽象的なエリア名だけで終わらせたりしないでください。

## Screen Guidance

### Radar / Home

感情の入口です。`会いたい君がいる現在地` を強く扱い、レーダー、電波、信号、現在地の存在感を出します。  
ただし、説明過多にせず、今ログインしているか、記録できるか、次に押すべき操作は明確にします。

### Check-in

実用画面です。正確な位置を保存すること、保存後に何が起きるかを明確にします。  
ボタンは迷わせず、成功時は地図や軌跡の確認へ自然につながるようにします。

### Map

Appleの「探す」のように、場所が正確にわかることを優先します。  
ピン、精度円、周辺文脈、足あとリストを同時に理解できる密度にします。

### Zukan

コレクション画面です。達成感は出してよいですが、装飾よりも「どこを通ったか」「誰とすれ違ったか」が読み取れることを優先します。

### My Page / Settings

操作と設定の画面です。静かで高密度にし、過度な演出を避けます。アカウント、X連携、位置情報停止、ブロック/通報などの境界は誤操作しにくくします。

## Components

既存の `theme/tokens/` を優先して使います。`#RRGGBB` の直書きは原則 `theme/tokens/palette.ts` に集約してください。  
スペーシング、フォントサイズ、角丸、タッチターゲットは `theme/tokens/layout.ts` に従います。

アイコンが意味を伝えられる場合は、テキストだけの角丸ボタンにしないでください。React Native / Expo の既存アイコンセットや既存コンポーネントを優先し、新しいアイコン体系を勝手に増やさないでください。

## Motion

モーションは「信号を受信している」「現在地を測位している」「足あとが残った」ことを伝えるために使います。  
レーダーパルス、スキャンライン、ピンのフォーカス、軽いグローは許容します。画面全体を重くする装飾アニメーションは避けます。

## Contrast Contract（WCAG 2.1 AA）

- **本文（14px+）**: 背景とのコントラスト比 **4.5:1 以上** — `textPrimary` / `textSecondary` / `textMuted` on `kimitoBg` / `white` / `kimitoBlueSoft`
- **CTA**: 背景 `kimitoBlue` または `#0F1419`（X）+ 文字 `textOnAccent`（白）
- **禁止**: `textWhite` を `#E2EDF7` / `#FFFFFF` / 白カード上に使用。本文に `opacity < 0.75` を使わない
- **Web CTA**: `Link asChild` + `Pressable` だけに頼らず、[`KimitoLoginCta`](components/molecules/kimito-login-cta.tsx) のように `<a>` / `Link` へ背景色を直付け
- **最小サイズ**: 補助テキスト 12px（タブラベル 11px のみ例外）

## Anti-Slop Checklist

UI変更後、最低限これを確認してください。

- 最初の画面で、このアプリが位置情報のアプリだとわかる
- `会いたい君がいる現在地` または同等の核が弱くなっていない
- 正確な場所、足あと、すれ違い、X連携のどれかが視覚的に伝わる
- ボタンやカードの文字がモバイルで切れない
- 余白が広すぎて情報密度が失われていない
- 黒、ピンク、紫、ティール以外の色が主役になっていない
- 説明文を増やすだけでデザイン問題をごまかしていない
- 既存の仕様、認証、位置情報保存方針を変えていない

## Implementation Rule

UI/UXを変更する実装担当モデルは、作業前にこのファイルと `AGENTS.md` / `CLAUDE.md` を読み、変更理由をこのデザイン契約に結びつけて説明してください。  
判断に迷う場合は、見た目の好みではなく「正確な場所を残し、あとでたどれる体験が強くなるか」で決めます。
