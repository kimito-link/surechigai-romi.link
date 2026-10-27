import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";

/** Clerk chunk 読込中。起動画面と同じ絵でつなぎ、別のスピナー画面を挟まない。 */
export function AppBootstrapFallback() {
  return <BrandLoadingScreen />;
}
