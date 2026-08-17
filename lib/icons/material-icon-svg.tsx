import Svg, { Path } from "react-native-svg";
import { MATERIAL_SVG_PATHS } from "@/lib/icons/material-svg-paths";

type Props = {
  name: string;
  size?: number;
  color: string;
};

/** フォント無し Material 風 SVG（Web クリティカルパス用）。 */
export function MaterialIconSvg({ name, size = 24, color }: Props) {
  const d = MATERIAL_SVG_PATHS[name];
  if (!d) return null;
  return (
    // accessibilityRole="image" を付けると Web で role="img" が出るが、
    // アイコン自体は名前を持たないため axe の svg-img-alt に落ちる（実測14箇所/ページ）。
    // ここのアイコンは隣接テキストか親の accessibilityLabel で意味が伝わる装飾なので、
    // ロールを与えず支援技術から隠す。単独で意味を担うアイコンは、
    // 呼び出し側（Pressable 等）に accessibilityLabel を付けること。
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      <Path fill={color} d={d} />
    </Svg>
  );
}

export function hasMaterialSvgPath(name: string): boolean {
  return name in MATERIAL_SVG_PATHS;
}
