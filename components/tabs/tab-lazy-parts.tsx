/**
 * タブまわりの「ログイン後だけ要る部品」（Web 版: ゲスト bundle から外すため lazy）。
 * iOS / Android は tab-lazy-parts.native.tsx で静的に読み込む。
 */
import { lazy } from "react";

export const PostTabIconAuthenticated = lazy(() =>
  import("@/components/post/post-tab-icon-authenticated").then((m) => ({
    default: m.PostTabIconAuthenticated,
  })),
);
export const CheckinTabIconAuthenticated = lazy(() =>
  import("@/components/tabs/checkin-tab-icon-authenticated").then((m) => ({
    default: m.CheckinTabIconAuthenticated,
  })),
);
export const TabAuthenticatedExtras = lazy(() =>
  import("@/components/tabs/tab-authenticated-extras").then((m) => ({
    default: m.TabAuthenticatedExtras,
  })),
);
