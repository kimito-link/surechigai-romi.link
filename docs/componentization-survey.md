# コンポーネント化ルール 調査レポート

「コンポーネント化すべきもの」ルールに基づく抜け漏れ調査と適用結果。

---

## ルールの整理

| カテゴリ | 内容 |
|----------|------|
| **同一UIが2回以上** | Button / Card / Modal / Table など、同じ見た目・振る舞いが複数箇所にある |
| **共通挙動** | バリデーション、エラーハンドリング、ローディングなど |
| **表示ルール** | IP表示の強調、ステータス表示、通知など「ルールで決まる見た目」 |

---

## 1. 同一UIが2回以上

### Modal

| 箇所 | 状態 | 備考 |
|------|------|------|
| `components/ui/modal.tsx` | ✅ 共通化済み | Modal, ConfirmModal, AlertModal |
| `components/organisms/ticket-transfer-section/modals.tsx` | ⚠️ 要検討 | RN Modal + インライン overlay。UI Modal でラップ可能だが、フォームレイアウトのため現状維持も可 |
| `components/molecules/follow-gate.tsx` | ⚠️ 要検討 | RN Modal + インラインスタイル。センターモーダルとして UI Modal でラップ可能 |
| `components/organisms/japan-region/JapanRegionBlocks.tsx` | ⚠️ 要検討 | スライドインのボトム風モーダル。type="bottom" で UI Modal に寄せられる可能性 |
| その他 LoginModal, ErrorDialog, HostProfileModal 等 | ✅ 専用コンポーネント済み | 用途別に分割済み |

### Card / リスト1件

| 箇所 | 状態 | 備考 |
|------|------|------|
| 通知一覧 1件（`app/notifications.tsx`） | ✅ 適用済み | **NotificationItemCard** としてコンポーネント化 |
| admin エラーログ1行（`app/admin/errors.tsx`） | 部分対応 | 行全体は長いが、ステータスバッジは Badge 利用可 |
| その他 FlatList renderItem | 要確認 | 行が長い場合は随時 Card 化を検討 |

### Button

| 箇所 | 状態 |
|------|------|
| `components/ui/button.tsx` | ✅ 共通化済み。Button, IconButton, FAB |
| 直書きの Pressable | 多数あるが、デザインが違う場合は意図的とみなす |

### Table

| 箇所 | 状態 |
|------|------|
| admin 各画面 | 一覧は FlatList / map で行を描画。共通の TableRow/Cell は未整備。必要に応じて Section や ListItem を利用 |

---

## 2. バリデーション・エラー・ローディング

### ローディング

| 箇所 | 状態 | 備考 |
|------|------|------|
| `components/ui/screen-loading-state.tsx` | ✅ 共通化済み | 画面全体ローディング用 |
| `app/notifications.tsx` の初期ローディング | ✅ 適用済み | `ScreenLoadingState` に統一（従来は View + ActivityIndicator のインライン） |
| ボタン内ローディング | ✅ | Button の `loading` プロパティで対応 |
| リスト末尾の「もっと読む」ローディング | ✅ 適用済み | `app/notifications.tsx` と `app/messages/index.tsx` で **LoadingMoreIndicator** を使用。文言は `commonCopy.loading.loading` に統一 |

### エラーハンドリング

| 箇所 | 状態 | 備考 |
|------|------|------|
| `components/ui/screen-error-state.tsx` | ✅ 画面全体エラー用 |
| `components/organisms/error-dialog.tsx` | ✅ モーダルエラー用 |
| `components/organisms/error-message.tsx` | ✅ ErrorMessage, NetworkError, EmptyState |
| admin のインラインエラー（participations, users） | ✅ 適用済み | **InlineErrorBar** で共通化（⚠️ + メッセージ + 詳細） |
| Alert.alert("エラー", error.message) | 多数 | 意図的にネイティブアラートを使用している場合はそのまま |

### バリデーション

| 箇所 | 状態 |
|------|------|
| `components/molecules/character-validation-error.tsx` | キャラ数バリデーション用 |
| `components/molecules/inline-validation-error.tsx` | インライン表示用 |
| フォームごとのバリデーション | 各 feature 内で実装。共通ルールがあれば hooks 化を検討 |

---

## 3. 表示ルール

### 通知

| 項目 | 状態 | 備考 |
|------|------|------|
| 通知タイプ → アイコン・色 | ✅ 適用済み | **NotificationItemCard** 内に `getNotificationIcon` / `getNotificationColor` 相当のルールを集約可能（定数または card 内でマッピング） |
| 通知1件のレイアウト | ✅ 適用済み | NotificationItemCard で統一 |

### ステータス表示

| 箇所 | 状態 | 備考 |
|------|------|------|
| `components/atoms/badge.tsx` | ✅ 共通 Badge（variant: success/warning/error 等） |
| admin/errors の「解決済み」「AI分析済み」「分析中」 | Badge コンポーネントの利用で統一可能。既存の severity 色はそのまま渡す |

### IP表示

| 項目 | 状態 |
|------|------|
| コードベース内 | 現状 IP アドレス表示はなし。将来追加時は「強調表示ルール」を1コンポーネントにまとめる |

---

## 適用した変更（抜け漏れ対応）

1. **NotificationItemCard**（新規）  
   - 通知1件の表示をコンポーネント化。  
   - 表示ルール（type → icon/color）をコンポーネント内に集約。

2. **app/notifications.tsx**  
   - 初期ローディングを `ScreenLoadingState` に変更。  
   - リストの `renderItem` を `NotificationItemCard` に差し替え。

3. **InlineErrorBar**（新規・components/ui）  
   - 管理者画面向けのインラインエラー表示（⚠️ + message + 任意の detail）。  
   - `app/admin/participations.tsx` と `app/admin/users.tsx` で利用。

4. **調査ドキュメント**  
   - 本ファイル（`docs/componentization-survey.md`）で上記ルールと実施内容を記録。

---

## 設定化・コンポーネント化 抜け漏れ対応（第二弾）

判断ルール「同じものが2回出る → コンポーネント化」「表示・仕様が変わりやすい → 設定化」に基づく追加対応。

### 設定化（文言）

- **ScreenLoadingState の message**  
  - `app/notifications.tsx`、`app/admin/participations.tsx`、`app/admin/users.tsx`、`app/messages/index.tsx`、`app/admin/errors.tsx`、`app/admin/categories.tsx`、`app/admin/challenges.tsx` で、直書きしていたローディング文言を **commonCopy.loading.*** に統一。
- **LoadingMoreIndicator**  
  - 内部の「読み込み中…」を **commonCopy.loading.loading** に変更。

### 設定化（API URL）

- **hooks/use-auth.ts**  
  - 従来、`RAILWAY_API_URL` と独自の `getApiBaseUrl()` を定義していたが、**lib/api/config** の `getApiBaseUrl()` を利用するように変更。API Base URL の二重管理を解消。
- **lib/api/config.ts**  
  - Native 向けフォールバック（`Constants.expoConfig?.extra?.apiUrl ?? PRODUCTION_API_URL`）を追加し、use-auth から config に一本化できるようにした。

### コンポーネント化

- **リスト末尾ローディング**  
  - `app/notifications.tsx` と `app/messages/index.tsx` の `ListFooterComponent` を、インラインの View + ActivityIndicator / Text から **LoadingMoreIndicator** に差し替え。

### 空状態・Alert の文言定数化（第三弾）

- **空状態**: `constants/copy/common.ts` の `empty` に noNotifications, noMessages, noChallenges, noCategories, noErrors, noReleaseNotes, noTemplatesSaved/Public, noParticipationsDeleted, noAuditLog, noApiRequests, noRegionData, noEditPermission, noAccess, noComments, noPickedComments, noParticipationHistory, noBadges, passwordIncorrect を追加。各画面の「〇〇はありません」を commonCopy.empty.* に統一。
- **Alert タイトル**: `commonCopy.alerts`（success, error, confirm, copyDone, postDone, registerDone, unregisterDone, cancelDone, loginRequired, followDone, inviteSent, settingDone, deleteConfirm）を追加。Alert.alert の第1引数を commonCopy.alerts.* に統一（admin, profile, ticket-transfer, reminders, collaborators, export-button, account-switcher 等）。
- **showAlert**: edit-challenge の showAlert("エラー", ...) を showAlert(commonCopy.alerts.error, ...) に統一。

### モーダル共通化（第三弾）

- **ticket-transfer-section/modals.tsx**: RN Modal + インライン overlay をやめ、`components/ui/Modal` でラップ。CreateTransferModal / WaitlistModal とも title + showCloseButton + maxWidth で統一。
- **follow-gate.tsx**: RN Modal + インラインスタイルをやめ、UI Modal（title="プレミアム機能"）でラップ。
- **JapanRegionBlocks.tsx**: RN Modal + Reanimated SlideInDown をやめ、UI Modal type="bottom"（title=地域名、maxHeight="85%"）でラップ。ヘッダーは地域名を Modal の title に、絵文字は子要素として表示。

### 今後の検討（従来どおり）

- admin/errors のステータスバッジを Badge コンポーネントで統一する場合は別タスクで実施。

---

## 今後の検討

- ticket-transfer のモーダル、follow-gate のモーダルを `components/ui/Modal` でラップし、オーバーレイ・閉じる挙動を統一する。
- admin のエラーログ行で、ステータスバッジ部分を `Badge` + 既存 severity 色で表現する。
- 新規で「同じUIが2回以上」や「表示ルール」が出てきたら、本ルールに沿ってコンポーネント化する。
