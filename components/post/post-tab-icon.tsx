import { lazy, Suspense } from "react";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

const PostTabIconAuthenticated = lazy(() =>
  import("@/components/post/post-tab-icon-authenticated").then((m) => ({
    default: m.PostTabIconAuthenticated,
  })),
);

/** 未認証は envelope のみ。認証後に badge chunk を読む。 */
export function PostTabIcon({ color: iconColor }: { color: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <IconSymbol size={26} name="envelope.fill" color={iconColor} />;
  }
  return (
    <Suspense fallback={<IconSymbol size={26} name="envelope.fill" color={iconColor} />}>
      <PostTabIconAuthenticated iconColor={iconColor} />
    </Suspense>
  );
}
