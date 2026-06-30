/**
 * レイアウト・スペーシング・アニメーション関連のトークン
 * 
 * design-system.ts から移行した統一されたデザイントークン
 * - 一貫性: 全画面で同じスタイルを使用
 * - アクセシビリティ: Apple HIG準拠のタッチターゲット
 */

// スペーシング（8pxベース）
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

// ブレークポイント（hooks/use-responsive.ts と共有する単一の定義）
export const breakpoints = {
  /** スマホ→大きめスマホ/小型タブレット */
  sm: 640,
  /** タブレット */
  md: 768,
  /** 小型デスクトップ */
  lg: 1024,
  /** デスクトップ */
  xl: 1280,
  /** 大型デスクトップ */
  "2xl": 1536,
} as const;

/**
 * 画面内コンテンツの中央寄せ最大幅。
 * 地図やリストを含む本文を、PCで間延びさせず読みやすい幅に揃えるための共通値。
 */
export const contentMaxWidth = {
  /** フォーム・narrow な読み物（都道府県別一覧など） */
  narrow: 720,
  /** 地図・履歴を含む標準本文（軌跡/図鑑/公開ページの de facto 値） */
  standard: 980,
} as const;

/** 1行レイアウトを縦積みへ切り替える狭幅しきい値（履歴行など） */
export const NARROW_ROW_WIDTH = 420;

/** 固定タブバー・スクロール inset 計算用定数（_layout / hooks と共有） */
export const tabBar = {
  bodyHeight: 56,
  webBottomPadding: 12,
  /** ScrollView contentContainerStyle 用の追加余白 */
  scrollExtra: 24,
  /** ScreenContainer SafeAreaView 用の追加余白 */
  chromeExtra: 16,
} as const;

/** チェックイン完了画面の下部固定シェアドック高さ */
export const CHECKIN_STICKY_DOCK_HEIGHT = 76;

/** チェックイン Web モバイル: ブラウザ UI 分の追加スクロール余白 */
export const CHECKIN_MOBILE_WEB_CHROME = 40;

// タイポグラフィ（視認性: 黒背景では 12px を下限とする）
export const typography = {
  // フォントサイズ（meta=xs, body=sm, title=base）
  fontSize: {
    xs: 12,   // meta, ラベル
    sm: 14,   // body, 本文
    base: 16, // title, タイトル
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  // 行の高さ
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  // フォントウェイト
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

// ボーダー半径
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

// シャドウ
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// タッチターゲット（Apple HIG準拠）
export const touchTarget = {
  minSize: 44, // 最小タッチターゲットサイズ
  minSpacing: 8, // 最小間隔
} as const;

// アニメーション
export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
} as const;

// Zインデックス
export const zIndex = {
  base: 0,
  dropdown: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
} as const;
