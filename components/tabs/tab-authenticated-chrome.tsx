import type { ReactNode } from "react";
import { TutorialProvider } from "@/lib/tutorial-context";
import { TabAuthenticatedExtras } from "@/components/tabs/tab-authenticated-extras";

export function TabAuthenticatedChrome({ children }: { children: ReactNode }) {
  return (
    <TutorialProvider>
      {children}
      <TabAuthenticatedExtras />
    </TutorialProvider>
  );
}
