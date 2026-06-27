/**
 * theme/tokens/semantic.ts
 * アプリ全体の意味（semantic）
 * ここが "components/ 置換の受け皿" になります
 *
 * v6.67: 黒ベース・ピンクアクセント（仕様確定メモ準拠）
 * - ベースカラー: 黒 (#0a0a0a)
 * - 黄色: 完全廃止（全てピンク/パープルに置換）
 * - アクセント色: ピンク・紫・ティールのみ
 */

import { palette } from "./palette";

export const color = {
  // Surfaces - Black Base
  bg: palette.kimitoBg,           // #0a0a0a
  surface: palette.white,      // #171717
  surfaceAlt: palette.white,   // #1f1f1f
  surfaceDark: palette.gray200,  // #121212

  // Borders / dividers
  border: palette.gray400,       // #262626
  borderAlt: palette.gray500,    // #404040

  // Text - ライト地(#F0F4F8 / 白)での視認性を WCAG AA 以上に統一。
  //   旧値は薄すぎてコントラスト不足だった（#94A3B8/#CBD5E1）。濃いスレートへ引き上げる。
  textPrimary: palette.gray900,   // #0F172A（本文・見出し。最濃）
  textMuted: palette.gray750,     // #475569（補助テキスト。約6.9:1。旧#64748B→濃く）
  textSubtle: palette.gray750,    // #475569（旧#94A3B8→大幅に濃く）
  textSecondary: palette.gray800, // #334155（ラベル・小見出し）
  textHint: palette.gray700,      // #64748B（プレースホルダ。旧#CBD5E1→読める濃さに）
  textWhite: palette.white,

  // Accents - kimito.link 親ブランド（ネイビー基調 + 紫/オレンジ）
  accentPrimary: palette.kimitoBlue,      // #00427B（ネイビー・メインアクション）
  accentPrimaryAA: palette.kimitoBlue,    // #00427B（淡色背景で十分なコントラスト）
  accentAlt: palette.kimitoPurple,        // #5A4FEA（紫アクセント）
  accentOrange: palette.kimitoOrange,     // #DD6500（オレンジアクセント）
  accentIndigo: palette.kimitoBlue,       // ネイビーへ統一（旧ティール廃止）
  hostAccent: palette.kimitoPurple,       // #5A4FEA（紫）
  hostAccentLegacy: palette.kimitoBlue,   // #00427B（ネイビー）

  // App shell（外枠UI）
  headerBg: palette.kimitoBlueSoft,       // #E2EDF7（ヘッダー地・薄青）
  headerBorder: palette.kimitoBlue,       // #00427B（ヘッダー下線・低不透明度で使用）

  // Status - 統一感のあるカラー
  success: palette.green500,     // #22C55E
  successLight: palette.green400,
  successDark: palette.green600,
  danger: palette.red500,        // #EF4444
  dangerLight: palette.red400,
  dangerDark: palette.red600,
  warning: palette.yellow500,    // #A855F7（パープル、黄色廃止）
  warningLight: palette.yellow400,
  info: palette.blue500,         // #3B82F6
  infoLight: palette.blue400,
  infoDark: palette.blue600,

  // Special / Rank
  rankGold: palette.gold,        // #F59E0B
  rankSilver: palette.silver,    // #9CA3AF
  rankBronze: palette.bronze,    // #CD7F32

  // Toast backgrounds (dark variants)
  toastSuccessBg: "#052e16",
  toastErrorBg: "#450a0a",
  toastWarningBg: "#3b0764",
  toastInfoBg: "#172554",

  // Additional colors for molecules
  orange500: palette.primary500,
  orange400: palette.primary600,
  yellow500: palette.accent500,
  yellow400: palette.accent600,
  teal500: palette.teal500,
  teal400: palette.teal600,
  green400: palette.green400,
  purple400: palette.accent500,
  blue400: palette.blue400,
  pink400: palette.primary500,
  red400: palette.red400,
  cyan500: palette.blue400,
  slate300: palette.gray300,
  slate400: palette.gray400,
  slate200: palette.gray200,
  slate500: palette.gray500,

  // Social
  twitter: palette.twitter,
  line: palette.line,

  // Additional colors for charts/maps
  coral: palette.red500,
  hotPink: palette.primary500,
  emerald400: palette.green400,
  textDisabled: palette.gray600,

  // Japan Map - Region Colors
  regionHokkaido: palette.regionHokkaido,
  regionTohoku: palette.regionTohoku,
  regionKanto: palette.regionKanto,
  regionChubu: palette.regionChubu,
  regionKansai: palette.regionKansai,
  regionChugokuShikoku: palette.regionChugokuShikoku,
  regionChugoku: palette.regionChugoku,
  regionShikoku: palette.regionShikoku,
  regionKyushuOkinawa: palette.regionKyushuOkinawa,
  regionKyushu: palette.regionKyushu,
  regionOkinawa: palette.regionOkinawa,

  // Japan Map - Region Border Colors
  borderHokkaido: palette.borderHokkaido,
  borderTohoku: palette.borderTohoku,
  borderKanto: palette.borderKanto,
  borderChubu: palette.borderChubu,
  borderKansai: palette.borderKansai,
  borderChugoku: palette.borderChugoku,
  borderShikoku: palette.borderShikoku,
  borderKyushu: palette.borderKyushu,
  borderOkinawa: palette.borderOkinawa,

  // Heatmap Colors
  heatmapNone: palette.heatmapNone,
  heatmapLevel1: palette.heatmapLevel1,
  heatmapLevel2: palette.heatmapLevel2,
  heatmapLevel3: palette.heatmapLevel3,
  heatmapLevel4: palette.heatmapLevel4,
  heatmapLevel5: palette.heatmapLevel5,
  heatmapLevel6: palette.heatmapLevel6,
  heatmapLevel7: palette.heatmapLevel7,

  // Heatmap Intensity Colors
  heatIntense1: palette.heatIntense1,
  heatIntense2: palette.heatIntense2,
  heatIntense3: palette.heatIntense3,
  heatIntense4: palette.heatIntense4,
  heatIntense5: palette.heatIntense5,
  heatIntenseBorder1: palette.heatIntenseBorder1,
  heatIntenseBorder2: palette.heatIntenseBorder2,
  heatIntenseBorder3: palette.heatIntenseBorder3,
  heatIntenseBorder4: palette.heatIntenseBorder4,
  heatIntenseBorder5: palette.heatIntenseBorder5,

  // Map UI
  mapWater: palette.mapWater,
  mapStroke: palette.mapStroke,
  mapText: palette.mapText,
  mapInactive: palette.mapInactive,
  mapHighlight: palette.mapHighlight,

  // Rarity Colors (Achievements)
  rarityCommon: palette.rarityCommon,
  rarityRare: palette.rarityRare,
  rarityEpic: palette.rarityEpic,
  rarityLegendary: palette.rarityLegendary,

  // Rarity Card Colors
  rarityCommonBorder: palette.rarityCommonBorder,
  rarityCommonText: palette.rarityCommonText,
  rarityCommonBadgeBg: palette.rarityCommonBadgeBg,
  rarityUncommonBg: palette.rarityUncommonBg,
  rarityUncommonBorder: palette.rarityUncommonBorder,
  rarityUncommonText: palette.rarityUncommonText,
  rarityUncommonBadgeBg: palette.rarityUncommonBadgeBg,
  rarityRareBg: palette.rarityRareBg,
  rarityRareBorder: palette.rarityRareBorder,
  rarityRareText: palette.rarityRareText,
  rarityRareBadgeBg: palette.rarityRareBadgeBg,
  rarityEpicBg: palette.rarityEpicBg,
  rarityEpicBorder: palette.rarityEpicBorder,
  rarityEpicText: palette.rarityEpicText,
  rarityEpicBadgeBg: palette.rarityEpicBadgeBg,
  rarityLegendaryBg: palette.rarityLegendaryBg,
  rarityLegendaryBorder: palette.rarityLegendaryBorder,
  rarityLegendaryText: palette.rarityLegendaryText,
  rarityLegendaryBadgeBg: palette.rarityLegendaryBadgeBg,
  rarityLegendaryBadgeText: palette.rarityLegendaryBadgeText,

  // Tutorial / Overlay
  overlayDark: palette.overlayDark,
  overlayText: palette.overlayText,

  // Confetti / Celebration Colors
  confettiTeal: palette.confettiTeal,
  confettiYellow: palette.confettiYellow,
  confettiMint: palette.confettiMint,
  confettiCoral: palette.confettiCoral,

  // Tutorial Balloon Colors
  balloonLight: palette.balloonLight,
  balloonLighter: palette.balloonLighter,
  balloonRed: palette.balloonRed,
  balloonPink: palette.balloonPink,
  balloonMedium: palette.balloonMedium,
  balloonPale: palette.balloonPale,

  // Tutorial UI
  tutorialBlue: palette.tutorialBlue,
  tutorialText: palette.tutorialText,
  shadowBlack: palette.shadowBlack,

  // Gender colors（性別ボーダー用）
  genderMale: palette.genderMale,
  genderFemale: palette.genderFemale,
  genderOther: palette.genderOther,
} as const;

export type SemanticColor = typeof color;
