/**
 * 参加表明日時の表示用フォーマット
 * 「〇月〇日に参加表明しました」などで利用
 */
export function formatParticipationDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
