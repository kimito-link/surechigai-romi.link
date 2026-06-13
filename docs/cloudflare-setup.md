# Cloudflare設定手順

## 概要
Cloudflareを使用して、DDoS攻撃防御、Rate limiting、Bot検知、IP制限を実装します。

## 前提条件
- ドメイン名を所有している
- DNSの設定変更権限がある

## 設定手順

### 1. Cloudflareアカウント作成

1. Cloudflare公式サイトにアクセス
   - URL: https://www.cloudflare.com/

2. **Sign Up**をクリック

3. メールアドレスとパスワードを入力

4. メール認証を完了

### 2. ドメインを追加

1. **Add a Site**をクリック

2. ドメイン名を入力
   - 例: `doin-challenge.com`

3. **Add Site**をクリック

4. プランを選択
   - **Free**プランを選択（無料）
   - **Continue**をクリック

### 3. DNS設定をスキャン

1. Cloudflareが既存のDNSレコードを自動スキャン

2. スキャン結果を確認
   - 既存のAレコード、CNAMEレコード等が表示される

3. **Continue**をクリック

### 4. ネームサーバーを変更

1. Cloudflareが提供するネームサーバー情報をコピー
   - 例:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```

2. ドメインレジストラ（お名前.com、ムームードメイン等）にログイン

3. ネームサーバー設定を変更
   - Cloudflareのネームサーバーに変更

4. Cloudflareに戻り、**Done, check nameservers**をクリック

5. DNS伝播を待つ（最大24時間、通常は数時間）

### 5. Rate Limiting Rules設定

#### Rule 1: API Protection

1. **Security** → **WAF** → **Rate limiting rules**に移動

2. **Create rule**をクリック

3. ルール設定:
   - **Rule name**: `API Protection`
   - **If incoming requests match**: 
     - Field: `URI Path`
     - Operator: `starts with`
     - Value: `/api/`
   - **Then**:
     - **Requests**: `10`
     - **Period**: `10 seconds`
     - **Action**: `Block`
     - **Duration**: `1 hour`
   - **Characteristics**:
     - `IP Address`

4. **Deploy**をクリック

#### Rule 2: Login Protection

1. **Create rule**をクリック

2. ルール設定:
   - **Rule name**: `Login Protection`
   - **If incoming requests match**:
     - Field: `URI Path`
     - Operator: `starts with`
     - Value: `/api/auth/`
   - **Then**:
     - **Requests**: `5`
     - **Period**: `1 minute`
     - **Action**: `Managed Challenge` (CAPTCHA)
     - **Duration**: `15 minutes`
   - **Characteristics**:
     - `IP Address`

3. **Deploy**をクリック

#### Rule 3: Global Rate Limiting

1. **Create rule**をクリック

2. ルール設定:
   - **Rule name**: `Global Protection`
   - **If incoming requests match**:
     - Field: `URI Path`
     - Operator: `starts with`
     - Value: `/`
   - **Then**:
     - **Requests**: `100`
     - **Period**: `1 minute`
     - **Action**: `JS Challenge`
     - **Duration**: `5 minutes`
   - **Characteristics**:
     - `IP Address`

3. **Deploy**をクリック

### 6. DDoS Protection設定

1. **Security** → **DDoS**に移動

2. DDoS Protectionは**自動的に有効**（無料プランでも利用可能）

3. 設定確認:
   - **HTTP DDoS Attack Protection**: `Enabled`
   - **Network-layer DDoS Attack Protection**: `Enabled`

### 7. Bot Detection設定

1. **Security** → **Bots**に移動

2. Bot Fight Modeを有効化
   - **Bot Fight Mode**: `On`

3. 設定オプション:
   - **Definitely automated**: `Block`
   - **Likely automated**: `Challenge`

### 8. IP Blocking（オプション）

特定のIPアドレスをブロックする場合:

1. **Security** → **WAF** → **Tools**に移動

2. **IP Access Rules**をクリック

3. **Create IP Access Rule**をクリック

4. ルール設定:
   - **IP, IP range, country, or ASN**: IPアドレスを入力
   - **Action**: `Block`
   - **Zone**: 該当ドメインを選択

5. **Add**をクリック

### 9. SSL/TLS設定

1. **SSL/TLS** → **Overview**に移動

2. 暗号化モードを選択
   - **Full (strict)**: 推奨（証明書の検証を行う）

3. **Always Use HTTPS**を有効化
   - **SSL/TLS** → **Edge Certificates**
   - **Always Use HTTPS**: `On`

### 10. Caching設定（オプション）

1. **Caching** → **Configuration**に移動

2. キャッシュレベルを設定
   - **Caching Level**: `Standard`

3. ブラウザキャッシュTTLを設定
   - **Browser Cache TTL**: `4 hours`（推奨）

## 動作確認

### Rate Limitingのテスト

1. ターミナルで以下のコマンドを実行:
   ```bash
   # API Protection（10リクエスト/10秒）をテスト
   for i in {1..15}; do
     curl -I https://doin-challenge.com/api/health
     sleep 0.5
   done
   ```

2. 10リクエスト後に`429 Too Many Requests`が返ることを確認

### DDoS Protectionのテスト

1. Cloudflareダッシュボード → **Analytics** → **Security**

2. DDoS攻撃のシミュレーション結果を確認
   - 自動的にブロックされることを確認

## トラブルシューティング

### DNS伝播が完了しない

**原因**: ネームサーバーの変更が反映されていない
- **解決策**: 最大24時間待つ、または`dig`コマンドで確認
  ```bash
  dig doin-challenge.com NS
  ```

### Rate Limitingが動作しない

**原因**: ルールの設定が間違っている
- **解決策**: ルールの条件を再確認（URI Path、Operator等）

### 正常なトラフィックがブロックされる

**原因**: Rate Limitingの閾値が低すぎる
- **解決策**: 閾値を調整（例: 10 → 20リクエスト）

## 期待される効果

1. **DDoS攻撃防御**: 自動的に攻撃を検知・ブロック
2. **Rate Limiting**: 不正なリクエストを自動制限
3. **Bot検知**: ボット攻撃を自動ブロック
4. **IP制限**: 特定IPを自動ブロック
5. **パフォーマンス向上**: CDNによる高速化

## コスト

- **無料プラン**: $0/月
  - DDoS Protection
  - Rate Limiting（基本）
  - Bot Fight Mode
  - SSL/TLS
  - CDN

- **Pro プラン**: $20/月（オプション）
  - 高度なRate Limiting
  - 詳細な分析
  - 優先サポート

## 参考URL

- Cloudflare公式サイト: https://www.cloudflare.com/
- Rate Limiting Rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
- DDoS Protection: https://developers.cloudflare.com/ddos-protection/
- Bot Management: https://developers.cloudflare.com/bots/

## 次のステップ

1. ⏳ Cloudflareアカウント作成
2. ⏳ ドメインを追加
3. ⏳ ネームサーバーを変更
4. ⏳ Rate Limiting Rules設定
5. ⏳ DDoS Protection確認
6. ⏳ Bot Detection有効化
7. ⏳ 動作確認
