# PWA 起動画面（地色1色）の Android 実機計測 — surechigai-romi.link

- 日付: 2026-10-05
- 端末: moto g64y 5G／Android 15／Chrome 154（WebAPK）
- 撮り方: 端末の WebAPK を入れ直し、ホーム画面のアイコンから起動した様子を `screenrecord` で録画し、フレームに切り出した
- 手順の正本: `web-ios-android/templates/scripts/measure-webapk-launch.sh`
  （[GitHub](https://github.com/kimito-link/web-ios-android/blob/main/templates/scripts/measure-webapk-launch.sh)）
- 解析: 各フレームの本体領域（ステータスバー＝上 4%・ナビバー＝下 8%・右端 16px のスクロールバーを除く）の最頻色を出した。
  録画は YUV420 のため ±3 程度の圧縮ずれがある
- 設計書: `web-ios-android/_docs/DESIGN-pwa-launch-screen-2026-10-05.md`
  （[GitHub](https://github.com/kimito-link/web-ios-android/blob/main/_docs/DESIGN-pwa-launch-screen-2026-10-05.md)）
- このリポ内の関連: `scripts/check-pwa-splash.mjs`（`--expect-bg '#E2EDF7'`）／`__tests__/manifest-background-color.test.ts`／`docs/symptoms.md` の SG-09

## 期待地色

`#E2EDF7`（`palette.kimitoBlueSoft`。`manifest.background_color`・`app/+html.tsx` のベール・`BrandLoadingScreen` の3か所がこの値）

## 結果

| 段階 | 本体領域の最頻色 |
|---|---|
| OS の起動画面（地色＋アイコン） | #E0ECF6 |
| 切り替え直後のプレースホルダ | #E0ECF6 |
| 本編ヒーロー | #EEF4F5 |

判定: フラッシュ無し。起動画面 → プレースホルダは同色、本編ヒーローは緩やかな明度差のみで、白・灰のフレームは無い。
変更前（`background_color` を外していた状態）に白 #FFFEFF → 薄い青の飛びがあった実測は設計書の表を参照（2026-10-05 の先行計測、画面上部 1/5 の帯の平均で算出。ここでの最頻色とは測り方が違うので数値を横に並べない）。

## 画像

| ファイル | 中身 |
|---|---|
| `android_after.png` | 1回目（11:34）。起動直後 1.1 秒を 30fps で切り、画面の上から 62% を 11x3 のタイルに並べたもの |
| `android_transition.png` | 1回目の 5.30 秒付近、ベールから本編ヒーローへ切り替わる前後のフレーム |
| `android_after_rerun.png` | 2回目（11:40）。同じ手順で撮り直したタイル。1回目と同じ推移 |

ホーム画面のアプリアイコンが映っているが、個人のメッセージ・連絡先は映っていないことを確認した。

## 関連 PR

- #61 `manifest.background_color` を `#E2EDF7` に戻す（検査も反転）
- #62 `docs/symptoms.md` SG-09 に Android 実機の変更前後の実測を追記
- #64 起動画像を内容ハッシュ名にして `?v=` を廃止
- #65 `check-pwa-splash` をキット金型の最新版に同期（4項目追加）
- #67 `check-pwa-splash` をキット最新版に同期（ロゴ判定を中央 60% 矩形の領域サンプリングへ）
