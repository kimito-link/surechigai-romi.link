# 集まり（主催）モジュール — API ↔ UI 監査表

**監査日:** 2026-06-30  
**スコープ:** `/events` 主催・予定・ライブ・参加表明・マイページ連携

## event ルーター

| Procedure | UI 接続 | invalidate | 備考 |
|-----------|---------|------------|------|
| `create` | EventsHostPanel | listMine, listUpcoming, listLive, mySignal | Fix-1: URL 必須バリデーション追加 |
| `listMine` | EventsHostPanel | — | prefetch 追加 (Fix-4) |
| `goLive` | EventsHostPanel | 同上 | |
| `endLive` | EventsHostPanel | 同上 | |
| `cancel` | EventsHostPanel (Fix-2) | 同上 | 確認ダイアログ付き |
| `listUpcoming` | CalendarList (guest/auth) | — | |
| `listLive` | LiveList | — | 30s ポーリング |
| `reveal` | EventCard | — | unlisted 合言葉 |
| `getById` | OGP 用 | — | UI 直接利用なし |
| `resolveOfflineLocation` | **未接続** | — | G5: 将来 Fix |
| `countByPref` | **未使用** | — | 在席マップ将来用 |
| `update` | **未実装** | — | G7: 意図的スコープ外 |

## eventParticipation ルーター

| Procedure | UI 接続 | invalidate | 備考 |
|-----------|---------|------------|------|
| `create` | EventParticipationPanel | listUpcoming, listLive, mySignal, myUpcoming | Fix: invalidateEventListQueries 追加 |
| `cancel` | EventParticipationPanel | 同上 | |
| `mineForEvent` | EventParticipantsModal | — | |
| `listByEvent` | EventParticipantsModal | — | |
| `myUpcoming` | マイページ | — | |
| `setReminder` | use-event-reminder-sync | — | |

## 修正済みギャップ

| ID | 問題 | 対応 |
|----|------|------|
| G1 | オンライン URL UI 任意 / API 必須 | `validateEventCreateForm` + ラベル「必須」 |
| G2 | cancel UI なし | ConfirmModal + `event.cancel` |
| G3 | mySignal 未 invalidate | `invalidateEventListQueries` |
| G4 | listMine prefetch なし | `prefetch-tab-data.ts` |
| G5 | resolveOfflineLocation 未使用 | 未着手（任意） |
| G6 | description フォームなし | スコープ外 |
| G7 | update なし | スコープ外 |
