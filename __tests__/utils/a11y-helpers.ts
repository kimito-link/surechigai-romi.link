/**
 * アクセシビリティテストユーティリティ
 * 
 * React Native Testing Libraryを使用してa11y違反を検出するヘルパー関数
 */

/**
 * Apple Human Interface Guidelines準拠のタッチターゲットサイズ
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * WCAG AA準拠のコントラスト比
 */
export const MIN_CONTRAST_RATIO = 4.5;

/**
 * 最小推奨フォントサイズ（Apple HIG）
 */
export const MIN_FONT_SIZE = 11;

/**
 * a11yチェック結果の型
 */
export interface A11yCheckResult {
  valid: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * a11yエラー/警告の型
 */
export interface A11yIssue {
  element: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * コンポーネントのpropsからスタイルを取得
 */
function getStyleValue(
  props: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  const style = props.style;
  if (!style) return undefined;

  const flatStyle = Array.isArray(style)
    ? style.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
    : style;

  for (const key of keys) {
    const value = (flatStyle as Record<string, unknown>)[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

/**
 * タッチターゲットサイズのチェック
 * 最小44x44pxを確保しているか検証
 */
export function checkTouchTargetSize(props: Record<string, unknown>): A11yCheckResult {
  const width = getStyleValue(props, "width", "minWidth");
  const height = getStyleValue(props, "height", "minHeight");

  // サイズが指定されていない場合はスキップ
  if (width === undefined && height === undefined) {
    return { valid: true, message: "サイズが動的に決定されます" };
  }

  const widthValid = width === undefined || width >= MIN_TOUCH_TARGET_SIZE;
  const heightValid = height === undefined || height >= MIN_TOUCH_TARGET_SIZE;

  if (!widthValid || !heightValid) {
    return {
      valid: false,
      message: `タッチターゲットが小さすぎます: ${width ?? "auto"}x${height ?? "auto"}px (最小: ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px)`,
      details: { width, height },
    };
  }

  return { valid: true, details: { width, height } };
}

/**
 * アクセシビリティラベルのチェック
 * インタラクティブな要素にラベルが設定されているか検証
 */
export function checkAccessibilityLabel(
  props: Record<string, unknown>,
  isInteractive: boolean
): A11yCheckResult {
  const { accessibilityLabel, accessibilityHint, accessible } = props;

  // accessible=falseの場合はスキップ
  if (accessible === false) {
    return { valid: true, message: "アクセシビリティが無効化されています" };
  }

  if (isInteractive && !accessibilityLabel && !accessibilityHint) {
    return {
      valid: false,
      message: "インタラクティブな要素にaccessibilityLabelまたはaccessibilityHintが必要です",
    };
  }

  return { valid: true };
}

/**
 * アクセシビリティロールのチェック
 * 適切なロールが設定されているか検証
 */
export function checkAccessibilityRole(
  props: Record<string, unknown>,
  isInteractive: boolean
): A11yCheckResult {
  const { accessibilityRole } = props;

  // ボタンとして機能する要素にはbuttonロールが必要
  if (isInteractive && !accessibilityRole) {
    return {
      valid: false,
      message: "インタラクティブな要素にはaccessibilityRoleの設定を推奨します",
    };
  }

  return { valid: true };
}

/**
 * 画像のアクセシビリティチェック
 * 画像にaccessibilityLabelが設定されているか検証
 */
export function checkImageAccessibility(props: Record<string, unknown>): A11yCheckResult {
  const { accessibilityLabel, accessible } = props;

  // 装飾的な画像はaccessible=falseでスキップ可能
  if (accessible === false) {
    return { valid: true, message: "装飾的な画像としてマークされています" };
  }

  if (!accessibilityLabel) {
    return {
      valid: false,
      message: "画像にはaccessibilityLabelが必要です（装飾的な場合はaccessible={false}を設定）",
    };
  }

  return { valid: true };
}

/**
 * テキストのアクセシビリティチェック
 * 適切なフォントサイズが使用されているか検証
 */
export function checkTextAccessibility(props: Record<string, unknown>): A11yCheckResult {
  const fontSize = getStyleValue(props, "fontSize");

  // 最小フォントサイズ11px（Apple HIG推奨）
  if (fontSize !== undefined && fontSize < MIN_FONT_SIZE) {
    return {
      valid: false,
      message: `フォントサイズが小さすぎます: ${fontSize}px (最小推奨: ${MIN_FONT_SIZE}px)`,
      details: { fontSize },
    };
  }

  return { valid: true };
}

/**
 * コンポーネントがインタラクティブかどうかを判定
 */
export function isInteractiveElement(props: Record<string, unknown>): boolean {
  return !!(
    props.onPress ||
    props.onLongPress ||
    props.onPressIn ||
    props.onPressOut
  );
}

/**
 * a11yチェック結果をフォーマット
 */
export function formatA11yResults(issues: A11yIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const lines: string[] = [];

  if (errors.length > 0) {
    lines.push("❌ エラー:");
    errors.forEach(({ element, message }) => {
      lines.push(`  - ${element}: ${message}`);
    });
  }

  if (warnings.length > 0) {
    lines.push("⚠️ 警告:");
    warnings.forEach(({ element, message }) => {
      lines.push(`  - ${element}: ${message}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    lines.push("✅ アクセシビリティチェック: 問題なし");
  }

  return lines.join("\n");
}

/**
 * カスタムマッチャー: タッチターゲットサイズ
 */
export function toHaveMinTouchTargetSize(
  props: Record<string, unknown>
): { pass: boolean; message: () => string } {
  const result = checkTouchTargetSize(props);
  return {
    pass: result.valid,
    message: () => result.message || "タッチターゲットサイズが適切です",
  };
}

/**
 * カスタムマッチャー: アクセシビリティラベル
 */
export function toHaveAccessibilityLabel(
  props: Record<string, unknown>
): { pass: boolean; message: () => string } {
  const isInteractive = isInteractiveElement(props);
  const result = checkAccessibilityLabel(props, isInteractive);
  return {
    pass: result.valid,
    message: () => result.message || "アクセシビリティラベルが設定されています",
  };
}
