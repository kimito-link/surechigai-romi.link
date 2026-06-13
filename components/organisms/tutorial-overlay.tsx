// components/organisms/tutorial-overlay.tsx
// v6.18: リファクタリング済み - 分割されたモジュールからre-export
// 後方互換性のため、既存のインポートパスを維持

export { TutorialOverlay } from "./tutorial-overlay/TutorialOverlay";
export type { TutorialStep, TutorialOverlayProps, CharacterKey } from "./tutorial-overlay/types";
export { CHARACTER_IMAGES } from "./tutorial-overlay/types";
