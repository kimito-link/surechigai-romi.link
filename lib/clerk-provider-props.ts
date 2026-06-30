import { kimitoClerkAppearance } from "@/lib/clerk-appearance";
import { kimitoJaJP } from "@/lib/clerk-localization";
import { DEFAULT_POST_AUTH_PATH } from "@/lib/clerk-route";

const PRODUCTION_REDIRECT_ORIGINS = [
  "https://surechigai.kimito.link",
  "https://surechigai-romi.link",
];

const DEVELOPMENT_REDIRECT_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://localhost:8081",
  ...PRODUCTION_REDIRECT_ORIGINS,
];

/** kimito (auth)/layout.tsx の ClerkProvider 設定を surechigai 向けに移植。 */
export function getClerkProviderProps() {
  const postAuth = DEFAULT_POST_AUTH_PATH;
  return {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-in",
    signInForceRedirectUrl: postAuth,
    signUpForceRedirectUrl: postAuth,
    signInFallbackRedirectUrl: postAuth,
    signUpFallbackRedirectUrl: postAuth,
    allowedRedirectOrigins:
      process.env.NODE_ENV === "development"
        ? DEVELOPMENT_REDIRECT_ORIGINS
        : PRODUCTION_REDIRECT_ORIGINS,
    allowedRedirectProtocols: ["http:", "https:"] as ("http:" | "https:")[],
    appearance: kimitoClerkAppearance,
    localization: kimitoJaJP,
  };
}
