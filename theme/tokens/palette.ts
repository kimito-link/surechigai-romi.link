/**
 * theme/tokens/palette.ts
 * #RRGGBB を置く唯一の場所（原則ここ以外禁止）
 * 
 * v6.67: 黒ベース・ピンクアクセント（仕様確定メモ準拠）
 * - ベースカラー: 黒 (#0a0a0a)
 * - 黄色: 完全廃止（全てピンクに置換）
 * - アクセント色: ピンク・紫・ティールのみ
 */

export const palette = {
  // Brand / Accent - Pink & Purple Theme
  primary500: "#EC4899",      // ピンク（メインアクション）
  primary400: "#F472B6",      // ピンク（WCAG AA 4.5:1 小テキスト用）
  primary600: "#DB2777",      // ピンク（ホバー）
  accent500: "#A855F7",       // パープル（アクセント）
  accent600: "#9333EA",       // パープル（ホバー）
  teal500: "#14B8A6",         // ティール（セカンダリ）
  teal600: "#0D9488",         // ティール（ホバー）
  
  // Legacy Brand Colors (後方互換性)
  pink500: "#EC4899",         // → primary500 に統一
  pink600: "#DB2777",         // → primary600 に統一
  purple500: "#A855F7",       // → accent500 に統一
  purple600: "#9333EA",       // → accent600 に統一
  indigo500: "#14B8A6",       // → teal500 に統一
  amber400: "#A855F7",        // → accent500 に統一（黄色廃止）
  orange500: "#EC4899",       // → primary500 に統一（黄色廃止）

  // Neutral (dark UI) - Black Base
  gray900: "#0F172A",         // 背景（黒ベース）
  gray850: "#1E293B",         // 画像プレースホルダ等
  gray800: "#334155",         // surface（カード背景）
  gray750: "#475569",         // surface alt
  gray700: "#64748B",         // border
  gray650: "#94A3B8",         // switch track (dark)
  gray600: "#94A3B8",         // border alt

  // Neutral (text) - 視認性改善（黒背景で読めるよう semantic で gray300/200 を採用）
  gray500: "#CBD5E1",         // 非推奨（黒背景でコントラスト不足）。semantic.textHint は gray300 を使用
  gray400: "#E2E8F0",         // 非推奨（黒背景でやや薄い）。semantic.textSecondary は gray200 を使用
  gray300: "#E2E8F0",         // muted / hint（プレースホルダ等）
  gray200: "#F1F5F9",         // subtle / secondary（本文・ラベル）
  gray100: "#F8FAFC",         // primary text（最も明るい）
  white: "#FFFFFF",
  kimitoBg: "#F0F4F8",
  kimitoBlue: "#0B3A67",
  kimitoPurple: "#5A4FEA",
  kimitoBlueSoft: "#D9E8F5",

  // Semantic statuses
  green500: "#22C55E",        // success
  green400: "#4ADE80",        // success light
  green600: "#16A34A",        // success dark
  red500: "#EF4444",          // error
  red400: "#F87171",          // error light
  red600: "#DC2626",          // error dark
  yellow500: "#A855F7",       // warning → パープルに変更（黄色廃止）
  yellow400: "#C084FC",       // warning light
  yellow600: "#9333EA",       // warning dark

  // Blue shades
  blue500: "#3B82F6",         // info
  blue400: "#60A5FA",         // info light
  blue600: "#2563EB",         // info dark
  blue700: "#00427B",         // deep blue (onboarding steps)

  // Gender colors（性別ボーダー用）
  genderMale: "#3B82F6",      // 男性: 青
  genderFemale: "#EF4444",    // 女性: 赤（仕様）
  genderNeutral: "rgba(255,255,255,0.12)", // 未設定: ニュートラル
  genderOther: "#A855F7",     // その他: パープル

  // Special / Rank
  gold: "#F59E0B",            // ゴールド（ランク）→ アンバー系
  silver: "#9CA3AF",          // シルバー（ランク）
  bronze: "#CD7F32",          // ブロンズ（ランク）

  // Social
  twitter: "#1DA1F2",
  line: "#00B900",

  // Japan Map - Region Colors
  regionHokkaido: "#3B82F6",
  regionTohoku: "#10B981",
  regionKanto: "#F59E0B",
  regionChubu: "#8B5CF6",
  regionKansai: "#EC4899",
  regionChugokuShikoku: "#14B8A6",
  regionChugoku: "#06B6D4",
  regionShikoku: "#F97316",
  regionKyushuOkinawa: "#EF4444",
  regionKyushu: "#EF4444",
  regionOkinawa: "#F472B6",

  // Japan Map - Region Border Colors
  borderHokkaido: "#2563EB",
  borderTohoku: "#059669",
  borderKanto: "#D97706",
  borderChubu: "#7C3AED",
  borderKansai: "#DB2777",
  borderChugoku: "#0891B2",
  borderShikoku: "#EA580C",
  borderKyushu: "#DC2626",
  borderOkinawa: "#EC4899",

  // Heatmap Colors（温度グラデーション: 少＝ベージュ → 多＝濃い赤。最高状態で日本列島が赤く染まる）
  heatmapNone: "#1f1f1f",
  heatmapLevel1: "#F0DCC0", // 1,000人以上: 薄いベージュ
  heatmapLevel2: "#E8B868", // 5,000人以上: 淡い黄橙
  heatmapLevel3: "#E09A48", // 10,000人以上: 明るいオレンジ
  heatmapLevel4: "#E07030", // 30,000人以上: オレンジ
  heatmapLevel5: "#D84820", // 50,000人以上: 赤橙
  heatmapLevel6: "#C02020", // 100,000人以上: 濃い赤
  heatmapLevel7: "#8B1010", // 200,000人以上: 最深紅（日本列島が赤く染まる）

  // Heatmap Intensity Colors
  heatIntense1: "#1a1a2e",
  heatIntense2: "#16213e",
  heatIntense3: "#0f3460",
  heatIntense4: "#e94560",
  heatIntense5: "#ff6b6b",
  heatIntenseBorder1: "#2a2a4e",
  heatIntenseBorder2: "#26315e",
  heatIntenseBorder3: "#1f4480",
  heatIntenseBorder4: "#f95570",
  heatIntenseBorder5: "#ff8b8b",

  // Map UI
  mapWater: "#0a0a0a",
  mapStroke: "#404040",
  mapText: "#f5f5f5",
  mapInactive: "#262626",
  mapHighlight: "#EC4899",

  // Rarity Colors (Achievements)
  rarityCommon: "#9CA3AF",
  rarityRare: "#3B82F6",
  rarityEpic: "#A855F7",
  rarityLegendary: "#F59E0B",

  // Rarity Card Colors
  rarityCommonBorder: "#6B7280",
  rarityCommonText: "#D1D5DB",
  rarityCommonBadgeBg: "#374151",
  rarityUncommonBg: "#064E3B",
  rarityUncommonBorder: "#10B981",
  rarityUncommonText: "#A7F3D0",
  rarityUncommonBadgeBg: "#047857",
  rarityRareBg: "#1E3A8A",
  rarityRareBorder: "#3B82F6",
  rarityRareText: "#BFDBFE",
  rarityRareBadgeBg: "#1D4ED8",
  rarityEpicBg: "#4C1D95",
  rarityEpicBorder: "#A855F7",
  rarityEpicText: "#DDD6FE",
  rarityEpicBadgeBg: "#7C3AED",
  rarityLegendaryBg: "#78350F",
  rarityLegendaryBorder: "#F59E0B",
  rarityLegendaryText: "#FEF3C7",
  rarityLegendaryBadgeBg: "#D97706",
  rarityLegendaryBadgeText: "#FFFBEB",

  // Tutorial / Overlay
  overlayDark: "rgba(0, 0, 0, 0.75)",
  overlayText: "#FFFFFF",

  // Confetti / Celebration Colors
  confettiTeal: "#14B8A6",
  confettiYellow: "#A855F7",   // 黄色廃止 → パープル
  confettiMint: "#34D399",
  confettiCoral: "#F87171",

  // Tutorial Balloon Colors
  balloonLight: "#F9FAFB",
  balloonLighter: "#FFFFFF",
  balloonRed: "#EF4444",
  balloonPink: "#EC4899",
  balloonMedium: "#D1D5DB",
  balloonPale: "#F3F4F6",

  // Tutorial UI
  tutorialBlue: "#3B82F6",
  tutorialText: "#1F2937",
  shadowBlack: "rgba(0, 0, 0, 0.25)",

  // Special
  transparent: "transparent",
  black: "#000000",
} as const;

// 型エクスポート
export type PaletteKey = keyof typeof palette;
export type PaletteValue = (typeof palette)[PaletteKey];
