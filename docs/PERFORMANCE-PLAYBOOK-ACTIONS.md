# パフォーマンス改善アクション（プレイブック対応）

## 実施済み

- [x] **tRPC httpBatchStreamLink** - 速いクエリを遅いクエリを待たずに表示
- [x] **OAuth タイムアウト短縮** - RedirectingScreen: 12秒→4秒
- [x] **preconnect hints** - Railway API・Clerkドメインの事前接続
- [x] **isAuthReadyForUI** - 5秒→3秒に短縮
- [x] **Clerk token cache** - Web用localStorage（既存実装）
- [x] **staleTime** - 30分（既存、2分以上）

## 要確認（Railwayダッシュボード）

- [ ] **Railway Serverless Mode** - 有効の場合、10分アイドルで15〜22秒のコールドスタートが発生。無効化を推奨。
- [ ] **Railway リージョン** - 日本ユーザー向けは `asia-southeast1` (Singapore) を推奨

## 今後の検討

- [ ] Expo tree shaking + async routes
- [ ] React Compiler 有効化
- [ ] Vercel CDN キャッシュ設定
- [ ] SSR (Expo Router web.output: "server")
