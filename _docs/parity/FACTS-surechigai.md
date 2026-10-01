# FACTS — すれ違い通信（surechigai）

> Phase 0（事実確認）の成果物。**コード変更なし。**
> 作成 2026-10-01 / 司令塔（Claude Opus 5）が実コードで確認。
> 設計: [SISTER-SERVICES-REBUILD-SPEC.md](../../../SISTER-SERVICES-REBUILD-SPEC.md)
>
> ★**確認方法を各項目に書いた。** 書けないものは「未確認」と明記し、推測で埋めていない。

## 1. ストアの実状態 — ✅ **公開エンドポイントで部分的に決着（2026-10-01 実測）**

★以前「人間の作業」に回したが、**公開 API で確かめられた**。

| ストア | 実測 | 判定 |
|---|---|---|
| **Google Play** | `play.google.com/store/apps/details?id=com.kimito.link.surechigai` → **HTTP 200** | ★**公開済み** |
| App Store | iTunes lookup（bundleId・jp）→ `resultCount: 0` | 未公開 |

★**対照実験済み**: 存在しない id（`com.kimito.link.notexist999`）は **404**。
＝200 は「ページが実在する」ことを意味する（HTTP 200 の罠を避けるため対照を取った）。

★**`app.config.json:16` の `playAppId: ""` は実態と食い違っている。**
「ストアに出している」という設計書の記述の方が正しかった。
→ **Phase 5 で Capacitor 薄殻に差し替えるときは「更新」として出す**（新規アプリにしない）。
**bundleId**: `com.kimito.link.surechigai`（`app.config.json:7`）。★変えない。

**残る確認（人間）**: App Store Connect で iOS が審査中/未提出のどちらか。

## 2. 既存テーブルのユーザー鍵 — ✅ **コードで確定（Clerk 由来）**

**結論: 移行は原則不要。** 主キーは `serial id`（自動採番）で、本人の識別は `openId` 列。

```
drizzle/schema/users.ts:28-29
  id:     serial("id").primaryKey()                       ← 自動採番。Clerk userId ではない
  openId: varchar("openId",{length:64}).notNull().unique() ← ★ここが本人の鍵
```

`openId` の中身は **Clerk userId から機械的に作られる**:
```
server/_core/sdk.ts:102   const openId = `clerk:${clerkUserId}`;
server/clerk-auth-sync.ts:50  同じ形式
```
→ Next.js 側は `auth()` の `userId` から同じ文字列を組めば既存行に到達できる。
**鍵の書き換えも追加列も要らない。**

### 旧形式 `twitter:` が残っているか（★要確認・DBを見ないと決着しない）

```
server/twitter-routes.ts:234  const openId = `twitter:${userProfile.id}`;   ← 書き込み
server/db/user-db.ts:111      const openId = `twitter:${twitterId}`;        ← ★読み取り
```
★**`twitter:<X数値id>` 形式の行が実データに残っているかは未確認。**
残っていると、その利用者は Next.js 側から見つからない（＝データを失ったように見える）。

★退会処理は users 行を **DELETE** する実装（`server/account-deletion.ts`）。doin とは異なる。

**確認方法（本番DBに対する読み取りのみ）**:
```sql
SELECT split_part("openId", ':', 1) AS prefix, count(*)
FROM users GROUP BY 1;
```
`clerk` だけなら移行不要。`twitter` が残るなら**加算のみ**の移行を設計する
（既存値を UPDATE しない。SPEC §2.1 の契約）。

### openId の全経路（★2026-10-01 の検証で補完。以前は不完全だった）

| 経路 | 形式 | 種別 |
|---|---|---|
| `server/_core/sdk.ts` | `clerk:<clerkUserId>` | **書き込み**（現行） |
| `server/twitter-routes.ts` | `twitter:<X数値id>` | **書き込み**（レガシー経路。★今も `registerTwitterRoutes(app)` で登録されている） |
| `server/db/user-db.ts` | `twitter:<X数値id>` | ★**読み取り**（`select ... where`）。以前「書き込み2箇所」と書いたのは誤り |
| `app/oauth/twitter-callback.tsx` 等 | `twitter:...` | クライアント側の組み立て。DB書き込みではない（表示用の疑い・未精査） |

### ★★前提: 同じ Clerk インスタンスを使い続けること

「`auth()` の `userId` から同じ文字列を組めば既存行に到達できる」が成立するのは、
**Next.js 側が既存と同一の Clerk インスタンスを使う場合だけ**。
別インスタンスへ寄せると `userId` が変わり、**既存行に到達できなくなる**。
★メモリ（2026-08-10）に「surechigai 等は各自の Production Clerk アプリを持つ」という記録があり、
**ここは Clerk Dashboard の目視で裏を取るまで前提にしない**（SPEC §6「Clerk インスタンスの分割や統合は範囲外」）。

## 3. 実ユーザー数・データ量 — ★未確認（本番DBの読み取りが要る）

**確認方法**: `SELECT count(*) FROM users;` ほか主要テーブルの件数。
**テーブル総数**: ✅ **25**（`drizzle/schema/` の `pgTable` 実数。`ads/api-usage/audit/db-stats/encounter/event/event-participation/premium/users`）

## 5. Clerk Allowed subdomains — ✅ **登録済み（2026-10-01 オーナー確認）**

オーナーより「既に登録済み」との回答。4サブドメイン＋検証用サブドメイン
（`surechigai-next.kimito.link`）が Allowed subdomains に入っている前提で進める。

★★**ただし「登録されている」と「ログインが通る」は別。** 未登録なら無言で失敗するので、
Step 2 でプレビューURLを開いたときに Clerk がロードされるか（コンソールに
`Production Keys are only allowed for domain` が出ないか）を**実機で確かめる**。
出たら登録漏れを疑う。

## 6. Vercel 保護状態・本番 satellite の真偽 — ★未確認

既存 HANDOFF の Step 0-3 / 0-7 がそのまま宿題。

## 7. tRPC v11 を Next.js Route Handler に載せられるか — ★未検証（小さく試す）

✅ 確定している前提: `@trpc/server` **11.7.2**（package.json 実測）。
✅ **`server/` は Next.js へそのまま持っていける**: `expo-*` / `react-native` の
**import は0件**（`server/README.md` の散文がヒットするだけ。実測）。

## 9. ネイティブ API 依存 — ✅ **コードで棚卸し完了**

★**SPEC の懸念より軽い。** 大半は UI ライブラリで、Web 代替がある。

★**2026-10-01 の検証で数字を訂正した**（下記「訂正」参照）。

| ライブラリ | **import するファイル数** | 種別 |
|---|---|---|
| **`react-native` 本体** | **254** | ★**ここが書き直しの本体** |
| `expo-haptics` | 49※ | UI（触覚）。Web は無視でよい |
| `expo-image` | 40※ | UI（画像）。`next/image` へ |
| `expo-router` | 34※ | ルーティング。App Router へ |
| `expo-linear-gradient` | 7※ | UI。CSS で足りる |
| **`expo-location`** | **3** | ハードウェア（★動的 import） |
| **`expo-notifications`** | **2** | ハードウェア |
| `expo-secure-store` | 3※ | Clerk のトークン保管。Next.js では不要 |

※印は import 文の出現数ベース（ファイル数とは±1〜2ずれる）。太字はファイル数で再計測済み。

### ★訂正（以前の記載は誤りだった）

| 項目 | 誤 | 正 |
|---|---|---|
| `expo-location` | 6ファイル | **3ファイル**（残り3件はコメント言及2＋テストの正規表現1） |
| `expo-notifications` | 4ファイル | **2ファイル**（4は import 文の行数） |

★**「ファイル数」と「import 文の数」を混ぜない**。表のヘッダーが「ファイル数」なら
ファイル数で統一する。

**`expo-location` を使う3ファイル**（いずれも `await import("expo-location")` の**動的 import**
＝ Web バンドルに入らない）:
`hooks/use-live-presence.ts` / `lib/checkin-location-session.ts` / `lib/get-current-location.ts`

**`expo-notifications` を使う2ファイル**: `lib/event-reminders.ts` / `lib/push-notifications.ts`

★**位置情報は既に Web 対応済み**（＝作り直しで新規実装が要らない）:
```
components/checkin/checkin-authenticated-screen.tsx:6
  「Web: navigator.geolocation / Native: expo-location」
lib/checkin-location-session.ts:193,237  navigator.geolocation を実際に使っている
```

### ★「SPEC の懸念より軽い」には但し書きが要る

**ハードウェア課題**がプッシュ通知のみなのは正しい。
★しかし **`react-native` 本体を 254 ファイルが import している**。
ほかに reanimated / async-storage / svg / netinfo も使われている。
→ **UI 全面の書き直しは依然として本体の作業量**。「軽い」とは言えない。

## ルート台帳の元データ（★母数の定義を明記）

| 数え方 | 件数 |
|---|---|
| `app/**/*.tsx`（`_layout` 除く） | 24 |
| ★さらに `+html`（HTMLシェル＝ルートではない）と `+not-found` を除く | **22** |
| ★**`app/` の外にあるルート面**: `api/`（Vercel Functions。`api/trpc/[trpc].ts` 等） | **10** |

★**`routes.json` の母数は「22画面 + api/ 10本」で定義する。**
以前「24を1つも落とさない」と書いたが、`+html` はルートではないので母数の定義が誤っていた。

## この FACTS で埋まらなかったもの（＝人間の作業）

1・3・5・6 と、2 の「旧形式 `twitter:` 行の有無」。**どれも実物（ストア画面・Dashboard・本番DB）を見ないと決着しない。**
