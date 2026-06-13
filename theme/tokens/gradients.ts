// theme/tokens/gradients.ts
// LinearGradient の "配列そのまま" を集約

import { palette } from "./palette";

export const grad = {
  // Primary gradients
  pinkPurple: [palette.pink500, palette.purple500] as const,
  pinkPurpleIndigo: [palette.pink500, palette.purple500, palette.indigo500] as const,
  
  // Host / Orange gradients
  orangePink: [palette.orange500, palette.pink500] as const,
  orangePinkPurple: [palette.orange500, palette.pink500, palette.purple500] as const,
  amberPink: [palette.amber400, palette.pink500] as const,
  
  // Status gradients
  successGradient: [palette.green500, palette.green400] as const,
  dangerGradient: [palette.red500, palette.red400] as const,
  
  // Rank gradients
  goldGradient: [palette.gold, "#FFA500"] as const,
  silverGradient: [palette.silver, "#A0A0A0"] as const,
  bronzeGradient: [palette.bronze, "#8B4513"] as const,
  
  // Disabled / Muted
  grayGradient: [palette.gray500, palette.gray600] as const,
} as const;

export type Gradients = typeof grad;
