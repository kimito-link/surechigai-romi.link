export interface EventDateTimeValue {
  dateKey: string;
  hour: number;
  minute: number;
}

/** value から JST ローカルの Date を組み立てる。dateKey 未設定なら null。 */
export function toStartDate(value: EventDateTimeValue): Date | null {
  if (!value.dateKey) return null;
  const [y, m, d] = value.dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, value.hour, value.minute, 0, 0);
}
