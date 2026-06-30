import Svg, { Path } from "react-native-svg";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIconSvg, hasMaterialSvgPath } from "@/lib/icons/material-icon-svg";

const MAPPING: Record<string, string> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "plus.circle.fill": "add-circle",
  "person.fill": "person",
  calendar: "event",
  "heart.fill": "favorite",
  "star.fill": "star",
  "message.fill": "message",
  "share.fill": "ios-share",
  xmark: "close",
  checkmark: "check",
  "arrow.left": "arrow-back",
  magnifyingglass: "search",
  "person.crop.circle": "account-circle",
  "gearshape.fill": "settings",
  "chart.bar.fill": "bar-chart",
  "envelope.fill": "mail",
  "location.fill": "location-on",
  "book.fill": "menu-book",
  "map.fill": "map",
  "person.crop.circle.fill": "account-circle",
  "envelope.open.fill": "drafts",
  "flag.fill": "flag",
  "hand.raised.fill": "block",
  "bell.fill": "notifications",
  "clock.fill": "access-time",
  "arrow.clockwise": "refresh",
  "photo.fill": "photo",
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * Web: SVG でタブアイコンを描画（MaterialIcons フォント DL 不要）。
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] || "help";
  if (hasMaterialSvgPath(materialName)) {
    return (
      <MaterialIconSvg name={materialName} size={size} color={String(color)} />
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        fill={String(color)}
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      />
    </Svg>
  );
}
