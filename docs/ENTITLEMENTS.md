# 権限境界線（無料・プレミアム・広告）

このファイルは「無料/プレミアム/広告非表示/シェア」の境界線の正本。
境界線を変更するときは**必ずこのファイルを先に更新**する。各SPECは境界を
このファイルへの参照で書き、独自に再定義しない。

出典: `docs/uxux-stability-audit-SPEC.md` Part 2 §2.3

## 境界線表

| 機能 | ゲスト | 無料ログイン | プレミアム | 出典 |
|---|---|---|---|---|
| 足あと便リプレイ閲覧（`/u/{slug}`） | ○ | ○ | ○ | `docs/share-landing-uiux-SPEC.md` §2 |
| チェックイン・正確な座標の永続保存 | × | ○（無制限） | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |
| 地図で足あとをたどる | ○ | ○ | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |
| すれ違いマッチ・図鑑・シェア | × | ○ | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |
| 広告（協賛/お知らせ）表示 | なし（`/u/{slug}` は広告ゼロ・永久保証） | あり（新規ユーザー保護期間・日次キャップ付き） | **非表示** | `docs/cost-and-ads-ltv-SPEC.md` §2.4、`docs/uxux-stability-audit-SPEC.md` §2.2 ルール3 |
| 高度統計ダッシュボード | × | × | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |
| データエクスポート（GPX/GeoJSON） | × | × | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |
| 足あとマーカーのカスタマイズ | × | × | ○ | `docs/cost-and-ads-ltv-SPEC.md` §2.3 |

## 鉄則

- **記録と再訪（チェックイン・地図でたどる）は絶対に課金壁の後ろに置かない。** これは成長エンジンであり、無料で無限にやらせるのが正しい。
- `/u/{slug}` の広告ゼロは「当面入れない」ではなく**永久保証**（`docs/uxux-stability-audit-SPEC.md` §2.2 ルール3）。解禁する場合は関連SPECの改訂合意が必須。
- `lib/premium-features.ts` の実装はこの表に従う（`docs/cost-and-ads-ltv-SPEC.md` P1 タスク7で同期予定）。
