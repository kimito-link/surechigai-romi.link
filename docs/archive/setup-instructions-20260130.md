# 環境変数設定とUptimeRobot設定の手順書 (2026-01-30)

このドキュメントは、Sentryの有効化とUptimeRobotの監視設定の手順をまとめたものです。

---

## 1. Sentryの有効化

Sentryのコードは既に実装済みですが、環境変数を設定する必要があります。

### 手順

#### ステップ1: Sentryアカウントの作成

1. [Sentry](https://sentry.io/)にアクセス
2. 「Get Started」をクリックして無料アカウントを作成
3. メールアドレスを確認してログイン

#### ステップ2: プロジェクトの作成

1. ダッシュボードで「Create Project」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Platform | Next.js |
| Project Name | doin-challenge |
| Alert Frequency | On every new issue |

3. 「Create Project」をクリック

#### ステップ3: DSNの取得

プロジェクト作成後、DSN（Data Source Name）が表示されます。これをコピーしてください。

例：
```
https://examplePublicKey@o0.ingest.sentry.io/0
```

#### ステップ4: Vercelで環境変数を設定

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクト「doin-challenge」を選択
3. 「Settings」→「Environment Variables」に移動
4. 以下の環境変数を追加：

| Key | Value | Environment |
|-----|-------|-------------|
| `SENTRY_DSN` | コピーしたDSN | Production, Preview, Development |
| `NEXT_PUBLIC_SENTRY_DSN` | コピーしたDSN | Production, Preview, Development |

5. 「Save」をクリック
6. 「Deployments」タブで最新のデプロイを「Redeploy」

#### ステップ5: 動作確認

デプロイ完了後、以下の手順で動作確認します：

1. ブラウザで https://doin-challenge.com にアクセス
2. 開発者ツール（F12）を開く
3. コンソールタブで以下のコードを実行：

```javascript
throw new Error("Test error from Sentry");
```

4. Sentryダッシュボードで「Issues」タブを確認
5. 「Test error from Sentry」というエラーが表示されればOK

---

## 2. UptimeRobotの監視設定

UptimeRobotで `/api/health` を監視し、本番環境の安定性を確保します。

### 手順

#### ステップ1: UptimeRobotアカウントの作成

1. [UptimeRobot](https://uptimerobot.com/)にアクセス
2. 「Sign Up」をクリックして無料アカウントを作成
3. メールアドレスを確認してログイン

#### ステップ2: モニターの作成

1. ダッシュボードで「+ Add New Monitor」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Monitor Type | HTTP(s) |
| Friendly Name | doin-challenge Health Check |
| URL (or IP) | `https://doin-challenge.com/api/health` |
| Monitoring Interval | Every 5 minutes |

3. 「Create Monitor」をクリック

#### ステップ3: アラート設定

1. モニターの詳細画面で「Alert Contacts」をクリック
2. 「Add Alert Contact」をクリック
3. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Alert Contact Type | Email |
| Email Address | あなたのメールアドレス |

4. 「Create Alert Contact」をクリック

#### ステップ4: 動作確認

1. UptimeRobotダッシュボードで「doin-challenge Health Check」を確認
2. ステータスが「Up」になっていればOK
3. テスト通知を送信して、メールが届くか確認

---

## 3. サムネイル画像の表示確認

データベースのchallengesテーブルでhostProfileImageカラムに値が入っているか確認します。

### 手順

#### ステップ1: データベース管理画面にアクセス

1. Manusの管理画面で「Database」タブをクリック
2. 「Challenges」テーブルを選択

#### ステップ2: hostProfileImageカラムを確認

1. テーブルの「hostProfileImage」カラムを確認
2. 値が入っているか確認

#### ステップ3: 値が入っていない場合

hostProfileImageカラムに値が入っていない場合、以下のいずれかの方法で修正します：

**方法1: 手動で更新**

1. データベース管理画面で各行を編集
2. hostProfileImageカラムに、ホストのTwitterプロフィール画像URLを入力
3. 保存

**方法2: SQLで一括更新**

以下のSQLを実行して、hostProfileImageカラムを一括更新します：

```sql
-- 例: すべてのチャレンジのhostProfileImageを、ホストのTwitterプロフィール画像URLに更新
UPDATE challenges
SET hostProfileImage = 'https://pbs.twimg.com/profile_images/1234567890/example.jpg'
WHERE hostProfileImage IS NULL OR hostProfileImage = '';
```

**注意**: 実際のTwitterプロフィール画像URLに置き換えてください。

#### ステップ4: 本番環境で確認

1. ブラウザで https://doin-challenge.com にアクセス
2. ホーム画面のチャレンジカード（4番以降）にサムネイル画像が表示されることを確認

---

## 完了チェックリスト

- [ ] Sentryアカウントを作成
- [ ] SentryプロジェクトでDSNを取得
- [ ] Vercelで環境変数`SENTRY_DSN`と`NEXT_PUBLIC_SENTRY_DSN`を設定
- [ ] Vercelで再デプロイ
- [ ] Sentryの動作確認（テストエラーを送信）
- [ ] UptimeRobotアカウントを作成
- [ ] UptimeRobotでモニターを作成（`/api/health`を5分間隔で監視）
- [ ] UptimeRobotでアラート設定（メール通知）
- [ ] UptimeRobotの動作確認（ステータスが「Up」）
- [ ] データベースでhostProfileImageカラムを確認
- [ ] hostProfileImageカラムに値が入っていない場合、手動またはSQLで更新
- [ ] 本番環境でサムネイル画像が表示されることを確認

---

## トラブルシューティング

### Q: Sentryにエラーが送信されない

**A:** 以下を確認してください：

1. 環境変数`SENTRY_DSN`と`NEXT_PUBLIC_SENTRY_DSN`が正しく設定されているか
2. Vercelで再デプロイを実行したか
3. ブラウザのコンソールにエラーが表示されているか

### Q: UptimeRobotのステータスが「Down」になる

**A:** 以下を確認してください：

1. `/api/health`が正しく動作しているか（ブラウザで https://doin-challenge.com/api/health にアクセス）
2. レスポンスが`{"ok": true, ...}`になっているか
3. ステータスコードが200になっているか

### Q: サムネイル画像が表示されない

**A:** 以下を確認してください：

1. データベースのchallengesテーブルでhostProfileImageカラムに値が入っているか
2. hostProfileImageのURLが有効か（ブラウザで直接アクセスして確認）
3. ブラウザのコンソールに画像読み込みエラーが表示されていないか

---

## 参考リンク

- [Sentry公式ドキュメント](https://docs.sentry.io/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [UptimeRobot公式ドキュメント](https://uptimerobot.com/help/)
- [Vercel環境変数の設定](https://vercel.com/docs/concepts/projects/environment-variables)
