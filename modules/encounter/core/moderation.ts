/**
 * modules/encounter/core/moderation.ts
 *
 * NGワードフィルタ + Groq/Gemini 二段判定（fetch ベース）。
 * API キー未設定なら NGワードのみで通す graceful degradation。
 *
 * Groq: llama-3.1-8b-instant（14,400 RPD 無料）
 * Gemini: gemini-2.0-flash-lite（1,500 RPD 無料）
 *
 * DB・認証・Express に非依存の純粋TS。
 * 移植元: surechigai-nico/server/src/lib/moderation.ts
 */

// ---------------------------------------------------------------------------
// NGワードリスト（運用で追加していく）
// ---------------------------------------------------------------------------

const NG_WORDS = [
  "死ね", "殺す", "殺してやる",
  "ばか", "あほ", "くそ",
  "セックス", "エッチ",
  "LINE交換", "LINE教えて",
  "会いたい", "会おう",
  "電話番号", "住所教えて",
  // 出会い目的フレーズ
  "付き合って", "彼女募集", "彼氏募集",
  "会いましょう", "待ち合わせ",
] as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ngRegex = new RegExp(
  NG_WORDS.map((w) => escapeRegExp(w)).join("|"),
  "i"
);

/** NGワードを含むか判定 */
export function containsNgWord(text: string): boolean {
  return ngRegex.test(text);
}

/** NGワードをマスクして返す */
export function filterNgWords(text: string): string {
  return text.replace(ngRegex, (match) => "＊".repeat(match.length));
}

// ---------------------------------------------------------------------------
// LLM 二段判定
// ---------------------------------------------------------------------------

const LLM_PROMPT = (text: string) =>
  `以下の短文が「有害・出会い目的・個人情報交換の誘導」を含む場合は YES、含まない場合は NO とだけ答えてください。
短文: 「${text}」`;

async function checkWithGroq(
  text: string,
  apiKey: string
): Promise<boolean | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: LLM_PROMPT(text) }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    if (answer === "YES") return true;
    if (answer === "NO") return false;
    return null;
  } catch {
    return null;
  }
}

async function checkWithGemini(
  text: string,
  apiKey: string
): Promise<boolean | null> {
  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: LLM_PROMPT(text) }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0 },
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
    if (answer === "YES") return true;
    if (answer === "NO") return false;
    return null;
  } catch {
    return null;
  }
}

export type ModerationConfig = {
  groqApiKey?: string;
  geminiApiKey?: string;
};

export type ModerationResult = {
  /** true = 有害と判定（拒否すべき） */
  rejected: boolean;
  /** 判定に使用したステージ: "ng_word" | "groq" | "gemini" | "pass" */
  stage: "ng_word" | "groq" | "gemini" | "pass";
};

/**
 * ひとこと文字列をモデレーション判定する。
 *
 * 1. NGワードチェック → 即 rejected
 * 2. Groq チェック（APIキーあれば）→ YES なら rejected
 * 3. Gemini チェック（APIキーあれば）→ YES なら rejected
 * 4. すべて通過 → pass
 *
 * API キー未設定 or タイムアウトの場合は次段へフォールスルー（graceful degradation）。
 */
export async function moderateText(
  text: string,
  config: ModerationConfig = {}
): Promise<ModerationResult> {
  // 1. NGワード
  if (containsNgWord(text)) {
    return { rejected: true, stage: "ng_word" };
  }

  // 2. Groq
  if (config.groqApiKey) {
    const result = await checkWithGroq(text, config.groqApiKey);
    if (result === true) return { rejected: true, stage: "groq" };
    if (result === false) return { rejected: false, stage: "groq" };
    // null = エラー → フォールスルー
  }

  // 3. Gemini
  if (config.geminiApiKey) {
    const result = await checkWithGemini(text, config.geminiApiKey);
    if (result === true) return { rejected: true, stage: "gemini" };
    if (result === false) return { rejected: false, stage: "gemini" };
    // null = エラー → フォールスルー
  }

  // 4. 全通過
  return { rejected: false, stage: "pass" };
}
