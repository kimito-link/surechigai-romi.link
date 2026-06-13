// features/home/utils/momentum.ts
import type { Challenge } from "@/types/challenge";

/**
 * 参加者数が多いだけで上位固定にならないように「log補正」を入れた勢いスコア。
 * - currentValue: 現在参加者数など（goalType次第だが、基本は currentValue を使用）
 * - goalValue: 目標
 * - createdAt/updatedAt が無い前提でも動く（new24hは任意で渡せるようにしている）
 */

export type MomentumParams = {
  new24h?: number; // 24h以内の新規参加者数（取れない場合は0でOK）
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const log10 = (x: number) => Math.log(x) / Math.LN10;

export function momentumScore(challenge: Challenge, params: MomentumParams = {}): number {
  const current = Math.max(Number(challenge.currentValue ?? 0), 0);
  const goal = Math.max(Number(challenge.goalValue ?? 0), 1);
  const progress = clamp(current / goal, 0, 1);

  // 参加者数はlogで鈍らせる（固定化防止）
  const p = log10(1 + current);

  // 直近の伸び（取れないなら0）
  const new24h = Math.max(params.new24h ?? 0, 0);
  const v = log10(1 + new24h);

  // progressは 0.5〜1.0 の倍率として効かせる（達成が近いほど上がる）
  const score = p * (0.5 + 0.5 * progress) + v * 1.2;

  // ほんの少しだけ progress を足して同点を崩す
  return score + progress * 0.01;
}

/**
 * ソート用（降順）
 */
export function sortByMomentum(challenges: Challenge[], getNew24h?: (c: Challenge) => number): Challenge[] {
  return [...challenges].sort((a, b) => {
    const sa = momentumScore(a, { new24h: getNew24h?.(a) ?? 0 });
    const sb = momentumScore(b, { new24h: getNew24h?.(b) ?? 0 });
    return sb - sa;
  });
}
