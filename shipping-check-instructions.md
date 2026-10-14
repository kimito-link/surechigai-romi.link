# shipping-check-instructions.md

> 実装担当モデル（Codex 等）へ: このファイルに書かれたことを完遂せよ。
> **目的は「出荷して恥ずかしくない状態にすること」。** 見た目を綺麗にすることではない。

---

## Objective

本番稼働中（https://surechigai.kimito.link）かつ iOS/Android がストア審査中のアプリに対し、
**出荷レベルの品質チェックを行い、見つかった不具合を安全に直す。**

特に以下の2領域を重点的に洗う。ユーザーから「うまくいっていない・おかしい部分がたくさんありそう」
という指摘が出ている箇所である。

1. **スプラッシュ / 起動体験**
2. **共有（シェア）まわり**

**やらないこと**: 大規模リファクタ。UI意匠の変更。新機能。

---

## いちばん大事な前提: このリポジトリは「緑なのに壊れている」が頻発する

**過去に実際に起きたこと。同じ轍を踏むな。**

| 事故 | 自動チェックはどうだったか |
|---|---|
| OGPの丸ピンが本番で一度も出ていなかった | `curl -I` は 200 / image/png を返す。**画像を落として目視**して発覚 |
| 本番全ページ白画面 | `curl` では正しいJSが返る。CDNがHTMLを配信していた |
| ライブカメラが押すとエラーページ | 型・テスト・lint すべて素通り。**実リンクを叩いて**発覚 |
| ログインボタンが無反応（App Store 却下） | tsc 0・テスト全緑。**実機を触って**しか分からない |
| 許可リストから外してもテストが緑 | grepで書いたテストが実挙動を見ていなかった |

**したがって本作業では、次を鉄則とする。**

- **HTTPステータスを根拠にしない。** 画像は落として**目視**、ページは**実ブラウザで描画**して確認する
- **テストが緑であることを根拠にしない。** そのテストが**壊したときに落ちるか**（変異テスト）を確かめる
- **同じ機能に経路が2本あることを常に疑う**（Web/ネイティブ、地図/夜景、バー/シート）。
  片方だけ直して本番に出ない事故が実際に複数回起きている

---

## Baseline（2026-08-21 実測。編集前に必ず再取得すること）

```bash
git status --short
pnpm check
pnpm test
pnpm lint 2>&1 | tail -3
```

| 項目 | 実測値 |
|---|---|
| `pnpm check` | **0エラー** |
| `pnpm test` | **814 passed / 100ファイル** |
| `pnpm lint` | **0 errors / 574 warnings** |
| `git status` | 下記の**未追跡6件のみ**。追跡ファイルの変更（`M`）は無いこと |

`git status --short` の期待値（この6件は**想定内。停止理由にしない**）:

```
?? dist-map/
?? dist-perf/
?? dist-pl/
?? dist-pl2/
?? refactor-instructions.md
?? shipping-check-instructions.md
```

- `dist-*` 4件 … ビルド成果物（計273MB）。**触るな・`git add` するな**（後述 S6 で .gitignore に追加する）
- `refactor-instructions.md` … 別タスクの指示書。**触るな**
- `shipping-check-instructions.md` … **本指示書そのもの。** 当然存在する。**触るな**

**停止すべきなのは「追跡ファイルに `M`（変更済み）がある場合」**、
または上記6件以外の未追跡ファイルがある場合。
未追跡ファイルが上記と一致するなら**そのまま Phase 1 へ進んでよい**。

`pnpm check` / `pnpm test` / `pnpm lint` が baseline と違う場合は、
**そこで止まって報告する。** 自分の変更前から壊れているものを、自分が直そうとしないこと。

### 既存の検査資産（すでにある。作り直すな）

```bash
node scripts/lint-pre-submission.mjs      # ストア提出前チェック（現在: All passed / warn 2）
node scripts/check-tracked-imports.mjs    # 現在 PASS
node scripts/check-hermes-unsafe-imports.mjs  # 現在 PASS
node scripts/check-esm-imports.mjs        # 現在 PASS
node scripts/check-native-unsafe-dom.mjs  # ★現在 FAIL（後述 S1。ただし誤検知）
node scripts/check-doc-links.mjs          # 現在 OK（183ファイル）
pnpm check:live-cameras                   # 外部リンクの死活（外部サイトに負荷。頻繁に叩かない）
pnpm check:a11y                           # axe。要ビルド
pnpm qa:monkey / qa:monkey:auth           # モンキーテスト
node scripts/qa/responsive-audit.mjs      # 14ルート×7画面幅の実測
```

---

## 調査済みの所見（追試して、正しければ直す）

**以下は本指示書の作成時に実測した結果である。** ただし**鵜呑みにせず追試すること。**
「誤検知だった」と判断したら、その根拠とともに報告してよい。

---

### S1. `check-native-unsafe-dom` が FAIL するが、中身は誤検知2件 ★要対応

- **実測**: 実行すると NG 2件。
  - `components/auth/auto-advance-to-x.tsx:168` … `observer.observe(document.body, {`
  - `lib/_core/manus-runtime.ts:112` … `window.addEventListener("message", handleMessage)`
- **追試した結果、どちらも実害は無い**:
  - `manus-runtime.ts` は関数の冒頭が `if (!isWeb() || !isInIframe()) return;`（107行）で守られている
  - `auto-advance-to-x.tsx` は `hasAutoXParam()`（26行）が
    `if (Platform.OS !== "web" || typeof window === "undefined") return false;` を持ち、
    それが false なら `shouldAutoAdvanceToX` が false を返して**`document.body` に到達する前に return する**
- **なぜ問題か**: **このゲートは CI にも package.json にも登録されていない**（grep で確認済み）。
  つまり「誰も実行しないまま FAIL し続けている」。
  かつ誤検知を出すので、実行しても信用されず**本物を見逃す**。
  このリポジトリは `window.addEventListener` が原因で **App Store 却下（iOS 518）**を食らっている。
  この検査は本来いちばん効くはずの砦である。
- **やること**:
  1. 検出器を「関数の冒頭ガードを見て早期returnを認識する」形に改善するか、
     **既知の安全な箇所を理由付きで除外リストに入れる**
  2. **改善後、わざと危険なコードを1行足して検出されることを確認する**（変異テスト）。
     確認後その行は必ず削除する
  3. `package.json` の `check` に組み込む
- **注意**: 除外リストで黙らせるだけの対応は**しないこと**。
  「なぜ安全か」をコメントで残し、将来ガードが外れたら再び検出される形にする
- **今やってよいか**: **やってよい（Phase 2）**

---

### S2. スプラッシュ画像の元データが 200x200 ★要判断

- **実測**: `assets/images/splash-icon.png` は **200x200 px / 36KB**。
  `app.config.ts` の `expo-splash-screen` 設定は `imageWidth: 200`, `resizeMode: "contain"`。
- **なぜ問題か**: `imageWidth` は**ポイント指定**。3x 端末では 200pt = **600px** で描画されるため、
  200px の元画像が**3倍に引き伸ばされる**。ロゴの輪郭が甘くなる。
  ユーザーから「スプラッシュ画面が上手くいってない」という指摘が出ている。
- **確認方法**: 元画像を実際に開いて、意図した見た目か・余白が適切かを**目視**する。
  可能ならシミュレータで起動時の実表示を撮影して比較する。
- **やること**: 元画像を **600x600 以上**（できれば 1200x1200）で用意し直す。
  `imageWidth` の値は**変えない**（変えるとレイアウトが変わる）。
- **今やってよいか**: **画像の差し替えはプロダクト判断。** → **Stop And Ask（Q1）**
  ただし「現状が何px で、何倍に拡大されているか」を**実測して報告する**のは今やってよい

---

### S3. `pnpm splash:sync` が実行するたびにファイルを書き換える ★要対応

- **実測**: `node scripts/sync-splash-spec.mjs` を**引数なしで実行すると、
  検査ではなく生成が走り**、`app/+html.tsx`（122行）と
  `scripts/data/ios-launch-sizes.json` を書き換える。
- **`git diff -w` で確認したところ、実質的な差分は無い。**
  変わっているのは **CRLF/LF の改行コード（128行）** と `_syncedAt` の日付だけ。
- **なぜ問題か**:
  - 検査のつもりで叩くと**作業ツリーが汚れる**。CI に入れたら毎回差分が出る
  - 122行の無意味な差分が出るので、**本物の変更が埋もれる**
  - `verify-ios-splash-not-default.mjs` は `--snapshot` / `--verify` を要求するのに、
    こちらは引数なしで破壊的に動く。**同じ用途のスクリプトで作法が違う**
- **やること**:
  1. 改行コードを既存ファイルに合わせて出力する（差分を出さない）
  2. `--verify`（差分があれば非0で終了・書き換えない）モードを追加する
  3. `_syncedAt` は差分の原因になるので、**verify では比較対象から外す**
- **検証方法**: 2回連続で実行して `git status` が汚れないこと。
  かつ、わざと `+html.tsx` の link を1つ消して `--verify` が**落ちる**ことを確認する
- **今やってよいか**: **やってよい（Phase 2）**

---

### S4. 共有まわりは実装が集約されていて健全 ★調査のみ

- **実測**: `lib/share.ts` に公開関数10個が集約され、呼び出し元は4ファイルのみ。
  関連テストは **8ファイル / 60件が緑**。
  （`shareToTwitter` `shareToThreads` `shareApp` `shareMyLocation` `copyShareLinkForInstagram` 等）
- **本番実測**: `/u/kimito_link` `/u/test` ともに **200**。`/api/og` は **1200x630 / 98KB の実PNG**。
- **`og:image` が `/og-default.png` を指す件は仕様。** バグではない。
  `api/u/[slug].ts:103` に「slug が座標解決できれば `/api/og`、できなければ静的画像へフォールバック」
  と明記されている（外部fetch依存を排除するため・2026-07-13）。
- **やること**: **実在するユーザーのslugで**共有を実行し、
  1. X の投稿画面が開くか
  2. そこに出る OGP 画像が**その人の場所を示しているか**（`/api/og` 側が使われているか）
  を確認する。**画像は落として目視すること**（`curl -I` の 200 は根拠にならない）
- **今やってよいか**: **調査と報告のみ。** 直し方は結果を見てから決める

---

### S5. OGP画像の見た目に気になる点（要判断）

- **実測**: `/api/og?slug=kimito_link`（＝解決できない slug）で生成した画像を目視した結果:
  - 「**日本のどこか**」と表示されるが、**日本地図と現在地ピンが描かれている**。
    場所が特定できていないのに場所を示すUIが出ており、意味が矛盾して見える
  - 吹き出しからピンへ伸びる**引き出し線が左に飛び出し、ピンとつながっていない**ように見える
- **注意**: これは**解決できない slug の場合の表示**。
  実在ユーザーでは正しく見えている可能性がある。**先に S4 で実ユーザーの画像を確認すること。**
- **今やってよいか**: **提案のみ。** 意匠の判断であり `DESIGN.md` の管轄。→ **Stop And Ask（Q2）**

---

### S6. `dist-*` が .gitignore に無い ★要対応

- **実測**: `dist-map/` `dist-perf/` `dist-pl/` `dist-pl2/` が未追跡で存在。**計273MB**。
  `.gitignore` は `dist/` のみ。
- **なぜ問題か**: `git status` を常に汚し、**`git add -A` で巻き込む事故の温床**。
  このリポジトリは過去に `.npm-cache` を巻き込んで commit がタイムアウトし、
  作業ツリーを壊しかけた実績がある。
- **やること**: `.gitignore` に `dist-*/` を追加。**ディレクトリ自体は削除しない**（用途不明のため）
- **今やってよいか**: **やってよい（Phase 2）**

---

## Phase 構成

**各フェーズの終わりに検証してコミットする。フェーズを飛ばさない。**

### Phase 0: 現状の記録（編集禁止）

Baseline を全て取得して記録する。既存の検査資産を一通り走らせ、
**どれが通り、どれが落ちるか**の一覧を作る。

**成果物**: 記録のみ。コミットなし。

---

### Phase 1: 実機・実ブラウザでの洗い出し（コード変更なし）

**ここが本作業の中心。** 静的解析ではなく**実際に触って**確認する。

#### 1-A. 起動体験

1. Web（本番）を**実ブラウザ**で開き、初回描画までに**何が見えるか**を記録する
   - ブートベール → 中身、の間に**無地やタブバーだけの瞬間が露出しないか**
   - 375x812（モバイル）と デスクトップ幅の両方
2. PWA としてインストールした状態でも同じ確認をする
   - `apple-touch-startup-image` が効いているか（21件の画像は本番配信を確認済み）
3. 可能ならシミュレータでネイティブ起動を撮影する

#### 1-B. 共有（S4）

**実在するユーザーの公開ページ**で、以下を経路ごとに確認する。

| 経路 | 確認すること |
|---|---|
| Web ブラウザ | X の投稿画面が開くか / OGP画像が正しいか |
| PWA（standalone） | 同上。**過去に `window.open` が null を返して失敗した経路** |
| ネイティブアプリ | 同上。**過去にウォームが不発で灰色画像になった経路** |
| Threads | 投稿画面が開くか |

**OGP画像は必ずダウンロードして目視する。**

#### 1-C. 主要導線のモンキーテスト

```bash
pnpm qa:monkey          # ゲスト
pnpm qa:monkey:auth     # 認証済み（要 auth-state）
node scripts/qa/responsive-audit.mjs
```

**成果物**: 見つかった不具合の一覧。各項目に
「再現手順 / 実際に何が起きたか / 期待 / 影響範囲 / 深刻度」を書く。**この時点では直さない。**

---

### Phase 2: 明らかに安全な修正

1. **S6**: `.gitignore` に `dist-*/` を追加
2. **S3**: `sync-splash-spec.mjs` に `--verify` を追加し、改行コードで差分を出さないようにする
3. **S1**: `check-native-unsafe-dom` の誤検知2件を解消し、`pnpm check` に組み込む
   - **必ず変異テストを行う**（危険なコードを1行足して検出されることを確認し、削除する）

**検証**: `pnpm check` 0エラー / `pnpm test` 814件以上緑 / `pnpm lint` 0 errors・574以下

**コミット**: 3つに分ける

---

### Phase 3: Phase 1 で見つかった不具合の修正

**Phase 1 の一覧を報告し、どれを直すか指示を仰いでから着手する。**

修正するときの決まり:

- **1つの不具合 = 1コミット**
- **同じ機能の経路が2本ないか必ず確認する**（Web/ネイティブ、地図/夜景、バー/シート）
- 回帰テストを書く。**書いたら変異テストで「壊したら落ちる」ことを確認する**
- 本番反映後、**実ブラウザ／実画像で直ったことを確認する**

---

### Phase 4: 提案のみ（実装禁止）

- **S2**: スプラッシュ元画像の差し替え（意匠判断）
- **S5**: OGP画像の「日本のどこか」表示と引き出し線（意匠判断）
- Phase 1 で見つかったもののうち、意匠・仕様判断を含むもの

**成果物**: `docs/shipping-findings-<日付>.md`

---

## Non-Negotiables

- **最初に `git status` を確認する。** `dist-*` 4件が未追跡で存在する
- **`git add -A` / `git add .` を使わない。** 必ずファイルを明示列挙する
- **`dist-*` を絶対に `git add` しない**
- 編集前に baseline を記録する
- **1コミット = 1つの意味のある変更**
- **無関係な整形をしない**（prettier の全体がけ禁止）
- **既存挙動を勝手に変えない**
- **正しさが不明なら実装を止めて質問する**
- 各フェーズごとに検証する
- 最後に実行したコマンドと結果を報告する
- コメントは日本語で、**「何をしたか」でなく「なぜそうしたか」**を書く
- 応答は日本語（AGENTS.md ディレクティブ3）

---

## Stop And Ask Conditions

以下は**実装せず質問する**。

1. `drizzle/schema/` `drizzle/migrations/` の変更
2. 認証の**振る舞い**の変更（`lib/auth-context.tsx` / `components/providers/clerk-*` / `server/twitter-oauth2.ts`）
3. 課金（`server/routers/premium.ts` / `api/revenuecat-webhook.ts`）
4. `api/og.tsx` の**画像デザイン**の変更
5. tRPC のプロシージャ名・入出力型の変更
6. `theme/tokens/index.ts` の `CDN_CACHE_EPOCH`
7. `app.config.ts` / `eas.json` / `.github/workflows/ios-*` `android-*`
8. **画像アセットの差し替え**（意匠判断）
9. 「テストが実装と矛盾している」と気づいたとき
   （**テストを実装に合わせて書き換えるのは禁止**）
10. コードを消す判断で、使われていない確証が取れないもの

---

## Verification Requirements

各フェーズの終わりに全て実行し、結果を記録する。

```bash
pnpm check
pnpm test
pnpm lint 2>&1 | tail -3
node scripts/lint-pre-submission.mjs
git status --short
```

| 項目 | 合格条件 |
|---|---|
| `pnpm check` | **0エラー**（1つでも増えたら不合格） |
| `pnpm test` | **814件以上が緑**。減ったら不合格 |
| `pnpm lint` | **0 errors** / warnings **574以下** |
| `lint-pre-submission` | All passed |
| `git status` | 意図したファイルのみ（Phase 2 で `.gitignore` に `dist-*/` を足した後は、
未追跡が `refactor-instructions.md` と `shipping-check-instructions.md` の2件だけになる。**これは正常**） |

**テストを書いた／検査を直したフェーズでは、変異テストを必ず行う。**
検証対象をわざと壊し、**実際に落ちること**を確認してから元に戻す。
「緑だから守れている」は証拠にならない（このリポジトリで実際に複数回起きている）。

---

## Reporting Format

```markdown
## Phase N: <名前>

### やったこと
- <ファイルパス付きで箇条書き>

### 実行したコマンドと結果
| コマンド | 結果 |
|---|---|
| pnpm check | 0エラー |
| pnpm test | 814 passed |

### 変異テスト
- <何を壊したか> → <落ちた検査/テスト名> … 戻して緑を確認

### 実機・実ブラウザで確認したこと
- <何を見て、どう見えたか。スクリーンショットがあれば添付>

### 判断に迷った点 / 質問
- <無ければ「なし」>
```

---

## Out-of-scope Items

- UI意匠の変更（配色・余白・文言・レイアウト・モーション）
- 新機能の追加
- 依存パッケージの更新・追加・削除
- DBスキーマ・マイグレーション
- tRPC の契約変更
- 認証・課金・外部API連携の**振る舞い**の変更
- `scripts/` の審査・デプロイ自動化スクリプトの作り直し
- prettier の全体がけ / import順の一括整理
- **未使用に見えるコードの削除**（確証が取れない限り）
- パフォーマンス最適化（別途 PageSpeed の計測基盤がある）
- `refactor-instructions.md` の範囲（そちらは別タスク）

---

## 付録: このリポジトリ特有の地雷

1. **Hermes に `window.addEventListener` / `document` が無い。**
   `typeof window === "undefined"` のガードはすり抜ける。
   ネイティブで DOM API を触るなら `Platform.OS !== "web"` で先に返す。
   **これで App Store 却下（518）を食らっている**
2. **`api/*.ts`（Edge Function）は dev サーバに載っていない。**
   `server/_core/index.ts` は `api/weather.ts` も `api/live-stream.ts` もマウントしない。
   dev で 404 は正常。検証は実ハンドラを `.mts` で直接叩くのが速い
3. **Metro は `EXPO_PUBLIC_*` しか静的置換しない。**
   CI の job env だけではバンドルに届かず、`.env` の書き出しが要る
4. **`version.json` の一致はデプロイの証明にならない。**
   反映されないときは `theme/tokens/index.ts` の `CDN_CACHE_EPOCH` を +1
5. **外部リンクの許可リスト漏れは無言で `false`。** 押しても何も起きない
6. **同じ機能に経路が2本ある**（OGPの地図/夜景、いまの様子のバー/シート、Web/PWA/ネイティブの共有）。
   **必ず全経路を確認する**
7. **`useWindowDimensions` は初回 0 を返す。** 寸法0で画像が消える
8. **Windows + Git Bash。** コマンドは Git Bash 形式。日本語パスは引用符で囲む。
   PowerShell 用のコマンドは動かない
9. **`git add -A` 禁止**（273MB の `dist-*` を巻き込む）
