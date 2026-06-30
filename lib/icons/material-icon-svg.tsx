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
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path fill={color} d={d} />
    </Svg>
  );
}

export function hasMaterialSvgPath(name: string): boolean {
  return name in MATERIAL_SVG_PATHS;
}
