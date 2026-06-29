/**
 * Web 専用: kimito.link と同一の Clerk 標準 `<SignIn />`（@clerk/expo/web）。
 */
import { SignIn } from "@clerk/expo/web";
import { ClerkMountFallback } from "@/components/auth/clerk-mount-fallback";

export function ClerkSignIn({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignIn
      routing="hash"
      signUpUrl="/sign-in"
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
      fallback={<ClerkMountFallback mode="sign-in" />}
    />
  );
}
