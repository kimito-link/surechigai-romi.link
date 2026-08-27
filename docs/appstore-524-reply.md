# App Review 返信案（build 524 却下 / Submission f2783438-91ed-419b-93ad-d6386f1a662a）

> ★方針: **修正済みの新ビルドを出してから**返信する。
> 現状のまま「実装済みです」とだけ返すと、審査員が見た画面は実際に X しか
> 出していなかったので**再び却下される**。
> 出どころ: kimitolink-linktree/_docs/apple-reject-knowledge-base.md
> 「Resolution Center reply playbook」— 短く / ガイドライン番号で / 事実だけ /
> 方針論争はしない。

## 今回の事実（実測）

| | 内容 |
|---|---|
| 却下 | 4.8 Login Services / 2.1(a) App Completeness |
| 審査端末 | iPhone 17 Pro Max / iOS 26.6 |
| 4.8 の真因 | SIWA は**実装済み**。だが到達経路が `app/sign-in.tsx` の1本だけで、**他11画面は X へ直行**していた |
| 2.1(a) の真因 | その X 直行が `login()` を直に呼び、Clerk 未ロード時の throw がエラー表示になっていた |
| 対処 | ログイン導線を**両方が並ぶ /sign-in へ送る**（`fc02118d7`・本番反映済み） |
| 実測確認 | 本番 `/sign-in` に **Apple / Google / X の3つが可視・押下可能**（ブラウザで実測） |

## ★返信文（新ビルド提出後に送る）

```
Hello,

Thank you for the detailed report. We have addressed both issues in build (NEW).

Guideline 4.8 — Login Services

Sign in with Apple was already implemented, but it was not reachable from the
screen you tested. Our login entry points navigated directly to X instead of
showing the account picker. That was our mistake.

In build (NEW), every login entry point — including the menu shown in your
screenshot — now opens the same sign-in screen, which presents Sign in with
Apple, Google, and X as equivalent options. Sign in with Apple is listed first.

Sign in with Apple meets the requirements in 4.8: it limits data collection to
name and email, offers Hide My Email, and does not collect interactions for
advertising.

Guideline 2.1(a) — App Completeness

The error you saw after tapping "Xでログイン" came from the same code path.
When the authentication SDK had not finished loading, the direct login call
surfaced an error instead of waiting. Routing through the sign-in screen
removes that path; the screen handles the loading state.

To reproduce the fix: launch the app, open the menu (top right), and tap the
login button. You will see the account picker with Sign in with Apple.

Thank you for your patience.
```

## ★送る前に必ずやること

1. **新ビルドを提出する**（このコミットを含むもの）
2. ★**実機かシミュレータで、メニューから押して Apple が出ることを目視**する
   （3連続却下なので「直したはず」で出さない）
3. `(NEW)` をビルド番号に置き換える

## ★3回目以降のために（playbook より）

- 同じ定型文が返ってきたら、**前回の返信を日付で引用**し
  「どの画面が該当するのか名指ししてほしい」と求める
- それでも駄目なら **App Review Board へ申し立て**
  （Contact Us → App Review → Submit an appeal / 3〜5営業日・別の担当者が全文を読む）

---

## ★却下KBから学んだこと（2026-08-27 に3リポを突き合わせて確認）

### ★却下KBは2つあり、内容が違う（どちらも正本ではない）

| 版 | 行数 | 特徴 |
|---|---|---|
| `web-ios-android/_docs/`（store-guard が読む正本） | 878 | ★**実際に送って通った返信文**・409連鎖・日本語 |
| `kimitolink-linktree/_docs/` | 1,181 | escalation path・§5.1 Privacy・英語 |

★**新しい方が上位互換とは限らない。** 章を突き合わせたところ、
キット版にしか無い章（「実際に通った Resolution Center 返信文」
「提出時の必須項目連鎖 — 409 を1つずつ潰す」）があった。
★片方で上書きすると**実際に通った文面が消える**。統合は人の判断が要る。

### ★このリポでは carve-out を主張できない

キット版のテンプレ（v1.0.1 で通った実文）は 4.8 の**1つ目の除外規定**
「Your app exclusively uses your company's own account setup and sign-in systems」
を根拠にしている。★これは「第三者ログインを1つも出していない」場合の話。

★このアプリは **X ログインを実際に出している**ので、この除外は使えない。
使えるのは「**同等の選択肢として Sign in with Apple を提供している**」という
事実の提示だけ。だから**先に新ビルドを出す必要がある**（現状の 524 では
審査員が見た画面に Apple が無かったため、事実として反論できない）。

### 返信の作法（両KBで一致していた5点）

1. 短く（審査員は大量に捌いている）
2. ガイドライン番号 + Apple 自身の逐語引用
3. 視覚的な争点なら注釈付きスクショを添付
4. テンプレの後でも事実を再陳述する（bot生成・古いスクショ相手のことがある）
5. ★**方針を論じない**（「4.8は不合理」）。**事実だけ論じる**（「4.8 に該当しない/満たしている」）

### escalation（3連続却下の今、射程に入っている）

1. 1回目: 短く、根拠を引用、スクショ添付
2. 同じ定型文が返ってきたら: **前回返信を日付で引用**し
   「該当する画面を具体的に指摘してほしい」と求める
3. ★3振目: **App Review Board へ申し立て**
   （Contact Us → App Review → Submit an appeal / 3〜5営業日・別の担当者が全文を読む）
