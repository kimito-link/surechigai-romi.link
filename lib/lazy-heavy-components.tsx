import { lazy, Suspense, type ComponentProps } from "react";
import { View, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";
import type { WebTrailMap } from "@/components/organisms/web-trail-map";
import type { PrecisionTileMap } from "@/components/organisms/precision-tile-map";
import type { JapanBlockMap } from "@/components/organisms/japan-block-map";

export function MapChunkFallback({ minHeight = 220 }: { minHeight?: number }) {
  return (
    <View style={{ minHeight, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={color.accentPrimary} size="large" />
    </View>
  );
}

const WebTrailMapLazy = lazy(() =>
  import("@/components/organisms/web-trail-map").then((m) => ({ default: m.WebTrailMap })),
);

const PrecisionTileMapLazy = lazy(() =>
  import("@/components/organisms/precision-tile-map").then((m) => ({ default: m.PrecisionTileMap })),
);

const JapanBlockMapLazy = lazy(() =>
  import("@/components/organisms/japan-block-map").then((m) => ({ default: m.JapanBlockMap })),
);

type WebTrailMapProps = ComponentProps<typeof WebTrailMap>;
type PrecisionTileMapProps = ComponentProps<typeof PrecisionTileMap>;
type JapanBlockMapProps = ComponentProps<typeof JapanBlockMap>;

export function LazyWebTrailMap(props: WebTrailMapProps) {
  return (
    <Suspense fallback={<MapChunkFallback minHeight={360} />}>
      <WebTrailMapLazy {...props} />
    </Suspense>
  );
}

export function LazyPrecisionTileMap(props: PrecisionTileMapProps) {
  return (
    <Suspense fallback={<MapChunkFallback minHeight={280} />}>
      <PrecisionTileMapLazy {...props} />
    </Suspense>
  );
}

export function LazyJapanBlockMap(props: JapanBlockMapProps) {
  return (
    <Suspense fallback={<MapChunkFallback minHeight={180} />}>
      <JapanBlockMapLazy {...props} />
    </Suspense>
  );
}
