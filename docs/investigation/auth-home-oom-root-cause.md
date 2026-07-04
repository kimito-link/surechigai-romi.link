# 本番全面凍結→OOM の根本原因と修正（2026-07-04 確定）

## TL;DR

**犯人は `lib/icons/material-icons.web.tsx`（7/1 の PageSpeed 施策 `66060cf`/`dd1f8de` で導入）の
「`@expo/vector-icons/MaterialIcons` を動的 import して実体アイコンを描画する」構成。**
動的 import されたチャンクから実体アイコン（フォントグリフ版）を描画すると、React 19 で
無限 sync 再レンダリングに陥り、scheduler がメインスレッドを専有 → タイマー/fetch/入力/CDP が
全て飢餓（＝「凍結」）→ ヒープが徐々に肥えて数分後に Chrome の Out of Memory でタブが死ぬ。

修正: アイコン JS を静的 import に戻し（**動的 import 禁止**）、重いフォント ttf のダウンロード
だけを遅延。`Font.loadAsync` 成功を確認できた時だけ実体アイコンに切替、失敗時は SVG/プレース
ホルダのまま。全5ルートで凍結解消をローカル本番ビルド＋Playwright プローブで実証済み。

## なぜ「ログイン後だけ壊れる」ように見えたか（見かけの相関の正体）

- 凍結の条件は「**SVG パスが用意されていないアイコンを1つでも描画する画面**」。
- ゲスト `/` は SVG パス済みアイコンのみ → 無事。認証済みホーム・/checkin・/mypage・/events は
  フォントグリフが必要なアイコンを含む → 凍結。
- そのため「ログイン後の画面だけ壊れる」ように見えたが、**認証は無関係**
  （ゲストのまま /checkin を開くだけで再現する。Playwright で実証済み）。
- 「6/30 20:09 は動いていた」→ 7/1 00:48 のコミットで導入。時系列も一致。
  月替わり（日付）説は Date 偽装テストで棄却済み。

## 凍結の機構（観測に基づく）

1. window load 後、`prefetchHeavyTabChunks` / 画面本体がアイコンフォント JS チャンクを import。
2. フォント到着後、非SVGアイコンが `<Real/>`（@expo/vector-icons のクラスコンポーネント）を描画。
3. その直後から `processRootScheduleInMicrotask → flushSyncWorkAcrossRoots →
   performSyncWorkOnRoot → renderRootSync` がマイクロタスク起点で無限に繰り返される
   （CDP `Debugger.pause` によるスタックサンプリングで確認）。
4. MessageChannel/マイクロタスク駆動のため setTimeout・fetch・rAF・CDP evaluate が全飢餓。
   エラーは一切 throw されない（Error 185/301 の上限に掛からない経路）。
5. fiber 生成でヒープがゆっくり成長し、最終的に OOM。

なお ttf アセット自体も動的 import 化の副作用でエクスポートから消えており、本番は未知パスに
200/text/html を返す（SPA フォールバック）ため、7/1 以降フォントは一度も正常ロードされていなかった。
ただし **ttf を復活させただけでは凍結は直らない**（フォント正常ロード状態でも動的 import 経由の
描画で凍結することをビルド比較で確認）。静的 import 化が必須の修正である。

## 実証マトリクス（ローカル本番ビルド + Playwright、/checkin ゲスト）

| 構成 | 結果 |
|---|---|
| 7/4 時点の本番相当（動的 import + ttf 欠落） | 凍結（~4.5秒） |
| 日付を 6/25 に偽装 | 凍結（日付説棄却） |
| state/effect 除去・常に SVG/プレースホルダ | 生存 |
| uSES 化 + 動的 import + ttf 欠落 | 凍結 |
| uSES 化 + 動的 import + ttf 復活（フォント正常） | 凍結（フォント破損説棄却） |
| uSES 化 + `<Real/>` だけ描画しない | 生存（描画がトリガーと確定） |
| **uSES 化 + 静的 import + ttf 復活（採用した修正）** | **全5ルート生存** |

## 使った調査手法（再利用可）

- **ブラックボックスレコーダー**: 安全な同一オリジンページ（/version.json）で計測フックを仕込み、
  `history.replaceState(null,'','/')` → アプリ HTML を `document.write` で同一 realm に注入。
  凍結後も localStorage から飛行記録を回収できる。
- **CDP `Debugger.pause`**: 無限ループ中でも割り込みで停止でき、凍結中のコールスタックを採取できる
  （`.tmp-freeze-probe*.mjs`）。ソースマップ付きローカルビルド（`npx expo export --source-maps`）で
  シンボリケート。
- 凍結検出: `page.evaluate("1")` が 1.5 秒×2連続で無応答なら凍結と判定。

## 残課題

- `__common` が +65KB raw（glyphmap の静的化）。気になる場合はアイコン名の SVG パス被覆率を上げて
  フォント依存自体を無くす方向で削減可能。
- チャンク境界でなぜ React が壊れるか（module 二重化の具体的な重複対象）は未特定。
  Metro/expo export の潜在バグの可能性があり、**他のコンポーネントでも「動的 import した
  チャンクから React コンポーネントを描画して常時マウントする」パターンは要警戒**。
  既存の `lazy()`（Suspense 経由）は問題を起こしていない。直接 `import()` → 描画のパターンが危険。
