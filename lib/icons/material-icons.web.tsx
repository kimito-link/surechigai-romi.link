/**
 * Web: MaterialIcons フォント（~349KB）を load 後まで defer。
 * 既知アイコンは SVG、それ以外は load まで軽量プレースホルダ。
 */
import {
  useEffect,
  useState,
  type ComponentType,
} from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";
import { MaterialIconSvg, hasMaterialSvgPath } from "@/lib/icons/material-icon-svg";

type RealMaterialIcons = ComponentType<{
  name: string;
  size?: number;
  color?: string;
  style?: object;
}>;

let RealIcons: RealMaterialIcons | null = null;
let loadTask: Promise<void> | null = null;

function loadMaterialIconsFont(): Promise<void> {
  if (RealIcons) return Promise.resolve();
  if (!loadTask) {
    loadTask = import("@expo/vector-icons/MaterialIcons").then((mod) => {
      RealIcons = mod.default as RealMaterialIcons;
    });
  }
  return loadTask;
}

/** load 後 prefetch 用（認証ルート向け）。 */
export function prefetchMaterialIconsFont(): void {
  scheduleAfterWindowLoad(() => {
    void loadMaterialIconsFont();
  });
}

type MaterialIconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function MaterialIcons({ name, size = 24, color = "#000", style }: MaterialIconProps) {
  const [fontReady, setFontReady] = useState(Boolean(RealIcons));

  useEffect(() => {
    if (fontReady || hasMaterialSvgPath(name)) return;
    return scheduleAfterWindowLoad(() => {
      void loadMaterialIconsFont().then(() => setFontReady(true));
    });
  }, [fontReady, name]);

  if (hasMaterialSvgPath(name)) {
    return (
      <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <MaterialIconSvg name={name} size={size} color={String(color)} />
      </View>
    );
  }

  if (fontReady && RealIcons) {
    const Real = RealIcons;
    return <Real name={name} size={size} color={color} style={style as object | undefined} />;
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: "rgba(0,66,123,0.08)",
        },
        style,
      ]}
    />
  );
}
