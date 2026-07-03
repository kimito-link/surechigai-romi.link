/**
 * チェックイン精度の文脈コピー（docs/uiux-brushup-SPEC.md §1.3）
 * 「あとで行ける精度」という価値を、数値だけでなく短い一文で伝える。
 */

const GOOD_ACCURACY_M = 30;
const FAIR_ACCURACY_M = 100;

export function getAccuracyHeadline(accuracyM: number | null | undefined): string {
  if (accuracyM == null) return "精度を確認中…";
  const rounded = Math.round(accuracyM);
  if (accuracyM <= GOOD_ACCURACY_M) {
    return `±${rounded}m — あとで戻って来られる精度です`;
  }
  if (accuracyM <= FAIR_ACCURACY_M) {
    return `±${rounded}m — 記録には十分な精度です`;
  }
  return `±${rounded}m — 空の見える場所だと精度が上がります`;
}

export function isAccuracyGood(accuracyM: number | null | undefined): boolean {
  return accuracyM != null && accuracyM <= GOOD_ACCURACY_M;
}

export function isAccuracyLow(accuracyM: number | null | undefined): boolean {
  return accuracyM != null && accuracyM > FAIR_ACCURACY_M;
}
