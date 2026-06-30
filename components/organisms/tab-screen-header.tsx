import { AppHeader, type AppHeaderProps } from "@/components/organisms/app-header";
import { TabHeaderSpacer } from "@/components/organisms/tab-header-spacer";
import {
  useScreenContextBar,
  type ScreenContextKey,
} from "@/hooks/use-screen-context-bar";

type Props = Omit<AppHeaderProps, "variant" | "contextBar" | "showTagline"> & {
  contextKey?: ScreenContextKey;
};

/** タブ画面用 — compact ヘッダー + コンテキストバー + Web スペーサー */
export function TabScreenHeader({ contextKey, ...headerProps }: Props) {
  const ctx = useScreenContextBar(contextKey);

  return (
    <>
      <AppHeader
        {...headerProps}
        variant="compact"
        showTagline={false}
        contextBar={ctx.element}
      />
      <TabHeaderSpacer hasContextBar={ctx.hasBar} />
    </>
  );
}
