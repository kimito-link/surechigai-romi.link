/**
 * Feature flags for quick kill switch (Gate 1: 即OFF用).
 * Toggle via env: NEXT_PUBLIC_* so client can read.
 */
export const flags = {
  enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true",
  enablePush: process.env.NEXT_PUBLIC_ENABLE_PUSH === "true",
  enableHeavyAnimation:
    process.env.NEXT_PUBLIC_ENABLE_HEAVY_ANIMATION === "true",
};
