# ✅ AIに伝えるべき「ログインエラーの必須情報」

ここは **AI（Manus / Cursor / Claude など）に渡す情報の質で解決速度が10倍変わる部分** なので、
「感想」ではなく **再現可能な事実だけを渡す構造** にします。

今の状況（Gate1運用・OAuthが何度も壊れる・PWAあり）を前提に、
**AIに必ず渡すべき情報（不足すると100%遠回りする項目）** を整理します。

---

## ① 症状（最重要）

まずここ。AIはここを基準に原因を絞ります。

必ずこの形式で：

```
■ 症状
- Googleログインを押す
- Google認証画面までは行く / 行かない
- 認証後に：
  - 真っ暗になる
  - トップに戻る
  - エラー表示なし
  - 無限リロード
```

---

## ② 発生環境（OAuthはここで9割決まる）

```
■ 発生環境
- 本番URL: https://doin-challenge.com
- PWA（ホーム画面追加）からアクセス時に発生
- Safari直接アクセスでは未確認 or 正常
- iPhone / iOSバージョン
```

※ PWAかSafariかは超重要
OAuthはPWAだけ壊れるケースが非常に多いです。

---

## ③ 成功しているもの / 失敗しているもの（差分）

AIは「動くケースとの差分」で原因を特定します。

例：

```
■ 成功するケース
- PC Chromeではログイン成功

■ 失敗するケース
- iPhone PWAからのログイン
```

---

## ④ OAuthの現在の設計（ここが抜けるとAIは推測になる）

最低限：

```
■ OAuth構成
- Google OAuth
- redirect_uri は動的生成している
- server/_core/oauth.ts で host から生成
- 本番は doin-challenge.com
```

もし分かれば追加：

```
- callback URL: /api/auth/google/callback
```

---

## ⑤ 最近変更した内容（最重要）

今回の事故の原因です。

```
■ 最近の変更
- OAuthのredirect URLを動的生成に変更
- host.replace(...) を使用
- Gate1導入後の変更
```

AIはここを最優先で疑います。

---

## ⑥ /api/health の結果

```
■ API状態
/api/health は正常
commitSha: [最新のコミットハッシュ]
DB接続OK
```

→ サーバーは死んでないと判断できる

---

# ✅ AIに渡す「完成形テンプレ（コピペ用）」

これそのままManusに投げてOKです：

---

## Googleログイン不具合の相談（事実ベース）

### ■ 症状

Googleログインを実行後、認証完了してアプリに戻るタイミングで画面が真っ暗になります。エラーメッセージは表示されません。

### ■ 発生環境

* 本番環境: https://doin-challenge.com
* iPhone
* PWA（ホーム画面追加）からアクセス時に発生
* Safari直接アクセスでは未確認（確認中）

### ■ 成功 / 失敗の差分

* API自体は正常（/api/health OK）
* Google認証自体は成功している可能性あり
* アプリ復帰後の画面遷移で失敗している可能性

### ■ OAuth構成

* Google OAuth
* redirect_uri は server/_core/oauth.ts で動的生成
* hostベースでcallback URLを生成している

### ■ 最近の変更

* OAuth redirect URL生成ロジックを変更
* Gate1導入後の変更

### ■ 確認したいこと

* PWA環境でOAuth callback後に画面が真っ暗になる原因
* redirect_uri / cookie / SameSite 設定の問題の可能性
* Next.js側のhydrationエラーの可能性

---

# ⚠️ 重要：PWA + OAuth + Cookie制限

今回の症状はかなり高確率で：

### **PWA + OAuth + Cookie制限**

です。

iOS PWAは：

* Cookie共有がSafariと違う
* OAuth戻り時にセッションが消える
* 結果 → ログイン済みなのに未ログイン扱い → 真っ暗

という動きになります。

---

# 次のステップ

✅ **「なぜOAuthが毎回壊れるのか（構造的な原因）」**
✅ Gate1的に「二度と壊れなくする設計」

これらを整理する必要があります。
