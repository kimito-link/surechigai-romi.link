# /events パフォーマンス改善（2026-07-01）

PageSpeed Insights（Performance 41）を参考に、おすすめ順で実施。

## 1. コンソールエラー（Best Practices）

**原因:** Cloudflare Web Analytics beacon が CSP `script-src` に未登録でブロック。

**修正:** `vercel.json` に以下を追加。
- `script-src`: `https://static.cloudflareinsights.com`
- `connect-src`: `https://cloudflareinsights.com`

## 2. 未使用 JS 削減（主催タブ）

- `TYPE_TAG_LABELS` を `lib/events/type-tag-labels.ts` に分離（EventCard + ParticipationPanel をフォーム初回表示で読まない）
- 主催一覧の `EventCard` を `lazy()` + `Suspense`（イベント0件時は chunk 未ロード）
- `event.listMine` prefetch をタブ全体から削除 → **主催セグメント選択時のみ** prefetch + chunk preload

## 3. LCP / 初回描画

- デフォルト「予定」タブ表示時に主催用 API/chunk を読まない（上記 defer）
- 主催タブ選択時: `listMine.prefetch()` + `import(events-host-panel)` を並列開始

## 4. アクセシビリティ

- ゲスト `events-guest-content` セグメントに `accessibilityRole="tab"` + `accessibilityLabel` を追加

## 再計測

デプロイ後:

```bash
# PageSpeed（モバイル）
# https://pagespeed.web.dev/ → https://surechigai.kimito.link/events

pnpm exec playwright test tests/e2e/events-host.smoke.spec.ts -g guest
```

## 未着手（次フェーズ）

- resend.kimito-link.com ログイン導線一本化（別プロダクト）
- signal.encounter.life は本リポジトリ外
- EventCalendar / ParticipationPanel のさらなる code-split
- PWA maskable icon / apple-touch-icon（PageSpeed PWA 62）
