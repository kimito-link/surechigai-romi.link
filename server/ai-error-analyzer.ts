/**
 * AI エラー分析サービス
 * 
 * OpenRouterを使用してエラーを自動分析し、原因と解決策を提案
 * 無料モデルを優先使用し、複数APIキーのローテーションに対応
 */

import axios from "axios";

// OpenRouter API設定
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// 無料または低コストのモデル（優先順）
const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "qwen/qwen-2-7b-instruct:free",
];

// フォールバック用の有料モデル（安価なもの）
const FALLBACK_MODELS = [
  "meta-llama/llama-3.1-70b-instruct",
  "mistralai/mixtral-8x7b-instruct",
];

// APIキーのリスト（環境変数からカンマ区切りで取得）
function getApiKeys(): string[] {
  const keys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
  return keys.split(",").map(k => k.trim()).filter(Boolean);
}

// 現在のAPIキーインデックス
let currentKeyIndex = 0;

// APIキーの使用状況を追跡
const keyUsage: Map<string, { count: number; lastReset: Date; errors: number }> = new Map();

// 次のAPIキーを取得（ローテーション）
function getNextApiKey(): string | null {
  const keys = getApiKeys();
  if (keys.length === 0) return null;
  
  // エラーが多いキーをスキップ
  let attempts = 0;
  while (attempts < keys.length) {
    const key = keys[currentKeyIndex];
    const usage = keyUsage.get(key);
    
    // エラーが3回以上のキーは1時間スキップ
    if (usage && usage.errors >= 3) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (usage.lastReset > hourAgo) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
        continue;
      } else {
        // 1時間経過したらリセット
        usage.errors = 0;
        usage.lastReset = new Date();
      }
    }
    
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
  }
  
  // 全てのキーがエラー状態の場合、最初のキーを返す
  return keys[0];
}

// APIキーのエラーを記録
function recordKeyError(key: string): void {
  const usage = keyUsage.get(key) || { count: 0, lastReset: new Date(), errors: 0 };
  usage.errors++;
  keyUsage.set(key, usage);
}

// APIキーの使用を記録
function recordKeyUsage(key: string): void {
  const usage = keyUsage.get(key) || { count: 0, lastReset: new Date(), errors: 0 };
  usage.count++;
  keyUsage.set(key, usage);
}

// エラー分析の結果型
export interface ErrorAnalysis {
  cause: string;           // エラーの原因
  solution: string;        // 解決策
  codeExample?: string;    // コード例（あれば）
  severity: "low" | "medium" | "high" | "critical";  // 重要度
  category: string;        // エラーカテゴリ
  confidence: number;      // 分析の確信度（0-100）
  model: string;           // 使用したモデル
  analyzedAt: Date;        // 分析日時
}

// エラー分析のプロンプト
function buildAnalysisPrompt(error: {
  message: string;
  stack?: string;
  category: string;
  context?: Record<string, unknown>;
}): string {
  return `あなたはエキスパートのソフトウェアエンジニアです。以下のエラーを分析し、原因と解決策を日本語で説明してください。

## エラー情報
- カテゴリ: ${error.category}
- メッセージ: ${error.message}
${error.stack ? `- スタックトレース:\n\`\`\`\n${error.stack}\n\`\`\`` : ""}
${error.context ? `- コンテキスト: ${JSON.stringify(error.context, null, 2)}` : ""}

## 回答形式（JSON）
以下のJSON形式で回答してください。他の文章は含めないでください。

{
  "cause": "エラーの原因を簡潔に説明",
  "solution": "具体的な解決策を説明",
  "codeExample": "修正コード例（あれば）",
  "severity": "low/medium/high/criticalのいずれか",
  "category": "エラーのカテゴリ（database/api/auth/validation/network/unknown）",
  "confidence": 0-100の数値
}`;
}

// AIでエラーを分析
export async function analyzeError(error: {
  message: string;
  stack?: string;
  category: string;
  context?: Record<string, unknown>;
}): Promise<ErrorAnalysis | null> {
  const apiKey = getNextApiKey();
  
  if (!apiKey) {
    console.warn("[AI Analyzer] No API key available. Set OPENROUTER_API_KEY or OPENROUTER_API_KEYS environment variable.");
    return null;
  }
  
  const prompt = buildAnalysisPrompt(error);
  
  // 無料モデルから順に試す
  const modelsToTry = [...FREE_MODELS, ...FALLBACK_MODELS];
  
  for (const model of modelsToTry) {
    try {
      console.log(`[AI Analyzer] Trying model: ${model}`);
      
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model,
          messages: [
            {
              role: "system",
              content: "あなたはエキスパートのソフトウェアエンジニアです。エラー分析を行い、JSON形式で回答します。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://doin-challenge.com",
            "X-Title": "Doin Challenge Error Analyzer",
          },
          timeout: 30000,
        }
      );
      
      recordKeyUsage(apiKey);
      
      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn(`[AI Analyzer] Empty response from ${model}`);
        continue;
      }
      
      // JSONを抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(`[AI Analyzer] No JSON found in response from ${model}`);
        continue;
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        cause: analysis.cause || "不明",
        solution: analysis.solution || "詳細な調査が必要です",
        codeExample: analysis.codeExample,
        severity: analysis.severity || "medium",
        category: analysis.category || error.category,
        confidence: analysis.confidence || 50,
        model,
        analyzedAt: new Date(),
      };
      
    } catch (err: any) {
      console.error(`[AI Analyzer] Error with model ${model}:`, err.message);
      
      // レート制限エラーの場合はキーをローテーション
      if (err.response?.status === 429) {
        recordKeyError(apiKey);
        console.log("[AI Analyzer] Rate limited, rotating API key...");
      }
      
      // 次のモデルを試す
      continue;
    }
  }
  
  console.error("[AI Analyzer] All models failed");
  return null;
}

// 分析結果をキャッシュ（同じエラーの再分析を防ぐ）
const analysisCache: Map<string, { analysis: ErrorAnalysis; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1時間

// エラーのハッシュを生成
function getErrorHash(error: { message: string; category: string }): string {
  return `${error.category}:${error.message.substring(0, 100)}`;
}

// キャッシュ付きでエラーを分析
export async function analyzeErrorWithCache(error: {
  message: string;
  stack?: string;
  category: string;
  context?: Record<string, unknown>;
}): Promise<ErrorAnalysis | null> {
  const hash = getErrorHash(error);
  const cached = analysisCache.get(hash);
  
  // キャッシュが有効なら返す
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[AI Analyzer] Returning cached analysis");
    return cached.analysis;
  }
  
  // 新規分析
  const analysis = await analyzeError(error);
  
  if (analysis) {
    analysisCache.set(hash, { analysis, timestamp: Date.now() });
  }
  
  return analysis;
}

// APIキーの状態を取得（管理画面用）
export function getApiKeyStatus(): {
  totalKeys: number;
  activeKeys: number;
  usage: Array<{ keyPrefix: string; count: number; errors: number }>;
} {
  const keys = getApiKeys();
  const usage = keys.map(key => {
    const u = keyUsage.get(key);
    return {
      keyPrefix: key.substring(0, 8) + "...",
      count: u?.count || 0,
      errors: u?.errors || 0,
    };
  });
  
  const activeKeys = keys.filter(key => {
    const u = keyUsage.get(key);
    return !u || u.errors < 3;
  }).length;
  
  return {
    totalKeys: keys.length,
    activeKeys,
    usage,
  };
}

// 分析キャッシュをクリア
export function clearAnalysisCache(): number {
  const count = analysisCache.size;
  analysisCache.clear();
  return count;
}
