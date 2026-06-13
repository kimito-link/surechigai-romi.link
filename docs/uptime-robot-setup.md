# UptimeRobot 設定ガイド

このドキュメントは、UptimeRobotを使用して`/api/health`エンドポイントを監視する設定手順をまとめたものです。

## 目的

- 本番環境のヘルスチェックエンドポイントを定期的に監視
- 異常を検知した場合、即座に通知を受け取る
- ダウンタイムを最小化する

---

## 設定手順

### 1. UptimeRobotアカウントの作成

1. [UptimeRobot](https://uptimerobot.com/)にアクセス
2. 「Sign Up」をクリックして無料アカウントを作成
3. メールアドレスを確認してログイン

### 2. モニターの追加

1. ダッシュボードで「+ Add New Monitor」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Monitor Type | HTTP(s) |
| Friendly Name | Doin Challenge - Health Check |
| URL (or IP) | `https://doin-challenge.com/api/health` |
| Monitoring Interval | 5 minutes |
| Monitor Timeout | 30 seconds |

3. 「Create Monitor」をクリック

### 3. アラート設定

1. 「Alert Contacts」タブに移動
2. 「+ Add Alert Contact」をクリック
3. 通知方法を選択：

#### 推奨: Email通知

| 項目 | 設定値 |
|------|--------|
| Alert Contact Type | E-mail |
| Friendly Name | Admin Email |
| E-mail to Alert | あなたのメールアドレス |

#### オプション: Slack通知

| 項目 | 設定値 |
|------|--------|
| Alert Contact Type | Slack |
| Friendly Name | Slack Alerts |
| Slack Webhook URL | SlackのIncoming Webhook URL |

4. 「Create Alert Contact」をクリック

### 4. モニターにアラートを紐付け

1. 「Monitors」タブに戻る
2. 作成したモニター「Doin Challenge - Health Check」をクリック
3. 「Edit」をクリック
4. 「Alert Contacts to Notify」セクションで、作成したアラート連絡先を選択
5. 「Save Changes」をクリック

---

## 監視内容

UptimeRobotは以下をチェックします：

1. **HTTPステータスコード**: 200以外のレスポンスで通知
2. **レスポンスタイム**: 30秒以内にレスポンスがない場合、タイムアウト
3. **ダウンタイム**: 連続して2回失敗した場合、ダウンと判定

---

## 期待される動作

### 正常時

- `/api/health`が200を返す
- レスポンス例：
  ```json
  {
    "ok": true,
    "commitSha": "32d1587ca3bec75fef7a9e96b6fdf1e7cb12dcec",
    "version": "32d1587ca3bec75fef7a9e96b6fdf1e7cb12dcec",
    "builtAt": "2026-01-29T03:52:57.720Z"
  }
  ```

### 異常時

以下の場合、アラートが送信されます：

1. **サーバーダウン**: HTTPステータスコードが500, 502, 503など
2. **エンドポイント削除**: 404 Not Found
3. **タイムアウト**: 30秒以内にレスポンスがない
4. **SSL証明書エラー**: HTTPS接続に失敗

---

## アラート通知の例

### Email通知

```
Subject: [UptimeRobot Alert] Doin Challenge - Health Check is DOWN

Monitor: Doin Challenge - Health Check
Status: DOWN
Reason: HTTP 500 - Internal Server Error
URL: https://doin-challenge.com/api/health
Time: 2026-01-29 12:34:56 UTC
```

### Slack通知

```
🔴 Doin Challenge - Health Check is DOWN
Reason: HTTP 500 - Internal Server Error
URL: https://doin-challenge.com/api/health
Time: 2026-01-29 12:34:56 UTC
```

---

## トラブルシューティング

### Q: 誤検知（False Positive）が多い場合

**A:** 以下を確認してください：

1. **Monitoring Interval**を10分に延長
2. **Monitor Timeout**を60秒に延長
3. Vercel/Railwayのログを確認し、実際にエラーが発生しているか確認

### Q: 通知が来ない場合

**A:** 以下を確認してください：

1. Alert Contactが正しく設定されているか
2. メールがスパムフォルダに入っていないか
3. SlackのWebhook URLが正しいか

---

## 次のステップ

1. ✅ UptimeRobotの設定完了
2. ⬜ Sentryの導入（エラートラッキング）
3. ⬜ 統計ダッシュボードの実装

---

## 参考リンク

- [UptimeRobot公式ドキュメント](https://uptimerobot.com/docs/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
