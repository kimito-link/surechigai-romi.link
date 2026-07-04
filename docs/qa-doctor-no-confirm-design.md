# QA ドクター「ユーザーに確認させない最大化」設計

作成: 2026-07-04（Fable）
関連: `docs/qa-toolkit-design.md`（QA ツールキット全体） / `scripts/qa-doctor.mjs` / `scripts/save-auth-state.mjs`
メモリ: [[surechigai-auth-home-oom]]

---

## 0. 発端と目標

2026-07-04、`pnpm qa:doctor` 実行時に X ログイン画面が開いてから **5分間「ログイン: 未検知」のままタイムアウトで失敗**した。
ユーザーが何をしていたか（放置 / エラー / 2要素認証で停滞）は一切分からず、以降の soak / first-load 検証も走らなかった。

目標: **Xログイン（本人にしかできない操作）を除き、ユーザーへの確認・待機・手動判断をゼロにする。**
これを次の3層に分解する。

| 層 | 意味 | 本設計での対応 |
|---|------|--------------|
| A. 聞かない | 確認プロンプト・メニューを出さない | 済（qa-doctor は全自動フロー。地雷マップ§2 で確立済み） |
| B. 待たせない | 人間待ちの時間に無駄な直列待機を作らない | ログイン待機と並列化できるのはゲスト計測のみ（§4。設計のみ、実装は次チャット） |
| C. 聞き返さない | 失敗しても「何が起きたか」を人間に質問せず証跡から自己回答する | **本設計の中核**（§2〜§3。実装済み） |

---

## 1. 会議素材（4体LLM）の採否

| 提案 | 採否 | 理由（実コードでの裏取り結果） |
|------|------|------------------------------|
| 待機時間を「並列診断ステージ」に再定義 | **条件付き採用（設計のみ）** | 並列化してよいのは「人間待ち（ログイン監視）」との重ねだけ。soak / first-load は CPU 4x スロットリング下で heap / paintFps / longtask を計測しており、別ブラウザを並走させると計測が歪む。→ §4 の制約付き設計 |
| クッキー汚染リスク（gpt-oss-120b） | **却下（現構成では非該当）** | 実コードを確認: save/soak/first-load/one-tap は各々 `chromium.launch()` で**別ブラウザプロセス + 新規 context** を起動しており cookie 共有経路がない。`one-tap-x` プロジェクトは `playwright.config.ts` で storageState 非注入（ゲスト固定）。同一 context の共有はどこにも存在しない。汚染の代わりに本当のリスクは **CPU 競合による計測歪み**（上記） |
| タイムアウト時の証跡自動収集 | **採用（実装済み）** | first-load-crash.mjs で確立済みの「ndjson 即時フラッシュ + 定期スクリーンショット」方式に統一（§2）。ただし `page.context().tracing` は却下: (1) トレースには入力スナップショットが含まれ **X のパスワード入力画面を記録するプライバシー問題**、(2) `tracing.stop()` まで書き出されないためプロセス途中死で消える、(3) zip が大きい。ndjson は1行ずつフラッシュされ、途中死でも残る |
| 総合判定サマリーを最優先で出力 | **採用（実装済み）** | qa-doctor の全体結果の先頭に「総合判定: OK/NG — 理由」を1行で出す（§5） |
| 定期スクリーンショット 10〜30秒毎 | **採用（30秒毎）** | ログイン待機は人間速度なので 30 秒で十分。first-load（機械速度の急性クラッシュ）は既存の 2 秒毎を維持 |
| `page.on('event')` 等のコード例 | **却下** | 実在しない API。Playwright の実 API（`page.on("console"/"pageerror"/"crash")`, `context.on("page")`）で実装 |
| 心理的障壁は自動化で診断できない（gemma4） | **採用（設計で吸収）** | 「確認しない」と「見捨てない」を両立させる3点セット: アイドルベースのタイムアウト延長 + 停滞ヒント + タイムアウト時の詰まりどころ推定（§3） |

---

## 2. タイムアウト証跡の自動収集（`scripts/save-auth-state.mjs`・実装済み）

### 原則: 判定と証跡を分離する

地雷マップ§1（ログイン判定の偽陽性バグ）を踏まえ、**ログイン判定は従来どおり Clerk cookie `__client_uat != "0"` のみ**。
証跡収集はすべて読み取り専用で、判定条件には一切影響しない。

### 収集内容（`qa-results/auth-save/<timestamp>/`）

| ファイル | 内容 | タイミング |
|---------|------|-----------|
| `timeline.ndjson` | heartbeat（URL・画面説明・cookie 状態）/ navigated / popup-opened / console-error / pageerror / page-crash / stuck-hint-shown / deadline-extended / login-detected | 発生の都度・即時フラッシュ（first-load-crash.mjs と同方式。途中死しても残る） |
| `shots/t{sec}s.png` | 待機中のスクリーンショット | 30秒毎（x.com の画面も撮れる） |
| `final.png` | タイムアウト確定時の最終画面 | タイムアウト時 |
| `page.html` | `page.content()` の DOM ダンプ | タイムアウト時 |
| `summary.json` | 結果種別（saved-and-verified / timeout / aborted-browser-closed 等）+ 診断 + 最終アイドル秒数 | 終了時（成功・失敗とも） |

### プライバシー注意

スクリーンショットに X のユーザー名・メールが写り得る（パスワードはマスク表示）。
`qa-results/` は `.gitignore` 済み（確認済み）。**コミット・共有禁止**。`tracing` を使わない理由もこれ（§1）。

---

## 3. 「確認しない」と「見捨てない」の両立（実装済み）

gemma4 の批判（完全自動化すると、ユーザーが詰まっていても「タイムアウトしました」を繰り返すだけになる）への回答。
**人間に質問はしないが、人間の状態を推定して先回りする**。

1. **アクティビティ検知**: `context.addInitScript` で全ページ（x.com 含む）に keydown / pointerdown の最終時刻を記録。
   これで「操作中」と「放置」を機械的に区別できる。
2. **アイドルベースのタイムアウト延長**: 期限到達時、直近1分に入力または画面遷移があれば締切を2分自動延長
   （開始から絶対上限15分）。2要素認証や CAPTCHA で手間取っているユーザーを「時間指定し直して再実行」させない。
   逆に完全放置なら既定5分で早期に確定し、証跡付きで失敗を返す。
3. **停滞ヒント**: 同じ画面に90秒以上とどまったら、ターミナルに一度だけ
   「操作を続ければ自動延長される / エラーならブラウザを閉じれば即中断・証跡保存」を案内。
   ブラウザを閉じる = ユーザー側からの唯一の中断シグナル（既存挙動を活用。新しい確認 UI は作らない）。
4. **詰まりどころ推定（`diagnoseStuck`）**: タイムアウト確定時に最終 URL のホスト + `body.innerText` から仮説を出す:
   - x.com + 認証コード系文言 → 2要素認証で停滞
   - x.com + エラー系文言 → X 側エラー/制限
   - アプリの `/sign-in?auto=x` のまま → 1タップ導線の空振り疑い（`--only=one-tap` を案内）
   - clerk ドメイン → コールバック停滞
   - about:blank → ネットワーク断
   加えて最終入力からの経過時間で「放置の可能性が高い」を明示する。
   **あくまでヒューリスティクスであり確定診断ではない**（出力にもその旨を含む文体にしてある）。

---

## 4. 並列診断ステージ（設計のみ・次チャットで実装）

### 制約（これを破ると計測が壊れる）

- **並列化してよいのは「人間待ち」との重ねだけ**。soak / first-load はスロットリング下の性能計測なので、
  計測ステージ同士・計測と他ブラウザの並走は禁止（CPU 競合で heap 曲線・paintFps・longtask が歪む）。
- cookie 汚染は非該当（§1で裏取り済み）だが、one-tap チェックは storageState 非注入（ゲスト）を維持すること。

### 設計

現行フロー: `[1/3] one-tap（約1分・ゲスト）→ ログイン確保（人間待ち）→ [2/3] soak → [3/3] first-load`

変更: **認証が無効でログインが必要な場合のみ**、one-tap チェックをログイン監視と並行起動する。

```
auth NG の場合:
  ┌ save-auth-state.mjs（ヘッドフルブラウザ + HB ログがターミナルを占有）
  └ one-tap check（ヘッドレス・出力はバッファし、ログイン完了/失敗後にまとめて表示）
auth OK の場合:
  現行どおり直列（one-tap → soak → first-load）
```

### 実装ガイド（次チャット向けの地雷情報）

1. `qa-doctor.mjs` の `run()` は `stdio: "inherit"` なので並行起動すると HB ログと playwright 出力が交錯する。
   `runCaptured()`（`stdio: ["ignore", "pipe", "pipe"]` でバッファ）を新設し、one-tap 側に使う。
2. **Windows の spawn 罠（地雷マップ§3）**: 子プロセス起動は既存の `quoteWin` + `shell:true` + `windowsVerbatimArguments:true` を必ず経由する。新しい spawn 経路を書かない。
3. one-tap はヘッドレスなので、ユーザーが見ているヘッドフルのログイン用ウィンドウと視覚的に混ざらない。
4. 効果は「ユーザー待ち時間の約1分短縮」。qa-doctor の合計時間短縮であって確認削減ではないため優先度は §2〜§3 より低い。

---

## 5. 総合判定サマリー（`scripts/qa-doctor.mjs`・実装済み)

全体結果の**先頭**に1行で言い切る:

```
総合判定: OK — 1タップ導線・ホーム滞在・初回ロードのすべてで異常なし
総合判定: NG — ホーム滞在=RELOAD_LOOP / 初回ロード=クラッシュ2/白画面0（3回中）
```

- soak は exit code（クラッシュ時のみ非0）だけでなく `summary.json` の verdict（HEAP_GROWTH 等の非クラッシュ異常）も反映する。
- 詳細行（従来の1タップ導線/ソーク/初回ロード）はその下に維持。

---

## 6. セッション有効期限の管理（実装済み: verify-refresh）

現状すでにあるもの（`qa-doctor.mjs` の `diagnoseAuth`）:
- `.auth/auth-state.json` の mtime 7日超で stale 扱い → `--verify` 実行 → 失効なら自動再ログイン
- `__session` cookie の expires から残日数を表示

欠けていた1点を追加した: **`--verify` 成功時に `context.storageState()` で最新 cookie を再保存する**。
Clerk はページロード時にセッション cookie をローテーションするため、verify のたびに保存が更新され、
(1) mtime ベースの stale 判定と実際の有効性が一致し続ける、(2) 定期的に qa:doctor を回している限り再ログイン頻度が下がる。
専用の有効期限メタファイルは追加しない（mtime + 実地 verify で十分。ファイルを増やすと診断分岐が増えるだけ）。

---

## 7. 既知の食い違い（今回は変更しない・要判断）

`save-auth-state.mjs` のログイン URL は `redirect_url=/map` を手書きしているが、
実CTA（`lib/clerk-route.ts` の `SIGN_IN_AUTO_X_HREF`）は `redirect_url=/`（ホーム）。
`docs/qa-toolkit-design.md` §4「URL を手書きしない」に照らすと食い違いだが、
**ホームは OOM 調査の当事者**であり、ログイン保存フローがホームの初回マウントクラッシュに巻き込まれるのを
避ける防御として `/map` 着地は合理的な可能性がある。OOM 解消後に `SIGN_IN_AUTO_X_HREF` 系へ寄せるか判断する。

---

## 8. 実装しなかったこと（過剰実装の回避）

| 案 | 見送り理由 |
|----|-----------|
| Playwright tracing の常時記録 | §1 のとおり（プライバシー・途中死・サイズ） |
| ログイン画面への追加 UI（進捗ダイアログ等） | 地雷マップ§2「番号を押すのすら面倒」の延長。既存バナー + ターミナル HB で足りる |
| X ログイン自体の自動化（資格情報保存） | bot 対策・2FA・規約リスク。お題の前提（本人操作は残す）どおり対象外 |
| 有効期限メタファイル（verifiedAt 等）の新設 | §6 のとおり mtime + verify-refresh で足りる |
| soak / first-load への証跡強化 | first-load-crash.mjs が既に ndjson + 連続スクショを実装済み。重複投資 |
| 並列診断ステージの実装 | §4 のとおり設計のみ。効果が「約1分の短縮」に対し、qa-doctor の出力多重化という複雑さが釣り合うか次チャットで判断 |

---

## 9. 検証方法

```bash
# タイムアウトパスの無人セルフテスト（ゲストのまま放置 → 証跡収集まで一気通貫）
ROMI_AUTH_SAVE_HEADLESS=1 node scripts/save-auth-state.mjs --timeout-min=0.2
# → qa-results/auth-save/<timestamp>/ に timeline.ndjson / shots/ / final.png / page.html / summary.json
# → 「放置」扱いになる前に x.com への遷移が入るため deadline-extended（自動延長）も1回発火する

pnpm qa:doctor --only=verify   # verify-refresh（成功時に auth-state.json の mtime が更新される）
```
