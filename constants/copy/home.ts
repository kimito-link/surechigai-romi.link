/**
 * ホーム画面の文言定数
 * 
 * 原則: 複数箇所で使われる文言のみ定数化
 * ページ固有のストーリー（CatchCopySectionの長文など）は直書きでOK
 * 
 * @see docs/COMPONENTIZATION_GUIDELINES.md
 */
export const homeCopy = {
  /**
   * エンゲージメント表示（他の箇所でも使われる可能性がある）
   */
  engagement: {
    totalParticipations: "総参加表明",
    hotRegion: "人が参加表明中",
  },
  /**
   * 機能説明（他の箇所でも使われる可能性がある）
   */
  features: {
    participation: "参加表明で応援メッセージを送れる",
  },
} as const;
