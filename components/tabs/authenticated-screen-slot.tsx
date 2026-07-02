import { lazy } from "react";
import type { AuthenticatedTabScreenName } from "@/components/tabs/authenticated-screen-funnel";

const AuthenticatedScreenFunnel = lazy(() =>
  import("@/components/tabs/authenticated-screen-funnel").then((m) => ({
    default: m.AuthenticatedScreenFunnel,
  })),
);

export function AuthenticatedScreenSlot({ screen }: { screen: AuthenticatedTabScreenName }) {
  return <AuthenticatedScreenFunnel screen={screen} />;
}
