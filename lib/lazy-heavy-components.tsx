import { lazy, Suspense, type ComponentProps } from "react";
import { ChunkFallback } from "@/lib/chunk-fallback";
import type { WebTrailMap } from "@/components/organisms/web-trail-map";
import type { PrecisionTileMap } from "@/components/organisms/precision-tile-map";
import type { JapanBlockMap } from "@/components/organisms/japan-block-map";
import type { PrefectureSelector } from "@/components/ui/prefecture-selector";
import type { SignalAccountGrid } from "@/components/organisms/signal-account-grid";
import type { EnvelopePulse } from "@/components/molecules/envelope-pulse";
import type { CharacterHere } from "@/components/molecules/character-here";
import type { EncounterOpenModal } from "@/components/post/encounter-open-modal";
import type { GlobalMenu } from "@/components/organisms/global-menu";

export { ChunkFallback, MapChunkFallback } from "@/lib/chunk-fallback";

const WebTrailMapLazy = lazy(() =>
  import("@/components/organisms/web-trail-map").then((m) => ({ default: m.WebTrailMap })),
);
const PrecisionTileMapLazy = lazy(() =>
  import("@/components/organisms/precision-tile-map").then((m) => ({ default: m.PrecisionTileMap })),
);
const JapanBlockMapLazy = lazy(() =>
  import("@/components/organisms/japan-block-map").then((m) => ({ default: m.JapanBlockMap })),
);
const PrefectureSelectorLazy = lazy(() =>
  import("@/components/ui/prefecture-selector").then((m) => ({ default: m.PrefectureSelector })),
);
const SignalAccountGridLazy = lazy(() =>
  import("@/components/organisms/signal-account-grid").then((m) => ({
    default: m.SignalAccountGrid,
  })),
);
const EnvelopePulseLazy = lazy(() =>
  import("@/components/molecules/envelope-pulse").then((m) => ({ default: m.EnvelopePulse })),
);
const CharacterHereLazy = lazy(() =>
  import("@/components/molecules/character-here").then((m) => ({ default: m.CharacterHere })),
);
const EncounterOpenModalLazy = lazy(() =>
  import("@/components/post/encounter-open-modal").then((m) => ({
    default: m.EncounterOpenModal,
  })),
);
const GlobalMenuLazy = lazy(() =>
  import("@/components/organisms/global-menu").then((m) => ({ default: m.GlobalMenu })),
);

type WebTrailMapProps = ComponentProps<typeof WebTrailMap>;
type PrecisionTileMapProps = ComponentProps<typeof PrecisionTileMap>;
type JapanBlockMapProps = ComponentProps<typeof JapanBlockMap>;
type PrefectureSelectorProps = ComponentProps<typeof PrefectureSelector>;
type SignalAccountGridProps = ComponentProps<typeof SignalAccountGrid>;
type EnvelopePulseProps = ComponentProps<typeof EnvelopePulse>;
type CharacterHereProps = ComponentProps<typeof CharacterHere>;
type EncounterOpenModalProps = ComponentProps<typeof EncounterOpenModal>;
type GlobalMenuProps = ComponentProps<typeof GlobalMenu>;

export function LazyWebTrailMap(props: WebTrailMapProps) {
  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <WebTrailMapLazy {...props} />
    </Suspense>
  );
}

export function LazyPrecisionTileMap(props: PrecisionTileMapProps) {
  return (
    <Suspense fallback={<ChunkFallback minHeight={280} />}>
      <PrecisionTileMapLazy {...props} />
    </Suspense>
  );
}

export function LazyJapanBlockMap(props: JapanBlockMapProps) {
  return (
    <Suspense fallback={<ChunkFallback minHeight={180} />}>
      <JapanBlockMapLazy {...props} />
    </Suspense>
  );
}

export function LazyPrefectureSelector(props: PrefectureSelectorProps) {
  return (
    <Suspense fallback={<ChunkFallback minHeight={56} />}>
      <PrefectureSelectorLazy {...props} />
    </Suspense>
  );
}

export function LazySignalAccountGrid(props: SignalAccountGridProps) {
  return (
    <Suspense fallback={<ChunkFallback minHeight={200} />}>
      <SignalAccountGridLazy {...props} />
    </Suspense>
  );
}

export function LazyEnvelopePulse(props: EnvelopePulseProps) {
  return (
    <Suspense fallback={null}>
      <EnvelopePulseLazy {...props} />
    </Suspense>
  );
}

export function LazyCharacterHere(props: CharacterHereProps) {
  return (
    <Suspense fallback={null}>
      <CharacterHereLazy {...props} />
    </Suspense>
  );
}

/** 開封時のみマウントすること（reanimated chunk を初回 bundle から外す）。 */
export function LazyEncounterOpenModal(props: EncounterOpenModalProps) {
  return (
    <Suspense fallback={null}>
      <EncounterOpenModalLazy {...props} />
    </Suspense>
  );
}

/** ハンバーガー初回タップ時のみマウント（LogoutConfirmModal 等を初回 JS から外す）。 */
export function LazyGlobalMenu(props: GlobalMenuProps) {
  return (
    <Suspense fallback={null}>
      <GlobalMenuLazy {...props} />
    </Suspense>
  );
}
