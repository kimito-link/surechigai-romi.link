# App Store 却下への返信（2026-08-05 / Submission 740e82cd-83d6-4a47-a71e-d24bda8bc0e6）

App Store Connect の Resolution Center に貼る返信文。**投稿は人手**（API 未公開）。

> 送信前チェック
> - [ ] 新ビルドをアップロード済み（4.8 の修正が入ったもの）
> - [ ] スクリーンショット5枚を差し替え済み（5枚目が /premium ではないこと）
> - [ ] App Review Information の notes が新しい文言になっていること
> - [ ] 「App Review に再提出」を押す（返信投稿だけでは再審査は始まらない）

---

## 返信文（英語・そのまま貼る）

```
Hello App Review team,

Thank you for the detailed review. We have addressed all three items. Details below.

--- Guideline 4.8 (Login Services) ---

Sign in with Apple was already implemented and included in build 475. We believe it
was not visible during your session, and we want to explain exactly why, and what we
changed.

Our sign-in screen offers Sign in with Apple alongside X. Sign in with Apple in our
app meets all three requirements in Guideline 4.8:
  - It limits data collection to the user's name and email address only.
  - It allows users to keep their email address private during account setup
    (Apple's Hide My Email is fully supported).
  - It does not collect interactions with the app for advertising purposes. We do not
    integrate any third-party advertising or attribution SDK, and we do not track
    users across apps or websites.

Why it was likely not visible: the app had a "one tap start" convenience flow. When
the user tapped the start button, the app automatically advanced to the X provider on
the sign-in screen. The Sign in with Apple button was present on that screen, but the
automatic advance did not give the reviewer a chance to see or choose it. This was our
mistake, and we are sorry for the wasted review time.

Fixed in the new build:
  - The automatic advance is disabled in the iOS app. The sign-in screen is always
    shown and the user explicitly chooses a provider.
  - Sign in with Apple and X are presented as equivalent, side-by-side options.
  - The start button no longer names a specific provider.

To verify: launch the app, tap the start button on the first screen, and choose
"Sign in with Apple" on the sign-in screen.

--- Guideline 2.1(a) (Information Needed) ---

We apologize: our previous review notes incorrectly stated that demo credentials were
provided in App Review Information, when that field was in fact empty. The notes have
been corrected.

To clarify how this app can be evaluated:

1. No sign-in is required for most of the app. The home screen, the nationwide map,
   the stamp book (図鑑), and the meetup list are all viewable without an account.

2. This app has no username/password login by design. The only sign-in methods are
   Sign in with Apple and X (OAuth), so a demo username/password pair cannot be
   issued. To review the signed-in experience, please tap the start button on the
   first screen and choose "Sign in with Apple" — your own Apple ID works and no
   separate registration is needed. Signing in takes a few seconds.

3. Regarding the すれ違う (pass-by encounter) and たどれる (retrace) features you
   mentioned: both operate on the location history of the signed-in account. After
   signing in with Apple, tap the チェックイン (check-in) tab and record a location.
   The recorded point appears immediately on the map (たどれる / retrace), and the
   stamp book fills in the prefecture you are in. すれ違う (encounters) matches you
   with other users who passed through the same area, including within the past
   30 days, so it does not require another person to be present at the same moment.

If you would still prefer a pre-populated demo account, please let us know and we will
prepare one and share the credentials through App Review Information.

--- Guideline 2.3.7 (Accurate Metadata) ---

We have removed all price references from our screenshots. Specifically, the fifth
screenshot previously showed our support/premium page along with the words "always
free", and the caption band repeated that wording. That screenshot has been replaced
with the check-in feature, and the caption no longer refers to price in any form.

To be explicit about our business model: this app has no in-app purchases and no
subscriptions. Every feature is available at no charge.

Thank you again for the careful review.

Kind regards,
君斗りんくのすれ違ひ通信 (Surechigai Romi)
```

---

## 事実確認の根拠（送信前に自分で確かめた内容）

| 主張 | 根拠 |
|---|---|
| SIWA はビルド475に入っている | `39ad9f1b4` = 2026-08-01 10:06 JST、ビルド475アップロードは同日 23:09 JST（13時間後） |
| 第三者広告SDKなし | `package.json` に admob/facebook/appsflyer/adjust/branch 等の依存ゼロ |
| クロスアプリ追跡なし | 広告は自社配信（`server/routers/ads.ts`）。入力は現在地の都道府県・市区町村のみで、第三者へのデータ提供経路なし |
| username/password が作れない | Clerk 本番の `auth_config` が `email_address: off / password: off`、`identification_strategies` は OAuth 3種のみ |
| ゲストで主要機能が見える | `screenshot-plan.json` の `authTabs: []`（提出済みスクショ5枚すべて未ログイン画面） |

> Sentry（`@sentry/*`）はエラー監視用であり広告目的の行動収集ではないため、
> 「advertising purposes」の記述と矛盾しない。

## 残作業（人手が必要なもの）

1. **スクリーンショットの再撮影と差し替え** — `pnpm` の撮影スクリプトで5枚目を撮り直す
2. **新ビルドの提出** — `gh workflow run ios-appstore-release.yml`
3. **Resolution Center への返信投稿**（ASC 画面のみ）
4. **「App Review に再提出」を押す** — 返信だけでは再審査は始まらない
5. 承認後の配信国（Availability）設定と App Privacy の公開状態確認
