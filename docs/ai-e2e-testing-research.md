# AI × E2Eテストサービス調査レポート

## 調査日時
2026-01-31

## 目的
四六時中AIがサービスをテスト・バグ検知・自動修正・セキュリティ監視を行う仕組みを構築する

## 主要なAI E2Eテストサービス

### 1. mabl (https://www.mabl.com/)
- **特徴**: AI-native test automation platform
- **機能**: 
  - 自動テストケース生成
  - 継続的モニタリング
  - 自動修復（self-healing tests）
- **日本語対応**: あり（GMOグループが導入実績）
- **価格**: 要問い合わせ

### 2. Autify (https://autify.jp/)
- **特徴**: 日本製のAI E2Eテストツール
- **機能**:
  - ノーコードでテストシナリオ作成
  - AIによる自動メンテナンス
  - 複雑なテストシナリオの自動化
- **日本語対応**: 完全対応
- **価格**: 要問い合わせ

### 3. testRigor (https://testrigor.com/)
- **特徴**: End-to-end test automation tool
- **機能**:
  - 自然言語でテストケース記述
  - 全チームメンバーが使える
  - UI/API/モバイル対応
- **日本語対応**: 英語のみ
- **価格**: 要問い合わせ

### 4. Momentic (https://momentic.ai/)
- **特徴**: Best Overall AI for E2E testing
- **機能**:
  - AI-powered test generation
  - Visual testing
  - API testing
- **日本語対応**: 英語のみ
- **価格**: 要問い合わせ

### 5. Harness AI Test Automation (https://www.harness.io/)
- **特徴**: AI-native automation for DevOps
- **機能**:
  - End-to-end testing automation
  - Continuous testing
  - DevOps統合
- **日本語対応**: 英語のみ
- **価格**: 要問い合わせ

### 6. Datadog Synthetic Monitoring (https://www.datadoghq.com/)
- **特徴**: End-to-end testing automation + monitoring
- **機能**:
  - アプリケーションワークフローの監視
  - 自動テスト実行
  - パフォーマンス監視
- **日本語対応**: あり
- **価格**: 従量課金制

## 推奨サービス（優先順位順）

### 1位: Autify
**理由**:
- 日本製で日本語完全対応
- ノーコードで導入が容易
- AIによる自動メンテナンス機能が強力
- 日本企業の導入実績が豊富

**導入コスト**: 中（要問い合わせ）

### 2位: mabl
**理由**:
- AI-nativeで最も先進的
- GMOグループが導入済み（日本での実績あり）
- 継続的モニタリング機能が強力
- 自動修復機能が優秀

**導入コスト**: 中〜高（要問い合わせ）

### 3位: Datadog Synthetic Monitoring
**理由**:
- 既存のDatadog環境と統合可能
- 監視とテストを一元管理
- 従量課金制で小規模から始められる
- 日本語対応あり

**導入コスト**: 低〜中（従量課金）

## 自動バグ検知・修正の統合

### Sentry + AI自動修正
- **現状**: Sentryは既に導入済み
- **追加機能**:
  1. Sentry AI Autofix（GitHub Copilotと統合）
  2. エラー発生時に自動でPR作成
  3. AI分析によるバグ原因特定

### GitHub Copilot Workspace
- **機能**:
  - Sentryのエラーレポートから自動修正PR作成
  - AIによるコードレビュー
  - 自動テスト生成

## セキュリティ監視・IP制限

### 1. Cloudflare
- **機能**:
  - DDoS攻撃防御
  - Rate limiting
  - IP制限
  - Bot検知
- **価格**: 無料プランあり

### 2. Railway/Vercel組み込み機能
- **機能**:
  - 環境変数による制限
  - Rate limiting設定
  - IP whitelist/blacklist

## 次のステップ

1. **即座に導入可能（無料/低コスト）**:
   - Cloudflare（無料プラン）
   - Sentry AI Autofix（既存プラン拡張）
   - GitHub Copilot Workspace（既存GitHub契約）

2. **短期導入（1週間以内）**:
   - Datadog Synthetic Monitoring（従量課金、小規模から開始）
   - Rate limiting実装（Railway/Vercel）

3. **中期導入（1ヶ月以内）**:
   - Autify または mabl の無料トライアル開始
   - 本格導入の検討

## 参考URL

- mabl: https://www.mabl.com/
- Autify: https://autify.jp/
- testRigor: https://testrigor.com/
- Momentic: https://momentic.ai/
- Harness: https://www.harness.io/
- Datadog: https://www.datadoghq.com/synthetics/
- GMOのmabl導入事例: https://recruit.group.gmo/engineer/jisedai/blog/e2e-test-saas-ai-mabl/


## Autify詳細情報

### 主要機能
1. **直感的なテスト作成**: ノーコードインターフェースで誰でも簡単にE2Eテストシナリオを作成
2. **並列実行**: 複数のテストを同時に実行し、テスト実行速度を最大化
3. **AIによるメンテナンス**: テストシナリオを自動メンテナンス、マニュアル更新不要
4. **クロスブラウザテスト**: PC・モバイルブラウザをサポート、実機端末管理不要
5. **メールテスト**: 新規会員登録やトランザクションメールの確認
6. **ステップグループ**: 繰り返し使うアクションをグループ化
7. **サービス連携**: Bitrise, CircleCI, Jenkins, Webhook, TestRail, Slack
8. **ビジュアルリグレッション**: UIの変更を自動検知

### 導入実績
- 株式会社ヌーラボ: テスト仕様書のメンテナンス自動化
- その他多数の日本企業

### 料金
- 要デモ申し込み・問い合わせ
- URL: https://autify.jp/e2e-testing


## Sentry AI Autofix詳細

### 概要
Sentryの新しいAI機能で、エラーを自動的にデバッグ・修正し、GitHubにPRを作成

### 主要機能
1. **AI-powered Autofix**: エラー発生時に自動分析・修正提案
2. **GitHub Copilot統合**: GitHub Copilot ExtensionとしてPRワークフローに統合
3. **自動テスト生成**: ユニットテストを自動生成
4. **コンテキスト理解**: ユーザーの行動とエラーの関係を分析
5. **PR自動作成**: 修正コードを含むPRを自動生成

### 導入方法
1. GitHub MarketplaceからSentry Copilot Extensionをインストール
2. Sentryプロジェクトと連携
3. エラー発生時に自動的にAutofixが起動

### 参考URL
- https://blog.sentry.io/ai-powered-autofix-debugs-and-fixes-your-code-in-minutes/
- https://blog.sentry.io/automating-tests-and-bug-fixes-with-the-sentry-extension-for-github-copilot/
- https://github.com/getsentry/sentry/discussions/79515

## Cloudflare Rate Limiting & IP制限

### 概要
Cloudflareの無料プランで利用可能なセキュリティ機能

### 主要機能
1. **Rate Limiting Rules**: リクエスト数制限（IP単位）
2. **WAF (Web Application Firewall)**: 攻撃パターン検知
3. **DDoS Protection**: DDoS攻撃防御
4. **Bot Detection**: ボット検知・ブロック
5. **IP Blocking**: 特定IPのブロック

### 設定方法
1. Cloudflareダッシュボード → Security → WAF
2. Rate limiting rules → Create rule
3. ルール設定:
   - Path: 保護するパス（例: /api/*）
   - Rate: リクエスト数/秒（例: 10 requests per 10 seconds）
   - Action: Block, Challenge, JS Challenge等
   - Duration: ブロック期間（例: 1 hour）

### 推奨設定
```
Rule 1: API Rate Limiting
- Path: /api/*
- Rate: 10 requests per 10 seconds per IP
- Action: Block
- Duration: 1 hour

Rule 2: Login Protection
- Path: /api/auth/*
- Rate: 5 requests per 1 minute per IP
- Action: Challenge
- Duration: 15 minutes

Rule 3: Global Rate Limiting
- Path: /*
- Rate: 100 requests per 1 minute per IP
- Action: JS Challenge
- Duration: 5 minutes
```

### 参考URL
- https://developers.cloudflare.com/waf/rate-limiting-rules/
- https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/
- https://til.simonwillison.net/cloudflare/rate-limiting

## セキュリティ監視ツール

### 推奨ツール
1. **Cloudflare**: DDoS防御、Rate limiting、Bot検知（無料）
2. **Sentry**: エラー監視、パフォーマンス監視（既に導入済み）
3. **GitHub Dependabot**: 依存関係の脆弱性検知（無料）
4. **GitHub CodeQL**: コードの脆弱性検知（無料）
5. **Snyk**: オープンソースの脆弱性検知（無料プランあり）

### 参考URL
- https://apiiro.com/blog/top-continuous-security-monitoring-tools/
- https://radiantsecurity.ai/learn/top-18-security-automation-tools/
