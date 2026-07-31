/**
 * modules/encounter/core/report-reasons.ts
 *
 * 通報理由の単一の真実。
 *
 * 以前はサーバー（modules/encounter/api/safety.ts の REPORT_REASONS）と
 * UI（components/post/report-modal.tsx のハードコード配列）で別々に定義されており、
 * 片方だけ直すと「UIには出るが zod で弾かれる」（またはその逆）事故になっていた。
 * 新しい理由を足すときはこのファイルだけを変える。
 */

export const REPORT_REASONS = [
  "inappropriate_hitokoto",
  "inappropriate_place_note",
  "spam",
  "harassment",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * 通報メニューに出す文言（動詞形）。
 * 既存の lib/post/encounter-shared.ts の reasonLabel と同じ語調に揃えている。
 * あちらは encounter 通報専用で残し、こちらを新規箇所の正本とする。
 */
const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate_hitokoto: "不適切なひとことを通報",
  inappropriate_place_note: "不適切な場所メモを通報",
  spam: "スパムとして通報",
  harassment: "嫌がらせとして通報",
  other: "その他の理由で通報",
};

/** 通報理由の表示文言。未知の値は「その他」に寄せる（古いクライアント対策） */
export function reportReasonLabel(reason: string): string {
  return REASON_LABELS[reason as ReportReason] ?? REASON_LABELS.other;
}

/**
 * 足あとの場所メモに対する通報で選べる理由。
 * 「ひとことが不適切」は文脈が違うので出さない。
 */
export const PLACE_NOTE_REPORT_REASONS: readonly ReportReason[] = [
  "inappropriate_place_note",
  "spam",
  "harassment",
  "other",
];
