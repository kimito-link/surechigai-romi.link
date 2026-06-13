import { useMemo } from "react";
import { useSharedValue, SharedValue } from "react-native-reanimated";

export const CONFETTI_COUNT = 12;

export interface ConfettiItemValues {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
}

/**
 * 紙吹雪アイテムの SharedValue 群を管理するフック
 *
 * CONFETTI_COUNT 個を固定数で宣言するため、Hooks の呼び出し順は常に安定している。
 */
export function useConfettiItems(): ConfettiItemValues[] {
  // 固定12個 — 順序変更不可（Hooks ルール）
  const x0 = useSharedValue(0); const y0 = useSharedValue(0); const r0 = useSharedValue(0); const o0 = useSharedValue(0); const s0 = useSharedValue(1);
  const x1 = useSharedValue(0); const y1 = useSharedValue(0); const r1 = useSharedValue(0); const o1 = useSharedValue(0); const s1 = useSharedValue(1);
  const x2 = useSharedValue(0); const y2 = useSharedValue(0); const r2 = useSharedValue(0); const o2 = useSharedValue(0); const s2 = useSharedValue(1);
  const x3 = useSharedValue(0); const y3 = useSharedValue(0); const r3 = useSharedValue(0); const o3 = useSharedValue(0); const s3 = useSharedValue(1);
  const x4 = useSharedValue(0); const y4 = useSharedValue(0); const r4 = useSharedValue(0); const o4 = useSharedValue(0); const s4 = useSharedValue(1);
  const x5 = useSharedValue(0); const y5 = useSharedValue(0); const r5 = useSharedValue(0); const o5 = useSharedValue(0); const s5 = useSharedValue(1);
  const x6 = useSharedValue(0); const y6 = useSharedValue(0); const r6 = useSharedValue(0); const o6 = useSharedValue(0); const s6 = useSharedValue(1);
  const x7 = useSharedValue(0); const y7 = useSharedValue(0); const r7 = useSharedValue(0); const o7 = useSharedValue(0); const s7 = useSharedValue(1);
  const x8 = useSharedValue(0); const y8 = useSharedValue(0); const r8 = useSharedValue(0); const o8 = useSharedValue(0); const s8 = useSharedValue(1);
  const x9 = useSharedValue(0); const y9 = useSharedValue(0); const r9 = useSharedValue(0); const o9 = useSharedValue(0); const s9 = useSharedValue(1);
  const x10 = useSharedValue(0); const y10 = useSharedValue(0); const r10 = useSharedValue(0); const o10 = useSharedValue(0); const s10 = useSharedValue(1);
  const x11 = useSharedValue(0); const y11 = useSharedValue(0); const r11 = useSharedValue(0); const o11 = useSharedValue(0); const s11 = useSharedValue(1);

  // SharedValue 自体は安定参照なので deps に含めなくてよい
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo<ConfettiItemValues[]>(() => [
    { x: x0,  y: y0,  rotation: r0,  opacity: o0,  scale: s0  },
    { x: x1,  y: y1,  rotation: r1,  opacity: o1,  scale: s1  },
    { x: x2,  y: y2,  rotation: r2,  opacity: o2,  scale: s2  },
    { x: x3,  y: y3,  rotation: r3,  opacity: o3,  scale: s3  },
    { x: x4,  y: y4,  rotation: r4,  opacity: o4,  scale: s4  },
    { x: x5,  y: y5,  rotation: r5,  opacity: o5,  scale: s5  },
    { x: x6,  y: y6,  rotation: r6,  opacity: o6,  scale: s6  },
    { x: x7,  y: y7,  rotation: r7,  opacity: o7,  scale: s7  },
    { x: x8,  y: y8,  rotation: r8,  opacity: o8,  scale: s8  },
    { x: x9,  y: y9,  rotation: r9,  opacity: o9,  scale: s9  },
    { x: x10, y: y10, rotation: r10, opacity: o10, scale: s10 },
    { x: x11, y: y11, rotation: r11, opacity: o11, scale: s11 },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps
}
