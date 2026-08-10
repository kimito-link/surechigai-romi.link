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

/**
 * kimito.link Clerk 統合（真の fc2id・2026-08）:
 *   surechigai は kimito.link の Clerk アプリ（primary）の **satellite** として動く。
 *   ログインは primary（kimito.link）の sign-in に委譲され、戻ると同じアカウントで
 *   ログイン済みになる（1ログインで全 *.kimito.link サービス）。
 *
 *   satellite を有効化する条件（本番かつ env が揃っているとき）:
 *     - EXPO_PUBLIC_CLERK_IS_SATELLITE=true
 *     - EXPO_PUBLIC_CLERK_DOMAIN=clerk.kimito.link      （primary の Frontend API ドメイン）
 *     - EXPO_PUBLIC_CLERK_SIGN_IN_URL=https://kimito.link/sign-in/
 *   Publishable/Secret 鍵は kimito.link アプリのもの（pk_live_/sk_live_）を Vercel env に入れる。
 *   詳細手順: リポ直上 KIMITO-CLERK-UNIFICATION-PLAN.md（Dashboard 操作は人間が実施）。
 *
 *   env が無い/開発時は satellite を切り、従来どおり単独インスタンスで動く（安全側）。
 */
/**
 * sign-in は satellite でも「自オリジンの /sign-in」に保つ（2026-08-10 「30年後楽」設計）。
 *
 * 以前は satellite 有効時に primary の `https://kimito.link/sign-in/`（別オリジン）へ委譲していた。
 * だが surechigai の実ログイン遷移は自前 `buildSignInAutoXHref()`＝自オリジン `/sign-in` であり、
 * primary の sign-in 画面まで飛ばす必要がない（satellite の本体はセッション cookie 共有）。
 * 別オリジンへ飛ばすと、アカウント切り替えの遷移列（/sign-in → x.com → callback → 帰還）が
 * オリジンを跨ぎ、`switch-x-account-modal.tsx` の sessionStorage スナップショットが帰還時に
 * 読めなくなる（結果バナーが出ない）。
 *
 * 自オリジンに保てば **その導線を作り直さずに済む＝保守コードを増やさない**。
 * よって satellite は `isSatellite` + `domain`（セッション共有）だけ有効化し、signInUrl は委譲しない。
 * `EXPO_PUBLIC_CLERK_SIGN_IN_URL` env は廃止（設定しても使わない）。
 */
function resolveSatellite() {
  const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.EXPO_PUBLIC_CLERK_DOMAIN;
  // satellite は「フラグ ON かつ domain 指定あり」のときだけ有効化する（不完全設定で壊さない）。
  if (isSatellite && domain) {
    return { isSatellite: true as const, domain };
  }
  return null;
}

/** kimito (auth)/layout.tsx の ClerkProvider 設定を surechigai 向けに移植。 */
export function getClerkProviderProps() {
  const postAuth = DEFAULT_POST_AUTH_PATH;
  const satellite = resolveSatellite();
  return {
    // sign-in は satellite でも常に自オリジンの /sign-in（別オリジンへ飛ばさない・上の resolveSatellite 参照）。
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
    // satellite props（本番かつ env が揃うときだけ付与）。
    ...(satellite ? { isSatellite: satellite.isSatellite, domain: satellite.domain } : {}),
  };
}
