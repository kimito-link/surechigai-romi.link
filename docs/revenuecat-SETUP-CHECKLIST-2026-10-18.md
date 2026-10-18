# RevenueCat 準備チェックリスト（コードは動かさない）

- 作成: 2026-10-18 / 状態: **準備のみ。アプリの挙動は変えない**
- 位置づけ: `docs/monetization-DESIGN.md`（課金導線）・`docs/monetization-STRATEGY-2026-08-07.md`（戦略）の、
  E-2 作業ブレークダウン「1. RevenueCat プロジェクト作成・ストアにサブスク商品登録」だけを、先に進めるためのもの。
- **公開はしない**: App Store の再審査（4.3(a)、2026-09-23 却下）が通るまで、課金を入れない。
  初回審査に課金を入れない判断は、設計書（`docs/monetization-DESIGN.md` の結論）のとおり。
- 本書は手順の整理で、法的・税務の助言ではない。**ストアや RevenueCat の画面の細部は、変わりやすいので、
  各社の公式ドキュメントで確認しながら進めること**（本書は画面の文言を断定しない）。

## 0. すでにコードにあるもの（変えない）

| 項目 | 場所 | 内容 |
|---|---|---|
| Webhook | `api/revenuecat-webhook.ts` | `POST /api/revenuecat-webhook`。`Authorization` ヘッダが環境変数 `REVENUECAT_WEBHOOK_SECRET` と一致しないと 401（未設定なら常に 401） |
| ユーザー識別 | 同上 | RevenueCat の `app_user_id` は `"user_" + users.id`（例: `user_123`）。それ以外の形（匿名 ID など）は、権利を書かず 200 で返す |
| 権利の書き込み | 同上 | `INITIAL_PURCHASE`・`RENEWAL`・`UNCANCELLATION`・`PRODUCT_CHANGE` で有効化。`CANCELLATION` は更新停止のみ。`EXPIRATION`・`SUBSCRIPTION_PAUSED` で失効。`REFUND` で取り消し。`TEST`・`TRANSFER` は無視（200） |
| 有効化の条件 | 同上 | イベントに `expiration_at_ms` が必要（無ければ書かずに 200） |
| 判定 | `modules/encounter/db/premium-queries.ts` | 行が無い・DB に繋がらない・失敗のときは、すべて無料（安全側） |
| 画面 | `app/premium.tsx` | ペイウォール兼管理画面。`PURCHASE_AVAILABLE = false` が安全弁（購入ボタンが無効） |
| 宣言 | `app.config.json` | `businessModel.hasInAppPurchase: false`（無料アプリと宣言） |
| ID | `app.config.json` | iOS の `bundleId` と Android の `playPackageName` は、どちらも `com.kimito.link.surechigai` |

## 1. 先に決める値（案。決めたらここに書き戻す）

| 項目 | 案 | 決定 |
|---|---|---|
| 商品の種類 | 自動更新の月額サブスクリプション **1本のみ**（設計書の決定） | |
| 商品 ID（iOS / Android 共通にそろえる） | `com.kimito.link.surechigai.premium.monthly` | |
| 権限（Entitlement）名 | `premium` | |
| オファリング | RevenueCat の既定（`default`）に、上の商品1つ | |
| 価格 | 月額 400 円を目安（設計書。**ストア側の価格表と手取りは、実際の画面で確認**） | |
| 表示名・説明 | `app/premium.tsx` の特典（広告を表示しない／足あとの書き出し）と合わせる。価格・解約・自動更新の説明は平文 | |

## 2. Apple（App Store Connect）

- [ ] **有料アプリの契約・税務・銀行口座**が、有効になっている（アプリ内課金を売る前提。状態は未確認）
- [ ] サブスクリプショングループを作る
- [ ] 自動更新サブスクリプションの商品を作る（商品 ID は上の値）
- [ ] 価格を設定する
- [ ] 表示名・説明を、日本語（と必要な言語）で入れる
- [ ] 審査用の画像・メモの欄を埋める（**ただし審査に提出しない**。下の注意を参照）
- [ ] サンドボックステスターを作る（実機の検証用）
- [ ] （任意・要確認）Small Business Program の申請状態を確認する（設計書は手数料 15% を前提にしている）

## 3. Google Play（Play Console）

- [ ] 支払いプロファイル（加盟店アカウント）が、有効になっている（状態は未確認）
- [ ] サブスクリプション商品と基本プランを作る（商品 ID は上の値。Play の ID の制約は公式で確認）
- [ ] 価格を設定する
- [ ] ライセンステスターを登録する（実機の検証用）

## 4. RevenueCat

- [ ] アカウントとプロジェクトを作る（無料枠の条件は、設計書では月間トラッキング収益 $2.5k までとある。現行の条件は公式で確認）
- [ ] iOS アプリと Android アプリを登録する（上の ID）
- [ ] ストアとの連携に必要な認証情報を登録する（Apple 側は、アプリ内課金用のキーなど。Google 側は、サービスアカウント。要件は公式で確認）
- [ ] 商品をインポートする
- [ ] 権限 `premium` を作り、商品を紐づける
- [ ] オファリングを作り、商品を入れる
- [ ] **公開 API キー**（iOS 用・Android 用）を控える（秘密のキーではないが、リポジトリにはコミットせず、環境変数で渡す方針を、実装時に決める）
- [ ] Webhook を設定する
  - URL: `https://surechigai.kimito.link/api/revenuecat-webhook`
  - Authorization ヘッダの値: 十分に長いランダムな文字列（下の 5 と同じ値）
  - 疎通確認は RevenueCat の「テストイベント」で行う。コードは `TEST` を**無視して 200 を返す**ので、「401 にならない」ことが確認の目安

## 5. Vercel の環境変数

- [ ] `REVENUECAT_WEBHOOK_SECRET` を、Production に設定する（上の Webhook の Authorization ヘッダと同じ値）
  - 設定しないと、Webhook は常に 401 になる（コードの仕様）。**値は、チャットやリポジトリに書かない**

## 6. あとでコードに入れるもの（今回はやらない）

再審査が通ったあと、`docs/monetization-DESIGN.md` の E-2 に沿って進める。

- [ ] `react-native-purchases` の導入（EAS Build の設定を含む）
- [ ] 購入時に `Purchases.logIn("user_" + users.id)` で紐づける（匿名 ID のまま購入させない）
- [ ] 購入・復元フロー（`app/premium.tsx`）。`PURCHASE_AVAILABLE` を切り替える
- [ ] `app.config.json` の `businessModel` を実態に合わせる（`hasInAppPurchase` など）
- [ ] 利用規約・プライバシーポリシーの改訂、`docs/ENTITLEMENTS.md` の更新
- [ ] 審査ノート（購入直後に目に見える機能として、足あとの書き出しを見せる設計。設計書 E-1）

## 7. 検証（コードを入れたあと）

- [ ] サンドボックス購入 → Webhook が届く → `premium_entitlements` に行ができ、`premium.status` が有効になる
- [ ] 更新・解約（更新停止）・失効・返金で、状態が設計どおりに動く
- [ ] Webhook を、誤った Authorization ヘッダで叩くと 401 になる

## 8. 注意

- **審査との関係**: ストアにサブスク商品を作るだけで、アプリのバイナリに入れず、審査に提出しなければ、
  現行の審査には影響しない、と考えている（**未確認**。商品をアプリの審査に添付する操作は、再審査が通るまで行わない）。
- 位置情報・足あとのデータは、RevenueCat に送らない（設計書 G-3 のプライバシーの記載どおり。送るのは、ユーザー ID と購入情報）。
- 「Web で購入に誘導」はしない（Guideline 3.1.1。設計書 C-3）。

## 9. 確認していないこと

- 有料アプリの契約、税務、銀行口座の現在の状態
- RevenueCat のアカウントの有無と、現行の無料枠の条件
- Small Business Program の申請状態
- ストア・RevenueCat の画面の細部と、各社の現行の制約（商品 ID の文字種など）
