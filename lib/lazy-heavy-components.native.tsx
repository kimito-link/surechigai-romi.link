/**
 * iOS / Android 版: lazy() を使わず静的に読み込む（Web 版は lazy-heavy-components.tsx）。
 *
 * ★2026-11-14「動きがぎこちない」の調査で判明: ネイティブは 1 本の bundle なので分割の得が無いのに、
 *   lazy() は初回描画でいったん suspend する。React 19 は一度出した fallback を最低 300ms 見せる
 *   （Suspense の表示スロットリング）ため、メニュー初回タップ・封筒の初回開封・ピンや地図の初回表示が
 *   毎回 0.3 秒ほど遅れたり、灰色の枠が一瞬出てから中身に替わったりしていた。
 *   ネイティブでは同じ名前の部品を静的 import でそのまま出し、待ちを無くす。
 */
import type { ComponentProps } from "react";
import { WebTrailMap } from "@/components/organisms/web-trail-map";
import { PrecisionTileMap } from "@/components/organisms/precision-tile-map";
import { JapanBlockMap } from "@/components/organisms/japan-block-map";
import { PrefectureSelector } from "@/components/ui/prefecture-selector";
import { SignalAccountGrid } from "@/components/organisms/signal-account-grid";
import { EnvelopePulse } from "@/components/molecules/envelope-pulse";
import { CharacterHere } from "@/components/molecules/character-here";
import { EncounterOpenModal } from "@/components/post/encounter-open-modal";
import { GlobalMenu } from "@/components/organisms/global-menu";

export { ChunkFallback, MapChunkFallback } from "@/lib/chunk-fallback";

export function LazyWebTrailMap(props: ComponentProps<typeof WebTrailMap>) {
  return <WebTrailMap {...props} />;
}

export function LazyPrecisionTileMap(props: ComponentProps<typeof PrecisionTileMap>) {
  return <PrecisionTileMap {...props} />;
}

export function LazyJapanBlockMap(props: ComponentProps<typeof JapanBlockMap>) {
  return <JapanBlockMap {...props} />;
}

export function LazyPrefectureSelector(props: ComponentProps<typeof PrefectureSelector>) {
  return <PrefectureSelector {...props} />;
}

export function LazySignalAccountGrid(props: ComponentProps<typeof SignalAccountGrid>) {
  return <SignalAccountGrid {...props} />;
}

export function LazyEnvelopePulse(props: ComponentProps<typeof EnvelopePulse>) {
  return <EnvelopePulse {...props} />;
}

export function LazyCharacterHere(props: ComponentProps<typeof CharacterHere>) {
  return <CharacterHere {...props} />;
}

export function LazyEncounterOpenModal(props: ComponentProps<typeof EncounterOpenModal>) {
  return <EncounterOpenModal {...props} />;
}

export function LazyGlobalMenu(props: ComponentProps<typeof GlobalMenu>) {
  return <GlobalMenu {...props} />;
}
