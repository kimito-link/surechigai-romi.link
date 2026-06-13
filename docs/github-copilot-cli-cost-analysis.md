# GitHub Copilot CLI コスト分析（2026年1月時点）

## 重要な発見：1回4円でレビュー可能

Zennの記事（[GitHub Copilot CLIは、gpt-5.2-codex xhighに複雑なレビューを依頼しても1回4円](https://zenn.dev/nuits_jp/articles/2026-01-26-cheet-of-copilot)）によると、**GitHub Copilot CLIを使えば、GPT-5.2-Codex xhighで複雑なレビューを依頼しても1回約4円**で利用できます。

## プレミアムリクエストの料金体系

GitHub Copilotは「プレミアムリクエスト（PR）」という単位で課金されます。

| プラン | 月額料金 | Premium Requests | PR単価 |
|--------|----------|------------------|--------|
| **Copilot Pro** | $10/月 ($100/年) | 300/月 | **約5.3円** |
| **Copilot Pro+** | $39/月 ($390/年) | 1500/月 | **約4.2円** |
| Copilot Business | $19/シート/月 | 300/ユーザー/月 | 約10.1円 |
| Copilot Enterprise | $39/シート/月 | 1000/ユーザー/月 | 約6.2円 |

（$1=160円換算）

## モデル別のプレミアムリクエスト消費量

| モデル | PR消費量 | 実質コスト（Pro+） |
|--------|----------|-------------------|
| **GPT-4.1** | 0 | **無料（使い放題）** |
| **GPT-4o** | 0 | **無料（使い放題）** |
| **GPT-5 mini** | 0 | **無料（使い放題）** |
| Grok Code Fast 1 | 0.25 | 約1.1円 |
| Claude Haiku 4.5 | 0.33 | 約1.4円 |
| Gemini 3 Flash | 0.33 | 約1.4円 |
| GPT-5.1-Codex-Mini | 0.33 | 約1.4円 |
| **GPT-5.2-Codex** | **1** | **約4.2円** |
| GPT-5.1-Codex-Max | 1 | 約4.2円 |
| GPT-5.2 | 1 | 約4.2円 |
| Claude Sonnet 4.5 | 1 | 約4.2円 |
| Gemini 3 Pro | 1 | 約4.2円 |
| Claude Opus 4.5 | 3 | 約12.6円 |

**重要**: Reasoning Effortを変更しても単価は変わりません。

## コスパ良く活用するコツ

### 1. GitHub Copilot CLIを使う

VS Code拡張ではReasoning Effortが指定できないため、**Copilot CLIを使う**のが推奨されます。

### 2. Agent Skillsを活用

- Agent Skillsでちゃんとスキルを作っておく
- Skillsでは全体制御を行う
- 単一ファイルのタスクはサブエージェントでコンテキストを分離する

**重要**: サブエージェントはプレミアムリクエストを消費しません。

### 3. Coding Agentを使う

**GitHub Copilot Coding Agent**を使うと、**1セッションあたり1プレミアムリクエスト**で済みます。

- 自律的に1時間動かしっぱなしでも1PR
- ただし、Reasoning Effortは指定できない
- GitHub ActionsのCPU時間を別途消費

## Phase 2レビューへの適用

### 現在の状況

- PR-3では手動レビューチェックリストを使用
- 全チェック項目クリア済み
- 無料で品質担保できている

### Copilot CLI導入の検討

#### 必要な投資

- **Copilot Pro**: $10/月（月300PR = 約1,590円分）
- **Copilot Pro+**: $39/月（月1,500PR = 約6,300円分）

#### コストパフォーマンス

- **GPT-4.1/GPT-5 mini**: 無料（使い放題）
- **GPT-5.2-Codex xhigh**: 1回約4.2円（Pro+の場合）

#### Phase 2での活用例

1. **PR-4〜PR-6のレビュー**: GPT-4.1（無料）で十分
2. **複雑な状態遷移ロジック**: GPT-5.2-Codex xhigh（1回4.2円）
3. **最終統合レビュー**: GPT-5.2-Codex xhigh（1回4.2円）

**月間コスト試算**:
- PR-4〜PR-7（4回）: 0円（GPT-4.1使用）
- 複雑なレビュー（3回）: 約13円（GPT-5.2-Codex使用）
- **合計**: 約13円/月

## 結論

**GitHub Copilot Pro（$10/月）に加入すれば、Phase 2のレビューをほぼ無料で自動化できます。**

- GPT-4.1/GPT-5 miniは使い放題
- 複雑なレビューでもGPT-5.2-Codex xhighで1回4円
- 手動レビューの時間を大幅に削減

**推奨**: Phase 2の残りPR（PR-4〜PR-7）でCopilot Proを試してみる価値があります。

## 参考リンク

- [GitHub Copilot CLIは、gpt-5.2-codex xhighに複雑なレビューを依頼しても1回4円](https://zenn.dev/nuits_jp/articles/2026-01-26-cheet-of-copilot)
- [Requests in GitHub Copilot](https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-copilot-policies-as-an-individual-subscriber/managing-copilot-policies-as-an-individual-subscriber#about-requests-in-github-copilot)
