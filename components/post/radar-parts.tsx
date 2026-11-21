/**
 * ポスト画面のレーダー部品（Web 版: 初回 bundle から外すため lazy）。
 * iOS / Android は radar-parts.native.tsx で静的に読み込む。
 */
import { lazy } from "react";

export const JapanRadarMap = lazy(() =>
  import("@/components/organisms/japan-radar-map").then((m) => ({ default: m.JapanRadarMap })),
);
export const RadarHud = lazy(() =>
  import("@/components/organisms/radar-hud").then((m) => ({ default: m.RadarHud })),
);
