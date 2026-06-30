# タブ即時表示 — 手動計測シート（Phase A）

各タブを開いたときの体感遅延を記録する。条件ごとに3回計測し中央値を採用。

## 計測項目

| 記号 | 内容 |
|------|------|
| T0 | タブタップ |
| T1 | ヘッダー・コンテキストバー表示 |
| T2 | 本文の meaningful content（地図・リスト・数値） |
| T3 | ネットワーク idle（DevTools） |

## 条件

- ハードリロード後
- 別タブから遷移
- PWA ホーム画面から

## 記録表

| タブ | 条件 | T1−T0 | T2−T0 | T3−T0 | 空状態フラッシュ | メモ |
|------|------|-------|-------|-------|------------------|------|
| ポスト | リロード後 | | | | | |
| チェックイン | リロード後 | | | | | |
| 集まり | リロード後 | | | | | |
| 図鑑 | リロード後 | | | | | |
| 軌跡 | リロード後 | | | | | |
| マイページ | リロード後 | | | | | |

## DevTools 確認

- `/api/trpc/zukan.myTrail` と `dashboard.mySignal` の waterfall 差
- lazy chunk: `map-*.js`, `web-trail-map-*.js`, `map-authenticated-screen-*.js`

## 自動計測

```bash
pnpm e2e  # tab-instant-display.spec.ts を含む
```
