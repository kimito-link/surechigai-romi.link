import { useLayoutEffect, type ReactNode } from "react";
import { releaseBootVeil } from "@/lib/boot-veil";

/** 最初の実画面がコミットされたフレームで、起動画面を1回だけ外す。 */
export function useReleaseBootWhen(ready: boolean): void {
  useLayoutEffect(() => {
    if (ready) releaseBootVeil();
  }, [ready]);
}

/** Suspense の内側に置く。フォールバックの間は起動画面を残し、中身が出たフレームで外す。 */
export function ReleaseBootOnMount({ children }: { children: ReactNode }) {
  useReleaseBootWhen(true);
  return children;
}
